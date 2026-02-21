import { Controller, Post, Body, Get, Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ElevenLabsAgentService } from './elevenlabs-agent.service';
import { SarvamAgentService } from '../sarvam/sarvam-agent.service';
import { CallsService } from '../../calls/calls.service';
import { PatientsService } from '../../patients/patients.service';
import { MedicinesService } from '../../medicines/medicines.service';
import { PromptAssemblerService } from '../../dynamic-prompt/prompt-assembler.service';
import { DynamicPromptResult } from '../../dynamic-prompt/types/prompt-context.types';

/**
 * Admin controller for setting up the ElevenLabs Conversational AI agent.
 * These endpoints are called once during initial setup, not per-call.
 * Protected by JWT auth — requires a valid bearer token.
 */
@ApiTags('Admin - ElevenLabs Setup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/elevenlabs')
export class ElevenLabsSetupController {
  private readonly logger = new Logger(ElevenLabsSetupController.name);

  private readonly dynamicPromptGlobalEnabled: boolean;
  private readonly voiceStack: string;

  constructor(
    private agentService: ElevenLabsAgentService,
    private sarvamAgentService: SarvamAgentService,
    private callsService: CallsService,
    private patientsService: PatientsService,
    private medicinesService: MedicinesService,
    private promptAssembler: PromptAssemblerService,
    private configService: ConfigService,
  ) {
    this.dynamicPromptGlobalEnabled =
      this.configService.get<string>('DYNAMIC_PROMPT_ENABLED', 'false') === 'true';
    this.voiceStack = this.configService.get<string>('VOICE_STACK', 'elevenlabs');
  }

