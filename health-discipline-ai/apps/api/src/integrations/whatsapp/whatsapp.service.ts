import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private configService: ConfigService) {}

  async sendMessage(to: string, body: string): Promise<any> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio not configured, simulating WhatsApp message');
      this.logger.log(`WhatsApp to ${to}: ${body}`);
      return { sid: `SIM_WA_${Date.now()}` };
    }

    try {
      const twilio = require('twilio')(accountSid, authToken);
      return twilio.messages.create({
        to: `whatsapp:${to}`,
        from: `whatsapp:${fromNumber}`,
        body,
      });
    } catch (error) {
      this.logger.error(`WhatsApp send failed: ${error.message}`);
      throw error;
    }
  }

  async sendTemplateMessage(to: string, templateName: string, params: Record<string, string>): Promise<any> {
    // Format template message with params
    let body = this.getTemplate(templateName);
    for (const [key, value] of Object.entries(params)) {
      body = body.replace(`{{${key}}}`, value);
    }
    return this.sendMessage(to, body);
  }

  private getTemplate(name: string): string {
    const templates: Record<string, string> = {
      welcome: 'Welcome to Health Discipline AI! I\'m here to help you set up daily medicine monitoring for your parent. Let\'s begin - are you setting this up for a parent?',
      post_call_report: '{{patientName}}\'s Call Report:\n\n{{medicineReport}}\n\nVitals: {{vitals}}\nMood: {{mood}}',
      missed_call_alert: '{{patientName}} didn\'t pick up the call. Could you remind them? We\'ll try again in 30 minutes.',
      weekly_report: 'Weekly Health Report for {{patientName}}\n\nAdherence: {{adherence}}%\n\n{{details}}',
      trial_reminder: 'Your free trial ends in {{days}} days. Subscribe to keep monitoring {{patientName}}.',
      invalid_phone: '{{patientName}}\'s phone number appears to be invalid. Please update it in the dashboard.',
    };
    return templates[name] || `Template "${name}" not found`;
  }
}
