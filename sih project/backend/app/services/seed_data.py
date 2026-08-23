from datetime import date, timedelta
from random import Random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.domain import Area, AreaNeighbor, Observation, RiskAssessment, Role, User
from app.services.risk_engine import RiskEngine


AREAS = [
    ("Area A (Saheed Nagar)", "Bhubaneswar", 20.2961, 85.8245),
    ("Area B (Patia)", "Bhubaneswar", 20.3588, 85.8164),
    ("Area C (CDA Sector 6)", "Cuttack", 20.4625, 85.8830),
    ("Area D (Grand Road)", "Puri", 19.8135, 85.8312),
    ("Area E (Industrial Estate)", "Khurda", 20.1859, 85.6277),
]

DEMO_USERS = [
    ("admin@sih.gov.in", "Dr. Amit Sharma (Admin)", "Admin@12345", Role.ADMIN),
    ("official@sih.gov.in", "Dr. Priya Das (Health Official)", "Official@12345", Role.HEALTH_OFFICIAL),
    ("analyst@sih.gov.in", "Rajesh Mohanty (Epidemiology Analyst)", "Analyst@12345", Role.ANALYST),
    ("viewer@sih.gov.in", "Field Monitor (Viewer)", "Viewer@12345", Role.VIEWER),
]


def seed_database(db: Session) -> None:
    for email, full_name, password, role in DEMO_USERS:
        _ensure_user(db, email, full_name, password, role)
    db.commit()

    existing_areas = db.scalars(select(Area)).all()
    if existing_areas:
        db.commit()
        if not db.scalar(select(Observation.id).limit(1)):
            _seed_observations(db, existing_areas)
            db.commit()
        if not db.scalar(select(AreaNeighbor.id).limit(1)):
            _seed_neighbors(db, existing_areas)
            db.commit()
        if not db.scalar(select(Observation.id).limit(1)):
            return
        if not db.scalar(select(RiskAssessment.id).limit(1)):
            RiskEngine(db).run_for_all_areas()
        return

    area_objects = []
    for name, district, lat, lng in AREAS:
        area = Area(name=name, district=district, latitude=lat, longitude=lng)
        db.add(area)
        area_objects.append(area)
    db.flush()

    _seed_neighbors(db, area_objects)
    _seed_observations(db, area_objects)
    db.commit()
    RiskEngine(db).run_for_all_areas()


def _ensure_user(db: Session, email: str, full_name: str, password: str, role: Role) -> None:
    if not db.scalar(select(User).where(User.email == email)):
        db.add(
            User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                role=role,
            )
        )


def _seed_neighbors(db: Session, areas: list[Area]) -> None:
    for index, area in enumerate(areas):
        for neighbor in areas[max(0, index - 1) : index] + areas[index + 1 : index + 3]:
            db.add(AreaNeighbor(area_id=area.id, neighbor_area_id=neighbor.id))


def _seed_observations(db: Session, areas: list[Area]) -> None:
    rng = Random(42)
    today = date.today()
    start = today - timedelta(days=100)

    signal_profiles = {
        "medicine_demand": 130,
        "fever_cases": 42,
        "respiratory_symptoms": 36,
        "clinic_visits": 25,
        "gi_symptoms": 18,
    }

    for day_offset in range(101):
        observed_on = start + timedelta(days=day_offset)
        seasonal_factor = 1.12 if observed_on.month in {7, 8, 9, 12, 1} else 1.0
        for area_index, area in enumerate(areas):
            for signal_type, base in signal_profiles.items():
                value = base * seasonal_factor * (1 + area_index * 0.05)
                value += rng.uniform(-0.08, 0.08) * value

                if area.name in {"Area A", "Area B"} and observed_on >= today - timedelta(days=18):
                    if signal_type == "medicine_demand":
                        value *= 1.65
                    elif signal_type in {"fever_cases", "respiratory_symptoms", "clinic_visits"}:
                        value *= 1.45

                if area.name == "Area C" and observed_on >= today - timedelta(days=6):
                    if signal_type == "medicine_demand":
                        value *= 1.75

                db.add(
                    Observation(
                        area_id=area.id,
                        observed_on=observed_on,
                        signal_type=signal_type,
                        category=_category_for_signal(signal_type),
                        value=max(0, round(value, 2)),
                        source="synthetic",
                        data_quality_score=0.95,
                    )
                )


def _category_for_signal(signal_type: str) -> str:
    if signal_type == "medicine_demand":
        return "fever_respiratory_medicines"
    if signal_type in {"fever_cases", "respiratory_symptoms"}:
        return "respiratory_fever"
    if signal_type == "gi_symptoms":
        return "gastrointestinal"
    return "general"
