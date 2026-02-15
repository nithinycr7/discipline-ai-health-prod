import { Injectable, Logger } from '@nestjs/common';
import { CallsService } from '../calls/calls.service';
import { MedicinesService } from '../medicines/medicines.service';
import { PatientsService } from '../patients/patients.service';
import { ElevenLabsAgentService } from '../integrations/elevenlabs/elevenlabs-agent.service';
import { NotificationsService } from '../notifications/notifications.service';

interface DueCall {
  config: any;
  patient: any;
  timing: string;
}

@Injectable()
export class CallOrchestratorService {
  private readonly logger = new Logger(CallOrchestratorService.name);
  private readonly MAX_CONCURRENT = 50;

  constructor(
    private callsService: CallsService,
    private medicinesService: MedicinesService,
    private patientsService: PatientsService,
    private elevenLabsAgentService: ElevenLabsAgentService,
    private notificationsService: NotificationsService,
  ) {}

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
   * Initiate an AI voice call to a patient using ElevenLabs Conversational AI.
   *
   * Flow:
   * 1. Get patient's medicines for this timing
   * 2. Create a call record in DB
   * 3. Call ElevenLabs outbound call API with patient data as dynamic variables
   * 4. ElevenLabs agent conducts the conversation autonomously in Hindi
   * 5. After call ends, ElevenLabs sends post-call webhook → ElevenLabsWebhookController
   */
  async initiateCall(dueCall: DueCall) {
    const { patient, timing } = dueCall;

    try {
      // Get medicines for this timing
      const medicines = await this.medicinesService.findByPatientAndTiming(
        patient._id.toString(),
        timing,
      );

      if (medicines.length === 0) {
        this.logger.log(`No ${timing} medicines for patient ${patient._id}, skipping`);
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
        medicinesChecked: medicines.map((med: any) => ({
          medicineId: med._id,
          medicineName: med.brandName,
          nickname: med.nicknames?.[0] || med.brandName,
          response: 'pending',
          timestamp: new Date(),
        })),
      });

      // Make outbound call via ElevenLabs Conversational AI Agent
      // The agent handles the entire conversation autonomously
      const result = await this.elevenLabsAgentService.makeOutboundCall(
        patient.phone,
        call._id.toString(),
        {
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
        },
      );

      // Update call with ElevenLabs conversation ID
      await this.callsService.updateCallStatus(call._id.toString(), 'in_progress', {
        twilioCallSid: result.conversationId,
        initiatedAt: new Date(),
      });

      this.logger.log(
        `AI call initiated for ${patient.preferredName} (${patient._id}), ` +
        `conversationId: ${result.conversationId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to initiate call for patient ${patient._id}: ${error.message}`,
      );
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
