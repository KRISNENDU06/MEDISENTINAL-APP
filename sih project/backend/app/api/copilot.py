"""AI Epidemiologist Copilot API Router."""
from typing import Annotated, Any
from fastapi import APIRouter, Body, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.areas import _frontend_area_summary
from app.db.session import get_db
from app.models.domain import Area
from app.services.ai_copilot import answer_epidemiologist_query

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/query")
def copilot_query(
    db: Annotated[Session, Depends(get_db)],
    payload: Annotated[dict[str, Any], Body()] = None,
) -> dict[str, Any]:
    payload = payload or {}
    query = str(payload.get("query", ""))
    selected_area_id = payload.get("selectedAreaId", "area-1")
    weights = payload.get("weights")

    areas = db.scalars(select(Area).order_by(Area.name)).all()
    summaries = [_frontend_area_summary(db, area) for area in areas]

    selected_summary = next(
        (s for s in summaries if s.get("id") == selected_area_id),
        summaries[0] if summaries else None,
    )

    return answer_epidemiologist_query(
        query=query,
        selected_area=selected_summary,
        all_areas=summaries,
        weights=weights,
    )

