import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: any;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      try {
        const twilio = require('twilio');
        this.client = twilio(accountSid, authToken);
      } catch (e) {
        this.logger.warn('Twilio client not initialized - missing credentials');
      }
    }
  }

  async makeCall(to: string, audioUrl: string, callbackData: string): Promise<any> {
    if (!this.client) {
      this.logger.warn('Twilio client not configured, simulating call');
      return { sid: `SIM_${Date.now()}`, status: 'queued' };
    }

    const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    return this.client.calls.create({
      to,
      from: fromNumber,
      twiml: `<Response><Play>${audioUrl}</Play></Response>`,
      statusCallback: `${frontendUrl}/api/v1/webhooks/twilio/status`,
      statusCallbackEvent: ['completed', 'no-answer', 'busy', 'failed'],
      statusCallbackMethod: 'POST',
      machineDetection: 'Enable',
    });
  }

  async sendWhatsApp(to: string, body: string): Promise<any> {
    if (!this.client) {
      this.logger.warn('Twilio client not configured, simulating WhatsApp');
      return { sid: `SIM_WA_${Date.now()}` };
    }

    const fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER');

    return this.client.messages.create({
      to: `whatsapp:${to}`,
      from: `whatsapp:${fromNumber}`,
      body,
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    if (!this.client) return { status: 'not_configured' };

    try {
      await this.client.api.accounts(this.configService.get('TWILIO_ACCOUNT_SID')).fetch();
      return { status: 'ok' };
    } catch {
      return { status: 'error' };
    }
  }
}
