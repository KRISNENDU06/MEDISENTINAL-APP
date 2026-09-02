from datetime import date, datetime, timedelta
from random import Random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.domain import Alert, AlertStatus, Observation


# Jury-demo seed: creates realistic, clearly synthetic civic-compliance signals
# for active alerts that do not already have complete recent civic evidence.
# It never represents these values as a census of citizens.
DEMO_SCORES = [86, 78, 91, 67, 83, 72]
DEMO_SOURCES = [
    "Anonymous Public Feedback",
    "Municipal Field Survey",
    "Community Health Action Aggregate",
    "Traffic/IoT Aggregated Signal",
]


def seed_civic_demo_data(db: Session) -> None:
    """Ensure all four civic-compliance demo indicator groups exist for active alerts."""
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
        target = DEMO_SCORES[index]
        base_query = select(Observation).where(
            Observation.area_id == alert.area_id,
            Observation.signal_type == "civic_compliance",
            Observation.category == f"civic:{alert.id}",
            Observation.created_at >= cutoff,
        )
        recent_rows = list(db.scalars(base_query).all())
        existing_sources = {row.source for row in recent_rows}
        missing_sources = [source for source in DEMO_SOURCES if source not in existing_sources]

        # Backfill only missing evidence groups. This makes upgrades safe for
        # databases that already contain the earlier three-source demo data.
        for source_index, source in enumerate(missing_sources):
            for local_index in range(4):
                signal_index = source_index * 4 + local_index
                baseline = target - 5 if signal_index < 8 else target + 3
                value = max(0, min(100, baseline + rng.uniform(-4, 4)))
                quality = 0.82 + rng.uniform(0.08, 0.16)
                created_at = now - timedelta(minutes=(60 - signal_index * 3))

                db.add(
                    Observation(
                        area_id=alert.area_id,
                        observed_on=date.today(),
                        signal_type="civic_compliance",
                        category=f"civic:{alert.id}",
                        value=round(value, 2),
                        source=source,
                        data_quality_score=round(min(1.0, quality), 2),
                        created_at=created_at,
                    )
                )
            created_any = True

    if created_any:
        db.commit()
