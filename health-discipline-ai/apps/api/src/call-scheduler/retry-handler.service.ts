import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CallsService } from '../calls/calls.service';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { CallOrchestratorService } from './call-orchestrator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PatientsService } from '../patients/patients.service';
import { MedicinesService } from '../medicines/medicines.service';

// Default retry delays (minutes) per scenario
const RETRY_DELAYS = {
  no_answer: 30,
  re_scheduled: 60,
  busy: 15,
  failed: 10,
};

@Injectable()
export class RetryHandlerService {
  private readonly logger = new Logger(RetryHandlerService.name);

  constructor(
    private callsService: CallsService,
    private callConfigsService: CallConfigsService,
    private patientsService: PatientsService,
    private notificationsService: NotificationsService,
    private medicinesService: MedicinesService,
    @Inject(forwardRef(() => CallOrchestratorService))
    private callOrchestratorService: CallOrchestratorService,
  ) {}

  /**
   * Handle no_answer — patient didn't pick up.
   */
  async handleNoAnswer(callId: string) {
    return this.scheduleRetry(callId, 'no_answer');
  }

  /**
   * Handle reScheduled — patient said "call me later" / "busy hoon".
   */
  async handleReScheduled(callId: string) {
    return this.scheduleRetry(callId, 're_scheduled');
  }

  /**
   * Handle busy — Twilio returned busy signal.
   */
  async handleBusy(callId: string) {
    return this.scheduleRetry(callId, 'busy');
  }

  /**
   * Handle failed — technical error during call.
   */
  async handleFailed(callId: string) {
    return this.scheduleRetry(callId, 'failed');
  }

  /**
   * Core retry scheduling logic shared by all scenarios.
   */
  private async scheduleRetry(callId: string, reason: keyof typeof RETRY_DELAYS) {
    const call = await this.callsService.findById(callId);
    const config = await this.callConfigsService.findByPatient(call.patientId.toString());

    if (!config || !config.retryEnabled) {
      this.logger.log(`Retry not enabled for patient ${call.patientId}, skipping`);
      return;
    }

    const maxRetries = config.maxRetries || 2;

    if (call.retryCount >= maxRetries) {
      this.logger.log(`Max retries (${maxRetries}) reached for call ${callId} [${reason}]`);

      const patient = await this.patientsService.findById(call.patientId.toString());
      await this.notificationsService.sendMissedCallAlert(call, patient);

      // Mark pending medicines as missed
      for (const med of call.medicinesChecked) {
        if (med.response === 'pending') {
          await this.callsService.addMedicineResponse(
            callId,
            med.medicineId.toString(),
            med.medicineName,
            med.nickname,
            'missed',
          );
        }
      }
      return;
    }

    // Use config interval if set, otherwise use default per reason
    const delayMinutes = config.retryIntervalMinutes || RETRY_DELAYS[reason];
    const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    const retryCall = await this.callsService.create({
      patientId: call.patientId,
      userId: call.userId,
      scheduledAt,
      status: 'scheduled',
      retryCount: call.retryCount + 1,
      isRetry: true,
      originalCallId: call.originalCallId || call._id,
      medicinesChecked: call.medicinesChecked,
      usedNewPatientProtocol: call.usedNewPatientProtocol,
    });

    this.logger.log(
      `Retry ${retryCall.retryCount}/${maxRetries} scheduled for call ${callId} ` +
        `[${reason}] in ${delayMinutes}min at ${scheduledAt.toISOString()}`,
    );
  }

  /**
   * Process due retry calls — triggered by cron every 30 minutes.
   * Actually re-triggers calls through the orchestrator.
   */
  async processRetries() {
    const now = new Date();
    const dueRetries = await this.callsService['callModel'].find({
      status: 'scheduled',
      isRetry: true,
      scheduledAt: { $lte: now },
    });

    if (dueRetries.length === 0) return;

    this.logger.log(`Processing ${dueRetries.length} due retries`);

    for (const retry of dueRetries) {
      try {
        const patient = await this.patientsService.findById(retry.patientId.toString());

        if (patient.isPaused) {
          this.logger.log(`Patient ${patient._id} is paused, skipping retry ${retry._id}`);
          continue;
        }

        // Get the patient's call config for dynamic prompt opt-in
        const config = await this.callConfigsService.findByPatient(patient._id.toString());

        // Get ALL active medicines for the patient (retry covers all timings)
        const medicines = await this.medicinesService.findByPatient(patient._id.toString());

        if (!medicines.length) {
          this.logger.warn(`No medicines for patient ${patient._id}, skipping retry`);
          await this.callsService.updateCallStatus(retry._id.toString(), 'failed');
          continue;
        }

        // Mark as in_progress immediately to prevent duplicate processing
        await this.callsService.updateCallStatus(retry._id.toString(), 'in_progress');

        // Re-trigger the actual call via orchestrator
        await this.callOrchestratorService.initiateRetryCall(
          retry,
          patient,
          config,
          medicines,
        );

        this.logger.log(`Retry call ${retry._id} triggered for patient ${patient.preferredName}`);
      } catch (err: any) {
        this.logger.error(`Failed to process retry ${retry._id}: ${err.message}`);
        await this.callsService.updateCallStatus(retry._id.toString(), 'failed');
      }
    }
  }
}