  /**
   * Create or update the medicine-check AI agent on ElevenLabs.
   * Returns the agent_id to store in .env as ELEVENLABS_AGENT_ID.
   */
  @Post('setup-agent')
  @ApiOperation({ summary: 'Create/update the ElevenLabs conversational AI agent' })
  async setupAgent() {
    try {
      const agentId = await this.agentService.createOrUpdateAgent();
      return {
        success: true,
        agentId,
        message: `Agent created/updated. Add ELEVENLABS_AGENT_ID=${agentId} to your .env`,
      };
    } catch (error: any) {
      this.logger.error(`Setup agent failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import a phone number from SIP trunk (Exotel) into ElevenLabs.
   * Returns the phone_number_id to store in .env as ELEVENLABS_PHONE_NUMBER_ID.
   */
  @Post('import-phone')
  @ApiOperation({ summary: 'Import Exotel phone number into ElevenLabs via SIP trunk' })
  async importPhone(
    @Body() body: { phoneNumber: string; label?: string },
  ) {
    try {
      const phoneNumberId = await this.agentService.importPhoneNumber(
        body.phoneNumber,
        body.label || 'Health Discipline - Exotel',
      );
      return {
        success: true,
        phoneNumberId,
        message: `Phone imported. Add ELEVENLABS_PHONE_NUMBER_ID=${phoneNumberId} to your .env`,
      };
    } catch (error: any) {
      this.logger.error(`Import phone failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current agent and phone configuration status.
   */
  @Get('status')
  @ApiOperation({ summary: 'Check ElevenLabs agent setup status' })
  async getStatus() {
    const healthCheck = await this.agentService.healthCheck();
    return {
      agentId: this.agentService.getAgentId(),
      phoneNumberId: this.agentService.getPhoneNumberId(),
      ...healthCheck,
    };
  }

  /**
   * Trigger a test call to a patient.
   * Creates a call record and initiates the ElevenLabs agent call.
   */
  @Post('test-call')
  @ApiOperation({ summary: 'Trigger a test AI call to a patient' })
  async testCall(@Body() body: { patientId: string }) {
    try {
      // Global kill switch
      if (this.configService.get<string>('DISABLE_ALL_CALLS') === 'true') {
        return { success: false, error: 'All calls are disabled (DISABLE_ALL_CALLS=true)' };
      }

      const patient = await this.patientsService.findById(body.patientId);

      // Safety: don't call paused patients
      if (patient.isPaused) {
        return { success: false, error: `Patient ${patient.preferredName} is paused: ${patient.pauseReason || 'no reason'}` };
      }

      const medicines = await this.medicinesService.findByPatient(body.patientId);

      if (!medicines.length) {
        return { success: false, error: 'No medicines found for patient' };
      }

      // Create call record
      const call = await this.callsService.create({
        patientId: patient._id,
        userId: patient.userId,
        scheduledAt: new Date(),
        status: 'scheduled',
        isFirstCall: patient.callsCompletedCount === 0,
        usedNewPatientProtocol: patient.isNewPatient,
        medicinesChecked: medicines.map((med: any) => ({
          medicineId: med._id,
          medicineName: med.brandName,
          nickname: med.nicknames?.[0] || med.brandName,
          response: 'pending',
          isCritical: med.isCritical || false,
          timestamp: new Date(),
        })),
      });

      // Dynamic prompt assembly
      let dynamicPrompt: DynamicPromptResult | null = null;
      if (this.dynamicPromptGlobalEnabled) {
        try {
          dynamicPrompt = await this.promptAssembler.assembleDynamicPrompt(
            body.patientId,
          );
          this.logger.log(
            `Dynamic prompt: variant=${dynamicPrompt.variant}, tone=${dynamicPrompt.tone}, stage=${dynamicPrompt.relationshipStage}`,
          );

          // Store dynamic prompt metadata on call record
          await this.callsService.updateCallStatus(call._id.toString(), 'scheduled', {
            conversationVariant: dynamicPrompt.variant,
            toneUsed: dynamicPrompt.tone,
            relationshipStage: dynamicPrompt.relationshipStage,
            screeningQuestionsAsked: dynamicPrompt.screeningQuestionIds,
          } as any);
        } catch (err: any) {
          this.logger.warn(`Dynamic prompt assembly failed, using static: ${err.message}`);
        }
      }

      // Trigger outbound call via configured voice stack
      const patientData = {
        patientName: patient.preferredName,
        medicines: medicines.map((med: any) => ({
          name: med.nicknames?.[0] || med.brandName,
          timing: med.timing,
          medicineId: med._id.toString(),
        })),
        isNewPatient: patient.isNewPatient,
        hasGlucometer: patient.hasGlucometer,
        hasBPMonitor: patient.hasBPMonitor,
        preferredLanguage: patient.preferredLanguage || 'hi',
      };

      this.logger.log(
        `[TEST-CALL DEBUG] patientId=${body.patientId}, ` +
          `preferredLanguage="${patient.preferredLanguage}", ` +
          `resolved="${patientData.preferredLanguage}", ` +
          `patientName="${patientData.patientName}", ` +
          `voiceStack="${this.voiceStack}"`,
      );

      let result: { conversationId: string; callSid: string };

      if (this.voiceStack === 'sarvam') {
        result = await this.sarvamAgentService.makeOutboundCall(
          patient.phone,
          call._id.toString(),
          patientData,
          dynamicPrompt,
        );
      } else {
        result = await this.agentService.makeOutboundCall(
          patient.phone,
          call._id.toString(),
          patientData,
          dynamicPrompt,
        );
      }

      // Update call with conversation/room ID
      const callTrackingFields: any = { initiatedAt: new Date() };
      if (this.voiceStack === 'sarvam') {
        callTrackingFields.livekitRoomName = result.conversationId;
        callTrackingFields.voiceStack = 'sarvam';
      } else {
        callTrackingFields.elevenlabsConversationId = result.conversationId;
        callTrackingFields.voiceStack = 'elevenlabs';
      }
      await this.callsService.updateCallStatus(call._id.toString(), 'in_progress', callTrackingFields);

      return {
        success: true,
        callId: call._id.toString(),
        conversationId: result.conversationId,
        callSid: result.callSid,
        message: `Call initiated to ${patient.phone} for patient ${patient.preferredName}`,
      };
    } catch (error: any) {
      this.logger.error(`Test call failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
