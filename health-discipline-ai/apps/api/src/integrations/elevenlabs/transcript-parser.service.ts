import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ScreeningQuestionInput {
  questionId: string;
  question: string;
  dataType: string;
}

export interface ParsedCallData {
  medicineResponses: Array<{ medicineName: string; response: string }>;
  vitalsChecked: string | null;
  wellness: string | null;
  complaints: string[];
  reScheduled: boolean;
  skipToday: boolean;
  screeningAnswers: Array<{ questionId: string; answer: string; dataType: string }>;
}

/**
 * Post-call transcript parser using Gemini 2.5 Flash.
 *
 * Single source of truth for ALL post-call data extraction.
 * Takes raw transcript + medicine list + screening questions → structured JSON.
 * Used by both ElevenLabs and Sarvam webhook controllers.
 */
@Injectable()
export class TranscriptParserService {
  private readonly logger = new Logger(TranscriptParserService.name);
  private readonly apiKey: string;
  private readonly model = 'gemini-2.0-flash';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY', '');
  }

  async parseTranscript(
    transcript: string,
    medicines: Array<{ brandName: string; nickname?: string; timing: string }>,
    screeningQuestions?: ScreeningQuestionInput[],
  ): Promise<ParsedCallData | null> {
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_AI_API_KEY not configured, skipping LLM parse');
      return null;
    }

    if (!transcript || transcript.trim().length === 0) {
      return null;
    }

    const medicineList = medicines
      .map((m, i) => `  ${i + 1}. ${m.brandName} (${m.timing})${m.nickname ? ` — nickname: "${m.nickname}"` : ''}`)
      .join('\n');

    // Build screening questions section
    let screeningSection = '';
    let screeningJsonSchema = '';
    if (screeningQuestions && screeningQuestions.length > 0) {
      const questionList = screeningQuestions
        .map((q) => `  - ID: "${q.questionId}" | Type: ${q.dataType} | Question: "${q.question}"`)
        .join('\n');

      screeningSection = `
SCREENING QUESTIONS (asked during this call — extract patient's answers):
${questionList}

Answer format by data type:
  number_mgdl → numeric value as string, e.g. "120", "95"
  systolic_diastolic → "120/80" format
  yes_no → "yes" or "no"
  better_same_worse → "better", "same", or "worse"
  good_okay_low → "good", "okay", or "low"
  not_discussed → question was skipped or patient didn't answer`;

      screeningJsonSchema = `,
  "screening_answers": [
    { "question_id": "<exact ID from above>", "answer": "<extracted answer or not_discussed>" }
  ]`;
    }

    const prompt = `You are a multilingual medical transcript analyst. Your job is to extract structured data from a phone call between an AI health companion ("Assistant") and an elderly patient ("Patient") in India.

The call's purpose: check whether the patient took their prescribed medicines today, ask about vitals, and note any health complaints.

MEDICINES PRESCRIBED (use these EXACT brand names in your output — never nicknames or translations):
${medicineList}

TRANSCRIPT:
${transcript}
${screeningSection}

OUTPUT FORMAT — return ONLY this JSON, no explanation:
{
  "medicine_responses": [
    { "name": "<EXACT brand name from list>", "response": "taken" | "not_taken" | "unclear" }
  ],
  "vitals_checked": "yes" | "no" | "not_applicable",
  "wellness": "good" | "okay" | "not_well",
  "complaints": ["<complaint in English>"] or [],
  "re_scheduled": true | false,
  "skip_today": true | false${screeningJsonSchema}
}

EXTRACTION RULES:

1. MEDICINE RESPONSES — classify each medicine into exactly one category:

   TAKEN — patient confirms they took it:
     Hindi: haan, le liya, le li, kha liya, kha li, li hai, liya hai, liya tha, kha li thi
     Telugu: veskunna, veskunnanu, teeskunna, thinna, teeskunnanu
     Tamil: eduthuten, eduthukitten, saapten, saappittein
     Kannada: thogondidini, thogondenu, thogothini
     Bengali: kheye niyechi, niyechi, kheyelam
     Marathi: ghetla, ghetli, khalla, khalli
     English: yes, taken, I took it, had it, done

   TAKEN ALL — patient says they took ALL medicines at once → mark EVERY medicine as "taken":
     Hindi: sab le liya, saari le li, sab kha li, saare le liye, sab ho gaya
     Telugu: anni veskunna, anni teeskunna, annee thinna, antha ayyindi
     Tamil: ellam eduthuten, ellam saapten, ellam eduthukitten
     Kannada: ella thogondidini, ella tablets thogondidini
     Bengali: sob kheye niyechi, sob niyechi
     Marathi: sagla ghetla, sagli ghetli, sagla khalla
     English: took all, all taken, took everything, all done, yes all of them

   NOT TAKEN — patient missed or forgot:
     Hindi: nahi, nahi liya, nahi li, bhool gaya, bhool gayi, nahi khayi, nahi khaya
     Telugu: ledhu, veskoledhu, marchipoya, teeskoledhu, thinnaledhu
     Tamil: illa, edukala, marandhuten, saapidala, edukkalai
     Kannada: illa, thogondilla, marethidini
     Bengali: na, khaini, bhule gechi, khaini to
     Marathi: nahi, ghetla nahi, visarlo, khalla nahi
     English: no, missed, forgot, didn't take, haven't taken

   NOT TIME YET — medicine is for later (night/evening) → mark as "not_taken":
     Hindi: abhi time nahi hua, baad mein lungi, raat ko lungi, woh toh raat ki hai, abhi nahi
     Telugu: inka time kaale, tarvata vestanu, adi night tablet, inka time avvaledhu
     Tamil: innum time aagala, appuram edupeen, adhu night tablet
     Kannada: innu time aagilla, mele thogothini
     Bengali: ekhono shomoy hoyni, pore khabo
     Marathi: ajun time nahi zhala, nantar ghein
     English: not time yet, will take later, that's for night, evening one not yet

   UNCLEAR — not discussed, ambiguous, or you can't determine → "unclear"

   IMPORTANT:
   - If patient says "all taken" / "sab le liya", mark EVERY medicine as "taken"
   - Map nicknames to brand names: "BP ki goli" / "BP tablet" → the BP medicine in the list; "sugar ki goli" → Metformin/diabetes medicine
   - One medicine, one response. Include ALL medicines from the list, even if not discussed (mark those "unclear")

2. VITALS:
   - "yes" if patient said they checked BP/sugar/glucose today
   - "no" if they have the device but didn't check
   - "not_applicable" if no glucometer and no BP monitor, or vitals not discussed

3. WELLNESS — patient's overall mood/state during the call:
   - "good" — cheerful, happy, normal, fine, feeling well
   - "okay" — neutral, so-so, not great but not bad, theek hai, chalra hai
   - "not_well" — complaints, pain, tiredness, sadness, low energy, worried

4. COMPLAINTS — any health issues mentioned by the patient:
   - Translate to English: "sar mein dard" → "headache", "bukhar" → "fever"
   - Empty array [] if no complaints or patient said "sab theek hai"
   - Don't include "didn't take medicine" as a complaint

5. RE_SCHEDULED:
   - true if patient asked to be called back later or said they're busy
     Hindi: baad mein call karo, abhi busy hoon, baad mein baat karte hain
     Telugu: tarvata call cheyandi, ippudu busy
     Tamil: appuram call pannunga, ippodhu busy
     Kannada: amele call maadi, iga busy
     Bengali: pore call korun, ekhon busy
     Marathi: nantar call kara, ata busy aahe
     English: call me later, I'm busy, not now, call back
   - false otherwise

6. SKIP_TODAY — patient explicitly asked NOT to be called again today (different from re_scheduled):
   - true if patient said:
     Hindi: aaj mat karo, aaj nahi chahiye, aaj chhod do, aaj band karo
     Telugu: ee roju vaddu, ee roju call cheyakandi
     Tamil: innikku vendaam, innikku call pannaadheenga
     Kannada: ivattu beda, ivattu call maadabedi
     Bengali: aaj korben na, aaj darkar nei
     Marathi: aaj nako, aaj call karu naka
     English: don't call today, not today, skip today, no calls today
   - false otherwise
   - If both re_scheduled and skip_today seem true, prefer skip_today (patient doesn't want any more calls today)

Return ONLY valid JSON.`;

    let rawText = '';
    try {
      // Retry with exponential backoff for 429 rate limit errors
      const maxRetries = 3;
      let response: Response | null = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json',
              },
            }),
          },
        );

        if (response.status !== 429 || attempt === maxRetries) break;

        const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000); // 1s, 2s, 4s
        this.logger.warn(`Gemini 429 rate limit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delayMs));
      }

      if (!response!.ok) {
        const errText = await response!.text();
        this.logger.error(`Gemini API error: ${response!.status} - ${errText}`);
        return null;
      }

      const data: any = await response!.json();
      const finishReason = data.candidates?.[0]?.finishReason || 'unknown';
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      this.logger.log(`Gemini finishReason=${finishReason}, responseLength=${rawText.length}`);

      if (!rawText) {
        this.logger.warn('Gemini returned empty response');
        this.logger.debug(`Full Gemini response: ${JSON.stringify(data).slice(0, 500)}`);
        return null;
      }

      this.logger.log(`Gemini raw response (${rawText.length} chars): ${rawText.slice(0, 300)}`);

      // Strip markdown code fences if present (```json ... ```)
      let cleanText = rawText.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.split('\n').slice(1).join('\n');
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.slice(0, cleanText.lastIndexOf('```'));
        }
        cleanText = cleanText.trim();
      }

      const parsed = JSON.parse(cleanText);

      // Map screening answers back with their dataType
      const screeningAnswers: Array<{ questionId: string; answer: string; dataType: string }> = [];
      if (parsed.screening_answers && screeningQuestions) {
        for (const sa of parsed.screening_answers) {
          const qDef = screeningQuestions.find((q) => q.questionId === sa.question_id);
          if (qDef && sa.answer && sa.answer !== 'not_discussed') {
            screeningAnswers.push({
              questionId: sa.question_id,
              answer: sa.answer,
              dataType: qDef.dataType,
            });
          }
        }
      }

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
        skipToday: parsed.skip_today === true || parsed.skip_today === 'true',
        screeningAnswers,
      };
    } catch (error: any) {
      this.logger.error(`Transcript parse error: ${error.message}`);
      if (error instanceof SyntaxError && rawText) {
        this.logger.error(`Raw Gemini text that failed to parse: ${rawText.slice(0, 500)}`);
      }
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
