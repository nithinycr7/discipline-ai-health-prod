import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CallsService } from '../../calls/calls.service';
import { PatientsService } from '../../patients/patients.service';
import { MedicinesService } from '../../medicines/medicines.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ElevenLabsAgentService } from './elevenlabs-agent.service';
import { TranscriptParserService } from './transcript-parser.service';
import { RetryHandlerService } from '../../call-scheduler/retry-handler.service';

/**
 * ElevenLabs Post-Call Webhook Controller
 *
 * After each AI voice call completes, ElevenLabs sends a POST webhook with
 * the same structure as GET /convai/conversations/{id}:
 *   - transcript[]
 *   - analysis.data_collection_results (medicine_responses, vitals, wellness, complaints)
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
    private medicinesService: MedicinesService,
    private notificationsService: NotificationsService,
    private elevenLabsAgentService: ElevenLabsAgentService,
    private transcriptParser: TranscriptParserService,
    private retryHandler: RetryHandlerService,
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
      let vitalsChecked = dcResults.vitals_checked?.value || null;
      let wellness = dcResults.wellness?.value || dcResults.mood?.value || null;
      const complaintsStr = dcResults.complaints?.value || '';
      const reScheduled = dcResults.re_scheduled?.value === 'true';

      // Parse medicine string: "HP120:taken, Ecosprin:not_taken, Metformin:unclear"
      const medicineResponses = this.parseMedicineString(medicineResponsesStr);

      // Parse complaints string: "fever, headache" or "none"
      let complaints = this.parseComplaintsString(complaintsStr);

      // Build transcript text
      const transcriptText = this.buildTranscriptText(transcript);

      // Fetch the call record
      const call = await this.callsService.findById(callId);

      // Update each medicine's response on the existing medicinesChecked array.
      // The AI may transliterate names (e.g. "Hp1" → "Hp ek", "Hp one"),
      // so we use fuzzy matching: normalize both strings, then check containment.
      if (call.medicinesChecked && call.medicinesChecked.length > 0) {
        for (const existingMed of call.medicinesChecked) {
          const match = medicineResponses.find((mr) =>
            this.fuzzyMedicineMatch(
              mr.medicineName,
              existingMed.nickname || existingMed.medicineName || '',
              existingMed.medicineName || '',
            ),
          );
          if (match) {
            existingMed.response = match.response;
            existingMed.timestamp = new Date();
          }
        }

        // If only one medicine and one response, force-match regardless of name
        if (
          call.medicinesChecked.length === 1 &&
          medicineResponses.length === 1 &&
          call.medicinesChecked[0].response === 'pending'
        ) {
          call.medicinesChecked[0].response = medicineResponses[0].response;
          call.medicinesChecked[0].timestamp = new Date();
        }
      }

      // LLM transcript parser: if any medicines still pending, use Gemini to re-extract
      const hasPending = call.medicinesChecked?.some((m) => m.response === 'pending');
      if (hasPending && transcriptText) {
        try {
          const medicines = await this.medicinesService.findByPatient(
            call.patientId.toString(),
          );
          const llmResult = await this.transcriptParser.parseTranscript(
            transcriptText,
            medicines.map((m: any) => ({
              brandName: m.brandName,
              nickname: m.nicknames?.[0] || undefined,
              timing: m.timing,
            })),
          );

          if (llmResult) {
            // Update pending medicines with LLM results
            for (const existingMed of call.medicinesChecked || []) {
              if (existingMed.response !== 'pending') continue;
              const llmMatch = llmResult.medicineResponses.find(
                (lr) =>
                  lr.medicineName.toLowerCase() ===
                  existingMed.medicineName.toLowerCase(),
              );
              if (llmMatch) {
                existingMed.response = llmMatch.response;
                existingMed.timestamp = new Date();
              }
            }

            // Also use LLM wellness/complaints if ElevenLabs didn't extract them
            if (!wellness && llmResult.wellness) {
              wellness = llmResult.wellness;
            }
            if (complaints.length === 0 && llmResult.complaints.length > 0) {
              complaints = llmResult.complaints;
            }
            if (!vitalsChecked && llmResult.vitalsChecked) {
              vitalsChecked = llmResult.vitalsChecked;
            }
            this.logger.log(`LLM parser resolved pending medicines`);
          }
        } catch (llmErr: any) {
          this.logger.warn(`LLM transcript parse failed: ${llmErr.message}`);
        }
      }

      // Calculate costs
      const durationSecs = metadata.call_duration_secs || 0;
      const terminationReason = metadata.termination_reason || '';

      // Twilio cost: $0.0405/min for US→India mobile outbound ≈ ₹3.56/min (at ₹88/$)
      const twilioCharges = Math.round((durationSecs / 60) * 3.56 * 100) / 100;

      // Fetch ElevenLabs cost from conversation API (credits)
      let elevenlabsCostCredits = 0;
      let elevenlabsCharges = 0;
      if (conversationId) {
        try {
          const convData = await this.elevenLabsAgentService.getConversation(conversationId);
          if (convData?.metadata?.cost) {
            elevenlabsCostCredits = convData.metadata.cost; // ElevenLabs credits
            // ElevenLabs Pro plan: ₹8,712/month for 500,000 credits = ₹17.42 per 1000 credits
            elevenlabsCharges = Math.round((elevenlabsCostCredits / 1000) * 17.42 * 100) / 100;
          }
        } catch (costErr: any) {
          this.logger.warn(`Failed to fetch ElevenLabs cost: ${costErr.message}`);
        }
      }

      const totalCharges = Math.round((twilioCharges + elevenlabsCharges) * 100) / 100;

      // Determine if call was effectively unanswered
      const allPending = call.medicinesChecked?.every((m) => m.response === 'pending') ?? true;
      const isNoAnswer =
        !reScheduled &&
        allPending &&
        (durationSecs < 30 ||
          /no.?answer|voicemail|unanswered|caller_did_not/i.test(terminationReason));

      // Determine final status
      const finalStatus = isNoAnswer ? 'no_answer' : 'completed';

      // Build transcript array for proper schema storage
      const transcriptArray = Array.isArray(transcript)
        ? transcript.map((entry: any) => ({
            role: entry.role || 'unknown',
            message: entry.message || '',
            timestamp: entry.timestamp ? new Date(entry.timestamp) : undefined,
          }))
        : [];

      // Update call status with all data
      await this.callsService.updateCallStatus(callId, finalStatus, {
        endedAt: new Date(),
        duration: durationSecs,
        moodNotes: wellness || undefined,
        complaints: complaints.length > 0 ? complaints : undefined,
        transcriptUrl: conversationId
          ? `elevenlabs:conversation:${conversationId}`
          : undefined,
        elevenlabsConversationId: conversationId,
        medicinesChecked: call.medicinesChecked,
        transcript: transcriptArray.length > 0 ? transcriptArray : undefined,
        terminationReason: terminationReason || undefined,
        twilioCharges,
        elevenlabsCharges,
        elevenlabsCostCredits,
        totalCharges,
        reScheduled,
      } as any);

      // If no_answer, trigger retry and skip post-call processing
      if (isNoAnswer) {
        this.logger.log(
          `Call ${callId} detected as no_answer (duration=${durationSecs}s, ` +
            `allPending=${allPending}, termination=${terminationReason})`,
        );
        try {
          await this.retryHandler.handleNoAnswer(callId);
        } catch (retryErr: any) {
          this.logger.warn(`No-answer retry scheduling failed: ${retryErr.message}`);
        }

        return { received: true, callId, conversationId, status: 'no_answer' };
      }

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

      // Update adherence streak
      const takenCount = call.medicinesChecked?.filter((m) => m.response === 'taken').length || 0;
      const totalCount = call.medicinesChecked?.length || 1;
      const adherencePercent = Math.round((takenCount / totalCount) * 100);
      await this.patientsService.updateStreak(patient._id.toString(), adherencePercent);

      // Send post-call report to payer
      try {
        const updatedCall = await this.callsService.findById(callId);
        await this.notificationsService.sendPostCallReport(updatedCall, patient);
      } catch (notifErr: any) {
        this.logger.warn(`Post-call notification failed: ${notifErr.message}`);
      }

      // Schedule retry if patient asked to be called later
      if (reScheduled) {
        try {
          await this.retryHandler.handleReScheduled(callId);
          this.logger.log(`Retry scheduled for reScheduled call ${callId}`);
        } catch (retryErr: any) {
          this.logger.warn(`Retry scheduling failed: ${retryErr.message}`);
        }
      }

      this.logger.log(
        `Post-call processed: call=${callId}, ` +
          `medicines=${medicineResponses.length}, wellness=${wellness}, ` +
          `vitals=${vitalsChecked}, complaints=${complaints.length}, ` +
          `duration=${durationSecs}s, cost=₹${totalCharges}, reScheduled=${reScheduled}`,
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
    // Check not_taken BEFORE taken — "not_taken" contains "taken"
    if (
      lower.includes('not_taken') ||
      lower.includes('missed') ||
      lower === 'no' ||
      lower.includes('nahi') ||
      lower.includes('bhool')
    ) {
      return 'missed';
    }
    if (
      lower.includes('taken') ||
      lower === 'yes' ||
      lower.includes('li hai') ||
      lower.includes('le li') ||
      lower.includes('haan')
    ) {
      return 'taken';
    }
    return 'unclear';
  }

  /**
   * Fuzzy match an extracted medicine name against stored names.
   * Handles transliterations like "Hp ek" vs "Hp1", "Hp one" vs "Hp1".
   */
  private fuzzyMedicineMatch(
    extracted: string,
    nickname: string,
    brandName: string,
  ): boolean {
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/\bone\b/g, '1')
        .replace(/\btwo\b/g, '2')
        .replace(/\bthree\b/g, '3')
        .replace(/\bek\b/g, '1')
        .replace(/\bdo\b/g, '2')
        .replace(/\bteen\b/g, '3')
        .replace(/[^a-z0-9]/g, '');

    const ext = norm(extracted);
    const nick = norm(nickname);
    const brand = norm(brandName);

    if (!ext) return false;

    // Exact after normalization
    if (nick && ext === nick) return true;
    if (brand && ext === brand) return true;

    // One contains the other (only when both sides are non-empty)
    if (nick && (ext.includes(nick) || nick.includes(ext))) return true;
    if (brand && (ext.includes(brand) || brand.includes(ext))) return true;

    return false;
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
