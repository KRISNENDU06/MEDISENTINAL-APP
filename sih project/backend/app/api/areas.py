from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.domain import Area, AreaNeighbor, Observation, RiskAssessment, Role, User
from app.schemas.domain import AreaRead, AreaRiskSummary

router = APIRouter(prefix="/areas", tags=["areas"])


@router.get("", response_model=list[AreaRead])
def list_areas(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(Role.ADMIN, Role.HEALTH_OFFICIAL, Role.VIEWER))],
) -> list[Area]:
    return list(db.scalars(select(Area).order_by(Area.name)).all())


HEALTH_FACILITIES = [
    {
        "id": "fac-1",
        "name": "Urban Primary Health Centre (UPHC) Saheed Nagar",
        "type": "UPHC",
        "category": "Government Clinic",
        "district": "Bhubaneswar",
        "address": "Plot 42, Near BMC Community Hall, Saheed Nagar",
        "latitude": 20.2925,
        "longitude": 85.8475,
        "phone": "+91-674-2541929",
        "helpline": "1929",
        "isOpen24x7": True,
        "services": ["Free Fever Triage", "Rapid Dengue & Malaria Testing", "Free ORS & Antibiotics", "Doctor Consultation"],
        "verifiedStock": "High (Paracetamol, ORS, IV Fluids available)",
    },
    {
        "id": "fac-2",
        "name": "Capital Hospital & Epidemic Ward",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Bhubaneswar",
        "address": "Unit 6, Near AG Square, Bhubaneswar",
        "latitude": 20.2644,
        "longitude": 85.8281,
        "phone": "+91-674-2391983",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "Platelet Blood Bank", "Isolation Ward", "RT-PCR / Viral Testing"],
        "verifiedStock": "Critical Care Ready (Oxygen & Isolation Beds active)",
    },
    {
        "id": "fac-3",
        "name": "UPHC Patia Sector 3 & Fever Clinic",
        "type": "UPHC",
        "category": "Government Clinic",
        "district": "Bhubaneswar",
        "address": "Sector 3, Near Infocity Square, Patia",
        "latitude": 20.3588,
        "longitude": 85.8166,
        "phone": "+91-674-2748890",
        "helpline": "104",
        "isOpen24x7": False,
        "operatingHours": "8:00 AM - 8:00 PM",
        "services": ["Outpatient Syndromic Screen", "Blood Sample Collection", "Vaccination", "Telemedicine"],
        "verifiedStock": "Adequate (Diagnostic kits available)",
    },
    {
        "id": "fac-4",
        "name": "Apollo 24/7 Pharmacy & First Aid Point",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Bhubaneswar",
        "address": "Shop 12, Master Canteen Square",
        "latitude": 20.2685,
        "longitude": 85.8402,
        "phone": "+91-674-2530112",
        "isOpen24x7": True,
        "services": ["24/7 OTC Antipyretics", "ORS & Electrolytes", "Mosquito Repellents", "Home Delivery"],
        "verifiedStock": "Verified Stock (Essential Medicines In Stock)",
    },
    {
        "id": "fac-5",
        "name": "MedPlus 24x7 Pharmacy & Diagnostic Point",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Bhubaneswar",
        "address": "KIIT Road, Near Patia Station",
        "latitude": 20.3540,
        "longitude": 85.8190,
        "phone": "+91-674-2725511",
        "isOpen24x7": True,
        "services": ["24/7 Emergency Medicines", "Thermometers & Oximeters", "Water Purification Tablets"],
        "verifiedStock": "Verified Stock (Ample Supply)",
    },
    {
        "id": "fac-6",
        "name": "SCB Medical College & Hospital",
        "type": "HOSPITAL",
        "category": "Govt Medical College",
        "district": "Cuttack",
        "address": "Mangalabag, Cuttack",
        "latitude": 20.4625,
        "longitude": 85.8830,
        "phone": "+91-671-2414004",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["Tertiary Referral Hub", "State Viral Research Lab", "Advanced Critical Care"],
        "verifiedStock": "State Central Repository (Fully Equipped)",
    },
    {
        "id": "fac-7",
        "name": "District Headquarters Hospital (DHH) Puri",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Puri",
        "address": "Grand Road, Puri",
        "latitude": 19.8135,
        "longitude": 85.8312,
        "phone": "+91-6752-222045",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Epidemic Control Unit", "Diarrheal Treatment Center"],
        "verifiedStock": "Adequate",
    },
]


