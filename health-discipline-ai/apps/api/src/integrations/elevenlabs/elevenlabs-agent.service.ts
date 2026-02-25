import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamicPromptResult } from '../../dynamic-prompt/types/prompt-context.types';

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
      name: 'Cocarely - Medicine Check Agent',
      tags: ['health', 'medicine-check', 'hindi'],
      conversation_config: {
        agent: {
          first_message: '{{first_message_override}}',
          dynamic_variables: {
            dynamic_variable_placeholders: {
              patient_name: 'ji',
              medicines_list: '',
              medicine_count: '0',
              is_new_patient: 'false',
              has_glucometer: 'false',
              has_bp_monitor: 'false',
              preferred_language: 'Hindi',
              call_timing: 'morning',
              flow_directive: '',
              tone_directive: '',
              context_notes: '',
              relationship_directive: '',
              screening_questions: '',
              first_message_override: 'Hello ji!',
            },
          },
          prompt: {
            prompt: this.getSystemPrompt(),
            llm: 'gemini-2.5-flash',
            temperature: 0.6,
            max_tokens: 300,
          },
        },
        tts: {
          voice_id: voiceId,
          model_id: 'eleven_v3_conversational',
          stability: 0.4,
          similarity_boost: 0.85,
          speed: 0.85,
        },
        asr: {
          quality: 'high',
        },
        turn: {
          turn_timeout: 7, // 7s silence before re-prompting
          turn_eagerness: 'patient', // less eager = harder to interrupt with small sounds like "hmm"
          silence_end_call_timeout: 30, // end call after 30s of total silence (patient left)
        },
        conversation: {
          max_duration_seconds: 300, // 5 minutes max per call
        },
      },
      // Data extraction is handled post-call by TranscriptParserService (Gemini)
      // — no in-call data_collection needed.
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
      const wasUpdate = !!this.agentId;
      this.agentId = data.agent_id;
      this.logger.log(`ElevenLabs agent ${wasUpdate ? 'updated' : 'created'}: ${this.agentId}`);
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
      callTiming?: string;
    },
    dynamicPrompt?: DynamicPromptResult | null,
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

    // Build medicine list string grouped by timing for clarity
    const timingGroups: Record<string, string[]> = {};
    for (const m of patientData.medicines) {
      if (!timingGroups[m.timing]) timingGroups[m.timing] = [];
      timingGroups[m.timing].push(m.name);
    }
    const medicinesList = Object.entries(timingGroups)
      .map(([timing, names]) => `${timing}: ${names.join(', ')}`)
      .join(' | ');

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

    const greeting = dynamicPrompt?.firstMessage || this.getGreeting(patientData.preferredLanguage, patientData.patientName);

    this.logger.log(
      `[OUTBOUND DEBUG] langCode="${patientData.preferredLanguage}", ` +
        `resolvedLang="${preferredLanguage}", greeting="${greeting}", ` +
        `patient="${patientData.patientName}", agentId="${this.agentId}"`,
    );

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
              medicine_count: String(patientData.medicines.length),
              call_id: callId,
              is_new_patient: String(patientData.isNewPatient),
              has_glucometer: String(patientData.hasGlucometer),
              has_bp_monitor: String(patientData.hasBPMonitor),
              preferred_language: preferredLanguage,
              webhook_url: `${apiBaseUrl}/api/v1/webhooks/elevenlabs/post-call`,
              call_timing: patientData.callTiming || 'morning',
              // Dynamic prompt variables (empty strings when disabled — no effect on prompt)
              flow_directive: dynamicPrompt?.flowDirective || '',
              tone_directive: dynamicPrompt?.toneDirectiveText || '',
              context_notes: dynamicPrompt?.contextNotes || '',
              relationship_directive: dynamicPrompt?.relationshipDirective || '',
              screening_questions: dynamicPrompt?.screeningQuestions || '',
              first_message_override: greeting,
            },
            // Per-call language override — optimizes ASR for the patient's language
            overrides: {
              agent: {
                language: patientData.preferredLanguage || 'hi',
                // Hinglish mode only for Hindi speakers (Hindi-English code-switching)
                ...(patientData.preferredLanguage === 'hi' && { hinglish_mode: true }),
              },
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
    return `You are {{patient_name}}'s caring health companion calling to check their medicines and wellbeing. Speak ONLY in {{preferred_language}}. These instructions are in English for your understanding only.

TONE & MANNER
- Warm, respectful, like talking to family
- Use colloquial language and contractions, not formal textbookish speech
- Natural, conversational phone talk — not formal or robotic
- One question at a time; wait for answer before moving on
- Keep responses short (1-2 sentences)
{{relationship_directive}}
{{tone_directive}}

PATIENT INFO
Name: {{patient_name}} | New patient: {{is_new_patient}}
Glucometer: {{has_glucometer}} | BP monitor: {{has_bp_monitor}}
Medicines ({{medicine_count}}): {{medicines_list}}
{{context_notes}}

CALL FLOW
{{flow_directive}}
1. GREETING — Warmly greet {{patient_name}} and ask how they're doing. New patient? Briefly introduce yourself.
2. MEDICINES — Ask about EACH medicine one at a time, only for the current {{call_timing}} slot. Skip medicines meant for other times of day.
3. VITALS — If they have a glucometer or BP monitor, ask if they checked today. If YES, ask for the specific values.
4. WELLNESS — Ask if they have any concerns or problems. If they share something, respond with real warmth.
{{screening_questions}}
5. CLOSING — Say everything is noted, encourage them warmly, and say goodbye.

KEY RULES
- Ask about ALL medicines for this timing slot, do NOT skip any
- If flow is disturbed by a question/concern, address it briefly then return to the flow
- For vitals, if patient checked: ask for SPECIFIC NUMBERS (glucose in mg/dL, BP like "120 over 80")
- NEVER give medical or diagnosis advice. Do not suggest medicines, dosages, or diagnoses. Always suggest checking with doctor.
- If patient is busy or says don't call today, respect it and end warmly
- If they mention severe pain/chest pain/breathing issues, tell them to call their doctor or 108 immediately
- If they mention health problems, empathize then suggest visiting doctor (don't diagnose)
- Never contradict them (if they forgot, acknowledge it gently)
- In an emergency, guide them to call 108 or ask if they would like to alert their care manager
- Keep the call warm and focused — aim for 2-3 minutes
- EVERY word you speak must be in {{preferred_language}}.`;
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

  private getGreeting(_langCode: string, patientName: string): string {
    return `Hello ${patientName}!`;
  }
}
