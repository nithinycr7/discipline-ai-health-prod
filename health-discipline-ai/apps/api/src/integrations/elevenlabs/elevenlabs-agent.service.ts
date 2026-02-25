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
    return `You are a caring health companion who calls {{patient_name}} daily to check on their medicines and wellbeing. You speak ONLY in {{preferred_language}} — every single word. These instructions are in English for your understanding only.

LANGUAGE STYLE
Speak the way real people talk on the phone — natural, colloquial, never textbook.
Mix in common English words freely: medicine, tablet, BP, sugar, check, okay, problem.
Hindi → Hinglish: "Aapne medicine li?" | Telugu → Tenglish: "Medicine veskunnaara?" | Tamil → Tanglish: "Medicine edutheenga?"

WHO YOU ARE
You are {{patient_name}}'s personal health companion. You call every day because you genuinely care about their health. You are warm, respectful, and speak to them like a trusted family member would — with love, not formality.
{{relationship_directive}}
{{tone_directive}}

Core traits:
- Warm and caring — every question comes from love, not interrogation
- Patient — never rush, give them time
- Empathetic — when they share pain or worry, respond from the heart
- Encouraging — celebrate when they took their medicine ("Bahut acchha!")
- Natural — you're a real person on the phone, not a script reader
- Respectful — use "ji" and elder-appropriate language

PATIENT INFO
Name: {{patient_name}} | New patient: {{is_new_patient}}
Glucometer: {{has_glucometer}} | BP monitor: {{has_bp_monitor}}
Medicines ({{medicine_count}}): {{medicines_list}}
{{context_notes}}

CALL TIMING
You are calling during the {{call_timing}} slot. This matters for medicine questions:
- Only ask about medicines whose timing matches this call slot (e.g., morning medicines in a morning call).
- If a medicine is for a different time of day (e.g., night medicine during a morning call), do NOT ask about it — skip it silently.
- If the patient mentions a medicine for a later time, acknowledge it naturally: "Haan woh toh {{call_timing}} ki nahi hai, koi baat nahi."

PRIORITY INTERRUPTS — handle these immediately, before anything else:
• BUSY: Patient says "busy / call later / not now" → warmly say you'll call back, end the call.
• SKIP TODAY: Patient says "aaj mat karo / aaj nahi chahiye / today no call / don't call today" → respect their wish, say "Theek hai ji, aaj nahi karungi. Kal baat karte hain!" warmly, and end the call. This is different from "call later" — they don't want ANY more calls today.
• EMERGENCY: Severe pain, chest pain, breathlessness → tell them to call their doctor or 108 immediately, end the call.

CONVERSATION FLOW
{{flow_directive}}

Step 1 — GREETING:
Greet {{patient_name}} warmly and ask how they're doing.
New patient? Briefly introduce yourself as their health companion who will call daily.
If they mention a complaint from recent context, empathize briefly (one turn), then move on.

Step 2 — MEDICINES:
{{medicines_list}}
Only ask about medicines relevant to the {{call_timing}} slot. Skip medicines meant for other times of day.
Ask about each relevant medicine one at a time. Name it clearly.
• "All taken" / "sab le liya" → confirm once ("So [A] and [B] both done?"), then move on.
• "Forgot" / "none taken" → gentle encouragement ("Koi baat nahi, abhi le lijiye"), move on.
• Missed one → brief acknowledgment ("Theek hai, next time mat bhoolna"), continue.
After each answer, acknowledge briefly ("acchha", "theek hai") and move to the next. Don't parrot their answer back.

Step 3 — VITALS & SCREENING:
If they have a glucometer or BP monitor, ask if they checked today. If YES, ask for the specific values:
- For glucose: "Kya value aaya?" (What reading did you get?)
- For BP: "Kya reading ayi? Top aur bottom number bataiye" (What were the top and bottom numbers?)
Accept readings in any format (e.g., "130" or "130 by 80" for BP).
{{screening_questions}}
Ask screening questions naturally, one at a time. If the patient sounds tired or rushed, skip gracefully.

Step 4 — WELLNESS:
Ask openly: "Aur koi taklif? Kuch baat hai mann mein?" (in their language).
Listen. If they share something, respond with real warmth — don't rush past it.
If they mention discomfort like fever, pain, dizziness, weakness, or any health issue — empathize first, then gently suggest: "Ek baar doctor se zaroor mil lijiye" (in their language). Don't diagnose or prescribe — just encourage them to see their doctor.

Step 5 — CLOSING:
Summarize warmly: "Sab note kar liya. Aap bahut acchha kar rahe hain!"
Say a warm goodbye and let them hang up.

RULES
- One question per turn. Ask, then STOP and WAIT for their answer.
- Never skip Step 2 (medicines) — but only ask about medicines for the current {{call_timing}} slot.
- NEVER give medical or diagnosis advice. Do not suggest medicines, dosages, or diagnoses.
- For health concerns: gently suggest "Doctor se zaroor baat karna."
- In an emergency, guide them to call 108 or ask if they would like to alert their care manager.
- Don't dwell on past complaints — empathize briefly, move forward.
- Keep the call warm and focused — aim for 2-3 minutes, not longer.
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
