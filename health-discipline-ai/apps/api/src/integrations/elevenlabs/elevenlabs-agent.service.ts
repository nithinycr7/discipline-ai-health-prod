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
              patient_name: {
                value: 'ji',
                description: 'Patient preferred name',
              },
              medicines_list: {
                value: '',
                description: 'Comma-separated list of medicines with timing (e.g. "Telma 40 (morning), Ecosprin (evening)")',
              },
              is_new_patient: {
                value: 'false',
                description: 'Whether this is the first call to this patient (true/false)',
              },
              has_glucometer: {
                value: 'false',
                description: 'Whether patient has a glucometer (true/false)',
              },
              has_bp_monitor: {
                value: 'false',
                description: 'Whether patient has a BP monitor (true/false)',
              },
              preferred_language: {
                value: 'hi',
                description: 'Patient preferred language ISO code (hi, en, te, ta, etc.)',
              },
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
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 0.9,
        },
        asr: {
          quality: 'high',
        },
        turn: {
          mode: 'turn',
        },
        conversation: {
          max_duration_seconds: 300, // 5 minutes max per call
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
    return `You MUST speak in {{preferred_language}} throughout the entire conversation. Do not switch to any other language unless the patient speaks to you in a different language first.

You are a caretaker who calls elderly patients every day to check on their medicine intake and well-being. You genuinely care about the patient — like a trusted person from their own family.

The patient's name is {{patient_name}}.
Their medicines to check today: {{medicines_list}}.
Is new patient: {{is_new_patient}}.
Has glucometer: {{has_glucometer}}.
Has BP monitor: {{has_bp_monitor}}.

PERSONALITY:
- Warm, respectful, patient — like a caring family member who checks in every day
- Always use the respectful/formal form of address in the patient's language
- Speak slowly and clearly — many patients are elderly and may be hard of hearing
- Be genuinely encouraging and supportive, not mechanical
- If the patient seems confused or doesn't understand, repeat gently with simpler words
- If this is a new patient (is_new_patient = true), introduce yourself warmly: explain that their family has arranged for you to call every day to help them stay on track with their medicines. Speak extra slowly and be patient.
- If this is a returning patient, be familiar and warm — like someone who already knows them

CONVERSATION FLOW:
1. You have already greeted them in the first message. Start by asking how they are feeling today — genuinely, like a caretaker would.
2. Based on their response, acknowledge what they said before moving to medicines. If they mention feeling unwell, show concern and ask a brief follow-up.
3. Then check on each medicine one by one from the medicines list. Use the medicine name naturally. For each one, confirm: "taken" or "not taken".
4. If they missed a medicine, respond with gentle encouragement — not pressure. Never scold.
5. If patient has a glucometer (has_glucometer = true) or BP monitor (has_bp_monitor = true), ask if they checked their readings today.
6. Listen for any health complaints or concerns they bring up. Acknowledge them.
7. End with warm encouragement — remind them you will call again tomorrow. Say goodbye affectionately.

RULES:
- Keep the conversation under 3 minutes
- Do NOT give any medical advice whatsoever
- Do NOT suggest changing medicine dosage or timing
- Do NOT diagnose or interpret symptoms
- If patient reports emergency symptoms (chest pain, breathlessness, severe dizziness, loss of consciousness), immediately tell them to call their doctor or 108
- Accept any response gracefully — never judge or scold
- If the patient wants to chat about their day, allow a brief moment, then gently steer back to medicines
- If the patient says someone else (daughter, son, etc.) gives them their medicines, still confirm whether each medicine was taken

DATA TO EXTRACT (fill these accurately based on the conversation):
- medicine_responses: For each medicine, record "medicine_name:taken" or "medicine_name:not_taken" or "medicine_name:unclear", comma-separated
- vitals_checked: Whether patient checked vitals today — "yes", "no", or "not_applicable" (if they have no devices)
- wellness: Patient's overall state — "good" (happy, healthy, normal), "okay" (fine but not great), "not_well" (complaints, pain, low energy, sad)
- complaints: Comma-separated list of any health complaints mentioned, or "none"`;
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
