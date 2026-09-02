from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import require_authenticated_roles
from app.api.dashboard import invalidate_dashboard_cache
from app.db.session import get_db
from app.models.domain import Area, Observation, Role, User
from app.services.audit import log_activity
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/provider-observations", tags=["provider-data"])


class ProviderObservationCreate(BaseModel):
    area_id: int = Field(gt=0)
    observed_on: date
    disease: str = Field(min_length=2, max_length=80)
    medicine_demand: float = Field(default=0, ge=0)
    fever_cases: float = Field(default=0, ge=0)
    clinic_visits: float = Field(default=0, ge=0)
    data_quality_score: float = Field(default=0.95, ge=0, le=1)


@router.post("", status_code=201)
def create_provider_observation(
    payload: ProviderObservationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_authenticated_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
):
    area = db.get(Area, payload.area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    provider = current_user.provider_type or "GOVERNMENT_HEALTH_OFFICIAL"
    source = provider
    category = f"disease:{payload.disease.strip().lower()}"
    signals = [("medicine_demand", payload.medicine_demand), ("fever_cases", payload.fever_cases), ("clinic_visits", payload.clinic_visits)]
    if not any(value > 0 for _, value in signals):
        raise HTTPException(status_code=400, detail="Enter at least one numeric health signal")

    created = 0
    for signal_type, value in signals:
        if value <= 0:
            continue
        db.add(Observation(area_id=area.id, observed_on=payload.observed_on, signal_type=signal_type, category=category, value=value, source=source, data_quality_score=payload.data_quality_score))
        created += 1

    db.flush()
    assessments, generated_alerts = RiskEngine(db).run_for_all_areas(payload.observed_on)
    assessment = next((item for item in assessments if item.area_id == area.id), None)
    log_activity(db, action="PROVIDER_OBSERVATION_CREATED", details=f"{provider} uploaded {created} {payload.disease} signals for {area.name}", user=current_user)
    db.commit()
    invalidate_dashboard_cache()

    return {
        "success": True,
        "message": f"{created} health signal(s) recorded for {area.name}. Risk engine recalculated.",
        "provider_type": provider,
        "disease": payload.disease,
        "area_id": area.id,
        "area_name": area.name,
        "assessment": {
            "risk_score": assessment.risk_score if assessment else None,
            "risk_level": assessment.risk_level.value if assessment else None,
            "medicine_score": assessment.medicine_score if assessment else None,
            "health_score": assessment.health_score if assessment else None,
            "persistence_score": assessment.persistence_score if assessment else None,
            "geographic_score": assessment.geographic_score if assessment else None,
            "confidence": assessment.confidence if assessment else None,
        },
        "generated_alerts": generated_alerts,
    }
