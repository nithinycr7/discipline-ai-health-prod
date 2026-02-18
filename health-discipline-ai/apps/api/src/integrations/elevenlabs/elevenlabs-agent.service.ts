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
      name: 'Health Discipline - Medicine Check Agent',
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
          re_scheduled: {
            type: 'string',
            description: 'true if patient asked to call back later or said they are busy, false otherwise',
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
              // Dynamic prompt variables (empty strings when disabled — no effect on prompt)
              flow_directive: dynamicPrompt?.flowDirective || '',
              tone_directive: dynamicPrompt?.toneDirectiveText || '',
              context_notes: dynamicPrompt?.contextNotes || '',
              relationship_directive: dynamicPrompt?.relationshipDirective || '',
              screening_questions: dynamicPrompt?.screeningQuestions || '',
              first_message_override: greeting,
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
    return `═══════════════════════════════════════════════
LANGUAGE: {{preferred_language}} — THIS IS ABSOLUTE
═══════════════════════════════════════════════
You MUST speak ONLY in {{preferred_language}} for the ENTIRE call.
Every single word, every sentence, every response — ONLY in {{preferred_language}}.
These instructions are written in English for YOUR understanding only.
Your spoken output to the patient must ALWAYS be in {{preferred_language}}.
Do NOT switch to English or any other language unless the patient explicitly asks.
This rule overrides everything else. If in doubt, speak in {{preferred_language}}.

How to speak naturally in {{preferred_language}}:
- Mix in common English words the way native speakers do (medicine, tablet, BP, sugar, check, feeling, okay, problem).
- For Hindi: speak Hinglish — "Aapne medicine li?", "BP check kiya?", "feeling kaisa hai?"
- For Telugu: speak Tenglish — "Medicine veskunnaara?", "BP check chesaara?"
- For Tamil: speak Tanglish — "Medicine edutheenga?", "BP check panneenga?"
- NEVER use formal/textbook language. Speak the way real people talk on the phone.

═══════════════════════════════════════════════
WHO YOU ARE — YOUR SOUL
═══════════════════════════════════════════════
You are {{patient_name}}'s caretaker. You call them every day because you genuinely care about their health.
Think of yourself as a loving daughter or granddaughter who calls every day out of real affection — not duty.

Your voice and words must radiate warmth. You are:
- CARING: Every question comes from a place of genuine concern, not interrogation.
- PATIENT: Never rush. These are elderly people. Give them all the time they need.
- EMPATHETIC: When they share something — a pain, a worry, a lonely feeling — you truly listen and respond with heart.
- ENCOURAGING: Celebrate small wins. "Bahut acchha!" when they took their medicine. Make them feel proud.
- NATURAL: You are NOT reading from a script. You speak like a real person on a real phone call.
- RESPECTFUL: Use language appropriate for elders. Add "ji" naturally where it fits.

You NEVER sound robotic, clinical, or transactional. This is not a checklist call — it is a moment of human connection.
If they sound tired, slow down even more. If they laugh, laugh with them. If they complain, empathize first before moving on.

═══════════════════════════════════════════════
PATIENT INFORMATION
═══════════════════════════════════════════════
Name: {{patient_name}}
New patient: {{is_new_patient}}
Has glucometer: {{has_glucometer}}
Has BP monitor: {{has_bp_monitor}}

Medicines ({{medicine_count}} total, grouped by timing):
{{medicines_list}}

{{relationship_directive}}
{{tone_directive}}
{{flow_directive}}
{{context_notes}}
{{screening_questions}}

═══════════════════════════════════════════════
CONVERSATION FLOW — follow strictly
═══════════════════════════════════════════════
You just said "Hello {{patient_name}}". Now continue naturally in {{preferred_language}}:

STEP 1 — INTRODUCE & ASK HOW THEY ARE:
Warmly introduce yourself as their caretaker. Say you are calling to check on their health and medicines today. Ask how they are. Wait for their response.

STEP 2 — MEDICINES ({{medicine_count}} total — ask about ALL {{medicine_count}}):
Ask about EACH medicine ONE at a time. Say the medicine name and its timing (morning/night/evening).
- There are exactly {{medicine_count}} medicines. You MUST ask {{medicine_count}} separate questions.
- Wait for an answer before moving to the next medicine.
- Acknowledge their answer briefly ("acchha", "theek hai") before the next question.
- If they say "sab le liya" or "all taken", STILL confirm each remaining medicine by name.
- NEVER skip a medicine. NEVER combine two into one question.
- Keep counting. Do NOT move to step 3 until all {{medicine_count}} are covered.

STEP 3 — VITALS (only if applicable):
If has_glucometer=true or has_bp_monitor=true, ask if they checked today. Otherwise skip.

STEP 4 — WELLNESS:
Ask genuinely how they are feeling. Listen with real empathy. If they share a problem, respond with warmth and care. Ask if there is anything else on their mind.

STEP 5 — WARM CLOSING:
Tell them you have noted everything. Encourage them — they are doing great. Say a warm, caring goodbye. Ask them to disconnect the call.

RULES:
- ONE question per turn. After asking, STOP and WAIT.
- Speak slowly and clearly. Give them time to respond.
- Never give medical advice. For emergencies, say "please call your doctor or 108".
- Remember: EVERY word you speak must be in {{preferred_language}}.

═══════════════════════════════════════════════
DATA EXTRACTION — STRICT FORMAT
═══════════════════════════════════════════════
Use EXACT brand names from the medicines list above. During the call you may use local names, but when extracting data, ALWAYS map back to the original brand name.

CRITICAL — Listen carefully for TAKEN vs NOT TAKEN across all languages:

TAKEN (patient confirmed they took it):
- Hindi: haan, le liya, kha liya, li hai, liya tha, le li, kha li
- Telugu: veskunna, teeskunna, veskunnanu, thinna
- Tamil: eduthuten, eduthukitten, saptten, saapten
- Kannada: thogondidini, thogondenu
- Bengali: kheye niyechi, niyechi
- Marathi: ghetla, ghetli, khalla, khalli
- English: yes, taken, I took it

TAKEN ALL (patient says they took ALL medicines — mark EVERY medicine as "taken"):
- Hindi: sab le liya, saari le li, sab kha li, saare tablets le liye
- Telugu: anni veskunna, anni tablets veskunna, anni teeskunna, annee thinna
- Tamil: ellam eduthuten, ellam saapten, ellam eduthukitten
- Kannada: ella thogondidini, ella tablets thogondidini
- Bengali: sob kheye niyechi, sob niyechi
- Marathi: sagla ghetla, sagli ghetli
- English: took all, taken all, all taken, I took everything

NOT TAKEN (patient said no):
- Hindi: nahi, nahi liya, nahi li, bhool gaya, bhool gayi, nahi khayi
- Telugu: ledhu, veskoledhu, marchipoya, teeskoledhu, thinnaledhu
- Tamil: illa, edukala, marandhuten, saapidala
- Kannada: illa, thogondilla, marethidini
- Bengali: na, khaini, bhule gechi
- Marathi: nahi, ghetla nahi, visarlo
- English: no, didn't take, missed, forgot

NOT TIME YET (patient hasn't taken yet — mark as "not_taken"):
- Hindi: abhi time nahi hua, abhi raat nahi hui, baad mein lungi/lunga, raat ko lungi/lunga, woh toh raat ki hai, abhi nahi li
- Telugu: inka time kaale, inka time avvaledhu, tarvata vestanu, adi night tablet
- Tamil: innum time aagala, appuram edupeen, adhu night tablet
- Kannada: innu time aagilla, mele thogothini
- Bengali: ekhono shomoy hoyni, pore khabo
- Marathi: ajun time nahi zhala, nantar ghein
- English: not time yet, will take later, haven't taken yet, that's for night

RE-SCHEDULE (patient wants to be called later — mark re_scheduled as "true"):
- Hindi: baad mein call karo, abhi busy hoon, baad mein baat karo, phone rakhti hoon
- Telugu: tarvata call cheyandi, ippudu busy, tarvata cheyandi
- Tamil: appuram call pannunga, ippodhu busy, appuram pannunga
- Kannada: amele call maadi, iga busy
- Bengali: pore call korun, ekhon busy
- Marathi: nantar call kara, ata busy aahe
- English: call me later, I am busy, call back later, not now

- Ambiguous or unclear = unclear
Do NOT guess. If you are unsure, mark "unclear".
If patient says they took ALL medicines at once, mark EVERY medicine as "taken" — do not leave any as unclear.

- medicine_responses: "BrandName:taken" or "BrandName:not_taken" or "BrandName:unclear" for EACH medicine, comma-separated.
- vitals_checked: "yes", "no", or "not_applicable"
- wellness: "good", "okay", or "not_well"
- complaints: comma-separated list in English, or "none"
- re_scheduled: "true" if patient asked to call back later or said they are busy. "false" otherwise.`;
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
