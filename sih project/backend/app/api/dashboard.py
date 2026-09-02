from datetime import date, datetime, timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.domain import Alert, AlertStatus, Area, Observation, RiskAssessment, RiskLevel, Role, User
from app.schemas.domain import AreaRiskSummary, DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


_DASHBOARD_SUMMARY_CACHE: DashboardSummary | None = None


def invalidate_dashboard_cache():
    global _DASHBOARD_SUMMARY_CACHE
    _DASHBOARD_SUMMARY_CACHE = None


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
) -> DashboardSummary:
    global _DASHBOARD_SUMMARY_CACHE
    if _DASHBOARD_SUMMARY_CACHE is not None:
        return _DASHBOARD_SUMMARY_CACHE

    latest_by_area = _latest_assessments(db)
    scores = [assessment.risk_score for assessment in latest_by_area]
    confidences = [assessment.confidence for assessment in latest_by_area]
    overall_score = round(sum(scores) / len(scores), 2) if scores else 0
    last_updated = max((assessment.created_at for assessment in latest_by_area), default=None)

    result = DashboardSummary(
        overall_risk_score=overall_score,
        overall_risk_level=_classify_overall(overall_score),
        average_confidence=round(sum(confidences) / len(confidences), 2) if confidences else 0,
        active_alerts=int(db.scalar(select(func.count(Alert.id)).where(Alert.status != AlertStatus.RESOLVED)) or 0),
        areas_monitored=int(db.scalar(select(func.count(Area.id))) or 0),
        signals_processed=int(db.scalar(select(func.count(Observation.id))) or 0),
        high_risk_areas=sum(1 for assessment in latest_by_area if assessment.risk_level == RiskLevel.HIGH),
        medium_risk_areas=sum(1 for assessment in latest_by_area if assessment.risk_level == RiskLevel.MEDIUM),
        low_risk_areas=sum(1 for assessment in latest_by_area if assessment.risk_level == RiskLevel.LOW),
        last_updated=last_updated,
    )
    _DASHBOARD_SUMMARY_CACHE = result
    return result


@router.get("/area-risk", response_model=list[AreaRiskSummary])
def area_risk(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
) -> list[AreaRiskSummary]:
    latest_by_area = {a.area_id: a for a in _latest_assessments(db)}
    areas = db.scalars(select(Area).order_by(Area.name)).all()
    return [AreaRiskSummary(area=area, assessment=latest_by_area.get(area.id)) for area in areas]


class CivicFeedbackCreate(BaseModel):
    area_id: int = Field(gt=0)
    alert_id: int = Field(gt=0)
    response: Literal["EXCELLENT", "GOOD", "MIXED", "POOR", "NOT_APPLICABLE"]


class CivicSignalCreate(BaseModel):
    area_id: int = Field(gt=0)
    alert_id: int = Field(gt=0)
    score: float = Field(ge=0, le=100)
    source: str = Field(default="authorized_area_signal", min_length=3, max_length=120)
    quality: float = Field(default=0.9, ge=0, le=1)


CIVIC_WEIGHTS = {
    "citizen_pulse": 0.30,
    "behavior_adherence": 0.25,
    "health_action": 0.25,
    "advisory_impact": 0.20,
}

CIVIC_SOURCE_GROUPS = {
    "citizen_pulse": {"anonymous_citizen_feedback", "Anonymous Public Feedback"},
    "behavior_adherence": {"Municipal Field Survey", "community_behavior_observation", "Community Behavior Survey"},
    "health_action": {"Community Health Action Aggregate", "health_action_index", "Health Action Aggregate"},
    "advisory_impact": {"Traffic/IoT Aggregated Signal", "traffic_iot_aggregate", "Advisory Impact Aggregate"},
}

CIVIC_RESPONSE_SCORES = {
    "EXCELLENT": 100.0,
    "GOOD": 75.0,
    "MIXED": 50.0,
    "POOR": 25.0,
    "NOT_APPLICABLE": 50.0,
}


