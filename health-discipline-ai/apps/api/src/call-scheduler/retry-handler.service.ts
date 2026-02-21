import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { CallsService } from '../calls/calls.service';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { CallOrchestratorService } from './call-orchestrator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PatientsService } from '../patients/patients.service';
import { MedicinesService } from '../medicines/medicines.service';
import { DistributedLockService } from '../distributed-lock/distributed-lock.service';
import { ConfigService } from '@nestjs/config';
import { CloudTasksService } from '../cloud-tasks/cloud-tasks.service';

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
    private lockService: DistributedLockService,
    private configService: ConfigService,
    private cloudTasksService: CloudTasksService,
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
    const patientId = call.patientId.toString();
    const config = await this.callConfigsService.findByPatient(patientId);

    if (!config || !config.retryEnabled) {
      this.logger.log(`Retry not enabled for patient ${patientId}, skipping`);
      return;
    }

    // Respect retryOnlyForStatuses — only retry for allowed reasons
    const allowedStatuses = config.retryOnlyForStatuses || ['no_answer', 'busy'];
    if (!allowedStatuses.includes(reason)) {
      this.logger.log(
        `Retry reason '${reason}' not in allowed statuses [${allowedStatuses.join(', ')}] for patient ${patientId}, skipping`,
      );
      return;
    }

    // Per-patient lock: prevents two concurrent calls to scheduleRetry from
    // both passing hasPendingRetry() and creating duplicate retries.
    const lockAcquired = await this.lockService.acquireLock(`retry:${patientId}`, 30);
    if (!lockAcquired) {
      this.logger.log(`Could not acquire retry lock for patient ${patientId}, another retry is being created`);
      return;
    }

    try {
      return await this._scheduleRetryLocked(callId, call, config, reason);
    } finally {
      await this.lockService.releaseLock(`retry:${patientId}`);
    }
  }

  /** Inner retry logic — must be called while holding per-patient lock */
  private async _scheduleRetryLocked(
    callId: string,
    call: any,
    config: any,
    reason: keyof typeof RETRY_DELAYS,
  ) {
    const patientId = call.patientId.toString();

    // Don't create duplicate retries — only one pending retry per patient at a time
    const alreadyHasRetry = await this.callsService.hasPendingRetry(patientId);
    if (alreadyHasRetry) {
      this.logger.log(
        `Patient ${patientId} already has a pending retry, skipping new retry for call ${callId}`,
      );
      return;
    }

    const maxRetries = config.maxRetries || 2;

    if (call.retryCount >= maxRetries) {
      this.logger.log(`Max retries (${maxRetries}) reached for call ${callId} [${reason}]`);

      const patient = await this.patientsService.findById(call.patientId.toString());
      await this.notificationsService.sendMissedCallAlert(call, patient);

      // Mark pending medicines as missed (uses upsert — no duplicates)
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

    // Reset all medicine responses to 'pending' for the retry
    const freshMedicines = (call.medicinesChecked || []).map((med: any) => ({
      medicineId: med.medicineId,
      medicineName: med.medicineName,
      nickname: med.nickname,
      response: 'pending',
      isCritical: med.isCritical || false,
      timestamp: new Date(),
    }));

    const retryCall = await this.callsService.create({
      patientId: call.patientId,
      userId: call.userId,
      scheduledAt,
      status: 'scheduled',
      retryCount: call.retryCount + 1,
      isRetry: true,
      originalCallId: call.originalCallId || call._id,
      medicinesChecked: freshMedicines,
      usedNewPatientProtocol: call.usedNewPatientProtocol,
    });

    // Enqueue Cloud Task to trigger the retry at the scheduled time
    if (this.configService.get<string>('USE_CLOUD_TASKS') === 'true') {
      await this.cloudTasksService.enqueueRetryTask(
        patientId,
        retryCall._id.toString(),
        retryCall.retryCount,
        scheduledAt,
      ).catch((err) => {
        this.logger.warn(`Failed to enqueue retry task for call ${retryCall._id}: ${err.message}`);
      });
    }

    this.logger.log(
      `Retry ${retryCall.retryCount}/${maxRetries} scheduled for call ${callId} ` +
        `[${reason}] in ${delayMinutes}min at ${scheduledAt.toISOString()}`,
    );
  }

  /**
   * Process due retry calls — triggered by cron every 30 minutes.
   * Uses atomic claim to prevent race conditions.
   * Only processes ONE retry per patient to prevent call cascades.
   */
  async processRetries() {
    const dueRetries = await this.callsService.findDueRetries();

    if (dueRetries.length === 0) return;

    this.logger.log(`Processing ${dueRetries.length} due retries`);

    // Dedup: only process the FIRST retry per patient, cancel the rest
    const processedPatients = new Set<string>();

    for (const retry of dueRetries) {
      const patientKey = retry.patientId.toString();

      // Skip if we already triggered a retry for this patient in this batch
      if (processedPatients.has(patientKey)) {
        this.logger.warn(
          `Duplicate retry ${retry._id} for patient ${patientKey} — cancelling as duplicate`,
        );
        await this.callsService.updateCallStatus(retry._id.toString(), 'failed');
        continue;
      }

      try {
        // Atomically claim the retry — prevents duplicate processing
        const claimed = await this.callsService.claimForProcessing(
          retry._id.toString(),
          'scheduled',
        );
        if (!claimed) {
          this.logger.log(`Retry ${retry._id} already claimed, skipping`);
          continue;
        }

        const patient = await this.patientsService.findById(retry.patientId.toString());

        if (patient.isPaused) {
          this.logger.log(`Patient ${patient._id} is paused, skipping retry ${retry._id}`);
          await this.callsService.updateCallStatus(retry._id.toString(), 'scheduled');
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

        // Re-trigger the actual call via orchestrator
        await this.callOrchestratorService.initiateRetryCall(
          retry,
          patient,
          config,
          medicines,
        );

        processedPatients.add(patientKey);
        this.logger.log(`Retry call ${retry._id} triggered for patient ${patient.preferredName}`);
      } catch (err: any) {
        this.logger.error(`Failed to process retry ${retry._id}: ${err.message}`);
        await this.callsService.updateCallStatus(retry._id.toString(), 'failed');
      }
    }
  }
}
