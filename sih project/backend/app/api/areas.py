from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.domain import Area, AreaNeighbor, Observation, RiskAssessment, Role, User
from app.schemas.domain import AreaRead, AreaRiskSummary

router = APIRouter(prefix="/areas", tags=["areas"])


@router.get("", response_model=list[AreaRead])
def list_areas(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.ANALYST, Role.VIEWER))],
) -> list[Area]:
    return list(db.scalars(select(Area).order_by(Area.name)).all())


@router.get("/risk-summary")
def frontend_risk_summary(
    db: Annotated[Session, Depends(get_db)],
    days: int = 30,
) -> list[dict]:
    """Return area summaries in the shape expected by the frontend dashboard."""
    areas = db.scalars(select(Area).order_by(Area.name)).all()
    return [_frontend_area_summary(db, area, days=days) for area in areas]


@router.get("/{area_id}")
def area_detail(
    area_id: str,
    db: Annotated[Session, Depends(get_db)],
    days: int = 30,
) -> dict:
    clean_id_str = str(area_id).replace("area-", "")
    raw_id = int(clean_id_str) if clean_id_str.isdigit() else None
    area = db.get(Area, raw_id) if raw_id else None
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    return _frontend_area_summary(db, area, days=days)


def _frontend_area_summary(db: Session, area: Area, days: int = 30) -> dict:
    assessment = _latest_assessment(db, area.id)
    signals = _frontend_signals(db, area.id, days=days)
    risk_score = round(assessment.risk_score) if assessment else 0
    risk_level = assessment.risk_level.value if assessment else "LOW"
    
    recent_obs = db.scalars(
        select(Observation)
        .where(Observation.area_id == area.id)
        .order_by(Observation.observed_on.desc(), Observation.id.desc())
        .limit(15)
    ).all()

    observations_list = [
        {
            "id": obs.id,
            "date": obs.observed_on.isoformat(),
            "signalType": obs.signal_type,
            "value": obs.value,
            "source": obs.source,
            "quality": obs.data_quality_score,
        }
        for obs in recent_obs
    ]

    return {
        "id": f"area-{area.id}",
        "rawId": area.id,
        "name": area.name,
        "district": area.district,
        "state": area.state,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "confidence": round(assessment.confidence) if assessment else 0,
        "trend": assessment.trend if assessment else "STABLE",
        "persistenceWeeks": min(3, round((assessment.persistence_score / 100) * 3)) if assessment else 0,
        "explanation": assessment.explanation if assessment else f"Routine monitoring for {area.name}.",
        "recommendedAction": assessment.recommended_action if assessment else "Continue routine monitoring.",
        "signals": signals,
        "factorScores": {
            "medicine": round(assessment.medicine_score, 1) if assessment else 0,
            "healthIndicators": round(assessment.health_score, 1) if assessment else 0,
            "persistence": round(assessment.persistence_score, 1) if assessment else 0,
            "geographicSpread": round(assessment.geographic_score, 1) if assessment else 0,
        },
        "timeline": _frontend_timeline(db, area.id, risk_score, days=days),
        "recentObservations": observations_list,
        "status": "EARLY_WARNING" if risk_level == "HIGH" else "WATCH" if risk_level == "MEDIUM" else "MONITOR",
        "latitude": area.latitude,
        "longitude": area.longitude,
    }


def _latest_assessment(db: Session, area_id: int) -> RiskAssessment | None:
    return db.scalar(
        select(RiskAssessment)
        .where(RiskAssessment.area_id == area_id)
        .order_by(RiskAssessment.assessed_on.desc(), RiskAssessment.id.desc())
    )


def _frontend_signals(db: Session, area_id: int, days: int = 30) -> dict:
    medicine_current, medicine_baseline = _current_and_baseline(db, area_id, "medicine_demand", days=days)
    fever_current, fever_baseline = _current_and_baseline(db, area_id, "fever_cases", days=days)
    clinic_current, clinic_baseline = _current_and_baseline(db, area_id, "clinic_visits", days=days)
    affected_neighbors, total_neighbors = _neighbor_spread(db, area_id)

    return {
        "medicineDemand": {
            "current": round(medicine_current),
            "baseline": round(medicine_baseline),
            "deviation": _deviation(medicine_current, medicine_baseline),
        },
        "feverIndicators": {
            "current": round(fever_current),
            "baseline": round(fever_baseline),
            "deviation": _deviation(fever_current, fever_baseline),
        },
        "clinicVisits": {
            "current": round(clinic_current),
            "baseline": round(clinic_baseline),
            "deviation": _deviation(clinic_current, clinic_baseline),
        },
        "geographicSpread": {
            "affectedNeighbors": affected_neighbors,
            "totalNeighbors": total_neighbors,
            "deviation": f"+{round((affected_neighbors / total_neighbors) * 100)}%" if total_neighbors else "0%",
        },
    }


