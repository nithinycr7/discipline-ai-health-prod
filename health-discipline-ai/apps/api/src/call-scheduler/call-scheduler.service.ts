import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { CallsService } from '../calls/calls.service';
import { PatientsService } from '../patients/patients.service';
import { CallOrchestratorService } from './call-orchestrator.service';
import { RetryHandlerService } from './retry-handler.service';
import { DistributedLockService } from '../distributed-lock/distributed-lock.service';
import { DateTime } from 'luxon';

// Catch-up window: if cron missed a tick, still process calls up to this many minutes late
const CATCHUP_MINUTES = 5;

@Injectable()
export class CallSchedulerService {
  private readonly logger = new Logger(CallSchedulerService.name);

  constructor(
    private callConfigsService: CallConfigsService,
    private callsService: CallsService,
    private patientsService: PatientsService,
    private callOrchestratorService: CallOrchestratorService,
    private retryHandlerService: RetryHandlerService,
    private lockService: DistributedLockService,
    private configService: ConfigService,
  ) {}

  /** Global kill switch — set DISABLE_ALL_CALLS=true to stop all outbound calls */
  private isKillSwitchActive(): boolean {
    return this.configService.get<string>('DISABLE_ALL_CALLS') === 'true';
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledCalls() {
    if (this.isKillSwitchActive()) return;
    if (this.configService.get<string>('USE_CLOUD_TASKS') === 'true') return;
    const ran = await this.lockService.withLock('cron:processScheduledCalls', 120, async () => {
      try {
        const now = DateTime.now();
        const configs = await this.callConfigsService.getActiveConfigs();

        const SLOT_CONFIG = [
          { field: 'morningCallTime', timing: 'morning' },
          { field: 'afternoonCallTime', timing: 'afternoon' },
          { field: 'eveningCallTime', timing: 'evening' },
          { field: 'nightCallTime', timing: 'night' },
        ];

        const dueCalls = [];

        for (const config of configs) {
          const patientTime = now.setZone(config.timezone);
          const currentTime = `${String(patientTime.hour).padStart(2, '0')}:${String(patientTime.minute).padStart(2, '0')}`;

          for (const slot of SLOT_CONFIG) {
            const slotTime = config[slot.field];
            if (!slotTime || slotTime === 'pending') continue;

            // Check if slot is due now or was missed within the catch-up window
            const [slotH, slotM] = slotTime.split(':').map(Number);
            const slotMinutes = slotH * 60 + slotM;
            const currentMinutes = patientTime.hour * 60 + patientTime.minute;
            const diff = currentMinutes - slotMinutes;

            if (diff >= 0 && diff <= CATCHUP_MINUTES) {
              try {
                const patient = await this.patientsService.findById(config.patientId.toString());

                if (patient.isPaused) continue;
                if (patient.phoneStatus === 'invalid') continue;

                // Dedup: skip if a call already exists for this patient today
                const alreadyCalled = await this.callsService.hasCallToday(
                  patient._id.toString(),
                  config.timezone,
                );
                if (alreadyCalled) continue;

                dueCalls.push({
                  config,
                  patient,
                  timing: slot.timing,
                });
              } catch (err) {
                this.logger.warn(`Patient ${config.patientId} not found for call config`);
              }
            }
          }
        }

        if (dueCalls.length > 0) {
          this.logger.log(`Processing ${dueCalls.length} due calls`);
          await this.callOrchestratorService.processBatch(dueCalls);
        }
      } catch (error) {
        this.logger.error('Error in call scheduler', error.stack);
      }
    });

    if (!ran) {
      this.logger.debug('processScheduledCalls: skipped (another instance holds the lock)');
    }
  }

  @Cron('0 */30 * * * *') // Every 30 minutes
  async processRetries() {
    if (this.isKillSwitchActive()) return;
    if (this.configService.get<string>('USE_CLOUD_TASKS') === 'true') return;
    const ran = await this.lockService.withLock('cron:processRetries', 600, async () => {
      try {
        await this.retryHandlerService.processRetries();
      } catch (error) {
        this.logger.error('Error processing retries', error.stack);
      }
    });

    if (!ran) {
      this.logger.debug('processRetries: skipped (another instance holds the lock)');
    }
  }

  /**
   * Clean up calls stuck in 'in_progress' — webhook never arrived.
   * Marks them as 'no_answer' and triggers retry logic.
   */
  @Cron('0 */2 * * * *') // Every 2 minutes
  async cleanupStaleCalls() {
    if (this.isKillSwitchActive()) return;
    if (this.configService.get<string>('USE_CLOUD_TASKS') === 'true') return;
    const ran = await this.lockService.withLock('cron:cleanupStaleCalls', 240, async () => {
      try {
        const staleCalls = await this.callsService.findStaleCalls(10); // 10 min timeout

        for (const call of staleCalls) {
          // Atomically mark as no_answer — prevents race with late webhook
          const updated = await this.callsService.markStaleAsNoAnswer(call._id.toString());
          if (!updated) continue; // Webhook arrived between find and update

          this.logger.warn(
            `Stale call ${call._id} cleaned up (was in_progress for >10min), ` +
              `patient=${call.patientId}, voiceStack=${call.voiceStack}`,
          );

          // Only trigger retry if patient doesn't already have a completed call today.
          // This prevents stale test calls from creating retry cascades.
          try {
            const config = await this.callConfigsService.findByPatient(call.patientId.toString());
            const hasCompletedToday = await this.callsService.hasCompletedCallToday(
              call.patientId.toString(),
              config?.timezone || 'Asia/Kolkata',
            );
            if (hasCompletedToday) {
              this.logger.log(
                `Patient ${call.patientId} already has a completed call today, skipping retry for stale call ${call._id}`,
              );
              continue;
            }

            await this.retryHandlerService.handleNoAnswer(call._id.toString());
          } catch (retryErr) {
            this.logger.error(`Failed to schedule retry for stale call ${call._id}: ${retryErr.message}`);
          }
        }

        if (staleCalls.length > 0) {
          this.logger.log(`Cleaned up ${staleCalls.length} stale call(s)`);
        }
      } catch (error) {
        this.logger.error('Error in stale call cleanup', error.stack);
      }
    });

    if (!ran) {
      this.logger.debug('cleanupStaleCalls: skipped (another instance holds the lock)');
    }
  }

  @Cron('0 */30 * * * *') // Every 30 minutes (skip_today pauses expire mid-day, not just midnight)
  async checkPausedPatients() {
    if (this.configService.get<string>('USE_CLOUD_TASKS') === 'true') return;
    const ran = await this.lockService.withLock('cron:checkPausedPatients', 600, async () => {
      try {
        const patients = await this.patientsService.getPausedPatientsWithExpiry();
        for (const patient of patients) {
          await this.patientsService.resume(patient._id.toString(), patient.userId.toString());
          this.logger.log(`Auto-resumed patient ${patient._id} (pausedUntil expired)`);
        }
      } catch (error) {
        this.logger.error('Error checking paused patients', error.stack);
      }
    });

    if (!ran) {
      this.logger.debug('checkPausedPatients: skipped (another instance holds the lock)');
    }
  }
}
