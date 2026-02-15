import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExotelService {
  private readonly logger = new Logger(ExotelService.name);
  private readonly apiKey: string;
  private readonly apiToken: string;
  private readonly accountSid: string;
  private readonly callerId: string;
  private readonly baseUrl: string;
  private configured = false;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('EXOTEL_API_KEY', '');
    this.apiToken = this.configService.get<string>('EXOTEL_API_TOKEN', '');
    this.accountSid = this.configService.get<string>('EXOTEL_ACCOUNT_SID', '');
    this.callerId = this.configService.get<string>('EXOTEL_CALLER_ID', '');
    this.baseUrl = this.configService.get<string>(
      'EXOTEL_BASE_URL',
      'https://api.exotel.com/v1/Accounts',
    );

    if (this.apiKey && this.apiToken && this.accountSid) {
      this.configured = true;
      this.logger.log('Exotel service configured successfully');
    } else {
      this.logger.warn('Exotel not configured - missing credentials');
    }
  }

  /**
   * Make an interactive outbound call to a patient.
   * Uses Exotel's Passthru Applet — our server controls each step via webhooks.
   * Flow: Exotel calls patient → hits our /webhooks/exotel/flow endpoint →
   *       we return XML instructions (play audio + gather DTMF input) for each medicine.
   */
  async makeCall(to: string, audioUrl: string, callbackData: string): Promise<any> {
    if (!this.configured) {
      this.logger.warn('Exotel not configured, simulating call');
      return { sid: `SIM_EXO_${Date.now()}`, status: 'queued' };
    }

    const url = `${this.baseUrl}/${this.accountSid}/Calls/connect.json`;
    const apiBaseUrl = this.configService.get<string>('API_BASE_URL', 'http://localhost:3001');

    // The Url points to our flow controller which returns dynamic ExoML/TwiML
    const flowUrl = `${apiBaseUrl}/api/v1/webhooks/exotel/flow?callId=${callbackData}&step=0`;

    const formData = new URLSearchParams();
    formData.append('From', this.callerId);
    formData.append('To', this.normalizeIndianNumber(to));
    formData.append('CallerId', this.callerId);
    formData.append('Url', flowUrl);
    formData.append('CallType', 'trans');
    formData.append('StatusCallback', `${apiBaseUrl}/api/v1/webhooks/exotel/status`);
    formData.append('StatusCallbackEvents[0]', 'terminal');
    formData.append('CustomField', callbackData);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.apiKey}:${this.apiToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`Exotel call failed: ${JSON.stringify(data)}`);
        throw new Error(`Exotel API error: ${data?.RestException?.Message || 'Unknown error'}`);
      }

      this.logger.log(`Exotel call initiated to ${to}, SID: ${data?.Call?.Sid}`);
      return {
        sid: data?.Call?.Sid,
        status: data?.Call?.Status || 'queued',
      };
    } catch (error: any) {
      this.logger.error(`Exotel makeCall error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send an SMS via Exotel.
   */
  async sendSms(to: string, body: string): Promise<any> {
    if (!this.configured) {
      this.logger.warn('Exotel not configured, simulating SMS');
      return { sid: `SIM_SMS_${Date.now()}` };
    }

    const url = `${this.baseUrl}/${this.accountSid}/Sms/send.json`;

    const formData = new URLSearchParams();
    formData.append('From', this.callerId);
    formData.append('To', this.normalizeIndianNumber(to));
    formData.append('Body', body);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.apiKey}:${this.apiToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data: any = await response.json();

      if (!response.ok) {
        this.logger.error(`Exotel SMS failed: ${JSON.stringify(data)}`);
        throw new Error(`Exotel SMS error: ${data?.RestException?.Message || 'Unknown error'}`);
      }

      return { sid: data?.SMSMessage?.Sid, status: data?.SMSMessage?.Status };
    } catch (error: any) {
      this.logger.error(`Exotel sendSms error: ${error.message}`);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string }> {
    if (!this.configured) return { status: 'not_configured' };

    try {
      const url = `${this.baseUrl}/${this.accountSid}.json`;
      const response = await fetch(url, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.apiKey}:${this.apiToken}`).toString('base64'),
        },
      });

      return response.ok ? { status: 'ok' } : { status: 'error' };
    } catch {
      return { status: 'error' };
    }
  }

  /**
   * Normalize phone number to Indian format (0XXXXXXXXXX) for Exotel.
   * Exotel expects numbers without +91 prefix, just 0 + 10 digits.
   */
  private normalizeIndianNumber(phone: string): string {
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+91')) {
      return '0' + cleaned.slice(3);
    }
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '0' + cleaned.slice(2);
    }
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return cleaned;
    }
    return cleaned;
  }
}