def _current_and_baseline(db: Session, area_id: int, signal_type: str, days: int = 30) -> tuple[float, float]:
    observations = db.scalars(
        select(Observation)
        .where(Observation.area_id == area_id, Observation.signal_type == signal_type)
        .order_by(Observation.observed_on.desc())
        .limit(max(days, 28))
    ).all()

    if not observations:
        return 0, 1

    current = observations[0].value
    baseline_values = [observation.value for observation in observations[7:days]] or [
        observation.value for observation in observations[1:]
    ]
    baseline = sum(baseline_values) / len(baseline_values) if baseline_values else current
    return current, baseline or 1


def _frontend_timeline(db: Session, area_id: int, latest_risk_score: int, days: int = 30) -> list[dict]:
    limit_count = max(days, 14)
    medicine_rows = db.scalars(
        select(Observation)
        .where(Observation.area_id == area_id, Observation.signal_type == "medicine_demand")
        .order_by(Observation.observed_on.desc())
        .limit(limit_count)
    ).all()
    fever_rows = db.scalars(
        select(Observation)
        .where(Observation.area_id == area_id, Observation.signal_type == "fever_cases")
        .order_by(Observation.observed_on.desc())
        .limit(limit_count)
    ).all()
    clinic_rows = db.scalars(
        select(Observation)
        .where(Observation.area_id == area_id, Observation.signal_type == "clinic_visits")
        .order_by(Observation.observed_on.desc())
        .limit(limit_count)
    ).all()

    medicine_by_date = {row.observed_on: row.value for row in medicine_rows}
    fever_by_date = {row.observed_on: row.value for row in fever_rows}
    clinic_by_date = {row.observed_on: row.value for row in clinic_rows}
    
    all_dates = sorted(medicine_by_date.keys())
    
    if days <= 7:
        selected_dates = all_dates[-7:]
    elif days <= 30:
        step = max(1, len(all_dates) // 6)
        selected_dates = all_dates[-30::step] or all_dates[-6:]
    else:
        step = max(1, len(all_dates) // 10)
        selected_dates = all_dates[-90::step] or all_dates[-10:]

    if not selected_dates:
        return []

    baseline = sum(medicine_by_date[day] for day in medicine_by_date) / len(medicine_by_date) if medicine_by_date else 100
    timeline = []
    total_pts = len(selected_dates)
    for index, observed_on in enumerate(selected_dates):
        progress = (index + 1) / total_pts
        med_val = medicine_by_date.get(observed_on, baseline)
        fever_val = fever_by_date.get(observed_on, 0)
        clinic_val = clinic_by_date.get(observed_on, round(fever_val * 0.25))
        timeline.append(
            {
                "week": f"Day {observed_on.strftime('%d %b')}" if days <= 7 else f"W{observed_on.isocalendar().week}",
                "date": observed_on.strftime("%Y-%m-%d"),
                "baseline": round(baseline),
                "medicine": round(med_val),
                "fever": round(fever_val),
                "clinic": round(clinic_val),
                "risk": round(latest_risk_score * progress),
            }
        )
    return timeline


def _neighbor_spread(db: Session, area_id: int) -> tuple[int, int]:
    neighbor_ids = db.scalars(
        select(AreaNeighbor.neighbor_area_id).where(AreaNeighbor.area_id == area_id)
    ).all()
    total = len(neighbor_ids)
    if not total:
        return 0, 0

    affected = db.scalar(
        select(func.count(RiskAssessment.id))
        .where(RiskAssessment.area_id.in_(neighbor_ids), RiskAssessment.risk_score >= 40)
    )
    return int(affected or 0), total


def _deviation(current: float, baseline: float) -> str:
    if not baseline:
        return "0%"
    deviation = ((current - baseline) / baseline) * 100
    sign = "+" if deviation >= 0 else ""
    return f"{sign}{round(deviation, 1)}%"
