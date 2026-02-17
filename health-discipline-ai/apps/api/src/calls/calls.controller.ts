import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CallsService } from './calls.service';
import { PatientsService } from '../patients/patients.service';

@ApiTags('Calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CallsController {
  constructor(
    private callsService: CallsService,
    private patientsService: PatientsService,
  ) {}

  @Get('patients/:patientId/calls')
  @ApiOperation({ summary: 'Get call history for a patient' })
  async getCallHistory(
    @Param('patientId') patientId: string,
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    return this.callsService.findByPatient(patientId, {
      page,
      limit,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('patients/:patientId/adherence/today')
  @ApiOperation({ summary: 'Get today\'s adherence for a patient' })
  async getTodayAdherence(
    @Param('patientId') patientId: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    return this.callsService.getAdherenceForDate(patientId, new Date());
  }

  @Get('patients/:patientId/adherence/calendar')
  @ApiOperation({ summary: 'Get monthly adherence calendar' })
  async getAdherenceCalendar(
    @Param('patientId') patientId: string,
    @CurrentUser('userId') userId: string,
    @Query('month') month?: string,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    const now = new Date();
    const [year, mon] = month ? month.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
    return this.callsService.getAdherenceCalendar(patientId, year, mon);
  }

  @Get('patients/:patientId/stats')
  @ApiOperation({ summary: 'Get aggregated stats for patient dashboard charts' })
  async getPatientStats(
    @Param('patientId') patientId: string,
    @CurrentUser('userId') userId: string,
    @Query('days') days?: string,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.callsService.getPatientStats(patientId, parsedDays || 30);
  }

  @Get('calls/:callId')
  @ApiOperation({ summary: 'Get a single call detail' })
  async getCall(
    @Param('callId') callId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const call = await this.callsService.findById(callId);
    await this.patientsService.findByIdForUser(call.patientId.toString(), userId);
    return call;
  }
}
