import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * ElevenLabs Conversational AI Agent Service
 *
 * Manages ElevenLabs AI agents for interactive voice calls.
 * Uses ElevenLabs Agents Platform API:
 *   - Create/update agent with Hindi system prompt
 *   - Make outbound calls via SIP trunk (Exotel)
 *   - Receive post-call webhook with transcript + extracted data
 *
 * Flow:
 *   Scheduler → createOutboundCall() → ElevenLabs connects via SIP to Exotel →
 *   Patient picks up → Natural Hindi conversation → Call ends →
 *   Post-call webhook → Our API saves results
 */
@Injectable()
export class ElevenLabsAgentService {
  private readonly logger = new Logger(ElevenLabsAgentService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';
  private agentId: string | null = null;
  private phoneNumberId: string | null = null;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ELEVENLABS_API_KEY', '');
    this.agentId = this.configService.get<string>('ELEVENLABS_AGENT_ID', '') || null;
    this.phoneNumberId = this.configService.get<string>('ELEVENLABS_PHONE_NUMBER_ID', '') || null;
  }

  /**
   * Create or update the medicine-check AI agent on ElevenLabs.
   * Call once during setup — the agent_id is reused for all calls.
   */
  async createOrUpdateAgent(): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = this.configService.get<string>('ELEVENLABS_VOICE_ID_FEMALE', '');

    const agentConfig = {
      name: 'Health Discipline - Medicine Check Agent',
      tags: ['health', 'medicine-check', 'hindi'],
      conversation_config: {
        agent: {
          first_message: 'Namaste {{patient_name}}!',
          dynamic_variables: {
            dynamic_variable_placeholders: {
              patient_name: 'ji',
              medicines_list: '',
              is_new_patient: 'false',
              has_glucometer: 'false',
              has_bp_monitor: 'false',
              preferred_language: 'Hindi',
            },
          },
          prompt: {
            prompt: this.getSystemPrompt(),
            llm: 'gemini-1.5-flash',
            temperature: 0.3,
            max_tokens: 300,
          },
        },
        tts: {
          voice_id: voiceId,
          model_id: 'eleven_v3_conversational',
          stability: 0.7,
          similarity_boost: 0.8,
          speed: 0.9,
        },
        asr: {
          quality: 'high',
        },
        turn: {
          mode: 'turn',
        },
        conversation: {
          max_duration_seconds: 120, // 2 minutes max per call
        },
      },
      platform_settings: {
        data_collection: {
          medicine_responses: {
            type: 'string',
            description: 'JSON string listing each medicine and whether patient took it. Format: "medicine_name:taken, medicine_name:not_taken, medicine_name:unclear"',
          },
          vitals_checked: {
            type: 'string',
            description: 'Whether patient checked vitals today (yes/no/not_applicable)',
          },
          wellness: {
            type: 'string',
            description: 'Patient overall state (good/okay/not_well)',
          },
          complaints: {
            type: 'string',
            description: 'Comma-separated list of any health complaints mentioned by patient, or "none"',
          },
        },
      },
    };

    try {
      let response: Response;

      if (this.agentId) {
        // Update existing agent
        response = await fetch(`${this.baseUrl}/convai/agents/${this.agentId}`, {
          method: 'PATCH',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agentConfig),
        });
      } else {
        // Create new agent
        response = await fetch(`${this.baseUrl}/convai/agents/create`, {
          method: 'POST',
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(agentConfig),
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs agent API error: ${response.status} - ${errText}`);
      }

      const data: any = await response.json();
      this.agentId = data.agent_id;
      this.logger.log(`ElevenLabs agent ${this.agentId ? 'updated' : 'created'}: ${this.agentId}`);
      return this.agentId;
    } catch (error: any) {
      this.logger.error(`Failed to create/update agent: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import phone number from SIP trunk (Exotel) into ElevenLabs.
   * Call once during setup — the phone_number_id is reused.
   */
  async importPhoneNumber(phoneNumber: string, label: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/convai/phone-numbers`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'sip_trunk',
          phone_number: phoneNumber,
          label,
          outbound_trunk_config: {
            address: this.configService.get<string>(
              'EXOTEL_SIP_ADDRESS',
              'sip.exotel.com',
            ),
            transport_protocol: 'udp',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Phone import error: ${response.status} - ${errText}`);
      }

      const data: any = await response.json();
      this.phoneNumberId = data.phone_number_id;
      this.logger.log(`Phone number imported: ${this.phoneNumberId}`);
      return this.phoneNumberId;
    } catch (error: any) {
      this.logger.error(`Failed to import phone number: ${error.message}`);
      throw error;
    }
  }