@router.get("/facilities")
def list_facilities(district: str | None = None, facility_type: str | None = None) -> list[dict]:
    """Public locator endpoint for citizens to find nearby healthcare centers & 24/7 pharmacies."""
    res = HEALTH_FACILITIES
    if district:
        res = [f for f in res if f["district"].lower() == district.lower()]
    if facility_type:
        res = [f for f in res if f["type"].upper() == facility_type.upper()]
    return res


@router.get("/risk-summary")
def frontend_risk_summary(
    db: Annotated[Session, Depends(get_db)],
    days: int = 30,
) -> list[dict]:
    """Return area summaries in the shape expected by the frontend dashboard."""
    areas = db.scalars(select(Area).order_by(Area.name)).all()
    return [_frontend_area_summary(db, area, days=days) for area in areas]


@router.get("/{area_id}")
def area_detail(
    area_id: str,
    db: Annotated[Session, Depends(get_db)],
    days: int = 30,
) -> dict:
    clean_id_str = str(area_id).replace("area-", "")
    raw_id = int(clean_id_str) if clean_id_str.isdigit() else None
    area = db.get(Area, raw_id) if raw_id else None
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    return _frontend_area_summary(db, area, days=days)


def _frontend_area_summary(db: Session, area: Area, days: int = 30) -> dict:
    assessment = _latest_assessment(db, area.id)
    signals = _frontend_signals(db, area.id, days=days)
    risk_score = round(assessment.risk_score) if assessment else 0
    risk_level = assessment.risk_level.value if assessment else "LOW"
    
    recent_obs = db.scalars(
        select(Observation)
        .where(Observation.area_id == area.id)
        .order_by(Observation.observed_on.desc(), Observation.id.desc())
        .limit(15)
    ).all()

    observations_list = [
        {
            "id": obs.id,
            "date": obs.observed_on.isoformat(),
            "signalType": obs.signal_type,
            "value": obs.value,
            "source": obs.source,
            "quality": obs.data_quality_score,
        }
        for obs in recent_obs
    ]

    return {
        "id": f"area-{area.id}",
        "rawId": area.id,
        "name": area.name,
        "district": area.district,
        "state": area.state,
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "confidence": round(assessment.confidence) if assessment else 0,
        "trend": assessment.trend if assessment else "STABLE",
        "persistenceWeeks": min(3, round((assessment.persistence_score / 100) * 3)) if assessment else 0,
        "explanation": assessment.explanation if assessment else f"Routine monitoring for {area.name}.",
        "recommendedAction": assessment.recommended_action if assessment else "Continue routine monitoring.",
        "signals": signals,
        "factorScores": {
            "medicine": round(assessment.medicine_score, 1) if assessment else 0,
            "healthIndicators": round(assessment.health_score, 1) if assessment else 0,
            "persistence": round(assessment.persistence_score, 1) if assessment else 0,
            "geographicSpread": round(assessment.geographic_score, 1) if assessment else 0,
        },
        "timeline": _frontend_timeline(db, area.id, risk_score, days=days),
        "recentObservations": observations_list,
        "status": "EARLY_WARNING" if risk_level == "HIGH" else "WATCH" if risk_level == "MEDIUM" else "MONITOR",
        "latitude": area.latitude,
        "longitude": area.longitude,
    }


def _latest_assessment(db: Session, area_id: int) -> RiskAssessment | None:
    return db.scalar(
        select(RiskAssessment)
        .where(RiskAssessment.area_id == area_id)
        .order_by(RiskAssessment.assessed_on.desc(), RiskAssessment.id.desc())
    )


def _frontend_signals(db: Session, area_id: int, days: int = 30) -> dict:
    medicine_current, medicine_baseline = _current_and_baseline(db, area_id, "medicine_demand", days=days)
    fever_current, fever_baseline = _current_and_baseline(db, area_id, "fever_cases", days=days)
    clinic_current, clinic_baseline = _current_and_baseline(db, area_id, "clinic_visits", days=days)
    affected_neighbors, total_neighbors = _neighbor_spread(db, area_id)

    return {
        "medicineDemand": {
            "current": round(medicine_current),
            "baseline": round(medicine_baseline),
            "deviation": _deviation(medicine_current, medicine_baseline),
        },
        "feverIndicators": {
            "current": round(fever_current),
            "baseline": round(fever_baseline),
            "deviation": _deviation(fever_current, fever_baseline),
        },
        "clinicVisits": {
            "current": round(clinic_current),
            "baseline": round(clinic_baseline),
            "deviation": _deviation(clinic_current, clinic_baseline),
        },
        "geographicSpread": {
            "affectedNeighbors": affected_neighbors,
            "totalNeighbors": total_neighbors,
            "deviation": f"+{round((affected_neighbors / total_neighbors) * 100)}%" if total_neighbors else "0%",
        },
    }


