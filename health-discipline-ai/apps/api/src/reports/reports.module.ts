import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { WeeklyReportService } from './weekly-report.service';
import { CallsModule } from '../calls/calls.module';
import { PatientsModule } from '../patients/patients.module';
import { MedicinesModule } from '../medicines/medicines.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [CallsModule, PatientsModule, MedicinesModule, NotificationsModule],
  providers: [ReportsService, WeeklyReportService],
  exports: [ReportsService, WeeklyReportService],
})
export class ReportsModule {}
