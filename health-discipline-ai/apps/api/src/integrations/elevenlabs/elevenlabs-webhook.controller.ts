import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CallsService } from '../../calls/calls.service';
import { PatientsService } from '../../patients/patients.service';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * ElevenLabs Post-Call Webhook Controller
 *
 * After each AI voice call completes, ElevenLabs sends a POST webhook with:
 *   - Full conversation transcript
 *   - Extracted data (medicine responses, vitals, mood)
 *   - Call metadata (duration, conversation_id)
 *
 * We parse this data and save it to our call records in MongoDB.
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

  /**
   * Post-call webhook — ElevenLabs calls this when a conversation ends.
   * Payload includes transcript, data collection, and metadata.
   */
  @Public()
  @Post('post-call')
  @ApiExcludeEndpoint()
  async handlePostCall(@Body() body: any) {
    this.logger.log(`ElevenLabs post-call webhook received`);
    this.logger.debug(`Payload: ${JSON.stringify(body).substring(0, 500)}`);

    try {
      // Extract key fields from the webhook payload
      const conversationId = body.conversation_id
        || body.data?.conversation_id
        || body.conversation_initiation_client_data?.dynamic_variables?.system__conversation_id;

      const callId = body.conversation_initiation_client_data?.dynamic_variables?.call_id
        || body.data?.dynamic_variables?.call_id;

      const transcript = body.transcript || body.data?.transcript || [];
      const analysis = body.analysis || body.data?.analysis || {};
      const dataCollection = body.data_collection || body.data?.data_collection || {};
      const metadata = body.metadata || body.data?.metadata || {};

      if (!callId) {
        this.logger.warn(`Post-call webhook missing call_id. ConversationId: ${conversationId}`);
        return { received: true, warning: 'no_call_id' };
      }

      // Parse medicine responses from the agent's data collection
      const medicineResponses = this.parseMedicineResponses(dataCollection, transcript);
      const vitalsChecked = this.parseVitals(dataCollection, transcript);
      const mood = this.parseMood(dataCollection, transcript);
      const complaints = this.parseComplaints(dataCollection, transcript);

      // Build the full transcript text
      const transcriptText = this.buildTranscriptText(transcript);

      // Update the call record with all extracted data
      const call = await this.callsService.findById(callId);

      // Update medicine responses
      for (const medResponse of medicineResponses) {
        await this.callsService.addMedicineResponse(
          callId,
          medResponse.medicineId,
          medResponse.medicineName,
          medResponse.nickname || medResponse.medicineName,
          medResponse.response, // 'taken' | 'missed' | 'unclear'
        );
      }

      // Update vitals if reported
      if (vitalsChecked === 'yes') {
        await this.callsService.addVitals(callId, {
          capturedAt: new Date(),
          // Actual values would need voice-to-number parsing
          // For now, mark as "checked"
        });
      }

      // Update call status to completed with all metadata
      await this.callsService.updateCallStatus(callId, 'completed', {
        endedAt: new Date(),
        duration: metadata.duration || metadata.call_duration || 0,
        moodNotes: mood || undefined,
        complaints: complaints.length > 0 ? complaints : undefined,
        transcriptUrl: conversationId
          ? `elevenlabs:conversation:${conversationId}`
          : undefined,
        twilioCallSid: conversationId, // Store conversationId in this field
      } as any);

      // Track first call and increment count
      const patient = await this.patientsService.findById(call.patientId.toString());
      await this.patientsService.setFirstCallAt(patient._id.toString());
      await this.patientsService.incrementCallCount(patient._id.toString());

      // Send post-call WhatsApp report to payer
      const updatedCall = await this.callsService.findById(callId);
      await this.notificationsService.sendPostCallReport(updatedCall, patient);

      this.logger.log(
        `Post-call processed for call ${callId}: ` +
        `${medicineResponses.length} medicines, mood=${mood}, ` +
        `vitals=${vitalsChecked}, complaints=${complaints.length}`,
      );

      return {
        received: true,
        callId,
        conversationId,
        medicinesProcessed: medicineResponses.length,
      };
    } catch (error: any) {
      this.logger.error(`Post-call webhook processing error: ${error.message}`);
      return { received: true, error: error.message };
    }
  }

  /**
   * Webhook verification endpoint (GET) — some providers ping this first.
   */
  @Public()
  @Get('post-call')
  @ApiExcludeEndpoint()
  async verifyWebhook() {
    return { status: 'ok', service: 'health-discipline-elevenlabs-webhook' };
  }

  /**
   * Parse medicine responses from ElevenLabs data collection or transcript.
   */
  private parseMedicineResponses(
    dataCollection: any,
    transcript: any[],
  ): Array<{ medicineId: string; medicineName: string; nickname?: string; response: string }> {
    const responses: Array<{ medicineId: string; medicineName: string; nickname?: string; response: string }> = [];

    // Try structured data collection first
    if (dataCollection.medicine_responses) {
      const medResponses = Array.isArray(dataCollection.medicine_responses)
        ? dataCollection.medicine_responses
        : [dataCollection.medicine_responses];

      for (const med of medResponses) {
        if (med && typeof med === 'object') {
          responses.push({
            medicineId: med.medicine_id || med.medicineId || '',
            medicineName: med.medicine_name || med.medicineName || med.name || '',
            nickname: med.nickname,
            response: this.normalizeResponse(med.status || med.response || 'unclear'),
          });
        }
      }
    }

    // If no structured data, try to parse from transcript analysis
    if (responses.length === 0 && dataCollection) {
      for (const [key, value] of Object.entries(dataCollection)) {
        if (key.includes('medicine') || key.includes('med_') || key.includes('dawai')) {
          const strValue = String(value).toLowerCase();
          responses.push({
            medicineId: '',
            medicineName: key.replace(/_/g, ' '),
            response: this.normalizeResponse(strValue),
          });
        }
      }
    }

    return responses;
  }

  /**
   * Parse vitals response.
   */
  private parseVitals(dataCollection: any, transcript: any[]): string {
    if (dataCollection.vitals_checked) {
      const val = String(dataCollection.vitals_checked).toLowerCase();
      if (val.includes('yes') || val.includes('haan') || val.includes('ha')) return 'yes';
      if (val.includes('no') || val.includes('nahi') || val.includes('nhi')) return 'no';
      return val;
    }
    return 'not_asked';
  }

  /**
   * Parse mood response.
   */
  private parseMood(dataCollection: any, transcript: any[]): string {
    if (dataCollection.mood) {
      const val = String(dataCollection.mood).toLowerCase();
      if (val.includes('good') || val.includes('accha') || val.includes('theek')) return 'good';
      if (val.includes('okay') || val.includes('thik')) return 'okay';
      if (val.includes('not') || val.includes('kharab') || val.includes('bura')) return 'not_well';
      return val;
    }
    return 'not_asked';
  }

  /**
   * Parse complaints.
   */
  private parseComplaints(dataCollection: any, transcript: any[]): string[] {
    if (dataCollection.complaints) {
      if (Array.isArray(dataCollection.complaints)) {
        return dataCollection.complaints.map(String);
      }
      const val = String(dataCollection.complaints);
      if (val && val !== 'none' && val !== 'null') return [val];
    }
    return [];
  }

  /**
   * Normalize response text to our standard values.
   */
  private normalizeResponse(response: string): string {
    const lower = response.toLowerCase().trim();
    if (lower.includes('taken') || lower.includes('yes') || lower.includes('haan') || lower.includes('li hai') || lower.includes('le li')) {
      return 'taken';
    }
    if (lower.includes('not_taken') || lower.includes('missed') || lower.includes('no') || lower.includes('nahi') || lower.includes('nhi') || lower.includes('bhool')) {
      return 'missed';
    }
    return 'unclear';
  }

  /**
   * Build readable transcript text from the structured transcript array.
   */
  private buildTranscriptText(transcript: any[]): string {
    if (!Array.isArray(transcript)) return '';

    return transcript
      .map((entry) => {
        const role = entry.role === 'agent' ? 'Assistant' : 'Patient';
        return `${role}: ${entry.message || entry.text || ''}`;
      })
      .join('\n');
  }
}
