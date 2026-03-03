"""
Sarvam AI Voice Agent Worker (LiveKit)

This is a long-running Python process that connects to LiveKit and handles
voice conversations using:
  - Sarvam STT (saaras:v3) for speech recognition
  - Google Gemini 2.0 Flash for LLM responses (real-time conversation)
  - Sarvam TTS (bulbul:v3) for speech synthesis
  - Sarvam 105B for POST-CALL data extraction (via data_extractor.py)

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
import re
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
    """Voice agent that checks medicine intake for elderly patients.

    Uses:
    - Sarvam STT (saaras:v3) for speech recognition
    - Google Gemini 2.0 Flash for LLM responses (conversation)
    - Sarvam TTS (bulbul:v3) for speech synthesis
    - Sarvam 105B for POST-CALL data extraction (via data_extractor.py)
    """

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
                model="gemini-2.0-flash",  # ~280ms TTFT, excellent Indian language support
                temperature=0.3,
            ),
            tts=sarvam.TTS(
                target_language_code=tts_lang,
                model="bulbul:v3",
                speaker="simran",  # Energetic, cheery female voice
                pace=0.95,  # Slightly slower for elderly patients on phone
                speech_sample_rate=8000,  # 8kHz — matches telephony codec, smaller chunks = faster streaming
                enable_preprocessing=True,  # Normalize numbers/abbreviations before synthesis
            ),
        )

    async def on_enter(self):
        """Called when user joins — agent starts the conversation."""
        self.session.generate_reply()

    async def llm_node(self, chat_ctx, tools, model_settings):
        """Override LLM node to strip markdown/emoji from output before TTS.

        Gemini sometimes returns **bold**, *italic*, #headings, or emoji that
        Sarvam TTS can't synthesize — producing silence or garbled audio.
        Cleaning the text here prevents 'no audio frames' and cutoff issues.
        """
        async for event in Agent.default.llm_node(self, chat_ctx, tools, model_settings):
            if hasattr(event, "text") and event.text:
                cleaned = event.text
                cleaned = re.sub(r"[*_#`~>|]", "", cleaned)  # strip markdown chars
                cleaned = re.sub(  # strip emoji
                    r"[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF"
                    r"\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF"
                    r"\U00002702-\U000027B0\U0000FE00-\U0000FE0F"
                    r"\U0001F900-\U0001F9FF\U0001FA00-\U0001FA6F]+",
                    "", cleaned,
                )
                if cleaned.strip():
                    event.text = cleaned
                    yield event
            else:
                yield event


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
        # --- Endpointing (latency-sensitive) ---
        # In STT mode, min_endpointing_delay is ADDITIVE with Sarvam STT's own
        # end-of-speech signal (~70ms). 0.3s + 70ms = ~370ms — still generous for
        # elderly patients but 400ms faster than the previous 0.7s setting.
        min_endpointing_delay=0.3,
        max_endpointing_delay=3.5,
        # --- Interruption handling (fixes audio cutoff) ---
        # min_interruption_duration: require 800ms of speech to count as interruption
        # min_interruption_words: require 2+ transcribed words — prevents "hmm"/"haan"/
        #   coughs/background noise from killing the TTS stream mid-sentence
        min_interruption_duration=0.8,
        min_interruption_words=2,
        # Resume playback if the interruption turns out to be false (noise, brief ack)
        resume_false_interruption=True,
        false_interruption_timeout=2.0,
        # --- Preemptive generation (biggest latency win) ---
        # Starts LLM+TTS inference WHILE the endpointing timer is still running.
        # If the user continues speaking, the speculative response is discarded.
        # Saves 200-400ms of LLM TTFT by overlapping it with the silence detection.
        preemptive_generation=True,
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
