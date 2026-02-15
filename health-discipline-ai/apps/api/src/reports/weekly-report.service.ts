import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from './reports.service';
import { PatientsService } from '../patients/patients.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WeeklyReportService {
  private readonly logger = new Logger(WeeklyReportService.name);

  constructor(
    private reportsService: ReportsService,
    private patientsService: PatientsService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('0 0 * * 0') // Every Sunday at midnight UTC
  async generateAllWeeklyReports() {
    this.logger.log('Starting weekly report generation');

    try {
      const patients = await this.patientsService.getActivePatients();

      const weekEnd = new Date();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      for (const patient of patients) {
        try {
          const report = await this.reportsService.generateWeeklyReport(
            patient._id.toString(),
            weekStart,
            weekEnd,
          );

          await this.notificationsService.sendWeeklyReport(
            patient.userId.toString(),
            patient,
            report,
          );

          // Send to family members too
          const familyMembers = await this.patientsService.getFamilyMembers(patient._id.toString());
          for (const member of familyMembers) {
            if (member.notificationLevel === 'weekly_plus_alerts' || member.notificationLevel === 'daily') {
              await this.notificationsService.sendWeeklyReportToFamily(member, patient, report);
            }
          }
        } catch (err) {
          this.logger.error(`Failed to generate report for patient ${patient._id}: ${err.message}`);
        }
      }

      this.logger.log(`Weekly reports generated for ${patients.length} patients`);
    } catch (error) {
      this.logger.error('Weekly report generation failed', error.stack);
    }
  }
}
