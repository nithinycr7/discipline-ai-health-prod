import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CallsService } from '../../calls/calls.service';
import { PatientsService } from '../../patients/patients.service';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * Sarvam AI Post-Call Webhook Controller
 *
 * After each Sarvam voice call completes, the Python LiveKit agent worker
 * POSTs the transcript and extracted data here.
 *
 * Payload:
 *   {
 *     callId: string,
 *     roomName: string,
 *     transcript: [{ role: 'agent' | 'user', message: string }],
 *     medicineResponses: "Metformin:taken, Amlodipine:not_taken",
 *     vitalsChecked: "yes" | "no" | "not_applicable",
 *     wellness: "good" | "okay" | "not_well",
 *     complaints: "none" | "headache, fever",
 *     duration: number (seconds),
 *     terminationReason?: string
 *   }
 */
@ApiTags('Webhooks')
@Controller('webhooks/sarvam')
export class SarvamWebhookController {
  private readonly logger = new Logger(SarvamWebhookController.name);

  constructor(
    private callsService: CallsService,
    private patientsService: PatientsService,
    private notificationsService: NotificationsService,
  ) {}

  @Public()
  @Post('post-call')
  @ApiExcludeEndpoint()
  async handlePostCall(@Body() body: any) {
    this.logger.log('Sarvam post-call webhook received');

    try {
      const {
        callId,
        roomName,
        transcript = [],
        medicineResponses: medicineResponsesStr = '',
        vitalsChecked = null,
        wellness = null,
        complaints: complaintsStr = '',
        duration = 0,
      } = body;

      if (!callId) {
        this.logger.warn('Post-call webhook missing callId');
        return { received: true, warning: 'no_call_id' };
      }

      // Parse medicine string: "Metformin:taken, Amlodipine:not_taken"
      const medicineResponses = this.parseMedicineString(medicineResponsesStr);

      // Parse complaints: "headache, fever" or "none"
      const complaints = this.parseComplaintsString(complaintsStr);

      // Build transcript text
      const transcriptText = this.buildTranscriptText(transcript);

      // Fetch the call record
      const call = await this.callsService.findById(callId);

      // Update each medicine's response on the existing medicinesChecked array
      if (call.medicinesChecked && call.medicinesChecked.length > 0) {
        for (const existingMed of call.medicinesChecked) {
          const match = medicineResponses.find(
            (mr) =>
              mr.medicineName.toLowerCase() ===
                (existingMed.nickname || existingMed.medicineName || '')
                  .toLowerCase() ||
              mr.medicineName.toLowerCase() ===
                (existingMed.medicineName || '').toLowerCase(),
          );
          if (match) {
            existingMed.response = match.response;
            existingMed.timestamp = new Date();
          }
        }
      }

      // Update call status to completed
      await this.callsService.updateCallStatus(callId, 'completed', {
        endedAt: new Date(),
        duration: duration || 0,
        moodNotes: wellness || undefined,
        complaints: complaints.length > 0 ? complaints : undefined,
        transcriptUrl: roomName ? `sarvam:livekit:${roomName}` : undefined,
        twilioCallSid: roomName,
        medicinesChecked: call.medicinesChecked,
        transcript: transcriptText || undefined,
      } as any);

      // Update vitals if patient reported checking them
      if (vitalsChecked === 'yes') {
        await this.callsService.addVitals(callId, { capturedAt: new Date() });
      }

      // Track first call and increment count
      const patient = await this.patientsService.findById(
        call.patientId.toString(),
      );
      await this.patientsService.setFirstCallAt(patient._id.toString());
      await this.patientsService.incrementCallCount(patient._id.toString());

      // Send post-call report to payer
      try {
        const updatedCall = await this.callsService.findById(callId);
        await this.notificationsService.sendPostCallReport(updatedCall, patient);
      } catch (notifErr: any) {
        this.logger.warn(`Post-call notification failed: ${notifErr.message}`);
      }

      this.logger.log(
        `Sarvam post-call processed: call=${callId}, ` +
          `medicines=${medicineResponses.length}, wellness=${wellness}, ` +
          `vitals=${vitalsChecked}, complaints=${complaints.length}, ` +
          `duration=${duration}s`,
      );

      return {
        received: true,
        callId,
        roomName,
        medicinesProcessed: medicineResponses.length,
      };
    } catch (error: any) {
      this.logger.error(`Sarvam post-call webhook error: ${error.message}`, error.stack);
      return { received: true, error: error.message };
    }
  }

  @Public()
  @Get('post-call')
  @ApiExcludeEndpoint()
  async verifyWebhook() {
    return { status: 'ok', service: 'health-discipline-sarvam-webhook' };
  }

  private parseMedicineString(
    str: string,
  ): Array<{ medicineName: string; response: string }> {
    if (!str || str === 'null' || str === 'undefined') return [];

    return str
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.includes(':'))
      .map((part) => {
        const colonIdx = part.indexOf(':');
        const name = part.substring(0, colonIdx).trim();
        const rawResponse = part.substring(colonIdx + 1).trim();
        return {
          medicineName: name,
          response: this.normalizeResponse(rawResponse),
        };
      });
  }

  private parseComplaintsString(str: string): string[] {
    if (!str || str === 'none' || str === 'null' || str === 'undefined') {
      return [];
    }
    return str
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c && c !== 'none');
  }

  private normalizeResponse(response: string): string {
    const lower = response.toLowerCase().trim();
    if (
      lower.includes('taken') ||
      lower === 'yes' ||
      lower.includes('li hai') ||
      lower.includes('le li') ||
      lower.includes('haan')
    ) {
      return 'taken';
    }
    if (
      lower.includes('not_taken') ||
      lower.includes('missed') ||
      lower === 'no' ||
      lower.includes('nahi') ||
      lower.includes('bhool')
    ) {
      return 'missed';
    }
    return 'unclear';
  }

  private buildTranscriptText(transcript: any[]): string {
    if (!Array.isArray(transcript)) return '';
    return transcript
      .map((entry) => {
        const role = entry.role === 'agent' ? 'Assistant' : 'Patient';
        return `${role}: ${entry.message || ''}`;
      })
      .join('\n');
  }
}
