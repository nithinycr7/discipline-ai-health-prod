"""
Sarvam AI Voice Agent Worker (LiveKit)

This is a long-running Python process that connects to LiveKit and handles
voice conversations using:
  - Sarvam STT (saaras:v3) for speech recognition
  - Gemini 2.5 Flash for LLM responses
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
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import google, sarvam

from prompt import build_system_prompt

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
                flush_signal=True,  # Emit speech start/end events for turn-taking
            ),
            llm=google.LLM(
                model="gemini-2.0-flash",  # 2.0 not 2.5 — avoids _thought token leak into TTS
                temperature=0.3,
            ),
            tts=sarvam.TTS(
                target_language_code=tts_lang,
                model="bulbul:v3",
                speaker="simran",  # Energetic, cheery female voice
                pace=0.95,  # Slightly slower for elderly patients on phone
            ),
        )

    async def on_enter(self):
        """Called when user joins — agent starts the conversation."""
        self.session.generate_reply()


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
    room_name = ctx.room.name  # Save before any variable shadowing

    if not call_id:
        logger.error("Room metadata missing callId, cannot proceed")
        return

    # Wait for the SIP participant (patient) to connect (60s timeout)
    logger.info(f"Room {room_name}: waiting for SIP participant to join...")
    remote_participants = list(ctx.room.remote_participants.values())
    if remote_participants:
        participant = remote_participants[0]
        logger.info(f"Participant already in room: {participant.identity}")
    else:
        try:
            participant = await asyncio.wait_for(
                ctx.wait_for_participant(), timeout=60
            )
            logger.info(f"Participant joined: {participant.identity}")
        except asyncio.TimeoutError:
            logger.warning(
                f"No participant joined room {room_name} within 60s — patient didn't answer. "
                f"callId={call_id}"
            )
            # POST no_answer webhook so backend can trigger retry
            if webhook_url:
                try:
                    async with httpx.AsyncClient(timeout=15) as client:
                        await client.post(webhook_url, json={
                            "callId": call_id,
                            "roomName": room_name,
                            "transcript": [],
                            "duration": 0,
                            "terminationReason": "no_answer",
                        })
                    logger.info(f"No-answer webhook sent for callId={call_id}")
                except Exception as e:
                    logger.error(f"Failed to send no-answer webhook: {e}")
            return

    logger.info(
        f"Starting call for patient {patient_data.get('patientName', '?')}, "
        f"callId={call_id}, room={room_name}"
    )

    # Track conversation transcript in real-time
    transcript: list[dict] = []
    call_start_time = time.time()

    # Create agent and session
    agent = MedicineCheckAgent(patient_data)
    session = AgentSession(
        # Use Sarvam STT-based turn detection (recommended by Sarvam docs)
        # Sarvam STT emits speech start/end events via flush_signal=True
        turn_detection="stt",
        # Tuned for elderly patients on phone calls:
        # - Higher interruption threshold to avoid false barge-ins from "hmm"/"haan"
        # - Longer endpointing delay since elderly patients pause more between words
        # - Resume speech if it was a false interruption (background noise, brief ack)
        min_interruption_duration=0.8,
        min_endpointing_delay=0.7,
        max_endpointing_delay=4.0,
        resume_false_interruption=True,
    )

    # Event to signal session closure
    session_closed = asyncio.Event()

    # Real-time transcript capture via conversation_item_added
    # This fires for BOTH user and agent messages when committed to chat history
    @session.on("conversation_item_added")
    def on_conversation_item(event):
        try:
            item = getattr(event, "item", event)
            role = getattr(item, "role", "")
            if role == "system":
                return

            text = ""
            content = getattr(item, "content", None)
            if isinstance(content, list):
                text = " ".join(
                    str(getattr(c, "text", ""))
                    for c in content
                    if hasattr(c, "text") and getattr(c, "text", None)
                ).strip()
            elif isinstance(content, str):
                text = content.strip()
            if not text and hasattr(item, "text"):
                text = str(item.text).strip()
            if not text and hasattr(item, "text_content"):
                tc = item.text_content
                text = (tc() if callable(tc) else str(tc)).strip()

            if text:
                mapped = "user" if role == "user" else "agent"
                transcript.append({"role": mapped, "message": text})
                logger.info(f"[transcript:{mapped}] {text[:100]}")
        except Exception as e:
            logger.error(f"conversation_item_added handler error: {e}")

    # Fallback: also capture user speech via user_input_transcribed
    last_user_speech_end = [0.0]  # Track when user stops speaking (for latency)

    @session.on("user_input_transcribed")
    def on_user_input(event):
        text = getattr(event, "transcript", "") or getattr(event, "text", "")
        is_final = getattr(event, "is_final", True)
        if text.strip() and is_final:
            last_user_speech_end[0] = time.time()
            logger.info(f"[STT] Patient said: {text}")

    # Latency instrumentation — log time from user speech end to agent speech start
    @session.on("agent_speech_started")
    def on_agent_speech_started(event):
        if last_user_speech_end[0] > 0:
            latency_ms = int((time.time() - last_user_speech_end[0]) * 1000)
            logger.info(f"[latency] STT→LLM→TTS: {latency_ms}ms")

    @session.on("close")
    def on_close():
        """Session closed — POST webhook synchronously before process exits.

        The LiveKit agent framework kills the process immediately after
        the entrypoint coroutine completes, so async POSTs never finish.
        Using sync httpx here ensures the webhook is sent before shutdown.
        """
        call_duration = int(time.time() - call_start_time)

        # Quick chat_ctx fallback for transcript (sync-safe)
        if not transcript:
            for _, source in [("agent", agent), ("session", session)]:
                chat_ctx = getattr(source, "chat_ctx", None) or getattr(
                    source, "_chat_ctx", None
                )
                if not chat_ctx:
                    continue
                try:
                    items = getattr(
                        chat_ctx, "items", getattr(chat_ctx, "messages", [])
                    )
                    for item in items:
                        role = getattr(item, "role", "")
                        if role == "system":
                            continue
                        text = ""
                        content = getattr(item, "content", None)
                        if isinstance(content, list):
                            text = " ".join(
                                str(getattr(c, "text", ""))
                                for c in content
                                if hasattr(c, "text") and getattr(c, "text", None)
                            ).strip()
                        elif isinstance(content, str):
                            text = content.strip()
                        if not text and hasattr(item, "text"):
                            text = str(item.text).strip()
                        if text:
                            mapped = "user" if role == "user" else "agent"
                            transcript.append({"role": mapped, "message": text})
                    if transcript:
                        break
                except Exception:
                    pass

        logger.info(
            f"AgentSession closed — callId={call_id}, duration={call_duration}s, "
            f"transcript_entries={len(transcript)}"
        )

        # Sync webhook POST — runs before process exits
        if webhook_url:
            try:
                with httpx.Client(timeout=15) as client:
                    resp = client.post(
                        webhook_url,
                        json={
                            "callId": call_id,
                            "roomName": room_name,
                            "transcript": transcript,
                            "duration": call_duration,
                            "terminationReason": "call_ended",
                        },
                    )
                logger.info(f"Webhook POST: status={resp.status_code}")
            except Exception as e:
                logger.error(f"Failed to POST webhook: {e}")
        else:
            logger.warning("No webhookUrl, skipping post-call report")

        session_closed.set()

    # Start the session — on_enter() will trigger generate_reply() for greeting
    await session.start(
        agent=agent,
        room=ctx.room,
    )
    logger.info("AgentSession started, agent will generate greeting via on_enter()")

    # Wait for the call to end (on_close posts webhook and sets this event)
    await session_closed.wait()


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
