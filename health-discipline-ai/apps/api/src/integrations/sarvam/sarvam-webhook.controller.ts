import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { DateTime } from 'luxon';
import { Public } from '../../common/decorators/public.decorator';
import { CallsService } from '../../calls/calls.service';
import { PatientsService } from '../../patients/patients.service';
import { MedicinesService } from '../../medicines/medicines.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { TranscriptParserService, ScreeningQuestionInput } from '../elevenlabs/transcript-parser.service';
import { RetryHandlerService } from '../../call-scheduler/retry-handler.service';
import { SCREENING_SCHEDULE } from '../../dynamic-prompt/types/prompt-context.types';

/**
 * Sarvam AI Post-Call Webhook Controller
 *
 * After each Sarvam voice call completes, the Python LiveKit agent worker
 * POSTs the transcript here. The transcript is passed to TranscriptParserService
 * (Gemini) which extracts all structured data (medicines, vitals, wellness,
 * complaints, re_scheduled).
 */
@ApiTags('Webhooks')
@Controller('webhooks/sarvam')
export class SarvamWebhookController {
  private readonly logger = new Logger(SarvamWebhookController.name);

  constructor(
    private callsService: CallsService,
    private patientsService: PatientsService,
    private medicinesService: MedicinesService,
    private notificationsService: NotificationsService,
    private transcriptParser: TranscriptParserService,
    private retryHandler: RetryHandlerService,
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
        duration = 0,
      } = body;
      const terminationReason = body.terminationReason || '';

      if (!callId) {
        this.logger.warn('Post-call webhook missing callId');
        return { received: true, warning: 'no_call_id' };
      }

      // Build transcript text for LLM extraction
      const transcriptText = this.buildTranscriptText(transcript);

      // Fetch the call record
      const call = await this.callsService.findById(callId);

      // Idempotency: skip if call already processed (duplicate webhook)
      if (['completed', 'no_answer'].includes(call.status)) {
        this.logger.warn(`Call ${callId} already in status '${call.status}', skipping duplicate webhook`);
        return { received: true, callId, roomName, status: call.status, duplicate: true };
      }

      // Extract ALL data from transcript via Gemini parser (single source of truth)
      let vitalsChecked: string | null = null;
      let wellness: string | null = null;
      let complaints: string[] = [];
      let reScheduled = false;
      let skipToday = false;
      let screeningAnswers: Array<{ questionId: string; answer: string; dataType: string }> = [];
      let llmResult: any = null;