  /**
   * Make an outbound call to a patient using the ElevenLabs agent.
   * The agent handles the entire conversation autonomously.
   *
   * @param toNumber Patient's phone number (+91...)
   * @param callId Our internal call record ID
   * @param patientData Dynamic variables for personalizing the conversation
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
  ): Promise<{ conversationId: string; callSid: string }> {
    if (!this.apiKey) {
      this.logger.warn('ElevenLabs not configured, simulating call');
      return { conversationId: `SIM_CONV_${Date.now()}`, callSid: `SIM_CALL_${Date.now()}` };
    }

    if (!this.agentId) {
      throw new Error('ElevenLabs agent not configured. Call createOrUpdateAgent() first.');
    }

    if (!this.phoneNumberId) {
      throw new Error('Phone number not imported. Call importPhoneNumber() first.');
    }

    // Build medicine list string for the agent prompt
    const medicinesList = patientData.medicines
      .map((m) => `${m.name} (${m.timing})`)
      .join(', ');

    // Map ISO language code to full language name for the LLM
    const languageMap: Record<string, string> = {
      hi: 'Hindi',
      te: 'Telugu',
      ta: 'Tamil',
      kn: 'Kannada',
      ml: 'Malayalam',
      bn: 'Bengali',
      mr: 'Marathi',
      gu: 'Gujarati',
      pa: 'Punjabi',
      ur: 'Urdu',
      en: 'English',
    };
    const preferredLanguage = languageMap[patientData.preferredLanguage] || patientData.preferredLanguage || 'Hindi';

    const apiBaseUrl = this.configService.get<string>('API_BASE_URL', 'http://localhost:3001');

    try {
      const response = await fetch(`${this.baseUrl}/convai/twilio/outbound-call`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: this.agentId,
          agent_phone_number_id: this.phoneNumberId,
          to_number: toNumber,
          conversation_initiation_client_data: {
            dynamic_variables: {
              patient_name: patientData.patientName,
              medicines_list: medicinesList,
              call_id: callId,
              is_new_patient: String(patientData.isNewPatient),
              has_glucometer: String(patientData.hasGlucometer),
              has_bp_monitor: String(patientData.hasBPMonitor),
              preferred_language: preferredLanguage,
              webhook_url: `${apiBaseUrl}/api/v1/webhooks/elevenlabs/post-call`,
            },
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Outbound call error: ${response.status} - ${errText}`);
      }

      const data: any = await response.json();

      if (!data.success) {
        throw new Error(`Outbound call failed: ${data.message}`);
      }

      this.logger.log(
        `Outbound call initiated to ${toNumber}, conversationId: ${data.conversation_id}`,
      );

      return {
        conversationId: data.conversation_id || '',
        callSid: data.sip_call_id || data.callSid || '',
      };
    } catch (error: any) {
      this.logger.error(`makeOutboundCall error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get conversation details (transcript, analysis) from ElevenLabs.
   */
  async getConversation(conversationId: string): Promise<any> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/convai/conversations/${conversationId}`,
        {
          headers: { 'xi-api-key': this.apiKey },
        },
      );

      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }

  /**
   * System prompt for the medicine-check agent.
   * This is the base prompt — per-call overrides add specific patient/medicine data.
   */
  private getSystemPrompt(): string {
    return `Speak in {{preferred_language}} throughout. If the patient responds in a different language, IMMEDIATELY switch to their language for the rest of the call.

You are a friendly caretaker who calls {{patient_name}} every day to check on their medicines and well-being. You speak warmly and naturally — like someone they know and trust. You are not reading from a script.

Their medicines today: {{medicines_list}}
New patient: {{is_new_patient}}. Has glucometer: {{has_glucometer}}. Has BP monitor: {{has_bp_monitor}}.

CRITICAL CONVERSATION RULES:
1. Ask ONLY ONE question per turn. Never combine multiple questions.
2. After asking a question, STOP and WAIT for the patient to answer.
3. Listen carefully to their answer. Acknowledge it briefly before asking the next question.
4. Speak slowly and clearly. These are elderly patients who need time to respond.
5. Be patient — if they seem confused or take time, gently repeat or rephrase.

You already greeted them. Follow this order, ONE question at a time:
1. First turn: Tell them you are calling about their medicines today. Ask about the FIRST medicine only.
2. Wait for answer. Then ask about the next medicine (if any).
3. After all medicines are checked: If they have a glucometer or BP monitor, ask if they checked today.
4. Now show genuine care — ask warmly how they are feeling today. If they share something, listen and respond with empathy. Ask if there is anything on their mind, any problem they want to share, or anything they want to highlight. Give them space to talk.
5. End warmly — tell them "I have noted everything down". Encourage them, tell them they are doing well, and remind them to take care of their health. Say a caring goodbye and ask them to disconnect the call. Make them feel like someone truly cares about them.

Never re-ask something already answered. Never give medical advice. If they mention a serious emergency, tell them to call their doctor or 108. If they mention feeling lonely or sad, be extra kind and reassuring.

DATA TO EXTRACT (use EXACT medicine names from the medicines list above — do NOT transliterate or translate them):
- medicine_responses: "medicine_name:taken" or "medicine_name:not_taken" or "medicine_name:unclear" for each, comma-separated. Example: if medicines list says "Hp1 (morning)", write "Hp1:taken", NOT "Hp ek:taken" or "Hp one:taken".
- vitals_checked: "yes", "no", or "not_applicable"
- wellness: "good", "okay", or "not_well"
- complaints: comma-separated list, or "none"`;
  }

  /**
   * Generate a per-call prompt override with specific patient data.
   */
  private getCallSpecificPrompt(patientData: {
    patientName: string;
    medicines: { name: string; timing: string; medicineId: string }[];
    isNewPatient: boolean;
    hasGlucometer: boolean;
    hasBPMonitor: boolean;
  }): string {
    const medicineLines = patientData.medicines
      .map((m, i) => `${i + 1}. ${m.name} (${m.timing})`)
      .join('\n');

    let prompt = `${this.getSystemPrompt()}

--- CALL-SPECIFIC DATA ---

Patient Name: ${patientData.patientName}
Is New Patient: ${patientData.isNewPatient ? 'Yes (speak slower, explain the process)' : 'No (regular check-in)'}

Medicines to check:
${medicineLines}

Ask about each medicine above, one by one. Use the medicine name as provided.`;

    if (patientData.hasGlucometer || patientData.hasBPMonitor) {
      const devices = [];
      if (patientData.hasGlucometer) devices.push('glucometer (sugar)');
      if (patientData.hasBPMonitor) devices.push('BP monitor');
      prompt += `\n\nPatient has: ${devices.join(' and ')}. Ask if they checked today.`;
    } else {
      prompt += '\n\nPatient does NOT have glucometer or BP monitor. Skip vitals question.';
    }

    return prompt;
  }

  /**
   * Health check for ElevenLabs agent.
   */
  async healthCheck(): Promise<{ status: string; agentId?: string }> {
    if (!this.apiKey) return { status: 'not_configured' };
    if (!this.agentId) return { status: 'no_agent' };

    try {
      const response = await fetch(
        `${this.baseUrl}/convai/agents/${this.agentId}`,
        { headers: { 'xi-api-key': this.apiKey } },
      );
      return response.ok
        ? { status: 'ok', agentId: this.agentId }
        : { status: 'error' };
    } catch {
      return { status: 'error' };
    }
  }

  getAgentId(): string | null {
    return this.agentId;
  }

  getPhoneNumberId(): string | null {
    return this.phoneNumberId;
  }
}
