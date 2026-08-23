"""Outbreak Simulation API Router."""
from typing import Annotated, Any
from fastapi import APIRouter, Body, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import Area
from app.services.simulation_engine import (
    DISEASE_ARCHETYPES,
    INTERVENTIONS,
    simulate_outbreak_step,
    simulate_what_if,
)

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.post("/what-if")
def run_what_if_simulation(
    payload: Annotated[dict[str, Any], Body()] = None,
) -> dict[str, Any]:
    payload = payload or {}
    return simulate_what_if(
        med_spike_pct=float(payload.get("medicineDemandSpike", payload.get("medSpikePct", 24.6))),
        fever_spike_pct=float(payload.get("feverCasesSpike", payload.get("feverSpikePct", 18.9))),
        clinic_spike_pct=float(payload.get("clinicVisitsSpike", payload.get("clinicSpikePct", 15.0))),
        spread_neighbors=int(payload.get("geographicSpread", payload.get("spreadNeighbors", 2))),
        persistence_weeks=int(payload.get("persistenceWeeks", 2)),
        archetype=str(payload.get("archetype", "DENGUE")),
        intervention=str(payload.get("intervention", "NONE")),
        r0=float(payload["r0"]) if "r0" in payload and payload["r0"] is not None else None,
    )


@router.post("/run")
def run_simulation(
    db: Annotated[Session, Depends(get_db)],
    payload: Annotated[dict[str, Any], Body()] = None,
) -> dict[str, Any]:
    payload = payload or {}
    step_index = int(payload.get("stepIndex", 0))
    r0 = float(payload.get("r0", 2.4))
    archetype = str(payload.get("archetype", "DENGUE"))
    intervention = str(payload.get("intervention", "NONE"))
    epicenter_ward_id = str(payload.get("epicenterWardId", "area-1"))

    areas = db.scalars(select(Area).order_by(Area.name)).all()

    simulated_areas = []
    for area in areas:
        area_key = f"area-{area.id}"
        is_epicenter = area_key == epicenter_ward_id
        distance = 0 if is_epicenter else 1

        sim = simulate_outbreak_step(
            step_index=step_index,
            r0=r0,
            archetype=archetype,
            intervention=intervention,
            neighbor_distance=distance,
        )

        risk_score = sim["activePoint"]["risk"]
        risk_level = "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 40 else "LOW"

        simulated_areas.append({
            "id": area_key,
            "name": area.name,
            "district": area.district,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "confidence": 89 if is_epicenter else 75,
            "trend": "INCREASING" if risk_score > 50 else "STABLE",
            "persistenceWeeks": min(3, step_index),
            "signals": {
                "medicineDemand": {
                    "current": sim["activePoint"]["medicine"],
                    "baseline": sim["activePoint"]["baseline"],
                    "deviation": f"+{round(((sim['activePoint']['medicine'] - sim['activePoint']['baseline'])/sim['activePoint']['baseline'])*100, 1)}%",
                },
                "feverIndicators": {
                    "current": sim["activePoint"]["fever"],
                    "baseline": 280,
                    "deviation": f"+{round(((sim['activePoint']['fever'] - 280)/280)*100, 1)}%",
                },
                "clinicVisits": {
                    "current": round(sim["activePoint"]["fever"] * 0.22),
                    "baseline": 60,
                    "deviation": "+35%",
                },
                "geographicSpread": {
                    "affectedNeighbors": 2 if is_epicenter else 1,
                    "totalNeighbors": 4,
                    "deviation": "+50%",
                },
            },
            "factorScores": {
                "medicine": round(risk_score * 0.3, 1),
                "healthIndicators": round(risk_score * 0.3, 1),
                "persistence": round(risk_score * 0.2, 1),
                "geographicSpread": round(risk_score * 0.2, 1),
            },
            "timeline": sim["timeline"],
            "status": "EARLY_WARNING" if risk_level == "HIGH" else "WATCH" if risk_level == "MEDIUM" else "MONITOR",
            "effectiveRt": sim["effectiveRt"],
        })

    return {
        "stepIndex": step_index,
        "archetype": DISEASE_ARCHETYPES.get(archetype, DISEASE_ARCHETYPES["DENGUE"]),
        "intervention": INTERVENTIONS.get(intervention, INTERVENTIONS["NONE"]),
        "areas": simulated_areas,
    }

