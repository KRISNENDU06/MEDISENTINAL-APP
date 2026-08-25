from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.domain import Role, RiskAssessment, User
from app.schemas.domain import ComparisonRow, RiskAssessmentRead, RiskRunResponse
from app.services.audit import log_activity
from app.services.risk_engine import RiskEngine

router = APIRouter(prefix="/risk", tags=["risk"])


@router.post(
    "/run",
    response_model=RiskRunResponse,
)
def run_risk_engine(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
    assessed_on: date | None = None,
) -> RiskRunResponse:
    assessments, generated_alerts = RiskEngine(db).run_for_all_areas(assessed_on)
    log_activity(
        db,
        action="RISK_ENGINE_RUN",
        details=f"Processed {len(assessments)} areas and generated {generated_alerts} alerts",
        user=current_user,
    )
    db.commit()
    return RiskRunResponse(
        processed_areas=len(assessments),
        generated_alerts=generated_alerts,
        assessments=assessments,
    )


@router.get("/assessments", response_model=list[RiskAssessmentRead])
def list_assessments(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
    area_id: int | None = None,
    limit: int = 100,
) -> list[RiskAssessment]:
    query = select(RiskAssessment).order_by(RiskAssessment.assessed_on.desc(), RiskAssessment.risk_score.desc())
    if area_id:
        query = query.where(RiskAssessment.area_id == area_id)
    return list(db.scalars(query.limit(min(limit, 500))).all())


@router.get("/comparison", response_model=list[ComparisonRow])
def comparison(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
    assessed_on: date | None = None,
    area_id: int | None = None,
) -> list[dict]:
    return RiskEngine(db).comparison_rows(assessed_on=assessed_on, area_id=area_id)
