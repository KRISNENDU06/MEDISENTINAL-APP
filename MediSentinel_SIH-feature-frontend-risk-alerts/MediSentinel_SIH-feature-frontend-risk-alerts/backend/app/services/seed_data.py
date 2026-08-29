from datetime import date, timedelta
from random import Random

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.domain import (
    ActivityLog,
    Alert,
    Area,
    AreaNeighbor,
    HealthReport,
    Observation,
    RiskAssessment,
    RiskLevel,
    Role,
    User,
)
from app.services.risk_engine import RiskEngine


# Exactly 3 Authentic Monitored Wards per District across all 30 Odisha Districts (90 Wards Total)
AREAS = [
    # 1. Angul District
    ("Angul Town Ward 8 (Nalco Nagar)", "Angul", 20.8444, 85.1511),
    ("Talcher Coalfield & Thermal Ward", "Angul", 20.9500, 85.2167),
    ("Pallahara CHC Sub-Division", "Angul", 21.4333, 85.1833),

    # 2. Balangir (Bolangir)
    ("Bolangir Town Ward (Daily Market)", "Bolangir", 20.7107, 83.4867),
    ("Titilagarh Railway Junction Corridor", "Bolangir", 20.3000, 83.1500),
    ("Patnagarh Sub-Divisional Hospital Ward", "Bolangir", 20.7200, 83.1300),

    # 3. Balasore (Baleswar)
    ("Balasore Station & Town Ward", "Balasore", 21.4934, 86.9135),
    ("Chandipur Coast & Defense Hub", "Balasore", 21.4700, 87.0200),
    ("Soro Sub-Division", "Balasore", 21.2800, 86.6900),

    # 4. Bargarh
    ("Bargarh Town Ward (Main Market)", "Bargarh", 21.3333, 83.6167),
    ("Padampur Agro Belt", "Bargarh", 20.9800, 83.0700),
    ("Attabira Canal Zone", "Bargarh", 21.3800, 83.8000),

    # 5. Bhadrak
    ("Bhadrak Puruna Bazar Ward", "Bhadrak", 21.0544, 86.4957),
    ("Dhamra Port & Marine Corridor", "Bhadrak", 20.8000, 86.9000),
    ("Basudevpur Coastal Ward", "Bhadrak", 21.1400, 86.7500),

    # 6. Boudh (Baudh)
    ("Boudh Town Ward", "Boudh", 20.8333, 84.3167),
    ("Kantamal Sub-Division", "Boudh", 20.6500, 83.7300),
    ("Harbhanga (Charichhak Zone)", "Boudh", 20.8200, 84.6000),

    # 7. Cuttack
    ("CDA Sector 6 (Bidanasi)", "Cuttack", 20.4789, 85.8364),
    ("Mangalabag & SCB Medical Campus", "Cuttack", 20.4700, 85.8900),
    ("Badambadi Transport Corridor", "Cuttack", 20.4500, 85.8750),

    # 8. Deogarh (Debagarh)
    ("Deogarh Town Ward", "Deogarh", 21.5333, 84.7333),
    ("Barkote Forest Catchment", "Deogarh", 21.5500, 85.0200),
    ("Reamal Rural Sub-Division", "Deogarh", 21.3700, 84.6700),

    # 9. Dhenkanal
    ("Dhenkanal Town Ward", "Dhenkanal", 20.6586, 85.5967),
    ("Kamakhyanagar Sub-Division", "Dhenkanal", 20.9300, 85.5600),
    ("Bhuban Industrial Catchment", "Dhenkanal", 20.8800, 85.8300),

    # 10. Gajapati
    ("Paralakhemundi Heritage Ward", "Gajapati", 18.8089, 84.1539),
    ("Mohana Tribal Catchment", "Gajapati", 19.4300, 84.2800),
    ("R. Udayagiri Sub-Division", "Gajapati", 19.1700, 84.1500),

    # 11. Ganjam
    ("Berhampur MKCG Hospital Ward", "Ganjam", 19.3149, 84.7941),
    ("Gopalpur on Sea Port", "Ganjam", 19.2600, 84.9000),
    ("Aska Sugar City Corridor", "Ganjam", 19.6100, 84.6600),

    # 12. Jagatsinghpur
    ("Paradip Port & Refinery Ward", "Jagatsinghpur", 20.3167, 86.6167),
    ("Jagatsinghpur Town Ward", "Jagatsinghpur", 20.2667, 86.1667),
    ("Tirtol Sub-Division", "Jagatsinghpur", 20.3300, 86.3300),

    # 13. Jajpur
    ("Vyasanagar (Jajpur Road)", "Jajpur", 20.9500, 86.1300),
    ("Kalinganagar Industrial City Hub", "Jajpur", 20.9600, 86.0500),
    ("Jajpur Town Ward", "Jajpur", 20.8522, 86.3333),

    # 14. Jharsuguda
    ("Jharsuguda Industrial Ward", "Jharsuguda", 21.8554, 84.0062),
    ("Brajarajnagar Coal Belt", "Jharsuguda", 21.8200, 83.9200),
    ("Belpahar Refractory Ward", "Jharsuguda", 21.8600, 83.8600),

    # 15. Kalahandi
    ("Bhawanipatna District Town", "Kalahandi", 19.9075, 83.1656),
    ("Kesinga Transport Junction", "Kalahandi", 20.2000, 83.2300),
    ("Dharamgarh Agro Catchment", "Kalahandi", 19.8700, 82.7800),

    # 16. Kandhamal
    ("Phulbani District Town", "Kandhamal", 20.1333, 84.1500),
    ("Daringbadi Hill Station Ward", "Kandhamal", 19.9000, 84.1300),
    ("Baliguda Tribal Catchment", "Kandhamal", 20.2000, 83.8200),

    # 17. Kendrapara
    ("Kendrapara Town Ward", "Kendrapara", 20.4994, 86.4230),
    ("Pattamundai Sub-Division", "Kendrapara", 20.5700, 86.5700),
    ("Rajnagar (Bhitarkanika Zone)", "Kendrapara", 20.5800, 86.8500),

    # 18. Keonjhar (Kendujhar)
    ("Barbil Mining Corridor", "Keonjhar", 22.1200, 85.4000),
    ("Keonjhar District Town", "Keonjhar", 21.6289, 85.5817),
    ("Joda Iron Ore Belt", "Keonjhar", 22.0200, 85.4300),

    # 19. Khordha / Bhubaneswar
    ("Saheed Nagar Ward 29", "Khurda", 20.2883, 85.8456),
    ("Patia InfoCity Corridor", "Khurda", 20.3588, 85.8166),
    ("Dumduma Housing Board Colony (Ward 62)", "Khurda", 20.2450, 85.7860),

    # 20. Koraput
    ("Jeypore Main Commercial Ward", "Koraput", 18.8500, 82.5700),
    ("Sunabeda HAL Township", "Koraput", 18.7300, 82.8300),
    ("Koraput Hill Town & SLN Medical HQ", "Koraput", 18.8135, 82.7123),

    # 21. Malkangiri
    ("Malkangiri Town Ward", "Malkangiri", 18.3500, 81.9000),
    ("Balimela Dam Catchment", "Malkangiri", 18.2500, 82.1300),
    ("Chitrakonda Hydro Zone", "Malkangiri", 18.1200, 82.0800),

    # 22. Mayurbhanj
    ("Baripada Palbani & Heritage Ward", "Mayurbhanj", 21.9322, 86.7233),
    ("Rairangpur Sub-Division", "Mayurbhanj", 22.2700, 86.1700),
    ("Karanjia Similipal Buffer", "Mayurbhanj", 21.7800, 85.9700),

    # 23. Nabarangpur
    ("Nabarangpur Town Ward", "Nabarangpur", 19.2319, 82.5511),
    ("Umerkote Agro Belt", "Nabarangpur", 19.6700, 82.2000),
    ("Khatiguda Catchment", "Nabarangpur", 19.3300, 82.6800),

    # 24. Nayagarh
    ("Nayagarh Town Ward", "Nayagarh", 20.1333, 85.1000),
    ("Odagaon Temple Corridor", "Nayagarh", 19.9800, 84.9700),
    ("Khandapada (Kantilo Zone)", "Nayagarh", 20.2700, 85.1800),

    # 25. Nuapada
    ("Nuapada Town Ward", "Nuapada", 20.8333, 82.5333),
    ("Khariar Sub-Division", "Nuapada", 20.2800, 82.7700),
    ("Sinapali Border Catchment", "Nuapada", 20.1500, 82.5200),

    # 26. Puri
    ("Grand Road (Bada Danda) Corridor", "Puri", 19.8135, 85.8312),
    ("VIP Road & Sea Beach Marine Drive", "Puri", 19.7980, 85.8250),
    ("Konark Sun Temple Catchment", "Puri", 19.8876, 86.0945),

    # 27. Rayagada
    ("Rayagada Town Ward", "Rayagada", 19.1678, 83.4158),
    ("Gunupur Sub-Division", "Rayagada", 19.0800, 83.8200),
    ("Muniguda Industrial Area", "Rayagada", 19.6300, 83.4900),

    # 28. Sambalpur
    ("Burla VIMSAR Medical Ward", "Sambalpur", 21.5000, 83.8700),
    ("Hirakud Dam Catchment", "Sambalpur", 21.5200, 83.8700),
    ("Dhanupali & Ainthapali Wards", "Sambalpur", 21.4700, 83.9800),

    # 29. Subarnapur (Sonepur)
    ("Sonepur Town Ward", "Subarnapur", 20.8333, 83.9167),
    ("Birmaharajpur Sub-Division", "Subarnapur", 20.8800, 84.0700),
    ("Tarbha Handloom Catchment", "Subarnapur", 20.7333, 83.7500),

    # 30. Sundargarh (Rourkela)
    ("Rourkela Steel Township (Sector 4)", "Sundargarh", 22.2500, 84.8700),
    ("Civil Township & Uditnagar", "Sundargarh", 22.2400, 84.8300),
    ("Koira Mining Belt", "Sundargarh", 21.9167, 85.2333),
]

