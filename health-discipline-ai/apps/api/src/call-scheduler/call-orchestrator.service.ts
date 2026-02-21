import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { CallsService } from '../calls/calls.service';
import { MedicinesService } from '../medicines/medicines.service';
import { PatientsService } from '../patients/patients.service';
import { ElevenLabsAgentService } from '../integrations/elevenlabs/elevenlabs-agent.service';
import { SarvamAgentService } from '../integrations/sarvam/sarvam-agent.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { PromptAssemblerService } from '../dynamic-prompt/prompt-assembler.service';
import { DynamicPromptResult } from '../dynamic-prompt/types/prompt-context.types';
import { RetryHandlerService } from './retry-handler.service';
import { DistributedLockService } from '../distributed-lock/distributed-lock.service';
import { CloudTasksService } from '../cloud-tasks/cloud-tasks.service';

interface DueCall {
  config: any;
  patient: any;
  timing: string;
}

@Injectable()
export class CallOrchestratorService {
  private readonly logger = new Logger(CallOrchestratorService.name);
  private readonly MAX_CONCURRENT = 50;
  private readonly voiceStack: string;
  private readonly dynamicPromptGlobalEnabled: boolean;

  constructor(
    private callsService: CallsService,
    private medicinesService: MedicinesService,
    private patientsService: PatientsService,
    private elevenLabsAgentService: ElevenLabsAgentService,
    private sarvamAgentService: SarvamAgentService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private callConfigsService: CallConfigsService,
    private promptAssembler: PromptAssemblerService,
    @Inject(forwardRef(() => RetryHandlerService))
    private retryHandler: RetryHandlerService,
    private lockService: DistributedLockService,
    private cloudTasksService: CloudTasksService,
  ) {
    this.voiceStack = this.configService.get<string>('VOICE_STACK', 'elevenlabs');
    this.dynamicPromptGlobalEnabled =
      this.configService.get<string>('DYNAMIC_PROMPT_ENABLED', 'false') === 'true';
    this.logger.log(`Voice stack configured: ${this.voiceStack}`);
    this.logger.log(`Dynamic prompt globally enabled: ${this.dynamicPromptGlobalEnabled}`);
  }

  async processBatch(dueCalls: DueCall[]) {
    const batches = [];
    for (let i = 0; i < dueCalls.length; i += this.MAX_CONCURRENT) {
      batches.push(dueCalls.slice(i, i + this.MAX_CONCURRENT));
    }

    for (const batch of batches) {
      await Promise.allSettled(batch.map((dc) => this.initiateCall(dc)));
    }
  }

