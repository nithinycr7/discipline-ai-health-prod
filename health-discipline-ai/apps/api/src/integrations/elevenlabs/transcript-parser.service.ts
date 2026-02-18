import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ParsedCallData {
  medicineResponses: Array<{ medicineName: string; response: string }>;
  vitalsChecked: string | null;
  wellness: string | null;
  complaints: string[];
  reScheduled: boolean;
}

/**
 * Post-call transcript parser using Gemini 2.0 Flash.
 *
 * Takes raw transcript + medicine list → structured extraction.
 * This is more reliable than ElevenLabs data_collection because the LLM
 * can understand nicknames, Hindi/Telugu words, and map them back to brand names.
 */
@Injectable()
export class TranscriptParserService {
  private readonly logger = new Logger(TranscriptParserService.name);
  private readonly apiKey: string;
  private readonly model = 'gemini-2.5-flash';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY', '');
  }

  async parseTranscript(
    transcript: string,
    medicines: Array<{ brandName: string; nickname?: string; timing: string }>,
  ): Promise<ParsedCallData | null> {
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_AI_API_KEY not configured, skipping LLM parse');
      return null;
    }

    if (!transcript || transcript.trim().length === 0) {
      return null;
    }

    const medicineList = medicines
      .map((m) => `${m.brandName} (${m.timing})${m.nickname ? ` — also called "${m.nickname}"` : ''}`)
      .join('\n');

    const prompt = `You are a medical call data extractor. Analyze this phone call transcript between an AI assistant and a patient. The call was about checking whether the patient took their medicines today.

MEDICINES LIST (use these EXACT brand names in output):
${medicineList}

TRANSCRIPT:
${transcript}

Extract the following as JSON. Use ONLY the brand names from the medicines list above — never nicknames, translations, or Hindi/Telugu words.

{
  "medicine_responses": [
    { "name": "<EXACT brand name>", "response": "taken" | "not_taken" | "unclear" }
  ],
  "vitals_checked": "yes" | "no" | "not_applicable",
  "wellness": "good" | "okay" | "not_well",
  "complaints": ["complaint1 in English"] or [],
  "re_scheduled": true | false
}

Rules:
- TAKEN: patient confirmed taking it
  Hindi: haan, le liya, kha liya, li hai, le li, kha li | Telugu: veskunna, teeskunna, thinna | Tamil: eduthuten, saapten | Kannada: thogondidini | Bengali: kheye niyechi | Marathi: ghetla, khalla | English: yes, taken
- TAKEN ALL: patient said they took ALL medicines → mark EVERY medicine as "taken"
  Hindi: sab le liya, saari le li, sab kha li | Telugu: anni veskunna, anni teeskunna | Tamil: ellam eduthuten, ellam saapten | Kannada: ella thogondidini | Bengali: sob kheye niyechi | Marathi: sagla ghetla | English: took all, all taken
- NOT TAKEN: patient said no or missed
  Hindi: nahi, nahi liya, bhool gaya, nahi khayi | Telugu: ledhu, veskoledhu, marchipoya | Tamil: illa, edukala, marandhuten | Kannada: illa, thogondilla | Bengali: na, khaini, bhule gechi | Marathi: nahi, ghetla nahi | English: no, missed, forgot
- NOT TIME YET → mark "not_taken" (they haven't taken it)
  Hindi: abhi time nahi hua, abhi raat nahi hui, baad mein lungi | Telugu: inka time kaale, tarvata vestanu | Tamil: innum time aagala, appuram edupeen | English: not time yet, will take later
- re_scheduled: true if patient asked to call back later or said they are busy
  Hindi: baad mein call karo, abhi busy hoon | Telugu: tarvata call cheyandi, ippudu busy | Tamil: appuram call pannunga, ippodhu busy | English: call me later, I am busy
- If unclear or not discussed, mark "unclear"
- Map nicknames to brand names: "BP tablet"/"BP ki goli" = Amlodipine, "sugar tablet"/"sugar ki goli" = Metformin, etc.
- vitals_checked: "not_applicable" if patient has no glucometer/BP monitor
- complaints: translate to English. "none" if no complaints
- Return ONLY valid JSON, no markdown or explanation`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
              responseMimeType: 'application/json',
            },
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`Gemini API error: ${response.status} - ${errText}`);
        return null;
      }

      const data: any = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        this.logger.warn('Gemini returned empty response');
        return null;
      }

      const parsed = JSON.parse(text);

      return {
        medicineResponses: (parsed.medicine_responses || []).map((m: any) => ({
          medicineName: m.name,
          response: this.normalizeResponse(m.response),
        })),
        vitalsChecked: parsed.vitals_checked || null,
        wellness: parsed.wellness || null,
        complaints: Array.isArray(parsed.complaints)
          ? parsed.complaints.filter((c: string) => c && c !== 'none')
          : [],
        reScheduled: parsed.re_scheduled === true || parsed.re_scheduled === 'true',
      };
    } catch (error: any) {
      this.logger.error(`Transcript parse error: ${error.message}`);
      return null;
    }
  }

  private normalizeResponse(response: string): string {
    const lower = (response || '').toLowerCase().trim();
    if (lower === 'taken' || lower === 'yes') return 'taken';
    if (lower === 'not_taken' || lower === 'missed' || lower === 'no') return 'missed';
    return 'unclear';
  }
}
