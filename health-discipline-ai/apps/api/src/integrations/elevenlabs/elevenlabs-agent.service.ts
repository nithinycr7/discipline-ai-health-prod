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
          first_message: 'Namaste {{patient_name}}! Main aapki health assistant bol rahi hoon. Kya aap mujhse baat kar sakte hain?',
          language: 'hi',
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
            },
          },
          prompt: {
            prompt: this.getSystemPrompt(),
            llm: 'gpt-4o-mini',
            temperature: 0.3,
            max_tokens: 300,
          },
        },
        tts: {
          voice_id: voiceId,
          model_id: 'eleven_multilingual_v2',
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
          mood: {
            type: 'string',
            description: 'Patient mood assessment (good/okay/not_well)',
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
    return `You are a caring health assistant who calls elderly patients in India to check on their daily medicine intake. You speak in simple Hindi (Hinglish).

The patient's name is {{patient_name}}.
Their medicines to check today: {{medicines_list}}.
Is new patient: {{is_new_patient}}.
Has glucometer: {{has_glucometer}}.
Has BP monitor: {{has_bp_monitor}}.

PERSONALITY:
- Warm, respectful, patient — like a caring family member
- Use "aap" (respectful form), never "tum"
- Speak slowly and clearly
- Be encouraging and supportive
- If patient seems confused, repeat gently
- If this is a new patient, speak slower and explain that their family started this service for them

CONVERSATION FLOW:
1. You have already greeted them in the first message. Now ask about each medicine one by one from the medicines list above.
2. For each medicine, confirm clearly: "taken" or "not taken"
3. If patient has glucometer or BP monitor, ask if they checked vitals today
4. Ask how they are feeling (mood check)
5. Listen for any complaints or concerns
6. End with warm encouragement and goodbye

RULES:
- Keep the conversation under 3 minutes
- Do NOT give medical advice
- Do NOT change medicine dosage
- If patient reports emergency symptoms (chest pain, breathlessness, severe dizziness), tell them to call their doctor or 108 immediately
- If patient says they missed a medicine, gently encourage but do NOT pressure
- Accept any response gracefully — do not judge

DATA TO EXTRACT:
- For each medicine: was it taken? (taken/not_taken/unclear)
- Vitals checked today? (yes/no)
- Overall mood (good/okay/not_well)
- Any complaints mentioned

LANGUAGE:
- Primary: Hindi (Devanagari phonetic in Roman script)
- If patient speaks in English, respond in English
- Use medicine nicknames when available (e.g., "BP wali goli" instead of "Amlodipine")`;
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
