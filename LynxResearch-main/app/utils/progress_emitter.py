# app/utils/progress_emitter.py

import asyncio
import json
import logging
from typing import AsyncGenerator
from datetime import datetime

logger = logging.getLogger(__name__)

# Global dict: run_id → asyncio.Queue
# The API SSE endpoint subscribes to these queues
_progress_queues: dict[str, asyncio.Queue] = {}


def get_or_create_queue(run_id: str) -> asyncio.Queue:
    if run_id not in _progress_queues:
        _progress_queues[run_id] = asyncio.Queue(maxsize=100)
    return _progress_queues[run_id]


def remove_queue(run_id: str):
    _progress_queues.pop(run_id, None)


async def emit_progress(run_id: str, stage: str, progress: int, message: str = ""):
    """
    Push a progress event into the run's queue.
    The SSE endpoint will pick this up and stream it to the frontend.
    """
    queue = get_or_create_queue(run_id)
    event = {
        "run_id": run_id,
        "stage": stage,
        "progress": progress,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
    }
    try:
        queue.put_nowait(event)
        logger.info(f"[{run_id}] {stage} — {progress}% — {message}")
    except asyncio.QueueFull:
        logger.warning(f"Progress queue full for run {run_id}, dropping event")


async def progress_event_generator(run_id: str) -> AsyncGenerator[str, None]:
    """
    SSE generator. FastAPI streams this to the frontend.
    Usage in route: return EventSourceResponse(progress_event_generator(run_id))
    """
    queue = get_or_create_queue(run_id)
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"data: {json.dumps(event)}\n\n"

                # Stop streaming when done or failed
                if event.get("stage") in ("done", "failed"):
                    break
            except asyncio.TimeoutError:
                # Heartbeat to keep connection alive
                yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
    finally:
        remove_queue(run_id)