DEMO_USERS = [
    ("admin@sih.gov.in", "Dr. Amit Sharma (Chief Medical Administrator)", "Admin@12345", Role.ADMIN),
    ("official@sih.gov.in", "Dr. Priya Das (District Surveillance Officer / IDSP)", "Official@12345", Role.HEALTH_OFFICIAL),
    ("viewer@sih.gov.in", "Citizen & Community User (Public Viewer)", "Viewer@12345", Role.VIEWER),
]


def seed_database(db: Session) -> None:
    """Standard startup seeder with idempotency."""
    for email, full_name, password, role in DEMO_USERS:
        _ensure_user(db, email, full_name, password, role)
    db.commit()

    existing_areas = db.scalars(select(Area)).all()
    if not existing_areas or len(existing_areas) < len(AREAS):
        reseed_database(db)
    else:
        if not db.scalar(select(Observation.id).limit(1)):
            _seed_observations(db, existing_areas)
            db.commit()
        if not db.scalar(select(AreaNeighbor.id).limit(1)):
            _seed_neighbors(db, existing_areas)
            db.commit()
        if not db.scalar(select(HealthReport.id).limit(1)):
            _seed_health_reports(db, existing_areas)
            db.commit()
        if not db.scalar(select(RiskAssessment.id).limit(1)):
            RiskEngine(db).run_for_all_areas()


