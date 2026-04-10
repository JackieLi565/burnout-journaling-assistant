"""Realtime Live API router."""

import contextlib

from fastapi import APIRouter, WebSocket

from live import LiveJournalProxy, authenticate_websocket

router = APIRouter(prefix="/live", tags=["live"])


@router.websocket("/journal")
async def journal_live_session(websocket: WebSocket):
    """Open an authenticated Gemini Live session for the active journal."""
    await websocket.accept()

    try:
        user_id = await authenticate_websocket(websocket)
    except ValueError as exc:
        await websocket.close(code=4401, reason=str(exc))
        return

    await websocket.send_json({"type": "authenticated", "userId": user_id})

    try:
        start_payload = await websocket.receive_json()
    except Exception:
        await websocket.close(code=4400, reason="Expected a start_session payload.")
        return

    if start_payload.get("type") != "start_session":
        await websocket.close(code=4400, reason="First message must be start_session.")
        return

    journal_date = str(start_payload.get("date") or "").strip()
    draft = str(start_payload.get("draft") or "")
    if not journal_date:
        await websocket.close(code=4400, reason="Missing journal date.")
        return

    proxy = LiveJournalProxy(
        user_id=user_id,
        journal_date=journal_date,
        draft=draft,
    )

    try:
        await proxy.run(websocket)
    finally:
        if websocket.client_state.name != "DISCONNECTED":
            with contextlib.suppress(RuntimeError):
                await websocket.close()
