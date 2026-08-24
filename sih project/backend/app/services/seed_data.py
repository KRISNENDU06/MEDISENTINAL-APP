from datetime import date, timedelta
from random import Random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.domain import Area, AreaNeighbor, HealthReport, Observation, RiskAssessment, RiskLevel, Role, User
from app.services.risk_engine import RiskEngine


AREAS = [
    # 1. Angul District
    ("Angul Town Ward 8 (Nalco Nagar)", "Angul", 20.8444, 85.1511),
    ("Pallahara CHC Sub-Division", "Angul", 21.4333, 85.1833),
    ("Khalari Rural PHC Ward", "Angul", 20.9333, 85.1000),
    ("Talcher Coalfield & Thermal Ward", "Angul", 20.9500, 85.2167),
    ("Kaniha NTPC Township", "Angul", 21.0833, 85.0667),
    ("Athmallik Hospital Corridor", "Angul", 20.7167, 84.5333),
    ("Chhendipada Community Health Centre", "Angul", 21.0833, 84.8667),

    # 2. Khordha / Bhubaneswar
    ("Saheed Nagar Ward 29", "Khurda", 20.2883, 85.8456),
    ("Patia InfoCity Corridor", "Khurda", 20.3588, 85.8166),
    ("Dumduma Housing Board Colony (Ward 62)", "Khurda", 20.2450, 85.7860),
    ("Nayapalli (IRC Village & Behera Sahi)", "Khurda", 20.2980, 85.8180),
    ("Chandrasekharpur (CS Pur Damana)", "Khurda", 20.3240, 85.8180),
    ("Khandagiri & Jagamara Ward", "Khurda", 20.2600, 85.7870),
    ("Old Town Lingaraj Temple Corridor", "Khurda", 20.2400, 85.8330),
    ("Industrial Estate Khurda", "Khurda", 20.1834, 85.6179),

    # 3. Cuttack District
    ("CDA Sector 6 (Bidanasi)", "Cuttack", 20.4789, 85.8364),
    ("Badambadi Transport Corridor", "Cuttack", 20.4500, 85.8750),
    ("Mangalabag & SCB Medical Campus", "Cuttack", 20.4700, 85.8900),
    ("Choudwar Industrial Hub", "Cuttack", 20.5333, 85.9167),
    ("Jagatpur Industrial Zone", "Cuttack", 20.5000, 85.9300),

    # 4. Puri District
    ("Grand Road (Bada Danda) Corridor", "Puri", 19.8135, 85.8312),
    ("VIP Road & Sea Beach Marine Drive", "Puri", 19.7980, 85.8250),
    ("Konark Sun Temple Catchment", "Puri", 19.8876, 86.0945),
    ("Pipili Craft & Heritage Ward", "Puri", 20.1167, 85.8333),
    ("Satyabadi (Sakshigopal)", "Puri", 19.9500, 85.8200),

    # 5. Sundargarh / Rourkela
    ("Rourkela Steel Township (Sector 4)", "Sundargarh", 22.2500, 84.8700),
    ("Civil Township & Uditnagar", "Sundargarh", 22.2400, 84.8300),
    ("Chhend Colony & Basanti Nagar", "Sundargarh", 22.2450, 84.8150),
    ("Koira Mining Belt", "Sundargarh", 21.9167, 85.2333),
    ("Sundargarh District HQ Town", "Sundargarh", 22.1200, 84.0300),

    # 6. Sambalpur District
    ("Burla VIMSAR Medical Ward", "Sambalpur", 21.5000, 83.8700),
    ("Hirakud Dam Catchment", "Sambalpur", 21.5200, 83.8700),
    ("Dhanupali & Ainthapali Wards", "Sambalpur", 21.4700, 83.9800),
    ("Rairakhol Sub-Division", "Sambalpur", 21.0667, 84.3500),

    # 7. Balasore (Baleswar)
    ("Chandipur Coast & Defense Hub", "Balasore", 21.4700, 87.0200),
    ("Balasore Station & Town Ward", "Balasore", 21.4934, 86.9135),
    ("Jaleswar Interstate Gateway", "Balasore", 21.8000, 87.2167),
    ("Soro Sub-Division", "Balasore", 21.2800, 86.6900),

    # 8. Ganjam / Berhampur
    ("Berhampur MKCG Hospital Ward", "Ganjam", 19.3149, 84.7941),
    ("Gopalpur on Sea Port", "Ganjam", 19.2600, 84.9000),
    ("Chhatrapur District HQ", "Ganjam", 19.3500, 84.9800),
    ("Hinjilicut Sub-Division", "Ganjam", 19.4800, 84.7400),
    ("Aska Sugar City", "Ganjam", 19.6100, 84.6600),

    # 9. Bhadrak District
    ("Bhadrak Puruna Bazar Ward", "Bhadrak", 21.0544, 86.4957),
    ("Dhamra Port & Marine Corridor", "Bhadrak", 20.8000, 86.9000),
    ("Basudevpur Coastal Ward", "Bhadrak", 21.1400, 86.7500),
    ("Chandbali Riverine Hub", "Bhadrak", 20.7800, 86.7400),

    # 10. Mayurbhanj District
    ("Baripada Palbani & Heritage Ward", "Mayurbhanj", 21.9322, 86.7233),
    ("Rairangpur Sub-Division", "Mayurbhanj", 22.2700, 86.1700),
    ("Karanjia Similipal Buffer", "Mayurbhanj", 21.7800, 85.9700),
    ("Udala Tribal Catchment", "Mayurbhanj", 21.5700, 86.5700),

    # 11. Keonjhar (Kendujhar)
    ("Keonjhar District Town", "Keonjhar", 21.6289, 85.5817),
    ("Barbil Mining Corridor", "Keonjhar", 22.1200, 85.4000),
    ("Joda Iron Ore Belt", "Keonjhar", 22.0200, 85.4300),
    ("Anandapur Sub-Division", "Keonjhar", 21.2200, 86.1200),

    # 12. Jharsuguda District
    ("Jharsuguda Industrial Ward", "Jharsuguda", 21.8554, 84.0062),
    ("Brajarajnagar Coal Belt", "Jharsuguda", 21.8200, 83.9200),
    ("Belpahar Refractory Ward", "Jharsuguda", 21.8600, 83.8600),

    # 13. Koraput District
    ("Jeypore Main Commercial Ward", "Koraput", 18.8500, 82.5700),
    ("Sunabeda HAL Township", "Koraput", 18.7300, 82.8300),
    ("Damanjodi NALCO Colony", "Koraput", 18.7700, 82.9000),
    ("Kotpad Handloom Catchment", "Koraput", 19.1400, 82.3200),
    ("Koraput Hill Town HQ", "Koraput", 18.8135, 82.7123),

    # 14. Rayagada District
    ("Rayagada Town Ward", "Rayagada", 19.1678, 83.4158),
    ("Gunupur Sub-Division", "Rayagada", 19.0800, 83.8200),
    ("Muniguda Industrial Area", "Rayagada", 19.6300, 83.4900),

    # 15. Kalahandi District
    ("Bhawanipatna District Town", "Kalahandi", 19.9075, 83.1656),
    ("Kesinga Transport Junction", "Kalahandi", 20.2000, 83.2300),
    ("Dharamgarh Agro Catchment", "Kalahandi", 19.8700, 82.7800),

    # 16. Bolangir (Balangir)
    ("Bolangir Town Ward", "Bolangir", 20.7107, 83.4867),
    ("Titilagarh Railway Junction", "Bolangir", 20.3000, 83.1500),
    ("Patnagarh Sub-Division", "Bolangir", 20.7200, 83.1300),

    # 17. Bargarh District
    ("Bargarh Town Ward", "Bargarh", 21.3333, 83.6167),
    ("Padampur Agro Belt", "Bargarh", 20.9800, 83.0700),
    ("Attabira Canal Zone", "Bargarh", 21.3800, 83.8000),

    # 18. Dhenkanal District
    ("Dhenkanal Town Ward", "Dhenkanal", 20.6586, 85.5967),
    ("Kamakhyanagar Sub-Division", "Dhenkanal", 20.9300, 85.5600),
    ("Bhuban Industrial Catchment", "Dhenkanal", 20.8800, 85.8300),

    # 19. Jajpur District
    ("Jajpur Town Ward", "Jajpur", 20.8522, 86.3333),
    ("Vyasanagar (Jajpur Road)", "Jajpur", 20.9500, 86.1300),
    ("Chandikhole Junction", "Jajpur", 20.6800, 86.1500),
    ("Sukinda Chromite Belt", "Jajpur", 20.9700, 85.9200),

    # 20. Kendrapara District
    ("Kendrapara Town Ward", "Kendrapara", 20.4994, 86.4230),
    ("Pattamundai Sub-Division", "Kendrapara", 20.5700, 86.5700),
    ("Rajnagar (Bhitarkanika Zone)", "Kendrapara", 20.5800, 86.8500),

    # 21. Jagatsinghpur District
    ("Jagatsinghpur Town Ward", "Jagatsinghpur", 20.2667, 86.1667),
    ("Paradip Port & Refinery Ward", "Jagatsinghpur", 20.3167, 86.6167),
    ("Tirtol Sub-Division", "Jagatsinghpur", 20.3300, 86.3300),

    # 22. Nayagarh District
    ("Nayagarh Town Ward", "Nayagarh", 20.1333, 85.1000),
    ("Odagaon Temple Corridor", "Nayagarh", 19.9800, 84.9700),
    ("Khandapada (Kantilo Zone)", "Nayagarh", 20.2700, 85.1800),

    # 23. Kandhamal District
    ("Phulbani District Town", "Kandhamal", 20.1333, 84.1500),
    ("Baliguda Tribal Catchment", "Kandhamal", 20.2000, 83.8200),
    ("Daringbadi Hill Station Ward", "Kandhamal", 19.9000, 84.1300),

    # 24. Boudh District
    ("Boudh Town Ward", "Boudh", 20.8333, 84.3167),
    ("Kantamal Sub-Division", "Boudh", 20.6500, 83.7300),
    ("Harbhanga (Charichhak Zone)", "Boudh", 20.8200, 84.6000),

    # 25. Subarnapur (Sonepur)
    ("Sonepur Town Ward", "Subarnapur", 20.8333, 83.9167),
    ("Birmaharajpur Sub-Division", "Subarnapur", 20.8800, 84.0700),
    ("Tarbha Handloom Catchment", "Subarnapur", 20.7300, 83.7500),

    # 26. Nabarangpur District
    ("Nabarangpur Town Ward", "Nabarangpur", 19.2319, 82.5511),
    ("Umerkote Agro Belt", "Nabarangpur", 19.6700, 82.2000),
    ("Khatiguda Catchment", "Nabarangpur", 19.3300, 82.6800),

    # 27. Nuapada District
    ("Nuapada Town Ward", "Nuapada", 20.8333, 82.5333),
    ("Khariar Sub-Division", "Nuapada", 20.2800, 82.7700),
    ("Sinapali Border Catchment", "Nuapada", 20.1500, 82.5200),

    # 28. Malkangiri District
    ("Malkangiri Town Ward", "Malkangiri", 18.3500, 81.9000),
    ("Balimela Dam Catchment", "Malkangiri", 18.2500, 82.1300),
    ("Chitrakonda Hydro Zone", "Malkangiri", 18.1200, 82.0800),

    # 29. Gajapati District
    ("Paralakhemundi Heritage Ward", "Gajapati", 18.8089, 84.1539),
    ("Mohana Tribal Catchment", "Gajapati", 19.4300, 84.2800),
    ("R. Udayagiri Sub-Division", "Gajapati", 19.1700, 84.1500),

    # 30. Deogarh (Debagarh)
    ("Deogarh Town Ward", "Deogarh", 21.5333, 84.7333),
    ("Barkote Forest Catchment", "Deogarh", 21.5500, 85.0200),
    ("Reamal Rural Sub-Division", "Deogarh", 21.3700, 84.6700),
]