def reseed_database(db: Session) -> None:
    """Full database purge and authentic re-seeding covering all 30 districts & 90 wards."""
    # 1. Clean existing tables in proper FK order
    db.execute(delete(Alert))
    db.execute(delete(HealthReport))
    db.execute(delete(RiskAssessment))
    db.execute(delete(Observation))
    db.execute(delete(AreaNeighbor))
    db.execute(delete(Area))
    db.commit()

    # 2. Ensure Users
    for email, full_name, password, role in DEMO_USERS:
        _ensure_user(db, email, full_name, password, role)
    db.commit()

    # 3. Seed all 90 Wards
    all_areas: list[Area] = []
    for name, district, lat, lng in AREAS:
        area = Area(name=name, district=district, latitude=lat, longitude=lng)
        db.add(area)
        all_areas.append(area)
    db.flush()

    # 4. Seed Neighbors (Contiguous edges)
    _seed_neighbors(db, all_areas)
    db.flush()

    # 5. Seed Authentic Epidemiological Observations (High, Medium, Low Risk Profiles)
    _seed_observations(db, all_areas)
    db.flush()

    # 6. Seed Authentic IDSP Official Reports
    _seed_health_reports(db, all_areas)
    db.commit()

    # 7. Run Risk Engine to compute baselines, risk assessments, and generate alerts
    RiskEngine(db).run_for_all_areas()
    db.commit()


