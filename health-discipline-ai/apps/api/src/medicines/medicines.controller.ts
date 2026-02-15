import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PatientsService } from '../patients/patients.service';
import { MedicinesService } from './medicines.service';
import { MedicineCatalogService } from './medicine-catalog.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';

@ApiTags('Medicines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class MedicinesController {
  constructor(
    private medicinesService: MedicinesService,
    private catalogService: MedicineCatalogService,
    private patientsService: PatientsService,
  ) {}

  @Post('patients/:patientId/medicines')
  @ApiOperation({ summary: 'Add a medicine to a patient' })
  async create(
    @Param('patientId') patientId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateMedicineDto,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    return this.medicinesService.create(patientId, dto);
  }

  @Get('patients/:patientId/medicines')
  @ApiOperation({ summary: 'List all active medicines for a patient' })
  async findAll(
    @Param('patientId') patientId: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    return this.medicinesService.findByPatient(patientId);
  }

  @Put('patients/:patientId/medicines/:medicineId')
  @ApiOperation({ summary: 'Update a medicine' })
  async update(
    @Param('patientId') patientId: string,
    @Param('medicineId') medicineId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateMedicineDto,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    return this.medicinesService.update(medicineId, dto);
  }

  @Delete('patients/:patientId/medicines/:medicineId')
  @ApiOperation({ summary: 'Remove a medicine (soft delete)' })
  async remove(
    @Param('patientId') patientId: string,
    @Param('medicineId') medicineId: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    await this.medicinesService.remove(medicineId);
    return { success: true };
  }

  @Post('medicines/search')
  @ApiOperation({ summary: 'Search medicine catalog' })
  async searchCatalog(@Body() body: { query: string }) {
    return this.catalogService.search(body.query);
  }

  @Get('medicines/flagged')
  @ApiOperation({ summary: 'Get medicines flagged for review (admin)' })
  async getFlagged() {
    return this.medicinesService.getFlaggedMedicines();
  }

  @Get('patients/:patientId/medicines/schedule')
  @ApiOperation({ summary: 'Get medicine schedule grouped by timing' })
  async getSchedule(
    @Param('patientId') patientId: string,
    @CurrentUser('userId') userId: string,
  ) {
    await this.patientsService.findByIdForUser(patientId, userId);
    return this.medicinesService.getMedicineSchedule(patientId);
  }
}