DEMO_USERS = [
    ("admin@sih.gov.in", "Dr. Amit Sharma (Admin Lead)", "Admin@12345", Role.ADMIN),
    ("official@sih.gov.in", "Dr. Priya Das (District Health Official)", "Official@12345", Role.HEALTH_OFFICIAL),
    ("viewer@sih.gov.in", "Citizen & Community User (Viewer)", "Viewer@12345", Role.VIEWER),
]


def seed_database(db: Session) -> None:
    for email, full_name, password, role in DEMO_USERS:
        _ensure_user(db, email, full_name, password, role)
    db.commit()

    existing_areas = db.scalars(select(Area)).all()
    existing_names = {a.name.lower() for a in existing_areas}

    new_areas_added = []
    for name, district, lat, lng in AREAS:
        if name.lower() not in existing_names:
            area = Area(name=name, district=district, latitude=lat, longitude=lng)
            db.add(area)
            new_areas_added.append(area)

    if new_areas_added:
        db.flush()
        all_areas = db.scalars(select(Area)).all()
        _seed_observations(db, new_areas_added)
        _seed_neighbors(db, all_areas)
        _seed_health_reports(db, all_areas)
        db.commit()
        RiskEngine(db).run_for_all_areas()
        return

    if existing_areas:
        db.commit()
        if not db.scalar(select(Observation.id).limit(1)):
            _seed_observations(db, existing_areas)
            db.commit()
        if not db.scalar(select(AreaNeighbor.id).limit(1)):
            _seed_neighbors(db, existing_areas)
            db.commit()
        _seed_health_reports(db, existing_areas)
        db.commit()
        if not db.scalar(select(RiskAssessment.id).limit(1)):
            RiskEngine(db).run_for_all_areas()
        return


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
    existing_pairs = set(db.execute(select(AreaNeighbor.area_id, AreaNeighbor.neighbor_area_id)).all())
    for index, area in enumerate(areas):
        for neighbor in areas[max(0, index - 1) : index] + areas[index + 1 : index + 3]:
            if (area.id, neighbor.id) not in existing_pairs:
                db.add(AreaNeighbor(area_id=area.id, neighbor_area_id=neighbor.id))
                existing_pairs.add((area.id, neighbor.id))


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


