import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamicPromptResult } from '../../dynamic-prompt/types/prompt-context.types';

/**
 * Sarvam AI Agent Service
 *
 * Triggers outbound voice calls via LiveKit + Sarvam stack:
 *   - Creates a LiveKit room with patient metadata
 *   - Creates a SIP participant (outbound call via Exotel SIP trunk)
 *   - A separate Python LiveKit agent worker picks up the room and
 *     conducts the conversation using Sarvam STT + Gemini LLM + Sarvam TTS
 *   - After the call ends, the Python worker POSTs results to /webhooks/sarvam/post-call
 */
@Injectable()
export class SarvamAgentService {
  private readonly logger = new Logger(SarvamAgentService.name);
  private readonly livekitUrl: string;
  private readonly livekitApiKey: string;
  private readonly livekitApiSecret: string;
  private readonly sipTrunkId: string;

  constructor(private configService: ConfigService) {
    this.livekitUrl = this.configService.get<string>('LIVEKIT_URL', '');
    this.livekitApiKey = this.configService.get<string>('LIVEKIT_API_KEY', '');
    this.livekitApiSecret = this.configService.get<string>('LIVEKIT_API_SECRET', '');
    this.sipTrunkId = this.configService.get<string>('LIVEKIT_SIP_TRUNK_ID', '');
  }

  /**
   * Make an outbound call via LiveKit + Sarvam stack.
   *
   * 1. Create a LiveKit room named after the call ID
   * 2. Attach patient metadata to the room (read by the Python agent worker)
   * 3. Create a SIP participant to dial the patient via Exotel SIP trunk
   */
  async makeOutboundCall(
    toNumber: string,
    callId: string,
    patientData: {
      patientName: string;
      medicines: { name: string; timing: string; medicineId: string }[];
      isNewPatient: boolean;
      hasGlucometer: boolean;
      hasBPMonitor: boolean;
      preferredLanguage: string;
    },
    dynamicPrompt?: DynamicPromptResult | null,
  ): Promise<{ conversationId: string; callSid: string }> {
    if (!this.livekitUrl || !this.livekitApiKey || !this.livekitApiSecret) {
      this.logger.warn('LiveKit not configured, simulating call');
      return {
        conversationId: `SIM_SARVAM_${Date.now()}`,
        callSid: `SIM_SIP_${Date.now()}`,
      };
    }

    const roomName = `call_${callId}`;
    const apiBaseUrl = this.configService.get<string>('API_BASE_URL', 'http://localhost:3001');

    // Room metadata — the Python LiveKit agent worker reads this
    const metadata = JSON.stringify({
      callId,
      patientName: patientData.patientName,
      medicines: patientData.medicines,
      isNewPatient: patientData.isNewPatient,
      hasGlucometer: patientData.hasGlucometer,
      hasBPMonitor: patientData.hasBPMonitor,
      preferredLanguage: patientData.preferredLanguage,
      webhookUrl: `${apiBaseUrl}/api/v1/webhooks/sarvam/post-call`,
      // Dynamic prompt context (null when disabled — Python agent falls back to static prompt)
      dynamicPrompt: dynamicPrompt
        ? {
            flowDirective: dynamicPrompt.flowDirective,
            toneDirective: dynamicPrompt.toneDirectiveText,
            contextNotes: dynamicPrompt.contextNotes,
            relationshipDirective: dynamicPrompt.relationshipDirective,
            screeningQuestions: dynamicPrompt.screeningQuestions,
            firstMessage: dynamicPrompt.firstMessage,
          }
        : null,
    });

    try {
      // Generate LiveKit JWT for API access
      const token = await this.generateLivekitToken();

      // 1. Create LiveKit room
      const roomResponse = await fetch(
        `${this.livekitHttpUrl}/twirp/livekit.RoomService/CreateRoom`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: roomName,
            metadata,
            empty_timeout: 300, // 5 min timeout if empty
            max_participants: 3, // agent + patient + optional monitor
          }),
        },
      );

      if (!roomResponse.ok) {
        const errText = await roomResponse.text();
        throw new Error(`LiveKit CreateRoom error: ${roomResponse.status} - ${errText}`);
      }

      this.logger.log(`LiveKit room created: ${roomName}`);

      // 2. Create SIP participant (outbound call via Exotel trunk)
      const sipResponse = await fetch(
        `${this.livekitHttpUrl}/twirp/livekit.SIP/CreateSIPParticipant`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sip_trunk_id: this.sipTrunkId,
            sip_call_to: toNumber,
            room_name: roomName,
            participant_identity: `patient_${callId}`,
            participant_name: patientData.patientName,
          }),
        },
      );

      if (!sipResponse.ok) {
        const errText = await sipResponse.text();
        throw new Error(`LiveKit SIP error: ${sipResponse.status} - ${errText}`);
      }

      const sipData: any = await sipResponse.json();

      this.logger.log(
        `Sarvam outbound call initiated to ${toNumber}, room: ${roomName}`,
      );

      return {
        conversationId: roomName,
        callSid: sipData.participant_id || sipData.sip_call_id || '',
      };
    } catch (error: any) {
      this.logger.error(`Sarvam makeOutboundCall error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a LiveKit access token (JWT) for server-side API calls.
   * Uses the livekit-server-sdk if available, otherwise manual JWT.
   */
  private async generateLivekitToken(): Promise<string> {
    try {
      // Use livekit-server-sdk
      const { AccessToken } = await import('livekit-server-sdk');
      const token = new AccessToken(this.livekitApiKey, this.livekitApiSecret, {
        ttl: 300, // 5 minutes validity for sequential API calls
      });
      token.addGrant({
        roomCreate: true,
        roomAdmin: true,
        roomList: true,
      });
      token.addSIPGrant({ admin: true, call: true });
      return await token.toJwt();
    } catch {
      throw new Error(
        'livekit-server-sdk not installed. Run: npm install livekit-server-sdk',
      );
    }
  }

  /**
   * Convert WebSocket LiveKit URL to HTTP for REST API calls.
   */
  private get livekitHttpUrl(): string {
    return this.livekitUrl
      .replace('wss://', 'https://')
      .replace('ws://', 'http://');
  }

  async healthCheck(): Promise<{ status: string; provider: string }> {
    if (!this.livekitUrl) return { status: 'not_configured', provider: 'sarvam' };

    try {
      const token = await this.generateLivekitToken();
      const response = await fetch(
        `${this.livekitHttpUrl}/twirp/livekit.RoomService/ListRooms`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        },
      );
      return response.ok
        ? { status: 'ok', provider: 'sarvam' }
        : { status: 'error', provider: 'sarvam' };
    } catch {
      return { status: 'error', provider: 'sarvam' };
    }
  }
}
