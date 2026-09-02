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
    area_id:int=Field(gt=0); observed_on:date; disease:str=Field(min_length=2,max_length=80)
    suspected_cases:float=Field(default=0,ge=0); confirmed_cases:float=Field(default=0,ge=0); lab_positivity_rate:float=Field(default=0,ge=0,le=100); fever_presentations:float=Field(default=0,ge=0); respiratory_symptoms:float=Field(default=0,ge=0); gi_symptoms:float=Field(default=0,ge=0); opd_visits:float=Field(default=0,ge=0); hospital_admissions:float=Field(default=0,ge=0); emergency_visits:float=Field(default=0,ge=0)
    medicine_demand_level:str=Field(default="NORMAL",max_length=30); vector_activity_level:str=Field(default="LOW",max_length=30); environmental_contamination_level:str=Field(default="NONE",max_length=30); additional_observations:str=Field(default="",max_length=1000); action_or_verification_needed:str=Field(default="",max_length=1000); data_quality_score:float=Field(default=.95,ge=0,le=1)
    medicine_demand:float=Field(default=0,ge=0); medicine_sales:float=Field(default=0,ge=0); pharmacy_demand:float=Field(default=0,ge=0); fever_cases:float=Field(default=0,ge=0); clinic_visits:float=Field(default=0,ge=0); reported_cases:float=Field(default=0,ge=0); suspected_vector_cases:float=Field(default=0,ge=0); water_contamination:float=Field(default=0,ge=0)
LEVEL_VALUES={"BELOW_NORMAL":0,"NORMAL":15,"ELEVATED":60,"VERY_HIGH":100,"LOW":0,"MODERATE":35,"HIGH":70,"CRITICAL":100,"NONE":0,"LOCALIZED":35,"WIDESPREAD":70,"SEVERE":100}
def level_value(value:str)->float:
    key=value.strip().upper().replace(" ","_")
    if key not in LEVEL_VALUES: raise HTTPException(400,f"Invalid assessment level: {value}")
    return LEVEL_VALUES[key]
@router.post("",status_code=201)
def create_provider_observation(payload:ProviderObservationCreate,db:Annotated[Session,Depends(get_db)],current_user:Annotated[User,Depends(require_roles(Role.ADMIN,Role.HEALTH_OFFICIAL))]):
    area=db.get(Area,payload.area_id)
    if not area: raise HTTPException(404,"Area not found")
    provider=current_user.provider_type or "GOVERNMENT_HEALTH_OFFICIAL"; source=f"{provider}:{current_user.id}"; category=f"disease:{payload.disease.strip().lower()}"
    medicine=level_value(payload.medicine_demand_level); vector=level_value(payload.vector_activity_level); environment=level_value(payload.environmental_contamination_level)
    signals=[("reported_cases",payload.suspected_cases),("confirmed_cases",payload.confirmed_cases),("lab_positivity",payload.lab_positivity_rate),("fever_cases",payload.fever_presentations),("respiratory_symptoms",payload.respiratory_symptoms),("gi_symptoms",payload.gi_symptoms),("clinic_visits",payload.opd_visits),("hospital_admissions",payload.hospital_admissions),("emergency_visits",payload.emergency_visits),("medicine_demand",medicine),("vector_risk",vector),("water_quality",environment)]
    legacy=[("medicine_demand",payload.medicine_demand),("medicine_sales",payload.medicine_sales),("pharmacy_demand",payload.pharmacy_demand),("fever_cases",payload.fever_cases),("clinic_visits",payload.clinic_visits),("reported_cases",payload.reported_cases),("suspected_vector_cases",payload.suspected_vector_cases),("water_quality",payload.water_contamination)]
    if any(x>0 for _,x in legacy): signals=legacy
    if not any(x>0 for _,x in signals) and not payload.additional_observations.strip() and not payload.action_or_verification_needed.strip(): raise HTTPException(400,"Provide at least one surveillance observation or professional note.")
    for signal_type,value in signals:
        db.add(Observation(area_id=area.id,observed_on=payload.observed_on,signal_type=signal_type,category=category,value=value,source=source,data_quality_score=payload.data_quality_score))
    if payload.additional_observations.strip() or payload.action_or_verification_needed.strip(): db.add(Observation(area_id=area.id,observed_on=payload.observed_on,signal_type="official_notes",category=category,value=0,source=source,data_quality_score=payload.data_quality_score))
    db.flush(); assessments,generated_alerts=RiskEngine(db).run_for_all_areas(payload.observed_on); assessment=next((x for x in assessments if x.area_id==area.id),None)
    log_activity(db,action="PROVIDER_OBSERVATION_CREATED",details=f"{provider} uploaded official surveillance information for {payload.disease} in {area.name}",user=current_user); db.commit(); invalidate_dashboard_cache()
    return {"success":True,"message":f"Official information recorded for {area.name}. Risk engine recalculated.","provider_type":provider,"disease":payload.disease,"area_id":area.id,"area_name":area.name,"one_upload_per_day":False,"assessment":{"risk_score":assessment.risk_score if assessment else None,"risk_level":assessment.risk_level.value if assessment else None,"medicine_score":assessment.medicine_score if assessment else None,"health_score":assessment.health_score if assessment else None,"persistence_score":assessment.persistence_score if assessment else None,"geographic_score":assessment.geographic_score if assessment else None,"confidence":assessment.confidence if assessment else None},"generated_alerts":generated_alerts}