def _seed_health_reports(db: Session, areas: list[Area]) -> None:
    if db.scalar(select(HealthReport.id).limit(1)):
        return

    official_user = db.scalar(select(User).where(User.role == Role.HEALTH_OFFICIAL))
    officer_id = official_user.id if official_user else None
    officer_name = official_user.full_name if official_user else "Dr. Priya Das (District Health Official)"

    reports = [
        {
            "area_name": "Area A (Saheed Nagar)",
            "title": "Field Surveillance Directive: Vector-Borne Febrile Cluster in Saheed Nagar",
            "signals": '{"fever_cases_surge": "+58% (7-Day)", "otc_paracetamol_demand": "+64%", "vector_larval_density": "High (Breteau Index 38)", "water_contamination": "Normal (Chlorine 0.4ppm)"}',
            "risk": RiskLevel.HIGH,
            "notes": "Door-to-door sentinel survey across 65 households in Sector 4 revealed clustered febrile illness with joint pain. Retail pharmacies report localized stockpiling of antipyretics.",
            "recommendations": '["Deploy municipal vector fogging in Sectors 3 & 4 immediately", "Set up daily fever screening triage booth at UPHC Saheed Nagar", "Distribute free ORS and paracetamol packets through ASHA workers", "Issue public advisory on eliminating stagnant water containers"]',
            "days_ago": 1,
        },
        {
            "area_name": "Area B (Patia)",
            "title": "Clinical Assessment: Waterborne Enteric Anomaly & Sanitation Directive",
            "signals": '{"gi_symptoms_trend": "+42%", "ors_sales_spike": "+35%", "water_source_turbidity": "Elevated (Pipeline repair in progress)", "clinic_footfalls": "+28%"}',
            "risk": RiskLevel.MEDIUM,
            "notes": "Sporadic acute gastroenteritis cases reported near KIIT square corridor. Water tanker supply tested positive for mild coliform presence.",
            "recommendations": '["Issue immediate boiling water notice for Patia Ward 7", "Mobile chlorine tablet distribution by BMC sanitation teams", "Intensified hydration surveillance at Patia UPHC", "Inspect commercial food vendors in student hostel zone"]',
            "days_ago": 2,
        },
    ]

    for rep in reports:
        matching_area = next((a for a in areas if rep["area_name"].lower() in a.name.lower()), areas[0] if areas else None)
        if matching_area:
            db.add(
                HealthReport(
                    area_id=matching_area.id,
                    officer_id=officer_id,
                    officer_name=officer_name,
                    officer_designation="District Health Official",
                    report_title=rep["title"],
                    observed_signals=rep["signals"],
                    risk_level=rep["risk"],
                    clinical_notes=rep["notes"],
                    recommendations=rep["recommendations"],
                    reported_date=date.today() - timedelta(days=rep["days_ago"]),
                    is_public=True,
                )
            )

