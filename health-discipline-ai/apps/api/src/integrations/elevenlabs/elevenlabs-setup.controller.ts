import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ElevenLabsAgentService } from './elevenlabs-agent.service';
import { CallsService } from '../../calls/calls.service';
import { PatientsService } from '../../patients/patients.service';
import { MedicinesService } from '../../medicines/medicines.service';

/**
 * Admin controller for setting up the ElevenLabs Conversational AI agent.
 * These endpoints are called once during initial setup, not per-call.
 * TODO: Add authentication guard for production.
 */
@ApiTags('Admin - ElevenLabs Setup')
@Controller('admin/elevenlabs')
export class ElevenLabsSetupController {
  private readonly logger = new Logger(ElevenLabsSetupController.name);

  constructor(
    private agentService: ElevenLabsAgentService,
    private callsService: CallsService,
    private patientsService: PatientsService,
    private medicinesService: MedicinesService,
  ) {}

  /**
   * Create or update the medicine-check AI agent on ElevenLabs.
   * Returns the agent_id to store in .env as ELEVENLABS_AGENT_ID.
   */
  @Public()
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
  @Public()
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
  @Public()
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
  @Public()
  @Post('test-call')
  @ApiOperation({ summary: 'Trigger a test AI call to a patient' })
  async testCall(@Body() body: { patientId: string }) {
    try {
      const patient = await this.patientsService.findById(body.patientId);
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
          timestamp: new Date(),
        })),
      });

      // Trigger ElevenLabs outbound call
      const result = await this.agentService.makeOutboundCall(
        patient.phone,
        call._id.toString(),
        {
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
        },
      );

      // Update call with conversation ID
      await this.callsService.updateCallStatus(call._id.toString(), 'in_progress', {
        twilioCallSid: result.conversationId,
        initiatedAt: new Date(),
      });

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
