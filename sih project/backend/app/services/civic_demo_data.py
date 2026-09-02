from datetime import date, datetime, timedelta
from random import Random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.domain import Alert, AlertStatus, Observation


# Jury-demo seed: creates realistic, clearly synthetic civic-compliance signals
# only when the database does not already contain civic-compliance observations.
# It never represents these values as a census of citizens.
DEMO_SCORES = [86, 78, 91, 67, 83, 72]
DEMO_SOURCES = [
    "Anonymous Public Feedback",
    "Municipal Field Survey",
    "Traffic/IoT Aggregated Signal",
]


def seed_civic_demo_data(db: Session) -> None:
    """Seed current civic-compliance demo signals for active alerts, once."""
    existing = db.scalar(
        select(Observation.id)
        .where(Observation.signal_type == "civic_compliance")
        .limit(1)
    )
    if existing is not None:
        return

    alerts = db.scalars(
        select(Alert)
        .where(Alert.status != AlertStatus.RESOLVED)
        .order_by(Alert.created_at.desc(), Alert.id.desc())
        .limit(len(DEMO_SCORES))
    ).all()

    if not alerts:
        return

    rng = Random(2026)
    now = datetime.utcnow()

    for index, alert in enumerate(alerts):
        target = DEMO_SCORES[index]

        # Twelve recent signals per alert make the dashboard immediately useful.
        # The first half is slightly lower than the second half so the UI can
        # demonstrate a meaningful IMPROVING trend without claiming real-world data.
        for signal_index in range(12):
            if signal_index < 6:
                baseline = target - 5
            else:
                baseline = target + 3

            value = max(0, min(100, baseline + rng.uniform(-4, 4)))
            quality = 0.82 + rng.uniform(0.08, 0.16)
            created_at = now - timedelta(minutes=(70 - signal_index * 5))

            db.add(
                Observation(
                    area_id=alert.area_id,
                    observed_on=date.today(),
                    signal_type="civic_compliance",
                    category=f"civic:{alert.id}",
                    value=round(value, 2),
                    source=DEMO_SOURCES[signal_index % len(DEMO_SOURCES)],
                    data_quality_score=round(min(1.0, quality), 2),
                    created_at=created_at,
                )
            )

    db.commit()