  /**
   * Initiate an AI voice call to a patient.
   *
   * Routes to the configured voice stack:
   * - VOICE_STACK=elevenlabs (default): ElevenLabs Conversational AI → post-call webhook
   * - VOICE_STACK=sarvam: LiveKit + Sarvam STT/TTS + Gemini → post-call webhook
   */
  async initiateCall(dueCall: DueCall) {
    const { patient, timing } = dueCall;
    const patientId = patient._id.toString();
    let callId: string | null = null;

    // Per-patient lock prevents two cron instances from creating duplicate calls
    const lockAcquired = await this.lockService.acquireLock(`call:${patientId}`, 60);
    if (!lockAcquired) {
      this.logger.log(`Could not acquire call lock for patient ${patientId}, another call is being initiated`);
      return;
    }

    try {
      // Re-check hasCallToday INSIDE the lock to prevent race condition
      const config = dueCall.config;

      // Skip daily call limit for test-tagged patients
      const isTestPatient = patient.tag === 'test';

      if (!isTestPatient) {
        const alreadyCalled = await this.callsService.hasCallToday(
          patientId,
          config.timezone || 'Asia/Kolkata',
        );
        if (alreadyCalled) {
          this.logger.log(`Patient ${patientId} already has a call today (detected inside lock), skipping`);
          return;
        }
      } else {
        this.logger.log(`Patient ${patientId} is tagged as 'test', bypassing daily call limit`);
      }

      // Get ALL medicines for the patient (we call once at night for everything)
      const medicines = await this.medicinesService.findByPatient(patientId);

      if (medicines.length === 0) {
        this.logger.log(`No medicines for patient ${patientId}, skipping`);
        return;
      }

      // Create call record
      const call = await this.callsService.create({
        patientId: patient._id,
        userId: patient.userId,
        scheduledAt: new Date(),
        status: 'scheduled',
        isFirstCall: patient.callsCompletedCount === 0,
        usedNewPatientProtocol: patient.isNewPatient,
        voiceStack: this.voiceStack,
        medicinesChecked: medicines.map((med: any) => ({
          medicineId: med._id,
          medicineName: med.brandName,
          nickname: med.nicknames?.[0] || med.brandName,
          response: 'pending',
          isCritical: med.isCritical || false,
          timestamp: new Date(),
        })),
      });
      callId = call._id.toString();

      const patientData = {
        patientName: patient.preferredName,
        medicines: medicines.map((med: any) => ({
          name: med.nicknames?.[0] || med.brandName,
          timing: med.timing,
          medicineId: med._id.toString(),
        })),
        isNewPatient: patient.isNewPatient,
        hasGlucometer: patient.hasGlucometer,
        hasBPMonitor: patient.hasBPMonitor,
        preferredLanguage: patient.preferredLanguage || 'hi',
        callTiming: timing,
      };

      // Dynamic prompt assembly (if enabled)
      let dynamicPrompt: DynamicPromptResult | null = null;

      if (this.dynamicPromptGlobalEnabled) {
        const config = dueCall.config;
        // Per-patient opt-out: skip if explicitly set to false
        if (config?.dynamicPromptEnabled !== false) {
          try {
            dynamicPrompt = await this.promptAssembler.assembleDynamicPrompt(
              patient._id.toString(),
            );
            this.logger.log(
              `Dynamic prompt: variant=${dynamicPrompt.variant}, ` +
                `tone=${dynamicPrompt.tone}, stage=${dynamicPrompt.relationshipStage}`,
            );
          } catch (err: any) {
            this.logger.warn(
              `Dynamic prompt assembly failed, falling back to static: ${err.message}`,
            );
          }
        }
      }

      // Store dynamic prompt metadata on the call record
      if (dynamicPrompt) {
        await this.callsService.updateCallStatus(call._id.toString(), 'scheduled', {
          conversationVariant: dynamicPrompt.variant,
          toneUsed: dynamicPrompt.tone,
          relationshipStage: dynamicPrompt.relationshipStage,
          screeningQuestionsAsked: dynamicPrompt.screeningQuestionIds,
        } as any);
      }

      let result: { conversationId: string; callSid: string };

      if (this.voiceStack === 'sarvam') {
        // Sarvam stack: LiveKit room + SIP call → Python agent worker
        result = await this.sarvamAgentService.makeOutboundCall(
          patient.phone,
          call._id.toString(),
          patientData,
          dynamicPrompt,
        );
      } else {
        // Default: ElevenLabs Conversational AI Agent
        result = await this.elevenLabsAgentService.makeOutboundCall(
          patient.phone,
          call._id.toString(),
          patientData,
          dynamicPrompt,
        );
      }

      // Update call with conversation/room ID
      const callTrackingFields: any = { initiatedAt: new Date() };
      if (this.voiceStack === 'sarvam') {
        callTrackingFields.livekitRoomName = result.conversationId;
      } else {
        callTrackingFields.elevenlabsConversationId = result.conversationId;
      }
      await this.callsService.updateCallStatus(
        call._id.toString(),
        'in_progress',
        callTrackingFields,
      );

      // Enqueue a timeout task to detect stale calls (Cloud Tasks path)
      if (this.configService.get<string>('USE_CLOUD_TASKS') === 'true') {
        const timeoutAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await this.cloudTasksService.enqueueTimeoutTask(callId!, timeoutAt).catch((err) => {
          this.logger.warn(`Failed to enqueue timeout task for call ${callId}: ${err.message}`);
        });
      }

      this.logger.log(
        `AI call initiated [${this.voiceStack}] for ${patient.preferredName} (${patient._id}), ` +
        `conversationId: ${result.conversationId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to initiate call for patient ${patient._id}: ${error.message}`,
      );

      // If a call record was created, mark it failed and trigger retry
      if (callId) {
        try {
          await this.callsService.updateCallStatus(callId, 'failed');
          await this.retryHandler.handleFailed(callId);
        } catch (retryErr: any) {
          this.logger.warn(`Failed to schedule retry for call ${callId}: ${retryErr.message}`);
        }
      }
    } finally {
      await this.lockService.releaseLock(`call:${patientId}`);
    }
  }

