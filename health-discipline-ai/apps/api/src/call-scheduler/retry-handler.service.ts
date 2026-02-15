import { Injectable, Logger } from '@nestjs/common';
import { CallsService } from '../calls/calls.service';
import { CallConfigsService } from '../call-configs/call-configs.service';
import { CallOrchestratorService } from './call-orchestrator.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PatientsService } from '../patients/patients.service';

@Injectable()
export class RetryHandlerService {
  private readonly logger = new Logger(RetryHandlerService.name);

  constructor(
    private callsService: CallsService,
    private callConfigsService: CallConfigsService,
    private patientsService: PatientsService,
    private notificationsService: NotificationsService,
  ) {}

  async handleNoAnswer(callId: string) {
    const call = await this.callsService.findById(callId);
    const config = await this.callConfigsService.findByPatient(call.patientId.toString());

    if (!config || !config.retryEnabled) return;

    if (call.retryCount >= config.maxRetries) {
      // Max retries reached - notify payer
      this.logger.log(`Max retries reached for call ${callId}`);

      const patient = await this.patientsService.findById(call.patientId.toString());
      await this.notificationsService.sendMissedCallAlert(call, patient);

      // Mark medicines as missed
      for (const med of call.medicinesChecked) {
        await this.callsService.addMedicineResponse(
          callId,
          med.medicineId.toString(),
          med.medicineName,
          med.nickname,
          'missed',
        );
      }
      return;
    }

    // Schedule retry
    const retryCall = await this.callsService.create({
      patientId: call.patientId,
      userId: call.userId,
      scheduledAt: new Date(Date.now() + config.retryIntervalMinutes * 60 * 1000),
      status: 'scheduled',
      retryCount: call.retryCount + 1,
      isRetry: true,
      originalCallId: call._id,
      medicinesChecked: call.medicinesChecked,
      usedNewPatientProtocol: call.usedNewPatientProtocol,
    });

    this.logger.log(`Retry ${retryCall.retryCount} scheduled for call ${callId}`);
  }

  async processRetries() {
    // Find scheduled retry calls that are due
    const now = new Date();
    const dueRetries = await this.callsService['callModel'].find({
      status: 'scheduled',
      isRetry: true,
      scheduledAt: { $lte: now },
    });

    this.logger.log(`Processing ${dueRetries.length} retries`);

    // Re-trigger calls through the orchestrator
    // (simplified - in production use the full orchestrator)
    for (const retry of dueRetries) {
      try {
        const patient = await this.patientsService.findById(retry.patientId.toString());
        if (patient.isPaused) continue;

        await this.callsService.updateCallStatus(retry._id.toString(), 'in_progress', {
          initiatedAt: new Date(),
        });
      } catch (err) {
        this.logger.error(`Failed to process retry ${retry._id}: ${err.message}`);
      }
    }
  }
}