def _ensure_user(db: Session, email: str, full_name: str, password: str, role: Role) -> None:
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        db.add(
            User(
                email=email,
                full_name=full_name,
                hashed_password=get_password_hash(password),
                role=role,
            )
        )
    else:
        user.full_name = full_name
        user.role = role


def _seed_neighbors(db: Session, areas: list[Area]) -> None:
    existing_pairs = set()
    # Group by district first
    district_map: dict[str, list[Area]] = {}
    for a in areas:
        district_map.setdefault(a.district, []).append(a)

    # 1. Connect intra-district wards to each other
    for dist, dist_areas in district_map.items():
        for i, a1 in enumerate(dist_areas):
            for a2 in dist_areas[i + 1 :]:
                if (a1.id, a2.id) not in existing_pairs:
                    db.add(AreaNeighbor(area_id=a1.id, neighbor_area_id=a2.id))
                    db.add(AreaNeighbor(area_id=a2.id, neighbor_area_id=a1.id))
                    existing_pairs.add((a1.id, a2.id))
                    existing_pairs.add((a2.id, a1.id))

    # 2. Connect contiguous neighboring districts
    for i, a in enumerate(areas):
        if i + 3 < len(areas):
            n = areas[i + 3]
            if (a.id, n.id) not in existing_pairs:
                db.add(AreaNeighbor(area_id=a.id, neighbor_area_id=n.id))
                db.add(AreaNeighbor(area_id=n.id, neighbor_area_id=a.id))
                existing_pairs.add((a.id, n.id))
                existing_pairs.add((n.id, a.id))


def _seed_observations(db: Session, areas: list[Area]) -> None:
    rng = Random(42)
    today = date.today()
    start = today - timedelta(days=100)

    # Defined Outbreak & Elevation Classifications
    # 🔴 HIGH RISK (Critical Anomaly Surges: +60% to +85%)
    HIGH_RISK_WARDS = {
        "Angul Town Ward 8 (Nalco Nagar)",
        "Saheed Nagar Ward 29",
        "Mangalabag & SCB Medical Campus",
        "Barbil Mining Corridor",
        "Berhampur MKCG Hospital Ward",
        "Jeypore Main Commercial Ward",
        "Bhadrak Puruna Bazar Ward",
        "Rourkela Steel Township (Sector 4)",
    }

    # 🟡 MEDIUM RISK (Elevated Sentinel Ingestions: +20% to +35%)
    MEDIUM_RISK_WARDS = {
        "Patia InfoCity Corridor",
        "Grand Road (Bada Danda) Corridor",
        "Jharsuguda Industrial Ward",
        "Bhawanipatna District Town",
        "Dhenkanal Town Ward",
        "Balasore Station & Town Ward",
        "Burla VIMSAR Medical Ward",
        "Paradip Port & Refinery Ward",
        "Vyasanagar (Jajpur Road)",
        "Bolangir Town Ward (Daily Market)",
        "Phulbani District Town",
        "Rayagada Town Ward",
    }

    # Standard nominal baseline signals
    signal_profiles = {
        "medicine_demand": 105,
        "fever_cases": 35,
        "respiratory_symptoms": 28,
        "clinic_visits": 22,
        "gi_symptoms": 16,
        "water_quality": 3.2,
    }

    for day_offset in range(101):
        observed_on = start + timedelta(days=day_offset)
        seasonal_factor = 1.10 if observed_on.month in {7, 8, 9, 12, 1} else 1.0

        for area in areas:
            is_high = area.name in HIGH_RISK_WARDS
            is_medium = area.name in MEDIUM_RISK_WARDS

            for signal_type, base in signal_profiles.items():
                value = base * seasonal_factor
                value += rng.uniform(-0.06, 0.06) * value

                # Apply surge curves for HIGH RISK wards in recent 18 days
                if is_high and observed_on >= today - timedelta(days=18):
                    if signal_type == "medicine_demand":
                        value *= 1.72  # +72% spike in Dolo/Paracetamol
                    elif signal_type in ("fever_cases", "respiratory_symptoms"):
                        value *= 1.65  # +65% spike in syndromic fever
                    elif signal_type == "clinic_visits":
                        value *= 1.55  # +55% hospital OPD surge
                    elif signal_type == "water_quality":
                        value = 9.4  # Elevated turbidity/coliform lab indicator

                # Apply moderate elevation curves for MEDIUM RISK wards in recent 10 days
                elif is_medium and observed_on >= today - timedelta(days=10):
                    if signal_type == "medicine_demand":
                        value *= 1.30  # +30% elevation
                    elif signal_type in ("fever_cases", "clinic_visits"):
                        value *= 1.28  # +28% elevation
                    elif signal_type == "water_quality":
                        value = 6.2

                # Ingest observation
                db.add(
                    Observation(
                        area_id=area.id,
                        observed_on=observed_on,
                        signal_type=signal_type,
                        category=_category_for_signal(signal_type),
                        value=max(0.1, round(value, 2)),
                        source="Retail Pharmacy & Hospital Telemetry",
                        data_quality_score=0.96,
                    )
                )


