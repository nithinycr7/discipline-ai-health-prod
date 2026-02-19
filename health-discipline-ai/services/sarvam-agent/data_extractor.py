"""
Post-call data extraction using Gemini LLM (REST API).

After the voice call ends, this module takes the conversation transcript
and extracts structured data (medicine responses, vitals, wellness, complaints)
using a Gemini 2.5 Flash call via the REST API.

Uses httpx directly to avoid SDK dependency conflicts with livekit-plugins-sarvam.

Keep in sync with: apps/api/src/integrations/elevenlabs/elevenlabs-agent.service.ts (DATA EXTRACTION section)
"""

import json
import logging

import httpx

logger = logging.getLogger("data-extractor")

EXTRACTION_PROMPT = """Analyze this healthcare call transcript between a caretaker (Assistant) and an elderly patient (Patient).
Extract the following structured data:

1. medicine_responses: For each medicine discussed, record "medicine_name:taken" or "medicine_name:not_taken" or "medicine_name:unclear", comma-separated.

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
   - Hindi: abhi time nahi hua, abhi raat nahi hui, baad mein lungi/lunga, raat ko lungi/lunga, woh toh raat ki hai
   - Telugu: inka time kaale, inka time avvaledhu, tarvata vestanu, adi night tablet
   - Tamil: innum time aagala, appuram edupeen, adhu night tablet
   - Kannada: innu time aagilla, mele thogothini
   - Bengali: ekhono shomoy hoyni, pore khabo
   - Marathi: ajun time nahi zhala, nantar ghein
   - English: not time yet, will take later, haven't taken yet, that's for night

   Ambiguous or unclear = "unclear". Do NOT guess.
   If patient says they took ALL medicines at once, mark EVERY medicine as "taken" — do not leave any as unclear.

2. vitals_checked: Whether patient checked vitals today — "yes", "no", or "not_applicable"

3. wellness: Patient's overall state — "good" (happy, healthy, normal), "okay" (fine but not great), "not_well" (complaints, pain, low energy, sad)

4. complaints: Comma-separated list of any health complaints mentioned in English, or "none"

5. re_scheduled: "true" if patient asked to call back later or said they are busy:
   - Hindi: baad mein call karo, abhi busy hoon, phone rakhti hoon
   - Telugu: tarvata call cheyandi, ippudu busy
   - Tamil: appuram call pannunga, ippodhu busy
   - Kannada: amele call maadi, iga busy
   - Bengali: pore call korun, ekhon busy
   - Marathi: nantar call kara, ata busy aahe
   - English: call me later, I am busy, not now
   "false" otherwise.

Transcript:
{transcript}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{{"medicine_responses": "...", "vitals_checked": "...", "wellness": "...", "complaints": "...", "re_scheduled": "..."}}"""

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

FALLBACK = {
    "medicine_responses": "",
    "vitals_checked": "unclear",
    "wellness": "unclear",
    "complaints": "none",
    "re_scheduled": "false",
}


async def extract_call_data(
    transcript: list[dict],
    api_key: str,
) -> dict:
    """
    Extract structured data from a call transcript using Gemini 2.5 Flash REST API.

    Args:
        transcript: List of {role: 'agent'|'user', message: str}
        api_key: Google AI API key for Gemini

    Returns:
        Dict with medicine_responses, vitals_checked, wellness, complaints, re_scheduled
    """
    if not transcript:
        logger.warning("Empty transcript, skipping extraction")
        return FALLBACK.copy()

    transcript_text = "\n".join(
        f"{'Assistant' if t['role'] == 'agent' else 'Patient'}: {t['message']}"
        for t in transcript
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{GEMINI_API_URL}?key={api_key}",
                json={
                    "contents": [
                        {
                            "parts": [
                                {"text": EXTRACTION_PROMPT.format(transcript=transcript_text)}
                            ]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": 500,
                        "responseMimeType": "application/json",
                    },
                },
            )

        if response.status_code != 200:
            logger.error(f"Gemini API error {response.status_code}: {response.text[:300]}")
            return FALLBACK.copy()

        data = response.json()
        result_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        logger.info(f"Gemini raw response: {result_text[:200]}")

        # Strip markdown fences if present
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1]
            if result_text.endswith("```"):
                result_text = result_text.rsplit("```", 1)[0]
            result_text = result_text.strip()

        return json.loads(result_text)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        logger.error(f"Raw response was: {result_text[:300]}")
        return FALLBACK.copy()
    except Exception as e:
        logger.error(f"Data extraction failed: {e}")
        return FALLBACK.copy()
