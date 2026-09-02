from datetime import date, datetime, timedelta
from random import Random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.domain import Alert, AlertStatus, Observation


# Jury-demo seed: creates realistic, clearly synthetic civic-compliance signals
# for active alerts that do not already have recent civic-compliance observations.
# It never represents these values as a census of citizens.
DEMO_SCORES = [86, 78, 91, 67, 83, 72]
DEMO_SOURCES = [
    "Anonymous Public Feedback",
    "Municipal Field Survey",
    "Community Health Action Aggregate",
    "Traffic/IoT Aggregated Signal",
]


def seed_civic_demo_data(db: Session) -> None:
    """Ensure current civic-compliance demo signals exist for active alerts."""
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
    cutoff = now - timedelta(hours=2)
    created_any = False

    for index, alert in enumerate(alerts):
        # Do not duplicate a demo series if this alert already has recent signals.
        has_recent = db.scalar(
            select(Observation.id)
            .where(
                Observation.area_id == alert.area_id,
                Observation.signal_type == "civic_compliance",
                Observation.category == f"civic:{alert.id}",
                Observation.created_at >= cutoff,
            )
            .limit(1)
        )
        if has_recent is not None:
            continue

        target = DEMO_SCORES[index]

        # Four evidence groups: citizen pulse, behavior adherence, health action,
        # and advisory impact. Values are synthetic and deliberately area-level.
        for signal_index in range(16):
            if signal_index < 8:
                baseline = target - 5
            else:
                baseline = target + 3

            value = max(0, min(100, baseline + rng.uniform(-4, 4)))
            quality = 0.82 + rng.uniform(0.08, 0.16)
            created_at = now - timedelta(minutes=(75 - signal_index * 4))

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
        created_any = True

    if created_any:
        db.commit()