def _current_and_baseline(db: Session, area_id: int, signal_type: str, days: int = 30) -> tuple[float, float]:
    observations = db.scalars(
        select(Observation)
        .where(Observation.area_id == area_id, Observation.signal_type == signal_type)
        .order_by(Observation.observed_on.desc())
        .limit(max(days, 28))
    ).all()

    if not observations:
        return 0, 1

    current = observations[0].value
    baseline_values = [observation.value for observation in observations[7:days]] or [
        observation.value for observation in observations[1:]
    ]
    baseline = sum(baseline_values) / len(baseline_values) if baseline_values else current
    return current, baseline or 1


def _frontend_timeline(db: Session, area_id: int, latest_risk_score: int, days: int = 30) -> list[dict]:
    limit_count = max(days, 14)
    medicine_rows = db.scalars(
        select(Observation)
        .where(Observation.area_id == area_id, Observation.signal_type == "medicine_demand")
        .order_by(Observation.observed_on.desc())
        .limit(limit_count)
    ).all()
    fever_rows = db.scalars(
        select(Observation)
        .where(Observation.area_id == area_id, Observation.signal_type == "fever_cases")
        .order_by(Observation.observed_on.desc())
        .limit(limit_count)
    ).all()
    clinic_rows = db.scalars(
        select(Observation)
        .where(Observation.area_id == area_id, Observation.signal_type == "clinic_visits")
        .order_by(Observation.observed_on.desc())
        .limit(limit_count)
    ).all()

    medicine_by_date = {row.observed_on: row.value for row in medicine_rows}
    fever_by_date = {row.observed_on: row.value for row in fever_rows}
    clinic_by_date = {row.observed_on: row.value for row in clinic_rows}
    
    all_dates = sorted(medicine_by_date.keys())
    
    if days <= 7:
        selected_dates = all_dates[-7:]
    elif days <= 30:
        step = max(1, len(all_dates) // 6)
        selected_dates = all_dates[-30::step] or all_dates[-6:]
    else:
        step = max(1, len(all_dates) // 10)
        selected_dates = all_dates[-90::step] or all_dates[-10:]

    if not selected_dates:
        return []

    baseline = sum(medicine_by_date[day] for day in medicine_by_date) / len(medicine_by_date) if medicine_by_date else 100
    timeline = []
    total_pts = len(selected_dates)
    for index, observed_on in enumerate(selected_dates):
        progress = (index + 1) / total_pts
        med_val = medicine_by_date.get(observed_on, baseline)
        fever_val = fever_by_date.get(observed_on, 0)
        clinic_val = clinic_by_date.get(observed_on, round(fever_val * 0.25))
        timeline.append(
            {
                "week": f"Day {observed_on.strftime('%d %b')}" if days <= 7 else f"W{observed_on.isocalendar().week}",
                "date": observed_on.strftime("%Y-%m-%d"),
                "baseline": round(baseline),
                "medicine": round(med_val),
                "fever": round(fever_val),
                "clinic": round(clinic_val),
                "risk": round(latest_risk_score * progress),
            }
        )
    return timeline


def _neighbor_spread(db: Session, area_id: int) -> tuple[int, int]:
    neighbor_ids = db.scalars(
        select(AreaNeighbor.neighbor_area_id).where(AreaNeighbor.area_id == area_id)
    ).all()
    total = len(neighbor_ids)
    if not total:
        return 0, 0

    affected = db.scalar(
        select(func.count(RiskAssessment.id))
        .where(RiskAssessment.area_id.in_(neighbor_ids), RiskAssessment.risk_score >= 40)
    )
    return int(affected or 0), total


def _deviation(current: float, baseline: float) -> str:
    if not baseline:
        return "0%"
    deviation = ((current - baseline) / baseline) * 100
    sign = "+" if deviation >= 0 else ""
    return f"{sign}{round(deviation, 1)}%"
