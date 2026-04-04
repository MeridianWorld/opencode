import asyncio
import json
import logging
import sqlite3
import os
from typing import Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import httpx
from httpx_sse import aconnect_sse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def fetch_initial_sessions() -> Dict[str, Any]:
    """Fetch recent sessions from opencode database to initialize the dashboard"""
    home = os.path.expanduser("~")
    db_path = os.path.join(home, ".local", "share", "opencode", "opencode.db")

    sessions = {}
    if not os.path.exists(db_path):
        logger.warning(f"Opencode DB not found at {db_path}")
        return sessions

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Fetch 20 most recent sessions
        cursor.execute("SELECT * FROM session ORDER BY time_created DESC LIMIT 20")
        rows = cursor.fetchall()
        for row in rows:
            sid = row["id"]
            sessions[sid] = {
                "id": sid,
                "title": row["title"],
            }
        conn.close()
    except Exception as e:
        logger.error(f"Failed to read sessions from DB: {e}")

    return sessions


# State Store
class Store:
    def __init__(self):
        self.sessions: Dict[str, Any] = fetch_initial_sessions()
        self.messages: Dict[
            str, Dict[str, Any]
        ] = {}  # sessionID -> {messageID: message}
        self.parts: Dict[
            str, Dict[str, Dict[str, Any]]
        ] = {}  # sessionID -> {messageID: {partID: part}}
        self.events_timeline: List[Any] = []
        self.sse_status: Dict[str, Any] = {
            "connected": False,
            "last_error": None,
            "has_received_event": False,
            "last_connection_time": None,
        }

    def handle_event(self, event_type: str, props: dict):
        # Record timeline
        self.events_timeline.append(
            {
                "type": event_type,
                "properties": props,
                "timestamp": asyncio.get_event_loop().time(),
            }
        )
        if len(self.events_timeline) > 2000:
            self.events_timeline.pop(0)

        # Update State
        if event_type == "session.created" or event_type == "session.updated":
            info = props.get("info", {})
            sid = info.get("id")
            if sid:
                self.sessions[sid] = info
                if sid not in self.messages:
                    self.messages[sid] = {}
                if sid not in self.parts:
                    self.parts[sid] = {}

        elif event_type == "message.updated":
            info = props.get("info", {})
            sid = info.get("sessionID")
            mid = info.get("id")
            if sid and mid:
                if sid not in self.messages:
                    self.messages[sid] = {}
                self.messages[sid][mid] = info

        elif event_type == "message.removed":
            sid = props.get("sessionID")
            mid = props.get("messageID")
            if sid and mid and sid in self.messages:
                self.messages[sid].pop(mid, None)
                if sid in self.parts:
                    self.parts[sid].pop(mid, None)

        elif event_type == "message.part.updated":
            part = props.get("part", {})
            sid = part.get("sessionID")
            mid = part.get("messageID")
            pid = part.get("id")
            if sid and mid and pid:
                if sid not in self.parts:
                    self.parts[sid] = {}
                if mid not in self.parts[sid]:
                    self.parts[sid][mid] = {}
                self.parts[sid][mid][pid] = part

        elif event_type == "message.part.removed":
            sid = props.get("sessionID")
            mid = props.get("messageID")
            pid = props.get("partID")
            if sid and mid and pid and sid in self.parts and mid in self.parts[sid]:
                self.parts[sid][mid].pop(pid, None)

        elif event_type == "session.compacted":
            # Can trigger a special notification
            pass

    def update_sse_status(self, connected: bool, error: str | None = None):
        self.sse_status["connected"] = connected
        self.sse_status["last_error"] = error
        if connected:
            self.sse_status["last_connection_time"] = asyncio.get_event_loop().time()
        if not connected and error:
            logger.info(f"SSE status updated: connected={connected}, error={error}")
        # Broadcast status update to all connected clients
        asyncio.create_task(manager.broadcast_sse_status())

    def mark_event_received(self):
        if not self.sse_status["has_received_event"]:
            self.sse_status["has_received_event"] = True
            # Broadcast status update when first event is received
            asyncio.create_task(manager.broadcast_sse_status())


store = Store()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send initial state snapshot
        await websocket.send_json(
            {
                "type": "snapshot",
                "data": {
                    "sessions": store.sessions,
                    "messages": store.messages,
                    "parts": store.parts,
                    "timeline": store.events_timeline[-100:],  # Last 100 events
                    "sse_status": store.sse_status,
                },
            }
        )

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to websocket: {e}")

    async def broadcast_sse_status(self):
        await self.broadcast(
            {
                "type": "sse_status",
                "data": store.sse_status,
            }
        )


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def opencode_sse_client():
    url = "http://localhost:4096/event"
    logger.info(f"Connecting to opencode SSE stream at {url}...")

    async with httpx.AsyncClient() as client:
        while True:
            try:
                async with aconnect_sse(client, "GET", url) as event_source:
                    logger.info("Connected to opencode event stream")
                    store.update_sse_status(connected=True)

                    async for sse in event_source.aiter_sse():
                        if sse.data:
                            try:
                                payload = json.loads(sse.data)
                                event_type = payload.get("type")
                                properties = payload.get("properties", {})

                                # Ignore heartbeat noise if desired
                                if event_type == "server.heartbeat":
                                    continue

                                logger.info(f"Received event: {event_type}")
                                store.mark_event_received()
                                store.handle_event(event_type, properties)

                                # Broadcast to frontend
                                await manager.broadcast(
                                    {"type": "event", "data": payload}
                                )

                            except json.JSONDecodeError:
                                logger.error("Failed to parse SSE JSON data")
            except Exception as e:
                error_msg = str(e)
                logger.error(
                    f"SSE connection failed: {error_msg}. Retrying in 3 seconds..."
                )
                store.update_sse_status(connected=False, error=error_msg)
                await asyncio.sleep(3)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(opencode_sse_client())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
