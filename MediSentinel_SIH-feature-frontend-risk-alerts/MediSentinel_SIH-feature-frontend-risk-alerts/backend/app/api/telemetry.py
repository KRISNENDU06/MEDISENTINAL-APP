"""Live Telemetry Server-Sent Events (SSE) Router."""
import asyncio
import json
import random
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.get("/stream")
async def stream_telemetry():
    async def event_generator():
        areas = [
            {"id": "area-1", "name": "Ward 12 - Saheed Nagar", "baseRisk": 87},
            {"id": "area-2", "name": "Ward 07 - Patia Sector 3", "baseRisk": 54},
            {"id": "area-3", "name": "Ward 21 - Old Town", "baseRisk": 33},
            {"id": "area-4", "name": "Ward 15 - Khandagiri", "baseRisk": 40},
        ]
        while True:
            await asyncio.sleep(4.0)
            area = random.choice(areas)
            pharmacy_delta = random.randint(-5, 20)
            fever_delta = random.randint(-2, 8)

            payload = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "areaId": area["id"],
                "areaName": area["name"],
                "pharmacyDelta": pharmacy_delta,
                "feverDelta": fever_delta,
                "currentRisk": min(98, max(12, area["baseRisk"] + (2 if pharmacy_delta > 10 else -1))),
            }
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

