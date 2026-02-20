import { Injectable, Logger } from '@nestjs/common';
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
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledCalls() {
    const ran = await this.lockService.withLock('cron:processScheduledCalls', 55, async () => {
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
    const ran = await this.lockService.withLock('cron:processRetries', 300, async () => {
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

  @Cron('0 */30 * * * *') // Every 30 minutes (skip_today pauses expire mid-day, not just midnight)
  async checkPausedPatients() {
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
