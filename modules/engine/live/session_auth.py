"""Authentication helpers for websocket-backed live sessions."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time

from fastapi import WebSocket

from config import settings


def _decode_base64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def verify_live_session_token(token: str) -> str:
    """Validate a short-lived HMAC token minted by the Next.js app."""
    if not settings.LIVE_SESSION_SECRET:
        raise ValueError("LIVE_SESSION_SECRET is not configured.")

    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError as exc:
        raise ValueError("Malformed live session token.") from exc

    expected_signature = hmac.new(
        settings.LIVE_SESSION_SECRET.encode("utf-8"),
        payload_part.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    received_signature = _decode_base64url(signature_part)

    if not hmac.compare_digest(expected_signature, received_signature):
        raise ValueError("Live session token signature is invalid.")

    try:
        payload = json.loads(_decode_base64url(payload_part).decode("utf-8"))
    except Exception as exc:
        raise ValueError("Live session token payload is invalid.") from exc

    uid = payload.get("uid")
    exp = payload.get("exp")

    if not uid or not isinstance(uid, str):
        raise ValueError("Live session token is missing a user id.")
    if not isinstance(exp, int) or exp <= int(time.time()):
        raise ValueError("Live session token has expired.")

    return uid


async def authenticate_websocket(websocket: WebSocket) -> str:
    """Authenticate the websocket using the signed live session token."""
    live_token = websocket.query_params.get("token")
    if not live_token:
        raise ValueError("Missing live session token.")

    return verify_live_session_token(live_token)
