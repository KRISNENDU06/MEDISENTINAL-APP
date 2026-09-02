from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import require_roles
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
    suspected_cases: float = Field(ge=0)
    confirmed_cases: float = Field(ge=0)
    lab_positivity_rate: float = Field(ge=0, le=100)
    fever_presentations: float = Field(ge=0)
    respiratory_symptoms: float = Field(ge=0)
    gi_symptoms: float = Field(ge=0)
    opd_visits: float = Field(ge=0)
    hospital_admissions: float = Field(ge=0)
    emergency_visits: float = Field(ge=0)
    medicine_demand_level: str = Field(min_length=1, max_length=30)
    vector_activity_level: str = Field(min_length=1, max_length=30)
    environmental_contamination_level: str = Field(min_length=1, max_length=30)
    additional_observations: str = Field(default="", max_length=1000)
    action_or_verification_needed: str = Field(default="", max_length=1000)
    data_quality_score: float = Field(default=0.95, ge=0, le=1)

LEVEL_VALUES = {
    "BELOW_NORMAL": 0, "NORMAL": 15, "ELEVATED": 60, "VERY_HIGH": 100,
    "LOW": 0, "MODERATE": 35, "HIGH": 70, "CRITICAL": 100,
    "NONE": 0, "LOCALIZED": 35, "WIDESPREAD": 70, "SEVERE": 100,
}

def level_value(value: str) -> float:
    key = value.strip().upper().replace(" ", "_")
    if key not in LEVEL_VALUES:
        raise HTTPException(status_code=400, detail=f"Invalid assessment level: {value}")
    return LEVEL_VALUES[key]

@router.post("", status_code=201)
def create_provider_observation(
    payload: ProviderObservationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
):
    area = db.get(Area, payload.area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")

    medicine_level = level_value(payload.medicine_demand_level)
    vector_level = level_value(payload.vector_activity_level)
    environmental_level = level_value(payload.environmental_contamination_level)
    provider = current_user.provider_type or "GOVERNMENT_HEALTH_OFFICIAL"
    source = f"{provider}:{current_user.id}"
    category = f"disease:{payload.disease.strip().lower()}"

    signals = [
        ("reported_cases", payload.suspected_cases),
        ("confirmed_cases", payload.confirmed_cases),
        ("lab_positivity", payload.lab_positivity_rate),
        ("fever_cases", payload.fever_presentations),
        ("respiratory_symptoms", payload.respiratory_symptoms),
        ("gi_symptoms", payload.gi_symptoms),
        ("clinic_visits", payload.opd_visits),
        ("hospital_admissions", payload.hospital_admissions),
        ("emergency_visits", payload.emergency_visits),
        ("medicine_demand", medicine_level),
        ("vector_risk", vector_level),
        ("water_quality", environmental_level),
    ]
    if not any(value > 0 for _, value in signals):
        raise HTTPException(status_code=400, detail="Provide at least one surveillance observation")

    for signal_type, value in signals:
        db.add(Observation(area_id=area.id, observed_on=payload.observed_on, signal_type=signal_type, category=category, value=value, source=source, data_quality_score=payload.data_quality_score))

    notes = f"Additional observations: {payload.additional_observations.strip() or 'None provided'}. Action/verification needed: {payload.action_or_verification_needed.strip() or 'None specified'}."
    db.add(Observation(area_id=area.id, observed_on=payload.observed_on, signal_type="official_notes", category=category, value=0, source=source, data_quality_score=payload.data_quality_score))
    db.flush()
    assessments, generated_alerts = RiskEngine(db).run_for_all_areas(payload.observed_on)
    assessment = next((item for item in assessments if item.area_id == area.id), None)
    log_activity(db, action="PROVIDER_OBSERVATION_CREATED", details=f"{provider} uploaded 12 surveillance indicators for {payload.disease} in {area.name}. {notes}", user=current_user)
    db.commit()
    invalidate_dashboard_cache()
    return {"success": True, "message": f"12 surveillance indicators recorded for {area.name}. Risk engine recalculated.", "provider_type": provider, "disease": payload.disease, "area_id": area.id, "area_name": area.name, "assessment": {"risk_score": assessment.risk_score if assessment else None, "risk_level": assessment.risk_level.value if assessment else None, "medicine_score": assessment.medicine_score if assessment else None, "health_score": assessment.health_score if assessment else None, "persistence_score": assessment.persistence_score if assessment else None, "geographic_score": assessment.geographic_score if assessment else None, "confidence": assessment.confidence if assessment else None}, "generated_alerts": generated_alerts}