  /**
   * Initiate a retry call using an existing call record.
   * Called by RetryHandlerService.processRetries() when a scheduled retry is due.
   */
  async initiateRetryCall(call: any, patient: any, config: any, medicines: any[]) {
    try {
      const patientData = {
        patientName: patient.preferredName,
        medicines: medicines.map((med: any) => ({
          name: med.nicknames?.[0] || med.brandName,
          timing: med.timing,
          medicineId: med._id.toString(),
        })),
        isNewPatient: patient.isNewPatient,
        hasGlucometer: patient.hasGlucometer,
        hasBPMonitor: patient.hasBPMonitor,
        preferredLanguage: patient.preferredLanguage || 'hi',
        callTiming: this.getCurrentCallTiming(),
      };

      // Dynamic prompt assembly (if enabled)
      let dynamicPrompt: DynamicPromptResult | null = null;

      if (this.dynamicPromptGlobalEnabled && config?.dynamicPromptEnabled !== false) {
        try {
          dynamicPrompt = await this.promptAssembler.assembleDynamicPrompt(
            patient._id.toString(),
          );
        } catch (err: any) {
          this.logger.warn(`Dynamic prompt failed for retry: ${err.message}`);
        }
      }

      if (dynamicPrompt) {
        await this.callsService.updateCallStatus(call._id.toString(), 'scheduled', {
          conversationVariant: dynamicPrompt.variant,
          toneUsed: dynamicPrompt.tone,
          relationshipStage: dynamicPrompt.relationshipStage,
          screeningQuestionsAsked: dynamicPrompt.screeningQuestionIds,
        } as any);
      }

      let result: { conversationId: string; callSid: string };

      if (this.voiceStack === 'sarvam') {
        result = await this.sarvamAgentService.makeOutboundCall(
          patient.phone,
          call._id.toString(),
          patientData,
          dynamicPrompt,
        );
      } else {
        result = await this.elevenLabsAgentService.makeOutboundCall(
          patient.phone,
          call._id.toString(),
          patientData,
          dynamicPrompt,
        );
      }

      const callTrackingFields: any = { initiatedAt: new Date() };
      if (this.voiceStack === 'sarvam') {
        callTrackingFields.livekitRoomName = result.conversationId;
        callTrackingFields.voiceStack = 'sarvam';
      } else {
        callTrackingFields.elevenlabsConversationId = result.conversationId;
        callTrackingFields.voiceStack = 'elevenlabs';
      }

      await this.callsService.updateCallStatus(
        call._id.toString(),
        'in_progress',
        callTrackingFields,
      );

      // Enqueue a timeout task to detect stale calls (Cloud Tasks path)
      if (this.configService.get<string>('USE_CLOUD_TASKS') === 'true') {
        const timeoutAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.cloudTasksService.enqueueTimeoutTask(call._id.toString(), timeoutAt).catch((err) => {
          this.logger.warn(`Failed to enqueue timeout task for retry call ${call._id}: ${err.message}`);
        });
      }

      this.logger.log(
        `Retry call initiated [${this.voiceStack}] for ${patient.preferredName}, ` +
          `retry #${call.retryCount}, conversationId: ${result.conversationId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to initiate retry call ${call._id}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Determine the call timing slot based on the current IST hour.
   */
  private getCurrentCallTiming(): string {
    const hour = DateTime.now().setZone('Asia/Kolkata').hour;
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Handle call failure (e.g., SIP failures, invalid numbers).
   * Note: Most completion handling is done by ElevenLabsWebhookController via post-call webhook.
   */
  async handleCallFailed(callId: string, status: string, errorCode?: string) {
    await this.callsService.updateCallStatus(callId, status);

    if (errorCode === '21217') {
      // Invalid phone number — pause patient, don't retry
      const call = await this.callsService.findById(callId);
      const patient = await this.patientsService.findById(call.patientId.toString());
      await this.patientsService.update(patient._id.toString(), patient.userId.toString(), {
        isPaused: true,
        pauseReason: 'invalid_phone',
      } as any);

      await this.notificationsService.sendInvalidPhoneAlert(call, patient);
    } else {
      // Recoverable failure — trigger retry
      try {
        await this.retryHandler.handleFailed(callId);
      } catch (retryErr: any) {
        this.logger.warn(`Failed to schedule retry for call ${callId}: ${retryErr.message}`);
      }
    }
  }
}
