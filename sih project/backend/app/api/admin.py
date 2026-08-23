from typing import Annotated
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.config import get_settings
from app.db.session import get_db
from app.models.domain import ActivityLog, Role, User
from app.schemas.domain import ActivityLogRead, UserRead
from app.services.audit import log_activity

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN))],
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.created_at.desc())).all())


@router.get("/activity-logs", response_model=list[ActivityLogRead])
def list_activity_logs(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN))],
    limit: int = 100,
    action: str | None = None,
) -> list[ActivityLog]:
    query = select(ActivityLog).order_by(ActivityLog.created_at.desc())
    if action:
        query = query.where(ActivityLog.action == action)
    return list(db.scalars(query.limit(min(limit, 500))).all())


@router.delete("/activity-logs/expired", status_code=status.HTTP_200_OK)
def delete_expired_activity_logs(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(Role.ADMIN))],
) -> dict[str, int]:
    cutoff = datetime.utcnow() - timedelta(days=get_settings().audit_log_retention_days)
    result = db.execute(delete(ActivityLog).where(ActivityLog.created_at < cutoff))
    deleted_count = int(result.rowcount or 0)
    log_activity(
        db,
        action="AUDIT_LOG_RETENTION_CLEANUP",
        details=f"Deleted {deleted_count} expired activity log records",
        user=current_user,
    )
    db.commit()
    return {"deleted": deleted_count}
