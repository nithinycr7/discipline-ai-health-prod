import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppService } from '../integrations/whatsapp/whatsapp.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private whatsAppService: WhatsAppService,
    private usersService: UsersService,
  ) {}

  async sendPostCallReport(call: any, patient: any) {
    try {
      const user = await this.usersService.findById(call.userId.toString());
      if (!user?.phone) return;

      const medicineReport = call.medicinesChecked
        .map((m: any) => {
          const icon = m.response === 'taken' ? 'v' : m.response === 'missed' ? 'x' : '?';
          return `${icon} ${m.medicineName}: ${m.response}`;
        })
        .join('\n');

      let vitalsText = 'Not collected';
      if (call.vitals?.glucose) vitalsText = `Glucose: ${call.vitals.glucose} mg/dL`;
      if (call.vitals?.bloodPressure) {
        vitalsText += `\nBP: ${call.vitals.bloodPressure.systolic}/${call.vitals.bloodPressure.diastolic}`;
      }

      const mood = call.moodNotes || 'Not reported';
      const hasMissed = call.medicinesChecked.some((m: any) => m.response === 'missed' && m.isCritical);

      let message = `${patient.preferredName}'s Call Report\n\n`;
      message += `${medicineReport}\n\n`;
      message += `Vitals: ${vitalsText}\n`;
      message += `Mood: ${mood}`;

      if (hasMissed) {
        message += '\n\n⚠ ALERT: Critical medicine missed!';
      }

      if (patient.callsCompletedCount <= 3) {
        message += `\n\n${patient.preferredName}'s call went well!`;
      }

      await this.whatsAppService.sendMessage(user.phone, message);
    } catch (error) {
      this.logger.error(`Failed to send post-call report: ${error.message}`);
    }
  }

  async sendMissedCallAlert(call: any, patient: any) {
    try {
      const user = await this.usersService.findById(call.userId.toString());
      if (!user?.phone) return;

      await this.whatsAppService.sendTemplateMessage(user.phone, 'missed_call_alert', {
        patientName: patient.preferredName,
      });
    } catch (error) {
      this.logger.error(`Failed to send missed call alert: ${error.message}`);
    }
  }

  async sendInvalidPhoneAlert(call: any, patient: any) {
    try {
      const user = await this.usersService.findById(call.userId.toString());
      if (!user?.phone) return;

      await this.whatsAppService.sendTemplateMessage(user.phone, 'invalid_phone', {
        patientName: patient.preferredName,
      });
    } catch (error) {
      this.logger.error(`Failed to send invalid phone alert: ${error.message}`);
    }
  }

  async sendWeeklyReport(userId: string, patient: any, report: any) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user?.phone) return;

      let details = `Medicines:\n`;
      for (const med of report.adherence.byMedicine) {
        details += `- ${med.name}: ${med.percentage}% (${med.taken}/${med.taken + med.missed})\n`;
      }

      if (report.missedMedicinesHighlight.length > 0) {
        details += `\nMissed: ${report.missedMedicinesHighlight.join(', ')}`;
      }

      await this.whatsAppService.sendTemplateMessage(user.phone, 'weekly_report', {
        patientName: patient.preferredName,
        adherence: String(report.adherence.overall),
        details,
      });
    } catch (error) {
      this.logger.error(`Failed to send weekly report: ${error.message}`);
    }
  }

  async sendWeeklyReportToFamily(member: any, patient: any, report: any) {
    try {
      const message = `Weekly Report for ${patient.preferredName}\nAdherence: ${report.adherence.overall}%\nCalls completed: ${report.totalCallsCompleted}\nCalls missed: ${report.totalCallsMissed}`;
      await this.whatsAppService.sendMessage(member.phone, message);
    } catch (error) {
      this.logger.error(`Failed to send report to family member: ${error.message}`);
    }
  }

  async sendTrialReminder(userId: string, patientName: string, daysLeft: number) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user?.phone) return;

      await this.whatsAppService.sendTemplateMessage(user.phone, 'trial_reminder', {
        patientName,
        days: String(daysLeft),
      });
    } catch (error) {
      this.logger.error(`Failed to send trial reminder: ${error.message}`);
    }
  }

  async sendFirst48HourUpdate(userId: string, patient: any, callCount: number, adherence: number) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user?.phone) return;

      const message = callCount >= 3
        ? `Great news! ${patient.preferredName} has picked up all ${callCount} calls! Adherence at ${adherence}%.`
        : `${patient.preferredName} has completed ${callCount} call(s) so far. ${3 - callCount} more to go!`;

      await this.whatsAppService.sendMessage(user.phone, message);
    } catch (error) {
      this.logger.error(`Failed to send 48-hour update: ${error.message}`);
    }
  }
}
