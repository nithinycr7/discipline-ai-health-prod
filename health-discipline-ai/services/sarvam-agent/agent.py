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
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer

import httpx
from dotenv import load_dotenv
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli
from livekit.agents.voice import Agent, AgentSession, room_io
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
                model="saarika:v2.5",
            ),
            llm=google.LLM(
                model="gemini-2.5-flash",
                temperature=0.3,
            ),
            tts=sarvam.TTS(
                target_language_code=tts_lang,
                model="bulbul:v3",
                speaker="simran",  # Energetic, cheery female voice
            ),
        )


async def entrypoint(ctx: JobContext):
    """LiveKit agent entrypoint — called when a new room is dispatched."""
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for the SIP participant (patient) to connect
    logger.info(f"Room {ctx.room.name}: waiting for SIP participant to join...")
    remote_participants = list(ctx.room.remote_participants.values())
    if remote_participants:
        participant = remote_participants[0]
        logger.info(f"Participant already in room: {participant.identity}")
    else:
        participant = await ctx.wait_for_participant()
        logger.info(f"Participant joined: {participant.identity}")

    # Ensure we're subscribed to the participant's audio track
    for track_pub in participant.track_publications.values():
        logger.info(
            f"Track: sid={track_pub.sid}, kind={track_pub.kind}, "
            f"source={track_pub.source}, subscribed={track_pub.subscribed}"
        )
        if not track_pub.subscribed:
            track_pub.set_subscribed(True)
            logger.info(f"Manually subscribed to track {track_pub.sid}")

    # Wait a moment for subscription to complete
    await asyncio.sleep(1)

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
        vad=silero.VAD.load(),
    )

    # Event to signal session closure
    session_closed = asyncio.Event()

    # Track transcript via session events
    @session.on("conversation_item_added")
    def on_conversation_item(item):
        role = getattr(item, "role", "unknown")
        # Extract text content from the conversation item
        content = ""
        if hasattr(item, "text_content"):
            content = item.text_content
        elif hasattr(item, "content"):
            content = str(item.content)
        elif hasattr(item, "text"):
            content = item.text
        else:
            content = str(item)

        if role == "user":
            transcript.append({"role": "user", "message": content})
            logger.info(f"[STT] Patient said: {content}")
        elif role == "assistant":
            transcript.append({"role": "agent", "message": content})
            logger.info(f"[TTS] Agent said: {content}")

    @session.on("close")
    def on_close():
        logger.info("AgentSession closed")
        session_closed.set()

    # Start the session — explicitly link to the SIP participant's audio
    await session.start(
        agent=agent,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            participant_identity=participant.identity,
        ),
    )
    logger.info(f"AgentSession started (linked to {participant.identity}), sending greeting...")

    # Send first greeting
    first_message = build_first_message(patient_data)
    await session.say(first_message)
    transcript.append({"role": "agent", "message": first_message})
    logger.info(f"Greeting sent: {first_message}")

    # Wait for the call to end (session closes when patient hangs up or timeout)
    await session_closed.wait()

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
                        "re_scheduled": extracted.get("re_scheduled", "false"),
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


# --- Cloud Run health check server ---
# Cloud Run requires an HTTP endpoint. This runs in a background thread
# while the LiveKit agent worker runs in the main thread.

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok","service":"sarvam-agent-worker"}')

    def log_message(self, format, *args):
        pass  # Silence per-request logs


def start_health_server():
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    logger.info(f"Health check server listening on :{port}")
    server.serve_forever()


if __name__ == "__main__":
    # Start health check server in background thread (for Cloud Run)
    health_thread = threading.Thread(target=start_health_server, daemon=True)
    health_thread.start()

    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
