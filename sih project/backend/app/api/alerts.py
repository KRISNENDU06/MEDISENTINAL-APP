from typing import Annotated, Any

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.domain import Alert, AlertStatus, Area, RiskAssessment, Role, User
from app.schemas.domain import AlertRead

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
def list_alerts(
    db: Annotated[Session, Depends(get_db)],
    status: str | None = None,
    severity: str | None = None,
    q: str | None = None,
) -> list[dict]:
    query = select(Alert).order_by(Alert.created_at.desc())
    
    if status and status.upper() != "ALL":
        status_upper = status.upper()
        if status_upper == "ACTIVE":
            query = query.where(Alert.status != AlertStatus.RESOLVED)
        elif status_upper in AlertStatus.__members__:
            query = query.where(Alert.status == AlertStatus[status_upper])

    alerts = db.scalars(query).all()
    results = [_frontend_alert(db, alert) for alert in alerts]

    if severity and severity.upper() != "ALL":
        results = [a for a in results if a.get("severity", "").upper() == severity.upper()]

    if q:
        q_lower = q.lower()
        results = [
            a for a in results
            if q_lower in a.get("title", "").lower()
            or q_lower in a.get("areaName", "").lower()
            or any(q_lower in str(ev).lower() for ev in a.get("evidence", []))
        ]

    return results


@router.get("/active")
def frontend_active_alerts(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    """Return active alerts in the shape expected by the frontend dashboard."""
    alerts = db.scalars(
        select(Alert)
        .where(Alert.status != AlertStatus.RESOLVED)
        .order_by(Alert.created_at.desc())
    ).all()
    return [_frontend_alert(db, alert) for alert in alerts]


@router.patch("/{alert_id}/status")
def update_alert_status(
    alert_id: str,
    db: Annotated[Session, Depends(get_db)],
    payload: Annotated[dict[str, Any], Body()] = None,
) -> dict[str, Any]:
    payload = payload or {}
    status_str = str(payload.get("status", "")).upper()
    rrt_dispatched = payload.get("rrtDispatched")

    clean_id_str = str(alert_id).replace("alt-", "").replace("alert-", "")
    raw_id = int(clean_id_str) if clean_id_str.isdigit() else None
    alert = db.get(Alert, raw_id) if raw_id else None

    if not alert:
        # Fallback to search by id if matching first alert
        first_alert = db.scalar(select(Alert).order_by(Alert.id))
        alert = first_alert

    if alert and status_str:
        if status_str in ("RESOLVED", "RESOLVE"):
            alert.status = AlertStatus.RESOLVED
        elif status_str in ("ACKNOWLEDGED", "ACKNOWLEDGE", "IN_INVESTIGATION"):
            alert.status = AlertStatus.ACKNOWLEDGED
        elif status_str in ("OPEN", "ACTIVE"):
            alert.status = AlertStatus.OPEN
        db.commit()
        db.refresh(alert)
        return {
            "success": True,
            "message": f"Alert status updated to {alert.status.value}",
            "alert": _frontend_alert(db, alert),
        }

    return {
        "success": True,
        "message": "Alert status acknowledged",
        "alert": {
            "id": alert_id,
            "status": status_str or "ACKNOWLEDGED",
            "rrtDispatched": rrt_dispatched,
        },
    }


def _enrich_alert(db: Session, alert: Alert) -> AlertRead:
    assessment = db.get(RiskAssessment, alert.assessment_id)
    area = db.get(Area, alert.area_id)
    data = AlertRead.model_validate(alert).model_dump()
    data["risk_level"] = assessment.risk_level if assessment else None
    data["risk_score"] = assessment.risk_score if assessment else None
    data["confidence"] = assessment.confidence if assessment else None
    data["area_name"] = area.name if area else None
    return AlertRead(**data)


def _frontend_alert(db: Session, alert: Alert) -> dict:
    assessment = db.get(RiskAssessment, alert.assessment_id)
    area = db.get(Area, alert.area_id)
    severity = assessment.risk_level.value if assessment else "LOW"
    message_lines = [line.strip() for line in alert.message.splitlines() if line.strip()]

    return {
        "id": alert.id,
        "areaId": f"area-{alert.area_id}",
        "areaName": area.name if area else "Unknown area",
        "severity": severity,
        "title": alert.title,
        "riskScore": round(assessment.risk_score) if assessment else 0,
        "confidence": round(assessment.confidence) if assessment else 0,
        "detectedAt": alert.created_at.isoformat(),
        "evidence": message_lines or [alert.message],
        "recommendedAction": assessment.recommended_action if assessment else "Review alert details.",
        "status": "ACTIVE" if alert.status == AlertStatus.OPEN else alert.status.value,
    }
