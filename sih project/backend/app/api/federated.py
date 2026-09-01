from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.api.areas import invalidate_areas_cache
from app.api.dashboard import invalidate_dashboard_cache
from app.db.session import get_db
from app.models.domain import Area, Observation, Role, User
from app.services.audit import log_activity
from app.services.federated import node_status, process_local_node, simulate_federated_round
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/federated", tags=["federated"])


class FederatedSignalRequest(BaseModel):
    node_id: str = Field(min_length=1, max_length=64)
    area_name: str = Field(min_length=1, max_length=120)
    observed_on: date
    signals: dict[str, float]
    epsilon: float = Field(default=2.0, gt=0)


@router.get("/nodes")
def get_nodes(
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
) -> dict[str, Any]:
    nodes = node_status()
    return {"nodes": nodes, "total_nodes": len(nodes), "connected_nodes": sum(n["status"] == "CONNECTED" for n in nodes), "raw_records_shared": 0, "privacy_enabled": True}


@router.post("/process-local")
def process_local(
    payload: FederatedSignalRequest,
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
) -> dict[str, Any]:
    try:
        return process_local_node(payload.node_id, payload.area_name, payload.observed_on, payload.signals, payload.epsilon)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/simulate-round")
def simulate_round(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
    observed_on: date | None = None,
) -> dict[str, Any]:
    assessed_on = observed_on or date.today()
    result = simulate_federated_round(assessed_on)
    areas = {a.name.lower(): a for a in db.scalars(select(Area)).all()}
    inserted = 0
    for node in result["nodes"]:
        area = areas.get(node["area_name"].lower())
        if not area:
            continue
        for signal in node["signals"]:
            db.add(Observation(area_id=area.id, observed_on=assessed_on, signal_type=signal["signal_type"], category="federated", value=float(signal["noisy_value"]), source=f"federated:{node['node_id']}", data_quality_score=0.9))
            inserted += 1
    db.flush()
    assessments, generated_alerts = RiskEngine(db).run_for_all_areas(assessed_on)
    log_activity(db, action="FEDERATED_ROUND_RUN", details=f"{result['nodes_processed']} nodes, {inserted} noisy signals, {len(assessments)} areas assessed, {generated_alerts} alerts", user=current_user)
    db.commit()
    invalidate_areas_cache()
    invalidate_dashboard_cache()
    return {**result, "signals_ingested": inserted, "areas_assessed": len(assessments), "generated_alerts": generated_alerts, "risk_engine": "EXECUTED"}
