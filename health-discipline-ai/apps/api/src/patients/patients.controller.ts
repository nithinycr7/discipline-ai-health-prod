import {
  Controller, Get, Post, Put, Body, Param, UseGuards, Query, Res, Header,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { MedicinesService } from '../medicines/medicines.service';
import { ElevenLabsService } from '../integrations/elevenlabs/elevenlabs.service';
import { ConfigService } from '@nestjs/config';
import { CallConfigsService } from '../call-configs/call-configs.service';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(
    private patientsService: PatientsService,
    private medicinesService: MedicinesService,
    private elevenLabsService: ElevenLabsService,
    private configService: ConfigService,
    private callConfigsService: CallConfigsService,
    private moduleRef: ModuleRef,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new patient profile' })
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreatePatientDto) {
    return this.patientsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all patients for current user' })
  async findAll(@CurrentUser('userId') userId: string) {
    return this.patientsService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.patientsService.findByIdForUser(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update patient profile' })
  async update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, userId, dto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause calls for a patient' })
  async pause(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() body: { reason?: string; pausedUntil?: Date },
  ) {
    return this.patientsService.pause(id, userId, body.reason, body.pausedUntil);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume calls for a patient' })
  async resume(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.patientsService.resume(id, userId);
  }

  @Post(':id/family-members')
  @ApiOperation({ summary: 'Add a family member to a patient' })
  async addFamilyMember(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() body: { name: string; phone: string; relationship: string; notificationLevel?: string },
  ) {
    await this.patientsService.findByIdForUser(id, userId);
    return this.patientsService.addFamilyMember(id, userId, body);
  }

  @Get(':id/family-members')
  @ApiOperation({ summary: 'Get family members for a patient' })
  async getFamilyMembers(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    await this.patientsService.findByIdForUser(id, userId);
    return this.patientsService.getFamilyMembers(id);
  }

  @Post(':id/test-call/preview')
  @ApiOperation({ summary: 'Generate a preview of what the AI call sounds like' })
  async testCallPreview(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Res() res: Response,
  ) {
    const patient = await this.patientsService.findByIdForUser(id, userId);
    const medicines = await this.medicinesService.findByPatient(id);

    // Build the full call script
    const greeting = patient.isNewPatient
      ? `Namaste ${patient.preferredName}! Main aapki health assistant bol rahi hoon. Aapke ghar walon ne yeh seva shuru ki hai taaki aapki dawai ka dhyan rakha ja sake.`
      : `Namaste ${patient.preferredName}! Kaisi hain aap aaj?`;

    const medicineLines = medicines.map((med: any) => {
      const name = med.nicknames?.[0] || med.brandName;
      const timing = med.timing === 'morning' ? 'subah' : med.timing === 'evening' ? 'shaam' : med.timing;
      return `Kya aapne ${name} ${timing} mein li hai?`;
    });

    const vitalsLine = (patient.hasGlucometer || patient.hasBPMonitor)
      ? 'Kya aapne aaj sugar ya BP check kiya?'
      : '';

    const closing = `Bahut accha ${patient.preferredName}! Apna khayal rakhiye. Kal phir baat karenge.`;

    const fullScript = [greeting, ...medicineLines, vitalsLine, closing]
      .filter(Boolean)
      .join(' ... ');

    // Get voice ID
    const voiceId = patient.preferredVoiceGender === 'male'
      ? this.configService.get('ELEVENLABS_VOICE_ID_MALE')
      : this.configService.get('ELEVENLABS_VOICE_ID_FEMALE');

    if (!voiceId) {
      return res.status(400).json({ error: 'No voice ID configured for this gender' });
    }

    const audioBuffer = await this.elevenLabsService.generateSpeechBuffer(
      fullScript,
      voiceId,
      { speed: patient.isNewPatient ? 0.85 : 1.0 },
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Content-Disposition': `inline; filename="preview-${patient.preferredName}.mp3"`,
    });
    res.send(audioBuffer);
  }

  @Post(':id/test-call')
  @ApiOperation({ summary: 'Trigger an immediate test call for a patient' })
  async testCall(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() body: { timing?: string } = {},
  ) {
    // Verify user owns this patient
    const patient = await this.patientsService.findByIdForUser(id, userId);

    const config = await this.callConfigsService.findByPatient(id);
    if (!config || !config.isActive) {
      return { status: 'error', reason: 'No active call configuration for this patient' };
    }

    const medicines = await this.medicinesService.findByPatient(id);
    if (!medicines.length) {
      return { status: 'error', reason: 'No medicines configured for this patient' };
    }

    const timing = body.timing || 'test';

    try {
      // Resolve CallOrchestratorService at runtime to handle circular dependency
      const { CallOrchestratorService } = await import('../call-scheduler/call-orchestrator.service');
      const orchestrator = this.moduleRef.get(CallOrchestratorService, { strict: false });

      if (!orchestrator) {
        return { status: 'error', reason: 'Call orchestrator service not available' };
      }

      await orchestrator.initiateCall({
        config,
        patient,
        timing,
      });
      return { status: 'ok', message: 'Test call initiated', patientId: id, timing };
    } catch (error: any) {
      return { status: 'error', reason: error.message };
    }
  }
}
