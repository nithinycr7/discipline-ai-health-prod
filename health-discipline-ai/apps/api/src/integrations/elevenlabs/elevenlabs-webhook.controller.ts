import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CallsService } from '../../calls/calls.service';
import { PatientsService } from '../../patients/patients.service';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * ElevenLabs Post-Call Webhook Controller
 *
 * After each AI voice call completes, ElevenLabs sends a POST webhook with
 * the same structure as GET /convai/conversations/{id}:
 *   - transcript[]
 *   - analysis.data_collection_results (medicine_responses, vitals, mood, complaints)
 *   - metadata (call_duration_secs, termination_reason, etc.)
 *   - conversation_initiation_client_data.dynamic_variables (call_id, patient_name, etc.)
 *
 * The payload may arrive raw or wrapped in { type, event_timestamp, data: {...} }.
 */
@ApiTags('Webhooks')
@Controller('webhooks/elevenlabs')
export class ElevenLabsWebhookController {
  private readonly logger = new Logger(ElevenLabsWebhookController.name);

  constructor(
    private callsService: CallsService,
    private patientsService: PatientsService,
    private notificationsService: NotificationsService,
  ) {}

  @Public()
  @Post('post-call')
  @ApiExcludeEndpoint()
  async handlePostCall(@Body() body: any) {
    this.logger.log('ElevenLabs post-call webhook received');
    this.logger.debug(`Payload keys: ${Object.keys(body).join(', ')}`);

    try {
      // Unwrap envelope if present (webhook may wrap in { type, data })
      const payload = body.data && body.type ? body.data : body;

      // Extract identifiers
      const conversationId =
        payload.conversation_id ||
        payload.conversation_initiation_client_data?.dynamic_variables?.system__conversation_id;

      const callId =
        payload.conversation_initiation_client_data?.dynamic_variables?.call_id;

      const transcript = payload.transcript || [];
      const analysis = payload.analysis || {};
      const dcResults = analysis.data_collection_results || {};
      const metadata = payload.metadata || {};

      if (!callId) {
        this.logger.warn(
          `Post-call webhook missing call_id. ConversationId: ${conversationId}`,
        );
        return { received: true, warning: 'no_call_id' };
      }

      // Parse extracted data from analysis.data_collection_results
      // Each field has { value, rationale, ... } — we read .value
      const medicineResponsesStr = dcResults.medicine_responses?.value || '';
      const vitalsChecked = dcResults.vitals_checked?.value || null;
      const mood = dcResults.mood?.value || null;
      const complaintsStr = dcResults.complaints?.value || '';

      // Parse medicine string: "HP120:taken, Ecosprin:not_taken, Metformin:unclear"
      const medicineResponses = this.parseMedicineString(medicineResponsesStr);

      // Parse complaints string: "fever, headache" or "none"
      const complaints = this.parseComplaintsString(complaintsStr);

      // Build transcript text
      const transcriptText = this.buildTranscriptText(transcript);

      // Fetch the call record
      const call = await this.callsService.findById(callId);

      // Update each medicine's response on the existing medicinesChecked array
      // The call record already has medicinesChecked from when the call was created.
      // Match by name and update the response.
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

      // Update call status to completed with all data
      await this.callsService.updateCallStatus(callId, 'completed', {
        endedAt: new Date(),
        duration: metadata.call_duration_secs || 0,
        moodNotes: mood || undefined,
        complaints: complaints.length > 0 ? complaints : undefined,
        transcriptUrl: conversationId
          ? `elevenlabs:conversation:${conversationId}`
          : undefined,
        twilioCallSid: conversationId,
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
        `Post-call processed: call=${callId}, ` +
          `medicines=${medicineResponses.length}, mood=${mood}, ` +
          `vitals=${vitalsChecked}, complaints=${complaints.length}, ` +
          `duration=${metadata.call_duration_secs}s`,
      );

      return {
        received: true,
        callId,
        conversationId,
        medicinesProcessed: medicineResponses.length,
      };
    } catch (error: any) {
      this.logger.error(`Post-call webhook error: ${error.message}`, error.stack);
      return { received: true, error: error.message };
    }
  }

  @Public()
  @Get('post-call')
  @ApiExcludeEndpoint()
  async verifyWebhook() {
    return { status: 'ok', service: 'health-discipline-elevenlabs-webhook' };
  }

  /**
   * Parse ElevenLabs medicine response string.
   * Format: "HP120:taken, Ecosprin:not_taken, Metformin:unclear"
   */
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

  /**
   * Parse complaints string: "fever, headache" or "none"
   */
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