def _civic_category(alert_id: int) -> str:
    return f"civic:{alert_id}"


def _source_group(source: str) -> str | None:
    for group, sources in CIVIC_SOURCE_GROUPS.items():
        if source in sources:
            return group
    return None


def _weighted_average(rows: list[Observation]) -> float | None:
    if not rows:
        return None
    denominator = sum(row.data_quality_score for row in rows)
    if denominator <= 0:
        return None
    return round(sum(row.value * row.data_quality_score for row in rows) / denominator, 1)


def _civic_score(db: Session, area_id: int, alert_id: int) -> dict:
    cutoff = datetime.utcnow() - timedelta(hours=2)
    rows = list(db.scalars(select(Observation).where(
        Observation.area_id == area_id,
        Observation.signal_type == "civic_compliance",
        Observation.category == _civic_category(alert_id),
        Observation.created_at >= cutoff,
    ).order_by(Observation.created_at.desc())).all())

    valid_rows = [row for row in rows if row.data_quality_score > 0]
    if not valid_rows:
        return {
            "score": None,
            "confidence": 0,
            "trend": "NO_DATA",
            "sample_count": 0,
            "updated_at": None,
            "status": "INSUFFICIENT_DATA",
            "indicators": {},
        }

    indicator_scores: dict[str, float] = {}
    indicator_counts: dict[str, int] = {}
    for group in CIVIC_WEIGHTS:
        group_rows = [row for row in valid_rows if _source_group(row.source or "") == group]
        value = _weighted_average(group_rows)
        if value is not None:
            indicator_scores[group] = value
            indicator_counts[group] = len(group_rows)

    # Renormalize only across indicators with available evidence. Missing data
    # is unknown, never interpreted as poor civic behavior.
    available_weight = sum(CIVIC_WEIGHTS[group] for group in indicator_scores)
    if available_weight > 0:
        score = round(sum(indicator_scores[group] * CIVIC_WEIGHTS[group] for group in indicator_scores) / available_weight, 1)
    else:
        score = _weighted_average(valid_rows)

    sample_count = len(valid_rows)
    quality = sum(row.data_quality_score for row in valid_rows) / sample_count
    source_diversity = min(len(indicator_scores) / len(CIVIC_WEIGHTS), 1.0)
    volume_confidence = min(sample_count / 40, 1.0)
    confidence = round(100 * (0.40 * volume_confidence + 0.30 * quality + 0.30 * source_diversity), 1)

    midpoint = datetime.utcnow() - timedelta(hours=1)
    recent = [row.value for row in valid_rows if row.created_at >= midpoint]
    older = [row.value for row in valid_rows if row.created_at < midpoint]
    trend = "STABLE"
    if recent and older:
        delta = sum(recent) / len(recent) - sum(older) / len(older)
        if delta >= 5:
            trend = "IMPROVING"
        elif delta <= -5:
            trend = "DECLINING"

    indicators = {
        "citizen_pulse": {"score": indicator_scores.get("citizen_pulse"), "weight": CIVIC_WEIGHTS["citizen_pulse"], "samples": indicator_counts.get("citizen_pulse", 0)},
        "behavior_adherence": {"score": indicator_scores.get("behavior_adherence"), "weight": CIVIC_WEIGHTS["behavior_adherence"], "samples": indicator_counts.get("behavior_adherence", 0)},
        "health_action": {"score": indicator_scores.get("health_action"), "weight": CIVIC_WEIGHTS["health_action"], "samples": indicator_counts.get("health_action", 0)},
        "advisory_impact": {"score": indicator_scores.get("advisory_impact"), "weight": CIVIC_WEIGHTS["advisory_impact"], "samples": indicator_counts.get("advisory_impact", 0)},
    }

    return {
        "score": score,
        "confidence": confidence,
        "trend": trend,
        "sample_count": sample_count,
        "updated_at": max(row.created_at for row in valid_rows),
        "status": "HIGH" if score is not None and score >= 80 else "MODERATE" if score is not None and score >= 50 else "LOW",
        "indicators": indicators,
    }


