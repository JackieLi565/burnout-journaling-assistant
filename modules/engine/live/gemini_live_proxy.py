"""Gemini Live websocket proxy for voice journaling."""

from __future__ import annotations

import asyncio
import base64
import contextlib
import json
import logging
from typing import AsyncIterator

from fastapi import WebSocket, WebSocketDisconnect
from google import genai
from google.genai import _transformers as t

from config import settings

try:
    from websockets.asyncio.client import ClientConnection
    from websockets.asyncio.client import connect
except ModuleNotFoundError:
    from websockets.client import ClientConnection
    from websockets.client import connect

logger = logging.getLogger(__name__)


class LiveJournalProxy:
    """Bridge browser audio and Gemini Live events for a journal session."""

    def __init__(self, *, user_id: str, journal_date: str, draft: str):
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured.")

        self.journal_date = journal_date
        self.draft = draft.strip()
        self.client = genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options={"api_version": "v1beta"},
        )

    def _resolve_model(self) -> str:
        return settings.GEMINI_LIVE_MODEL.strip()

    def _build_system_instruction(self) -> str:
        instruction = (
            "You are a supportive journaling coach for a burnout reflection app. "
            "Keep responses concise, warm, and grounded. "
            "Ask at most one follow-up question at a time. "
            "Do not diagnose, do not mention policies unless necessary, "
            "and focus on helping the user reflect on their day."
        )

        if self.draft:
            draft_preview = self.draft[:2000]
            instruction = (
                f"{instruction}\n\n"
                f"Current journal date: {self.journal_date}\n"
                f"Current draft context:\n{draft_preview}"
            )
        else:
            instruction = (
                f"{instruction}\n\n"
                f"Current journal date: {self.journal_date}"
            )

        return instruction

    def _build_setup_payload(self) -> dict[str, object]:
        api_client = self.client._api_client
        transformed_model = t.t_model(api_client, self._resolve_model())

        return {
            "setup": {
                "model": transformed_model,
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {
                                "voiceName": settings.GEMINI_LIVE_VOICE,
                            }
                        }
                    },
                },
                "systemInstruction": {
                    "role": "system",
                    "parts": [{"text": self._build_system_instruction()}],
                },
                "inputAudioTranscription": {},
                "outputAudioTranscription": {},
            }
        }

    @contextlib.asynccontextmanager
    async def _connect_live_session(self) -> AsyncIterator[ClientConnection]:
        api_client = self.client._api_client
        base_url = api_client._websocket_base_url()
        version = api_client._http_options["api_version"]
        api_key = api_client.api_key
        headers = api_client._http_options["headers"]
        uri = (
            f"{base_url}/ws/google.ai.generativelanguage.{version}."
            f"GenerativeService.BidiGenerateContent?key={api_key}"
        )

        async with connect(uri, additional_headers=headers) as ws:
            await ws.send(json.dumps(self._build_setup_payload()))
            raw_setup = await ws.recv(decode=False)
            setup_message = json.loads(raw_setup)

            if setup_message.get("setupComplete") is None:
                raise RuntimeError(
                    setup_message.get("error", {}).get("message")
                    or "Gemini Live setup failed."
                )

            yield ws

    async def _send_realtime_audio(self, *, live_ws: ClientConnection, audio_bytes: bytes) -> None:
        payload = {
            "realtimeInput": {
                "audio": {
                    "data": base64.b64encode(audio_bytes).decode("ascii"),
                    "mimeType": "audio/pcm;rate=16000",
                }
            }
        }
        await live_ws.send(json.dumps(payload))

    async def _send_audio_stream_end(self, *, live_ws: ClientConnection) -> None:
        payload = {
            "realtimeInput": {
                "audioStreamEnd": True,
            }
        }
        await live_ws.send(json.dumps(payload))

    async def run(self, websocket: WebSocket) -> None:
        """Open a Gemini Live session and proxy websocket traffic."""
        try:
            async with self._connect_live_session() as live_ws:
                await websocket.send_json({"type": "session_ready"})
                relay_task = asyncio.create_task(
                    self._relay_model_events(websocket=websocket, live_ws=live_ws)
                )

                try:
                    while True:
                        payload = await websocket.receive_json()
                        message_type = payload.get("type")

                        if message_type == "audio_chunk":
                            audio_base64 = str(payload.get("audio") or "")
                            if not audio_base64:
                                continue

                            audio_bytes = base64.b64decode(audio_base64)
                            await self._send_realtime_audio(
                                live_ws=live_ws,
                                audio_bytes=audio_bytes,
                            )
                        elif message_type == "audio_stream_end":
                            await self._send_audio_stream_end(live_ws=live_ws)
                        elif message_type == "stop_session":
                            break
                except WebSocketDisconnect:
                    logger.info("Live coach websocket disconnected.")
                finally:
                    relay_task.cancel()
                    with contextlib.suppress(asyncio.CancelledError):
                        await relay_task
        except Exception as exc:
            logger.exception("Gemini Live session failed during websocket proxy run.")
            with contextlib.suppress(RuntimeError):
                await websocket.send_json(
                    {
                        "type": "error",
                        "reason": f"Gemini Live session failed: {exc}",
                    }
                )

    async def _relay_model_events(
        self,
        *,
        websocket: WebSocket,
        live_ws: ClientConnection,
    ) -> None:
        """Forward Gemini Live session events to the browser."""
        while True:
            raw_response = await live_ws.recv(decode=False)
            if not raw_response:
                continue

            payload = json.loads(raw_response)
            server_content = payload.get("serverContent") or {}

            input_transcription = (
                payload.get("inputTranscription")
                or server_content.get("inputTranscription")
                or {}
            )
            if input_transcription.get("text"):
                await websocket.send_json(
                    {
                        "type": "input_transcript",
                        "text": input_transcription["text"],
                    }
                )

            output_transcription = (
                payload.get("outputTranscription")
                or server_content.get("outputTranscription")
                or {}
            )
            if output_transcription.get("text"):
                await websocket.send_json(
                    {
                        "type": "output_transcript",
                        "text": output_transcription["text"],
                    }
                )

            model_turn = server_content.get("modelTurn") or {}
            for part in model_turn.get("parts") or []:
                text = part.get("text")
                if text:
                    await websocket.send_json(
                        {
                            "type": "model_text",
                            "text": text,
                        }
                    )

                inline_data = part.get("inlineData") or {}
                mime_type = inline_data.get("mimeType", "")
                data = inline_data.get("data")
                if mime_type.startswith("audio/") and data:
                    await websocket.send_json(
                        {
                            "type": "output_audio_chunk",
                            "audio": data,
                            "mimeType": mime_type,
                        }
                    )

            if server_content.get("interrupted"):
                await websocket.send_json({"type": "interrupted"})

            if server_content.get("turnComplete"):
                await websocket.send_json({"type": "turn_complete"})
