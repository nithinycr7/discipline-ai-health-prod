import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { PatientsService } from '../patients/patients.service';
import { CallOrchestratorService } from './call-orchestrator.service';
import { RetryHandlerService } from './retry-handler.service';
import { DateTime } from 'luxon';

@Injectable()
export class CallSchedulerService {
  private readonly logger = new Logger(CallSchedulerService.name);

  constructor(
    private callConfigsService: CallConfigsService,
    private patientsService: PatientsService,
    private callOrchestratorService: CallOrchestratorService,
    private retryHandlerService: RetryHandlerService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledCalls() {
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

          if (slotTime === currentTime) {
            try {
              const patient = await this.patientsService.findById(config.patientId.toString());

              if (patient.isPaused) continue;
              if (patient.phoneStatus === 'invalid') continue;

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
  }

  @Cron('0 */30 * * * *') // Every 30 minutes
  async processRetries() {
    try {
      await this.retryHandlerService.processRetries();
    } catch (error) {
      this.logger.error('Error processing retries', error.stack);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkPausedPatients() {
    try {
      const patients = await this.patientsService.getActivePatients();
      for (const patient of patients) {
        if (patient.isPaused && patient.pausedUntil && new Date() >= patient.pausedUntil) {
          await this.patientsService.resume(patient._id.toString(), patient.userId.toString());
          this.logger.log(`Auto-resumed patient ${patient._id}`);
        }
      }
    } catch (error) {
      this.logger.error('Error checking paused patients', error.stack);
    }
  }
}
