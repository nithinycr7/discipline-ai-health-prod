"""
Sarvam AI Voice Agent Worker (LiveKit)

This is a long-running Python process that connects to LiveKit and handles
voice conversations using:
  - Sarvam STT (saaras:v3) for speech recognition
  - Gemini 1.5 Flash for LLM responses
  - Sarvam TTS (bulbul:v3) for speech synthesis

When the NestJS API creates a LiveKit room with patient metadata,
this worker picks it up, conducts the medicine-check conversation,
and POSTs results back to the NestJS webhook.

Usage:
  python agent.py dev        # Development mode
  python agent.py console    # Console test mode (no phone call)
"""

import asyncio
import json
import logging
import os
import time

import httpx
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import google, sarvam, silero

from data_extractor import extract_call_data
from prompt import build_first_message, build_system_prompt

load_dotenv()

logger = logging.getLogger("sarvam-agent")
logger.setLevel(logging.INFO)

# Language code to Sarvam TTS language code mapping
SARVAM_LANG_MAP = {
    "hi": "hi-IN",
    "te": "te-IN",
    "ta": "ta-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "bn": "bn-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "pa": "pa-IN",
    "en": "en-IN",
}

# Sarvam STT language code mapping
SARVAM_STT_LANG_MAP = {
    "hi": "hi-IN",
    "te": "te-IN",
    "ta": "ta-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "bn": "bn-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "pa": "pa-IN",
    "en": "en-IN",
}


class MedicineCheckAgent(Agent):
    """Voice agent that checks medicine intake for elderly patients."""

    def __init__(self, patient_data: dict) -> None:
        lang_code = patient_data.get("preferredLanguage", "hi")
        tts_lang = SARVAM_LANG_MAP.get(lang_code, "hi-IN")
        stt_lang = SARVAM_STT_LANG_MAP.get(lang_code, "unknown")

        super().__init__(
            instructions=build_system_prompt(patient_data),
            stt=sarvam.STT(
                language=stt_lang,
                model="saaras:v3",
                mode="transcribe",
            ),
            llm=google.LLM(
                model="gemini-1.5-flash",
                temperature=0.3,
            ),
            tts=sarvam.TTS(
                target_language_code=tts_lang,
                model="bulbul:v3",
                speaker="meera",  # Female Indian voice
            ),
        )


async def entrypoint(ctx: JobContext):
    """LiveKit agent entrypoint — called when a new room is dispatched."""
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Read patient metadata from room (set by NestJS SarvamAgentService)
    metadata_str = ctx.room.metadata or "{}"
    try:
        patient_data = json.loads(metadata_str)
    except json.JSONDecodeError:
        logger.error(f"Invalid room metadata: {metadata_str}")
        return

    call_id = patient_data.get("callId")
    webhook_url = patient_data.get("webhookUrl")

    if not call_id:
        logger.error("Room metadata missing callId, cannot proceed")
        return

    logger.info(
        f"Starting call for patient {patient_data.get('patientName', '?')}, "
        f"callId={call_id}, room={ctx.room.name}"
    )

    # Track conversation
    transcript: list[dict] = []
    call_start_time = time.time()

    # Create agent and session
    agent = MedicineCheckAgent(patient_data)
    session = AgentSession(
        turn_detection="stt",
        min_endpointing_delay=0.07,  # Sarvam STT latency compensation
    )

    # Track transcript via session events
    @session.on("user_speech_committed")
    def on_user_speech(msg):
        transcript.append({"role": "user", "message": msg.content})
        logger.debug(f"Patient: {msg.content}")

    @session.on("agent_speech_committed")
    def on_agent_speech(msg):
        transcript.append({"role": "agent", "message": msg.content})
        logger.debug(f"Agent: {msg.content}")

    # Start the session
    await session.start(agent=agent, room=ctx.room)

    # Send first greeting
    first_message = build_first_message(patient_data)
    await session.say(first_message)
    transcript.append({"role": "agent", "message": first_message})

    # Wait for the call to end (room closes when patient hangs up or timeout)
    # LiveKit handles this automatically via room empty_timeout
    await session.wait_for_close()

    call_duration = int(time.time() - call_start_time)

    logger.info(
        f"Call ended for callId={call_id}, duration={call_duration}s, "
        f"transcript_entries={len(transcript)}"
    )

    # Extract structured data from transcript using Gemini
    google_api_key = os.environ.get("GOOGLE_API_KEY", "")
    extracted = await extract_call_data(transcript, google_api_key)

    logger.info(f"Extracted data: {extracted}")

    # POST results to NestJS webhook
    if webhook_url:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(
                    webhook_url,
                    json={
                        "callId": call_id,
                        "roomName": ctx.room.name,
                        "transcript": transcript,
                        "medicineResponses": extracted.get("medicine_responses", ""),
                        "vitalsChecked": extracted.get("vitals_checked", ""),
                        "wellness": extracted.get("wellness", ""),
                        "complaints": extracted.get("complaints", "none"),
                        "duration": call_duration,
                        "terminationReason": "call_ended",
                    },
                )
                logger.info(
                    f"Webhook POST to {webhook_url}: status={response.status_code}"
                )
        except Exception as e:
            logger.error(f"Failed to POST webhook: {e}")
    else:
        logger.warn("No webhookUrl in metadata, skipping post-call report")


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
