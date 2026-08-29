from sqlalchemy.orm import Session

from app.models.domain import ActivityLog, User


def log_activity(
    db: Session,
    action: str,
    status: str = "SUCCESS",
    details: str = "",
    user: User | None = None,
    user_email: str | None = None,
    ip_address: str | None = None,
) -> ActivityLog:
    activity = ActivityLog(
        user_id=user.id if user else None,
        user_email=user.email if user else user_email,
        action=action,
        status=status,
        details=details,
        ip_address=ip_address,
    )
    db.add(activity)
    db.flush()
    return activity
