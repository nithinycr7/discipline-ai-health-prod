import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallsService } from '../calls/calls.service';
import { MedicinesService } from '../medicines/medicines.service';
import { PatientsService } from '../patients/patients.service';
import { ElevenLabsAgentService } from '../integrations/elevenlabs/elevenlabs-agent.service';
import { SarvamAgentService } from '../integrations/sarvam/sarvam-agent.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { PromptAssemblerService } from '../dynamic-prompt/prompt-assembler.service';
import { DynamicPromptResult } from '../dynamic-prompt/types/prompt-context.types';

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

    try {
      // Get ALL medicines for the patient (we call once at night for everything)
      const medicines = await this.medicinesService.findByPatient(
        patient._id.toString(),
      );

      if (medicines.length === 0) {
        this.logger.log(`No medicines for patient ${patient._id}, skipping`);
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

      this.logger.log(
        `AI call initiated [${this.voiceStack}] for ${patient.preferredName} (${patient._id}), ` +
        `conversationId: ${result.conversationId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to initiate call for patient ${patient._id}: ${error.message}`,
      );
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
   * Handle call failure (e.g., SIP failures, invalid numbers).
   * Note: Most completion handling is done by ElevenLabsWebhookController via post-call webhook.
   */
  async handleCallFailed(callId: string, status: string, errorCode?: string) {
    await this.callsService.updateCallStatus(callId, status);

    if (errorCode === '21217') {
      const call = await this.callsService.findById(callId);
      const patient = await this.patientsService.findById(call.patientId.toString());
      await this.patientsService.update(patient._id.toString(), patient.userId.toString(), {
        isPaused: true,
        pauseReason: 'invalid_phone',
      } as any);

      await this.notificationsService.sendInvalidPhoneAlert(call, patient);
    }
  }
}
