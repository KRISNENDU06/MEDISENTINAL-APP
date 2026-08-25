from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.domain import Alert, AlertStatus, Area, Observation, RiskAssessment, RiskLevel, Role, User
from app.schemas.domain import AreaRiskSummary, DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
) -> DashboardSummary:
    latest_by_area = _latest_assessments(db)
    scores = [assessment.risk_score for assessment in latest_by_area]
    confidences = [assessment.confidence for assessment in latest_by_area]
    overall_score = round(sum(scores) / len(scores), 2) if scores else 0
    last_updated = max((assessment.created_at for assessment in latest_by_area), default=None)

    return DashboardSummary(
        overall_risk_score=overall_score,
        overall_risk_level=_classify_overall(overall_score),
        average_confidence=round(sum(confidences) / len(confidences), 2) if confidences else 0,
        active_alerts=int(
            db.scalar(select(func.count(Alert.id)).where(Alert.status != AlertStatus.RESOLVED)) or 0
        ),
        areas_monitored=int(db.scalar(select(func.count(Area.id))) or 0),
        signals_processed=int(db.scalar(select(func.count(Observation.id))) or 0),
        high_risk_areas=sum(1 for assessment in latest_by_area if assessment.risk_level == RiskLevel.HIGH),
        medium_risk_areas=sum(1 for assessment in latest_by_area if assessment.risk_level == RiskLevel.MEDIUM),
        low_risk_areas=sum(1 for assessment in latest_by_area if assessment.risk_level == RiskLevel.LOW),
        last_updated=last_updated,
    )


@router.get("/area-risk", response_model=list[AreaRiskSummary])
def area_risk(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
) -> list[AreaRiskSummary]:
    areas = db.scalars(select(Area).order_by(Area.name)).all()
    rows = []
    for area in areas:
        assessment = db.scalar(
            select(RiskAssessment)
            .where(RiskAssessment.area_id == area.id)
            .order_by(RiskAssessment.assessed_on.desc(), RiskAssessment.id.desc())
        )
        rows.append(AreaRiskSummary(area=area, assessment=assessment))
    return rows


def _latest_assessments(db: Session) -> list[RiskAssessment]:
    areas = db.scalars(select(Area)).all()
    assessments = []
    for area in areas:
        assessment = db.scalar(
            select(RiskAssessment)
            .where(RiskAssessment.area_id == area.id)
            .order_by(RiskAssessment.assessed_on.desc(), RiskAssessment.id.desc())
        )
        if assessment:
            assessments.append(assessment)
    return assessments


def _classify_overall(score: float) -> RiskLevel:
    if score >= 70:
        return RiskLevel.HIGH
    if score >= 40:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW
