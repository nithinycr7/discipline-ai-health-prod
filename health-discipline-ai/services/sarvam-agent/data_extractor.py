"""
Post-call data extraction using Gemini LLM.

After the voice call ends, this module takes the conversation transcript
and extracts structured data (medicine responses, vitals, wellness, complaints)
using a Gemini 1.5 Flash call.
"""

import json
import logging
import google.generativeai as genai

logger = logging.getLogger("data-extractor")

EXTRACTION_PROMPT = """Analyze this healthcare call transcript between a caretaker (Assistant) and an elderly patient (Patient).
Extract the following structured data:

1. medicine_responses: For each medicine discussed, record "medicine_name:taken" or "medicine_name:not_taken" or "medicine_name:unclear", comma-separated.
   - "taken" = patient confirmed they took it (haan, li hai, le li, yes, taken, etc.)
   - "not_taken" = patient said they missed it (nahi, bhool gayi, no, missed, etc.)
   - "unclear" = patient gave an ambiguous or unrelated answer
2. vitals_checked: Whether patient checked vitals today — "yes", "no", or "not_applicable"
3. wellness: Patient's overall state — "good" (happy, healthy, normal), "okay" (fine but not great), "not_well" (complaints, pain, low energy, sad)
4. complaints: Comma-separated list of any health complaints mentioned, or "none"

Transcript:
{transcript}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{{"medicine_responses": "...", "vitals_checked": "...", "wellness": "...", "complaints": "..."}}"""


async def extract_call_data(
    transcript: list[dict],
    api_key: str,
) -> dict:
    """
    Extract structured data from a call transcript using Gemini 1.5 Flash.

    Args:
        transcript: List of {role: 'agent'|'user', message: str}
        api_key: Google AI API key for Gemini

    Returns:
        Dict with medicine_responses, vitals_checked, wellness, complaints
    """
    transcript_text = "\n".join(
        f"{'Assistant' if t['role'] == 'agent' else 'Patient'}: {t['message']}"
        for t in transcript
    )

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")

        response = model.generate_content(
            EXTRACTION_PROMPT.format(transcript=transcript_text),
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=500,
            ),
        )

        result_text = response.text.strip()

        # Strip markdown fences if present
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1]
            if result_text.endswith("```"):
                result_text = result_text.rsplit("```", 1)[0]
            result_text = result_text.strip()

        return json.loads(result_text)

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        return {
            "medicine_responses": "",
            "vitals_checked": "unclear",
            "wellness": "unclear",
            "complaints": "none",
        }
    except Exception as e:
        logger.error(f"Data extraction failed: {e}")
        return {
            "medicine_responses": "",
            "vitals_checked": "unclear",
            "wellness": "unclear",
            "complaints": "none",
        }
