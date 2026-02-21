import { Controller, Post, Body, Logger, UseGuards, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { DateTime } from 'luxon';
import { Public } from '../common/decorators/public.decorator';
import { InternalTaskGuard } from '../common/guards/internal-task.guard';
import { CloudTasksService } from './cloud-tasks.service';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { CallsService } from '../calls/calls.service';
import { PatientsService } from '../patients/patients.service';
import { MedicinesService } from '../medicines/medicines.service';
import { CallOrchestratorService } from '../call-scheduler/call-orchestrator.service';
import { RetryHandlerService } from '../call-scheduler/retry-handler.service';

const SLOT_FIELDS = [
  { field: 'morningCallTime', timing: 'morning' },
  { field: 'afternoonCallTime', timing: 'afternoon' },
  { field: 'eveningCallTime', timing: 'evening' },
  { field: 'nightCallTime', timing: 'night' },
] as const;

/**
 * Internal endpoints triggered by Cloud Tasks and Cloud Scheduler.
 * Protected by shared secret (InternalTaskGuard), not JWT.
 * These endpoints replace the 4 cron jobs when USE_CLOUD_TASKS=true.
 */
@Controller('internal')
@UseGuards(InternalTaskGuard)
@Public() // Bypass JWT auth — internal secret provides authentication
@ApiExcludeController()
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(
    private configService: ConfigService,
    private cloudTasksService: CloudTasksService,
    private callConfigsService: CallConfigsService,
    private callsService: CallsService,
    private patientsService: PatientsService,
    private medicinesService: MedicinesService,
    private callOrchestratorService: CallOrchestratorService,
    private retryHandlerService: RetryHandlerService,
  ) {}

  private isKillSwitchActive(): boolean {
    return this.configService.get<string>('DISABLE_ALL_CALLS') === 'true';
  }

  /**
   * Triggered by Cloud Scheduler daily at 5:00 AM IST.
   * Enqueues one Cloud Task per patient per time slot for today.
   */
  @Post('enqueue-daily-calls')
  @HttpCode(200)
  async enqueueDailyCalls() {
    if (this.isKillSwitchActive()) {
      this.logger.warn('Kill switch active, skipping daily enqueue');
      return { status: 'skipped', reason: 'kill_switch' };
    }

    const configs = await this.callConfigsService.getActiveConfigs();
    const now = DateTime.now();
    const dateKey = now.setZone('Asia/Kolkata').toFormat('yyyy-MM-dd');
    let tasksEnqueued = 0;
    let tasksSkipped = 0;

    for (const config of configs) {
      const patientId = config.patientId.toString();

      // Pre-check: skip paused patients
      try {
        const patient = await this.patientsService.findById(patientId);
        if (patient.isPaused || patient.phoneStatus === 'invalid') {
          tasksSkipped++;
          continue;
        }
      } catch {
        tasksSkipped++;
        continue;
      }

      for (const slot of SLOT_FIELDS) {
        const slotTime = config[slot.field];
        if (!slotTime || slotTime === 'pending') continue;

        // Parse HH:MM and compute exact schedule time in patient's timezone
        const [hour, minute] = slotTime.split(':').map(Number);
        const scheduleDateTime = now
          .setZone(config.timezone || 'Asia/Kolkata')
          .set({ hour, minute, second: 0, millisecond: 0 });

        // Skip if this slot is already in the past
        if (scheduleDateTime < now) {
          tasksSkipped++;
          continue;
        }

        try {
          const result = await this.cloudTasksService.enqueueCallTask(
            patientId,
            slot.timing,
            scheduleDateTime.toJSDate(),
            dateKey,
          );
          if (result) {
            tasksEnqueued++;
          } else {
            tasksSkipped++; // Already enqueued (dedup)
          }
        } catch (err: any) {
          this.logger.error(`Failed to enqueue call task for patient ${patientId}: ${err.message}`);
          tasksSkipped++;
        }
      }
    }

    this.logger.log(
      `Daily enqueue complete: ${tasksEnqueued} tasks enqueued, ${tasksSkipped} skipped, ${configs.length} configs scanned`,
    );

    return { status: 'ok', date: dateKey, tasksEnqueued, tasksSkipped, configsScanned: configs.length };
  }

  /**
   * Triggered by Cloud Task at the patient's exact call time.
   * Handles both new calls and retry calls.
   */
  @Post('trigger-call')
  @HttpCode(200)
  async triggerCall(
    @Body() body: { patientId: string; timing?: string; callId?: string; isRetry?: boolean },
  ) {
    if (this.isKillSwitchActive()) {
      this.logger.warn('Kill switch active, skipping trigger-call');
      return { status: 'skipped', reason: 'kill_switch' };
    }

    const { patientId, timing, callId, isRetry } = body;

    if (!patientId) {
      return { status: 'error', reason: 'missing_patient_id' };
    }

    // Load patient and check guards
    const patient = await this.patientsService.findById(patientId);
    if (patient.isPaused) {
      this.logger.log(`Patient ${patientId} is paused, skipping call`);
      return { status: 'skipped', reason: 'patient_paused' };
    }
    if (patient.phoneStatus === 'invalid') {
      this.logger.log(`Patient ${patientId} has invalid phone, skipping call`);
      return { status: 'skipped', reason: 'invalid_phone' };
    }

    const config = await this.callConfigsService.findByPatient(patientId);
    if (!config || !config.isActive) {
      this.logger.log(`No active config for patient ${patientId}, skipping call`);
      return { status: 'skipped', reason: 'no_active_config' };
    }

    // --- RETRY CALL PATH ---
    if (isRetry && callId) {
      const call = await this.callsService.findById(callId);

      // Atomic claim — prevents double processing
      const claimed = await this.callsService.claimForProcessing(callId, 'scheduled');
      if (!claimed) {
        this.logger.log(`Retry call ${callId} already claimed, skipping`);
        return { status: 'skipped', reason: 'already_claimed' };
      }

      const medicines = await this.medicinesService.findByPatient(patientId);
      if (!medicines.length) {
        this.logger.warn(`No medicines for patient ${patientId}, skipping retry`);
        await this.callsService.updateCallStatus(callId, 'failed');
        return { status: 'skipped', reason: 'no_medicines' };
      }

      await this.callOrchestratorService.initiateRetryCall(call, patient, config, medicines);
      return { status: 'ok', callId, type: 'retry' };
    }

    // --- NEW CALL PATH ---
    // Safety check: one call per patient per day (skip for test-tagged patients)
    const isTestPatient = patient.tag === 'test';
    if (!isTestPatient) {
      const alreadyCalled = await this.callsService.hasCallToday(
        patientId,
        config.timezone || 'Asia/Kolkata',
      );
      if (alreadyCalled) {
        this.logger.log(`Patient ${patientId} already has a call today, skipping`);
        return { status: 'skipped', reason: 'already_called_today' };
      }
    } else {
      this.logger.log(`Patient ${patientId} is tagged as 'test', bypassing daily call limit`);
    }

    await this.callOrchestratorService.initiateCall({
      config,
      patient,
      timing: timing || 'night',
    });

    return { status: 'ok', patientId, type: 'new_call' };
  }

  /**
   * Triggered by Cloud Task 10 minutes after a call starts.
   * Replaces the cleanupStaleCalls cron.
   */
  @Post('call-timeout')
  @HttpCode(200)
  async callTimeout(@Body() body: { callId: string }) {
    const { callId } = body;

    if (!callId) {
      return { status: 'error', reason: 'missing_call_id' };
    }

    // Check if call is still in_progress — if not, webhook already handled it
    const call = await this.callsService.findById(callId);
    if (call.status !== 'in_progress') {
      this.logger.log(`Call ${callId} already in status '${call.status}', timeout no-op`);
      return { status: 'ok', reason: 'already_handled' };
    }

    // Atomically mark as no_answer — prevents race with late webhook
    const updated = await this.callsService.markStaleAsNoAnswer(callId);
    if (!updated) {
      this.logger.log(`Call ${callId} already updated by webhook, timeout no-op`);
      return { status: 'ok', reason: 'webhook_won_race' };
    }

    this.logger.warn(`Call ${callId} timed out (in_progress for >10min), marked as no_answer`);

    // Only retry if patient doesn't already have a completed call today
    const config = await this.callConfigsService.findByPatient(call.patientId.toString());
    const hasCompletedToday = await this.callsService.hasCompletedCallToday(
      call.patientId.toString(),
      config?.timezone || 'Asia/Kolkata',
    );

    if (hasCompletedToday) {
      this.logger.log(`Patient ${call.patientId} already has a completed call today, skipping retry`);
      return { status: 'ok', reason: 'completed_today' };
    }

    try {
      await this.retryHandlerService.handleNoAnswer(callId);
    } catch (err: any) {
      this.logger.error(`Failed to schedule retry for timed-out call ${callId}: ${err.message}`);
    }

    return { status: 'ok', callId, action: 'no_answer_retry' };
  }

  /**
   * Triggered by Cloud Scheduler every 30 minutes.
   * Resumes patients whose pausedUntil has expired.
   */
  @Post('check-paused-patients')
  @HttpCode(200)
  async checkPausedPatients() {
    const patients = await this.patientsService.getPausedPatientsWithExpiry();
    let resumedCount = 0;

    for (const patient of patients) {
      try {
        await this.patientsService.resume(patient._id.toString(), patient.userId.toString());
        this.logger.log(`Auto-resumed patient ${patient._id} (pausedUntil expired)`);
        resumedCount++;
      } catch (err: any) {
        this.logger.error(`Failed to resume patient ${patient._id}: ${err.message}`);
      }
    }

    return { status: 'ok', resumedCount };
  }
}