def _category_for_signal(signal_type: str) -> str:
    if signal_type == "medicine_demand":
        return "fever_respiratory_medicines"
    if signal_type in ("fever_cases", "respiratory_symptoms"):
        return "respiratory_fever"
    if signal_type == "gi_symptoms":
        return "gastrointestinal"
    if signal_type == "water_quality":
        return "environmental_water"
    return "general"


def _seed_health_reports(db: Session, areas: list[Area]) -> None:
    official_user = db.scalar(select(User).where(User.role == Role.HEALTH_OFFICIAL))
    officer_id = official_user.id if official_user else None

    # Realistic Authentic Field Health Reports across High, Medium, and Low Risk Zones
    authentic_reports = [
        # 1. Angul Outbreak Report (HIGH)
        {
            "area_name": "Angul Town Ward 8 (Nalco Nagar)",
            "title": "Field Surveillance Directive: Vector-Borne Dengue Cluster in Nalco Nagar",
            "officer_name": "Dr. Priya Das",
            "officer_designation": "District Surveillance Officer (DSO / IDSP Khurda & Angul)",
            "signals": '["Acute Fever Cluster Surge (+72%)", "OTC Dolo-650 & Paracetamol Purchases (+78%)", "Vector Larval Density High (Breteau Index 42)", "Platelet Drop Clustered in 14 Patients", "Etiology: VECTOR", "RRT: Level 2 Deployment Active"]',
            "risk": RiskLevel.HIGH,
            "notes": "Door-to-door syndromic fever survey across 85 households in Nalco Nagar Sector 2 & 3 revealed clustered acute febrile illness with severe retro-orbital pain and arthralgia. Retail pharmacy telemetry confirmed localized stockpiling of antipyretics and ORS. Rapid Response Team (RRT) deployed.",
            "recommendations": '["Deploy municipal chemical thermal fogging (Malathion/Pyrethrum) across Sectors 1-4 immediately", "Establish 24/7 dedicated fever triage and NS1/IgM rapid testing booth at Angul DHH", "Distribute free ORS sachets and paracetamol blister packs via ASHA community workers", "Issue civic notice to empty overhead open water tanks and air coolers"]',
            "days_ago": 1,
        },

        # 2. SCB Medical Cuttack Outbreak Directive (HIGH)
        {
            "area_name": "Mangalabag & SCB Medical Campus",
            "title": "Epidemiological Alert: Inpatient Pyrexia & Thrombocytopenia Surge",
            "officer_name": "Dr. Debashish Patnaik",
            "officer_designation": "Chief Medical Officer (IDSP Outbreak Cell Cuttack)",
            "signals": '["Hospital OPD Fever Footfall (+78%)", "Platelet Concentrate Requisition Spike (+65%)", "Serology NS1 Positivity Rate: 28.4%", "Etiology: VECTOR / PUO", "RRT: Level 3 State MMU Deployed"]',
            "risk": RiskLevel.HIGH,
            "notes": "SCB Medical College OPD registry records acute spike in high-grade pyrexia admissions originating from Mangalabag and Ranihat catchment. Blood bank platelet requisitions elevated by 65%. 50 dedicated isolation beds activated.",
            "recommendations": '["Activate 50 additional pediatric and adult fever isolation beds in SCB Ward 11", "Enforce daily entomological larval source reduction in Ranihat-Mangalabag canal corridor", "Mandate all private clinical laboratories to upload NS1/IgM ELISA positive results to IHIP within 6 hours", "Conduct evening anti-larval spray in student hostels and residential colonies"]',
            "days_ago": 2,
        },

        # 3. Barbil Mining Belt Contamination Directive (HIGH)
        {
            "area_name": "Barbil Mining Corridor",
            "title": "Environmental Health Assessment: Enteric Anomaly & Mine Runoff Contamination",
            "officer_name": "Dr. Snigdha Mishra",
            "officer_designation": "District Health Officer (IDSP Keonjhar)",
            "signals": '["Drinking Water Turbidity: 9.4 NTU (Coliform Positive)", "Acute Diarrheal Footfalls (+58%)", "Zinc/ORS Pharmacy Sales Surge (+62%)", "Etiology: WATER-BORNE", "RRT: Level 2 Deployed"]',
            "risk": RiskLevel.HIGH,
            "notes": "Drinking water supply samples from mining township pipelines showed elevated coliform count following heavy monsoon runoff. Sero-epidemiological sampling identified acute gastroenteritis cluster in labor colonies.",
            "recommendations": '["Shut down affected tube well pumping stations and initiate super-chlorination of water storage sumps", "Distribute halogen water purification tablets and ORS packets to 500 households in mining belt", "Deploy Mobile Health Unit (MMU) with rapid diagnostic kits for door-to-door waterborne screening", "Issue public boil-water advisory via loudspeakers across Barbil market area"]',
            "days_ago": 2,
        },

        # 4. Saheed Nagar Febrile Warning (HIGH)
        {
            "area_name": "Saheed Nagar Ward 29",
            "title": "Surveillance Warning: Early Syndromic Fever Cluster in BMC Ward 29",
            "officer_name": "Dr. Priya Das",
            "officer_designation": "District Surveillance Officer (IDSP Khurda)",
            "signals": '["OTC Antipyretic Demand (+65%)", "UPHC Saheed Nagar Fever Footfall (+55%)", "Stagnant Storm Water Inundation", "Etiology: VECTOR", "RRT: Level 2 In Field"]',
            "risk": RiskLevel.HIGH,
            "notes": "Syndromic monitoring indicates clustered febrile complaints centered around Lane 4 and Maharshi College Road. Vector density index elevated due to stormwater clogging.",
            "recommendations": '["BMC sanitation squad to clear clogged storm runoff drains along Lane 3 and Lane 4", "Intensify ASHA fever tracker surveys in high-density residential blocks", "Conduct larvicidal Temephos application in domestic water storage drums"]',
            "days_ago": 3,
        },

        # 5. Patia InfoCity Sentinel Notice (MEDIUM)
        {
            "area_name": "Patia InfoCity Corridor",
            "title": "Sentinel Surveillance: Moderate Acute Respiratory & Viral Ingestion",
            "officer_name": "Dr. Amit Sharma",
            "officer_designation": "Chief Medical Administrator (IDSP Central Command)",
            "signals": '["Upper Respiratory / SARI Footfall (+32%)", "OTC Cough Syrups & Antihistamines (+35%)", "Etiology: RESPIRATORY", "RRT: Level 1 Monitoring"]',
            "risk": RiskLevel.MEDIUM,
            "notes": "Moderate increase in outpatient consultations for viral upper respiratory tract infections among student hostels and tech corridor. No severe acute respiratory distress cases observed.",
            "recommendations": '["Circulate respiratory hygiene protocols to educational institutions and corporate campuses", "Stockpile azithromycin and cetirizine at Patia UPHC", "Monitor daily ILI consultations for any sudden doubling rate"]',
            "days_ago": 4,
        },

        # 6. Puri Pilgrim Transit Health Directive (MEDIUM)
        {
            "area_name": "Grand Road (Bada Danda) Corridor",
            "title": "Pilgrim Transit Health Protocol: Enteric Prevention & Food Safety Directive",
            "officer_name": "Dr. Manoranjan Behera",
            "officer_designation": "District Health Official (Puri Pilgrim Surveillance Cell)",
            "signals": '["Mild Enteric Consultations (+28%)", "Drinking Water Chlorine Residual 0.2 ppm", "Etiology: ENTERIC", "RRT: Level 1 Active"]',
            "risk": RiskLevel.MEDIUM,
            "notes": "Large pilgrim transit along Grand Road indicates mild increase in acute diarrheal OPD visits. Potable water tankers inspected and verified for chlorine adequacy.",
            "recommendations": '["Sanitation teams to conduct mandatory daily testing of municipal water tankers at Bada Danda", "Inspect food hygiene standards across street food vendors along VIP Road corridor", "Distribute free ORS packets at railway station and bus terminal first-aid kiosks"]',
            "days_ago": 5,
        },

        # 7. Berhampur Seasonal Vigilance Directive (HIGH)
        {
            "area_name": "Berhampur MKCG Hospital Ward",
            "title": "Field Directive: Vector Triage Protocols at MKCG Hospital Corridor",
            "officer_name": "Dr. Manoranjan Behera",
            "officer_designation": "District Surveillance Officer (Ganjam)",
            "signals": '["Fever OPD Footfall (+68%)", "OTC Paracetamol Demand (+70%)", "Platelet Monitoring Protocol: Active", "Etiology: VECTOR"]',
            "risk": RiskLevel.HIGH,
            "notes": "MKCG Medical College reports localized febrile clusters from Hillpatna and Gosaninuagaon. Rapid testing counters established at OPD entrance.",
            "recommendations": '["Institute mandatory 3-hour turnaround for all dengue NS1 rapid test results", "Deploy fogging vehicles in all residential colonies within 2 km radius of MKCG campus", "ASHA workers to distribute mosquito bed nets in urban vulnerable slum pockets"]',
            "days_ago": 3,
        },

        # 8. Sambalpur VIMSAR Normal Baseline Surveillance (LOW)
        {
            "area_name": "Burla VIMSAR Medical Ward",
            "title": "Routine IDSP Bulletin: Seasonal Epidemiological Baseline Stability",
            "officer_name": "Dr. Subhashree Mohanty",
            "officer_designation": "District Surveillance Officer (Sambalpur)",
            "signals": '["All Syndromic Signals within ±6% of 90-Day Baseline", "Water Quality Index: 2.8 NTU (Potable)", "Etiology: SEASONAL BASELINE", "RRT: Standby"]',
            "risk": RiskLevel.LOW,
            "notes": "Routine weekly surveillance across Burla and Hirakud indicates baseline normal patient footfalls with no clustering of febrile or enteric anomalies.",
            "recommendations": '["Maintain standard seasonal disease surveillance registers at Burla VIMSAR", "Continue routine weekly chlorination monitoring of Mahanadi intake supply", "Ensure adequate contingency stock of antipyretics and essential antibiotics"]',
            "days_ago": 6,
        },
    ]

    for rep in authentic_reports:
        matching_area = next((a for a in areas if rep["area_name"].lower() in a.name.lower()), areas[0] if areas else None)
        if matching_area:
            db.add(
                HealthReport(
                    area_id=matching_area.id,
                    officer_id=officer_id,
                    officer_name=rep["officer_name"],
                    officer_designation=rep["officer_designation"],
                    report_title=rep["title"],
                    observed_signals=rep["signals"],
                    risk_level=rep["risk"],
                    clinical_notes=rep["notes"],
                    recommendations=rep["recommendations"],
                    reported_date=date.today() - timedelta(days=rep["days_ago"]),
                    is_public=True,
                )
            )