      if (transcriptText) {
        try {
          const medicines = await this.medicinesService.findByPatient(
            call.patientId.toString(),
          );

          // Build screening question inputs from IDs stored on the call record
          const screeningQuestions: ScreeningQuestionInput[] = (call.screeningQuestionsAsked || [])
            .map((qId: string) => {
              const def = SCREENING_SCHEDULE.find((q) => q.id === qId);
              return def ? { questionId: def.id, question: def.question, dataType: def.dataType } : null;
            })
            .filter(Boolean) as ScreeningQuestionInput[];

          llmResult = await this.transcriptParser.parseTranscript(
            transcriptText,
            medicines.map((m: any) => ({
              brandName: m.brandName,
              nickname: m.nicknames?.[0] || undefined,
              timing: m.timing,
            })),
            screeningQuestions.length > 0 ? screeningQuestions : undefined,
          );

          if (llmResult) {
            // Update medicines from LLM results
            if (call.medicinesChecked && call.medicinesChecked.length > 0) {
              for (const existingMed of call.medicinesChecked) {
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

              // If only one medicine and one response, force-match regardless of name
              if (
                call.medicinesChecked.length === 1 &&
                llmResult.medicineResponses.length === 1 &&
                call.medicinesChecked[0].response === 'pending'
              ) {
                call.medicinesChecked[0].response = llmResult.medicineResponses[0].response;
                call.medicinesChecked[0].timestamp = new Date();
              }
            }

            vitalsChecked = llmResult.vitalsChecked;
            wellness = llmResult.wellness;
            complaints = llmResult.complaints;
            reScheduled = llmResult.reScheduled;
            skipToday = llmResult.skipToday;
            screeningAnswers = llmResult.screeningAnswers;
            this.logger.log(
              `Transcript parser extracted all data for call ${callId}` +
                (screeningAnswers.length > 0 ? `, screening=${screeningAnswers.length}` : ''),
            );
          }
        } catch (llmErr: any) {
          this.logger.warn(`Transcript parse failed: ${llmErr.message}`);
        }
      }

      // Determine if call was effectively unanswered
      // skipToday must be excluded — patient explicitly answered and refused calls today
      const allPending = call.medicinesChecked?.every((m) => m.response === 'pending') ?? true;
      const userSpoke = Array.isArray(transcript) && transcript.some((e: any) => e.role === 'user');
      const isNoAnswer =
        !reScheduled &&
        !skipToday &&
        allPending &&
        (duration < 30 ||
          !userSpoke ||
          /no.?answer|voicemail|unanswered/i.test(terminationReason));

      const finalStatus = isNoAnswer ? 'no_answer' : 'completed';

      // Build transcript array for proper schema storage
      const transcriptArray = Array.isArray(transcript)
        ? transcript.map((entry: any) => ({
            role: entry.role || 'unknown',
            message: entry.message || '',
            timestamp: entry.timestamp ? new Date(entry.timestamp) : undefined,
          }))
        : [];

      // Update call status
      await this.callsService.updateCallStatus(callId, finalStatus, {
        endedAt: new Date(),
        duration: duration || 0,
        moodNotes: wellness || undefined,
        complaints: complaints.length > 0 ? complaints : undefined,
        transcriptUrl: roomName ? `sarvam:livekit:${roomName}` : undefined,
        livekitRoomName: roomName,
        medicinesChecked: call.medicinesChecked,
        transcript: transcriptArray.length > 0 ? transcriptArray : undefined,
        terminationReason: terminationReason || undefined,
        reScheduled,
        screeningAnswers: screeningAnswers.length > 0 ? screeningAnswers : undefined,
      } as any);

      // If no_answer, trigger retry and skip post-call processing
      if (isNoAnswer) {
        this.logger.log(
          `Call ${callId} detected as no_answer (duration=${duration}s, ` +
            `allPending=${allPending}, userSpoke=${userSpoke}, termination=${terminationReason})`,
        );
        try {
          await this.retryHandler.handleNoAnswer(callId);
        } catch (retryErr: any) {
          this.logger.warn(`No-answer retry scheduling failed: ${retryErr.message}`);
        }

        return { received: true, callId, roomName, status: 'no_answer' };
      }

      // Update vitals if patient reported checking them or reported values
      if (vitalsChecked === 'yes' || llmResult?.vitals) {
        const vitalsData: any = { capturedAt: new Date() };
        if (llmResult?.vitals?.glucose) {
          vitalsData.glucose = llmResult.vitals.glucose;
        }
        if (llmResult?.vitals?.bloodPressure) {
          vitalsData.bloodPressure = llmResult.vitals.bloodPressure;
        }
        await this.callsService.addVitals(callId, vitalsData);
        this.logger.log(
          `Vitals stored for call ${callId}: glucose=${vitalsData.glucose || 'not reported'}, ` +
          `bp=${vitalsData.bloodPressure ? `${vitalsData.bloodPressure.systolic}/${vitalsData.bloodPressure.diastolic}` : 'not reported'}`,
        );
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

      // Handle "skip today" — patient doesn't want any more calls today
      if (skipToday) {
        try {
          const pauseUntilUTC = DateTime.now()
            .setZone('Asia/Kolkata')
            .endOf('day')
            .toJSDate();

          await this.patientsService.pause(
            patient._id.toString(),
            patient.userId.toString(),
            'patient_skip_today',
            pauseUntilUTC,
          );
          this.logger.log(
            `Patient ${patient._id} paused until end of today (skip_today) for call ${callId}`,
          );
        } catch (pauseErr: any) {
          this.logger.warn(`Failed to pause patient for skip_today: ${pauseErr.message}`);
        }
      } else if (reScheduled) {
        // Schedule retry if patient asked to be called later (but NOT if skip_today)
        try {
          await this.retryHandler.handleReScheduled(callId);
          this.logger.log(`Retry scheduled for reScheduled call ${callId}`);
        } catch (retryErr: any) {
          this.logger.warn(`Retry scheduling failed: ${retryErr.message}`);
        }
      }

      const medicinesResolved = call.medicinesChecked?.filter((m) => m.response !== 'pending').length || 0;
      this.logger.log(
        `Sarvam post-call processed: call=${callId}, ` +
          `medicines=${medicinesResolved}, wellness=${wellness}, ` +
          `vitals=${vitalsChecked}, complaints=${complaints.length}, ` +
          `duration=${duration}s, reScheduled=${reScheduled}, skipToday=${skipToday}`,
      );

      return {
        received: true,
        callId,
        roomName,
        medicinesProcessed: medicinesResolved,
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
