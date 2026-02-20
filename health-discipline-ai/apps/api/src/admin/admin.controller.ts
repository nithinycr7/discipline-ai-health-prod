import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CallsService } from '../calls/calls.service';
import { PatientsService } from '../patients/patients.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly callsService: CallsService,
    private readonly patientsService: PatientsService,
  ) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('patients')
  getPatients(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('subscription') subscription?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getPatients({
      search,
      status,
      subscription,
      sort,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('patients/:id')
  getPatient(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  @Get('patients/:id/stats')
  getPatientStats(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    return this.callsService.getPatientStats(id, days ? parseInt(days, 10) : 30);
  }

  @Get('patients/:id/calls')
  getPatientCalls(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.callsService.findByPatient(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('alerts')
  getAlerts() {
    return this.adminService.getAlerts();
  }

  @Get('analytics/health')
  getHealthAnalytics(@Query('days') days?: string) {
    return this.adminService.getHealthAnalytics(days ? parseInt(days, 10) : 30);
  }

  @Get('analytics/business')
  getBusinessAnalytics() {
    return this.adminService.getBusinessAnalytics();
  }

  @Get('analytics/operations')
  getOperationsAnalytics(@Query('days') days?: string) {
    return this.adminService.getOperationsAnalytics(days ? parseInt(days, 10) : 30);
  }
}