@router.post("/civic/feedback", status_code=201)
def submit_civic_feedback(payload: CivicFeedbackCreate, db: Session = Depends(get_db)):
    """Record anonymous public feedback; identity is intentionally not stored."""
    alert = db.get(Alert, payload.alert_id)
    area = db.get(Area, payload.area_id)
    if not alert or not area or alert.area_id != payload.area_id:
        raise HTTPException(status_code=404, detail="Alert or area not found")

    # A four-level emoji-style pulse is mapped to a bounded score. Non-applicable
    # responses are retained but have zero scoring weight.
    value = CIVIC_RESPONSE_SCORES[payload.response]
    quality = 0.8 if payload.response != "NOT_APPLICABLE" else 0.0
    observation = Observation(
        area_id=payload.area_id,
        observed_on=date.today(),
        signal_type="civic_compliance",
        category=_civic_category(payload.alert_id),
        value=value,
        source="anonymous_citizen_feedback",
        data_quality_score=quality,
    )
    db.add(observation)
    db.commit()
    return {"accepted": True, "message": "Anonymous civic signal recorded", "rating": _civic_score(db, payload.area_id, payload.alert_id)}


@router.post("/civic/signal", status_code=201)
def submit_civic_signal(
    payload: CivicSignalCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
):
    """Ingest an aggregated/authorized area-level compliance signal."""
    alert = db.get(Alert, payload.alert_id)
    area = db.get(Area, payload.area_id)
    if not alert or not area or alert.area_id != payload.area_id:
        raise HTTPException(status_code=404, detail="Alert or area not found")
    observation = Observation(
        area_id=payload.area_id,
        observed_on=date.today(),
        signal_type="civic_compliance",
        category=_civic_category(payload.alert_id),
        value=payload.score,
        source=payload.source,
        data_quality_score=payload.quality,
    )
    db.add(observation)
    db.commit()
    return {"accepted": True, "rating": _civic_score(db, payload.area_id, payload.alert_id)}


@router.get("/civic/rating")
def civic_rating(
    area_id: int,
    alert_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
):
    area = db.get(Area, area_id)
    alert = db.get(Alert, alert_id)
    if not area or not alert or alert.area_id != area_id:
        raise HTTPException(status_code=404, detail="Alert or area not found")
    return {"area_id": area_id, "area_name": area.name, "alert_id": alert_id, "alert_title": alert.title, **_civic_score(db, area_id, alert_id)}


@router.get("/civic/overview")
def civic_overview(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
):
    """Return current civic ratings for active alerts with area-level evidence."""
    active_alerts = db.scalars(select(Alert).where(Alert.status != AlertStatus.RESOLVED).order_by(Alert.created_at.desc())).all()
    result = []
    for alert in active_alerts:
        area = db.get(Area, alert.area_id)
        if not area:
            continue
        rating = _civic_score(db, alert.area_id, alert.id)
        result.append({"area_id": area.id, "area_name": area.name, "district": area.district, "alert_id": alert.id, "alert_title": alert.title, **rating})
    return result


def _latest_assessments(db: Session) -> list[RiskAssessment]:
    subq = select(
        RiskAssessment.id,
        func.row_number().over(
            partition_by=RiskAssessment.area_id,
            order_by=[RiskAssessment.assessed_on.desc(), RiskAssessment.id.desc()],
        ).label("rn"),
    ).subquery()
    return list(db.scalars(select(RiskAssessment).join(subq, RiskAssessment.id == subq.c.id).where(subq.c.rn == 1)).all())


def _classify_overall(score: float) -> RiskLevel:
    if score >= 70:
        return RiskLevel.HIGH
    if score >= 40:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW
