import json
from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_optional, require_roles
from app.db.session import get_db
from app.models.domain import Area, HealthReport, RiskLevel, Role, User
from app.schemas.domain import HealthReportCreate, HealthReportRead
from app.services.audit import log_activity

router = APIRouter(prefix="/reports", tags=["health-reports"])


@router.post("", response_model=HealthReportRead, status_code=status.HTTP_201_CREATED)
def create_health_report(
    payload: HealthReportCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
) -> dict[str, Any]:
    """Authorized Health Officer creates an official health report with signals & recommendations."""
    # 1. Resolve Target Area
    target_area = None
    if payload.area_id:
        target_area = db.get(Area, payload.area_id)
    elif payload.area_name:
        target_area = db.scalar(select(Area).where(Area.name.ilike(f"%{payload.area_name.strip()}%")))

    if not target_area:
        # Fallback to first area if not specified
        target_area = db.scalar(select(Area).order_by(Area.id))
        if not target_area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No matching ward/area found. Please specify a valid area.",
            )

    # 2. Format Observed Signals
    if isinstance(payload.observed_signals, (dict, list)):
        signals_str = json.dumps(payload.observed_signals)
    else:
        signals_str = str(payload.observed_signals)

    # 3. Format Recommendations
    if isinstance(payload.recommendations, list):
        rec_str = json.dumps(payload.recommendations)
    else:
        rec_str = str(payload.recommendations)

    officer_name = payload.officer_name or current_user.full_name or "Authorized Health Officer"
    officer_designation = payload.officer_designation or ("District Health Official" if current_user.role == Role.HEALTH_OFFICIAL else "Chief Medical Administrator")

    # 4. Create and persist Health Report
    report = HealthReport(
        area_id=target_area.id,
        officer_id=current_user.id,
        officer_name=officer_name,
        officer_designation=officer_designation,
        report_title=payload.report_title.strip(),
        observed_signals=signals_str,
        risk_level=payload.risk_level,
        clinical_notes=payload.clinical_notes.strip(),
        recommendations=rec_str,
        reported_date=payload.reported_date or date.today(),
        is_public=payload.is_public,
    )
    db.add(report)
    db.flush()

    # Log action in audit trail
    log_activity(
        db,
        action="HEALTH_REPORT_CREATED",
        details=f"Report '{report.report_title}' filed for {target_area.name} with risk {report.risk_level.value}",
        user=current_user,
    )
    db.commit()
    db.refresh(report)

    return _format_report(report, target_area)


@router.get("", response_model=list[HealthReportRead])
def list_health_reports(
    db: Annotated[Session, Depends(get_db)],
    area_id: int | None = None,
    risk_level: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """List all official health reports visible in the MEDISENTINEL dashboard."""
    query = select(HealthReport, Area).join(Area, HealthReport.area_id == Area.id).order_by(HealthReport.created_at.desc())

    if area_id:
        query = query.where(HealthReport.area_id == area_id)
    if risk_level and risk_level.upper() != "ALL":
        try:
            enum_level = RiskLevel(risk_level.upper())
            query = query.where(HealthReport.risk_level == enum_level)
        except ValueError:
            pass

    results = db.execute(query.limit(min(limit, 100))).all()
    return [_format_report(report, area) for report, area in results]


@router.get("/{report_id}", response_model=HealthReportRead)
def get_health_report(
    report_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    """Retrieve single official health report."""
    report = db.get(HealthReport, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health report not found")
    area = db.get(Area, report.area_id)
    return _format_report(report, area)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_health_report(
    report_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL))],
) -> None:
    """Delete a health report (Admin or Authoring Officer only)."""
    report = db.get(HealthReport, report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health report not found")

    if current_user.role != Role.ADMIN and report.officer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete this report")

    db.delete(report)
    log_activity(
        db,
        action="HEALTH_REPORT_DELETED",
        details=f"Deleted report ID {report_id} ({report.report_title})",
        user=current_user,
    )
    db.commit()


def _format_report(report: HealthReport, area: Area | None) -> dict[str, Any]:
    return {
        "id": report.id,
        "area_id": report.area_id,
        "area_name": area.name if area else "Unknown Ward",
        "district": area.district if area else "Odisha",
        "officer_id": report.officer_id,
        "officer_name": report.officer_name,
        "officer_designation": report.officer_designation,
        "report_title": report.report_title,
        "observed_signals": report.observed_signals,
        "risk_level": report.risk_level,
        "clinical_notes": report.clinical_notes,
        "recommendations": report.recommendations,
        "reported_date": report.reported_date,
        "is_public": report.is_public,
        "created_at": report.created_at,
    }
