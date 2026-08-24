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
    # 1. Angul
    {
        "id": "fac-ang-1",
        "name": "District Headquarters Hospital (DHH) Angul",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Angul",
        "ward": "Angul Town Ward 8 (Nalco Nagar)",
        "address": "Hospital Road, Near Collectorate, Angul Town",
        "latitude": 20.8444,
        "longitude": 85.1511,
        "phone": "+91-6764-230401",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & Trauma", "Epidemic Isolation Ward", "Blood Bank", "Free Diagnostic Pathology"],
        "verifiedStock": "Verified High (Antipyretics, IV Fluids & ORS in stock)",
    },
    {
        "id": "fac-ang-2",
        "name": "Sub-Divisional Hospital (SDH) Pallahara",
        "type": "HOSPITAL",
        "category": "Govt Sub-Divisional Hospital",
        "district": "Angul",
        "ward": "Pallahara Sub-Division CHC",
        "address": "Main Road, Pallahara, Angul",
        "latitude": 21.4333,
        "longitude": 85.2000,
        "phone": "+91-6765-279220",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Maternity & Child Health", "Fever Triage Desk", "Free Essential Drugs"],
        "verifiedStock": "Adequate Stock",
    },
    {
        "id": "fac-ang-3",
        "name": "Primary Health Centre (PHC) Khalari",
        "type": "UPHC",
        "category": "Govt Rural PHC",
        "district": "Angul",
        "ward": "Khalari Rural Catchment PHC",
        "address": "Village Post Khalari, Block Angul",
        "latitude": 20.9167,
        "longitude": 85.0833,
        "phone": "+91-6764-231180",
        "helpline": "104",
        "isOpen24x7": False,
        "operatingHours": "8:00 AM - 8:00 PM (Emergency 24x7 on-call)",
        "services": ["Outpatient Syndromic Screen", "Rapid Malaria & Typhoid Kits", "ORS Distribution"],
        "verifiedStock": "High (Paracetamol & ORS Ready)",
    },
    {
        "id": "fac-ang-4",
        "name": "Sub-Divisional Hospital (SDH) Talcher",
        "type": "HOSPITAL",
        "category": "Govt Sub-Divisional Hospital",
        "district": "Angul",
        "ward": "Talcher Coalfield & Thermal Ward",
        "address": "MCL Highway Road, Talcher",
        "latitude": 20.9500,
        "longitude": 85.2167,
        "phone": "+91-6760-240108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Trauma Care", "Industrial Dust & Respiratory Clinic", "Burn Unit", "Blood Storage"],
        "verifiedStock": "High (Inhalers & Critical Care Meds)",
    },
    {
        "id": "fac-ang-5",
        "name": "NTPC Kaniha Community Hospital",
        "type": "HOSPITAL",
        "category": "Govt / PSU Hospital",
        "district": "Angul",
        "ward": "Kaniha NTPC Township Ward",
        "address": "NTPC Township, Kaniha",
        "latitude": 21.0833,
        "longitude": 85.0500,
        "phone": "+91-6760-243200",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "General Medicine", "Pediatric Care"],
        "verifiedStock": "Fully Stocked",
    },
    {
        "id": "fac-ang-6",
        "name": "Sanjeevani 24/7 Pharmacy & Emergency Meds",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Angul",
        "ward": "Angul Town Ward 8 (Nalco Nagar)",
        "address": "Main Daily Market Square, Angul",
        "latitude": 20.8420,
        "longitude": 85.1530,
        "phone": "+91-6764-234550",
        "isOpen24x7": True,
        "services": ["24/7 OTC Antipyretics", "ORS & Rehydration Kits", "Thermometers & Nebulizers", "Oxygen Cylinder Supply"],
        "verifiedStock": "Verified Available",
    },
    {
        "id": "fac-ang-7",
        "name": "Apollo Pharmacy 24/7 Talcher",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Angul",
        "ward": "Talcher Coalfield & Thermal Ward",
        "address": "Hatatota Main Chowk, Talcher",
        "latitude": 20.9520,
        "longitude": 85.2190,
        "phone": "+91-6760-241234",
        "isOpen24x7": True,
        "services": ["24/7 Prescription Dispensing", "Antibiotics & Antivirals", "Home Delivery"],
        "verifiedStock": "Verified Available",
    },

    # 2. Khordha / Bhubaneswar
    {
        "id": "fac-khu-1",
        "name": "AIIMS Bhubaneswar (Apex Referral Institute)",
        "type": "HOSPITAL",
        "category": "National Premier Institute",
        "district": "Khurda",
        "ward": "Dumduma (Ward 62 - Sijua)",
        "address": "Sijua, Patrapada, Bhubaneswar",
        "latitude": 20.2285,
        "longitude": 85.7765,
        "phone": "+91-674-2476789",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["Apex Critical Care & ICU", "State Virology Institute", "Advanced Multi-Organ Trauma Hub", "24/7 Emergency"],
        "verifiedStock": "Central Reserve (Maximum Preparedness)",
    },
    {
        "id": "fac-khu-2",
        "name": "Capital Hospital & State Epidemic Control Ward",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Khurda",
        "ward": "Old Town & Unit 6",
        "address": "Unit 6, Near AG Square, Bhubaneswar",
        "latitude": 20.2644,
        "longitude": 85.8281,
        "phone": "+91-674-2391983",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "Platelet Blood Bank", "Isolation Ward", "Free RT-PCR / Viral Testing"],
        "verifiedStock": "Critical Care Ready (Oxygen & Isolation Beds active)",
    },
    {
        "id": "fac-khu-3",
        "name": "Apollo Hospital Bhubaneswar",
        "type": "HOSPITAL",
        "category": "Private Multispeciality Hospital",
        "district": "Khurda",
        "ward": "Saheed Nagar / Sainik School",
        "address": "Plot 251, Sainik School Road, Bhubaneswar",
        "latitude": 20.3080,
        "longitude": 85.8320,
        "phone": "+91-674-6661016",
        "helpline": "1066",
        "isOpen24x7": True,
        "services": ["24/7 Emergency Trauma", "Advanced ICU & Cardiac Care", "Epidemic Triage", "Comprehensive Diagnostic Labs"],
        "verifiedStock": "Fully Equipped",
    },
    {
        "id": "fac-khu-4",
        "name": "SUM Ultimate Medicare",
        "type": "HOSPITAL",
        "category": "Private Multispeciality Hospital",
        "district": "Khurda",
        "ward": "Khandagiri / Ghatikia",
        "address": "K8, Kalinga Nagar, Ghatikia, Bhubaneswar",
        "latitude": 20.2780,
        "longitude": 85.7650,
        "phone": "+91-674-3500500",
        "helpline": "0674-3500500",
        "isOpen24x7": True,
        "services": ["24/7 Emergency Triage", "Critical Care & Pulmonology", "Dialysis & Blood Bank"],
        "verifiedStock": "Fully Equipped",
    },
    {
        "id": "fac-khu-5",
        "name": "UPHC Saheed Nagar (Ward 29 Health Clinic)",
        "type": "UPHC",
        "category": "Government Clinic",
        "district": "Khurda",
        "ward": "Saheed Nagar (Ward 29)",
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
        "id": "fac-khu-6",
        "name": "UPHC Nayapalli & IRC Village Clinic",
        "type": "UPHC",
        "category": "Government Clinic",
        "district": "Khurda",
        "ward": "Nayapalli (IRC Village)",
        "address": "Sector 4, IRC Village, Nayapalli",
        "latitude": 20.3000,
        "longitude": 85.8150,
        "phone": "+91-674-2558710",
        "helpline": "104",
        "isOpen24x7": False,
        "operatingHours": "8:00 AM - 8:00 PM",
        "services": ["Outpatient Screen", "Vaccination", "Fever Clinic"],
        "verifiedStock": "Adequate Stock",
    },
    {
        "id": "fac-khu-7",
        "name": "Apollo 24/7 Pharmacy Master Canteen",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Khurda",
        "ward": "Master Canteen / Station Square",
        "address": "Shop 12, Master Canteen Square, Bhubaneswar",
        "latitude": 20.2685,
        "longitude": 85.8402,
        "phone": "+91-674-2530112",
        "isOpen24x7": True,
        "services": ["24/7 OTC Antipyretics", "ORS & Electrolytes", "Mosquito Repellents", "Home Delivery"],
        "verifiedStock": "Verified Stock (Essential Medicines In Stock)",
    },
    {
        "id": "fac-khu-8",
        "name": "MedPlus 24x7 Pharmacy Patia",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Khurda",
        "ward": "Patia (InfoCity Zone)",
        "address": "KIIT Road, Near Patia Station, Bhubaneswar",
        "latitude": 20.3540,
        "longitude": 85.8190,
        "phone": "+91-674-2725511",
        "isOpen24x7": True,
        "services": ["24/7 Emergency Medicines", "Thermometers & Oximeters", "Water Purification Tablets"],
        "verifiedStock": "Verified Stock (Ample Supply)",
    },

    # 3. Cuttack
    {
        "id": "fac-cut-1",
        "name": "SCB Medical College & Apex Government Hospital",
        "type": "HOSPITAL",
        "category": "Govt Medical College",
        "district": "Cuttack",
        "ward": "Mangalabag & SCB Medical Zone",
        "address": "Mangalabag, Cuttack",
        "latitude": 20.4625,
        "longitude": 85.8830,
        "phone": "+91-671-2414004",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["Tertiary Referral Hub", "State Viral Research Lab", "Advanced Critical Care", "24/7 Trauma Unit"],
        "verifiedStock": "State Central Repository (Fully Equipped)",
    },
    {
        "id": "fac-cut-2",
        "name": "Ashwini Hospital Cuttack",
        "type": "HOSPITAL",
        "category": "Private Multispeciality Hospital",
        "district": "Cuttack",
        "ward": "CDA Sector 6 (Bidanasi)",
        "address": "Sector 1, CDA, Cuttack",
        "latitude": 20.4850,
        "longitude": 85.8450,
        "phone": "+91-671-2363007",
        "helpline": "0671-2363007",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & Cardiac", "Intensive Care Unit", "Dialysis & Pathology"],
        "verifiedStock": "Fully Stocked",
    },
    {
        "id": "fac-cut-3",
        "name": "Relief 24/7 Chemist & Drug Store",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Cuttack",
        "ward": "Badambadi & Ranihat Zone",
        "address": "Ranihat Square, Medical Road, Cuttack",
        "latitude": 20.4650,
        "longitude": 85.8750,
        "phone": "+91-671-2423300",
        "isOpen24x7": True,
        "services": ["24/7 Emergency Lifesaving Drugs", "Surgical Supplies", "ORS Packets"],
        "verifiedStock": "Verified High",
    },

    # 4. Puri
    {
        "id": "fac-pur-1",
        "name": "District Headquarters Hospital (DHH) Puri",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Puri",
        "ward": "Grand Road (Bada Danda)",
        "address": "Grand Road, Near Jagannath Temple, Puri",
        "latitude": 19.8135,
        "longitude": 85.8312,
        "phone": "+91-6752-222045",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & Heatstroke Unit", "Epidemic Control Unit", "Diarrheal Treatment Center", "Blood Bank"],
        "verifiedStock": "High (ORS, IV Fluids & Paracetamol Available)",
    },
    {
        "id": "fac-pur-2",
        "name": "Jagannath 24/7 Chemist & Druggist",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Puri",
        "ward": "VIP Road Marine Drive",
        "address": "VIP Road, Near Medical Chowk, Puri",
        "latitude": 19.8100,
        "longitude": 85.8250,
        "phone": "+91-6752-224500",
        "isOpen24x7": True,
        "services": ["24/7 OTC Medicines", "First Aid", "Hydration Salts"],
        "verifiedStock": "Verified Ready",
    },

    # 5. Sundargarh / Rourkela
    {
        "id": "fac-sun-1",
        "name": "Ispat General Hospital (IGH Rourkela)",
        "type": "HOSPITAL",
        "category": "PSU / Govt Multispeciality",
        "district": "Sundargarh",
        "ward": "Rourkela Sector 4 Steel Township",
        "address": "Sector 19, Steel Township, Rourkela",
        "latitude": 22.2500,
        "longitude": 84.8500,
        "phone": "+91-661-2646200",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & Burn Unit", "Critical Care & ICU", "Blood Bank", "Diagnostic Labs"],
        "verifiedStock": "State Super-Speciality Reserve",
    },
    {
        "id": "fac-sun-2",
        "name": "Rourkela Government Hospital (RGH)",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Sundargarh",
        "ward": "Civil Township / Uditnagar",
        "address": "Panposh Road, Uditnagar, Rourkela",
        "latitude": 22.2280,
        "longitude": 84.8400,
        "phone": "+91-661-2500108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Fever Triage Booth", "Free Pathology"],
        "verifiedStock": "High",
    },
    {
        "id": "fac-sun-3",
        "name": "Lifeline 24/7 Medico Care Rourkela",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Sundargarh",
        "ward": "Civil Township / Uditnagar",
        "address": "Bisra Road, Near Railway Station, Rourkela",
        "latitude": 22.2250,
        "longitude": 84.8520,
        "phone": "+91-661-2512299",
        "isOpen24x7": True,
        "services": ["24/7 Emergency Drugs", "Nebulizers", "Oxygen Cans"],
        "verifiedStock": "Verified Available",
    },

    # 6. Sambalpur
    {
        "id": "fac-sam-1",
        "name": "VIMSAR Medical College & Hospital Burla",
        "type": "HOSPITAL",
        "category": "Govt Apex Medical College",
        "district": "Sambalpur",
        "ward": "Burla (VIMSAR Medical Zone)",
        "address": "Hospital Road, Burla, Sambalpur",
        "latitude": 21.5000,
        "longitude": 83.8700,
        "phone": "+91-663-2430768",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["Apex Tertiary Care", "24/7 Trauma Hub", "Advanced Virology & Epidemic Lab", "Blood Bank"],
        "verifiedStock": "Apex Western Odisha Reserve",
    },
    {
        "id": "fac-sam-2",
        "name": "Maa Samaleswari 24/7 Medicals",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Sambalpur",
        "ward": "Dhanupali & Ainthapali Ward",
        "address": "Budharaja Square, Sambalpur",
        "latitude": 21.4700,
        "longitude": 83.9800,
        "phone": "+91-663-2410888",
        "isOpen24x7": True,
        "services": ["24/7 Medicines", "Baby Care & Rehydration", "First Aid"],
        "verifiedStock": "High",
    },

    # 7. Balasore
    {
        "id": "fac-bal-1",
        "name": "Fakir Mohan Medical College & Hospital",
        "type": "HOSPITAL",
        "category": "Govt Medical College",
        "district": "Balasore",
        "ward": "Balasore Station & Town Ward",
        "address": "Remuna Golei, Balasore",
        "latitude": 21.4934,
        "longitude": 86.9135,
        "phone": "+91-6782-262010",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "Regional Blood Bank", "Diagnostic Labs"],
        "verifiedStock": "Fully Stocked",
    },
    {
        "id": "fac-bal-2",
        "name": "Balasore 24/7 Lifeline Pharmacy",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Balasore",
        "ward": "Balasore Station & Town Ward",
        "address": "Cinema Chhak, OT Road, Balasore",
        "latitude": 21.4950,
        "longitude": 86.9300,
        "phone": "+91-6782-264500",
        "isOpen24x7": True,
        "services": ["24/7 Antibiotics & Antipyretics", "Rapid Testing Kits"],
        "verifiedStock": "Verified Available",
    },

    # 8. Ganjam / Berhampur
    {
        "id": "fac-gan-1",
        "name": "MKCG Medical College & Hospital",
        "type": "HOSPITAL",
        "category": "Govt Apex Medical College",
        "district": "Ganjam",
        "ward": "Berhampur (MKCG Hospital Zone)",
        "address": "Medical College Campus, Berhampur, Ganjam",
        "latitude": 19.3150,
        "longitude": 84.7941,
        "phone": "+91-680-2292746",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["Apex Southern Odisha Referral", "24/7 Trauma & Emergency", "Super Speciality ICU"],
        "verifiedStock": "Apex Regional Reserve",
    },
    {
        "id": "fac-gan-2",
        "name": "Apollo Pharmacy 24/7 Berhampur",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Ganjam",
        "ward": "Berhampur (MKCG Hospital Zone)",
        "address": "Giri Road, Medical Square, Berhampur",
        "latitude": 19.3120,
        "longitude": 84.7920,
        "phone": "+91-680-2228800",
        "isOpen24x7": True,
        "services": ["24/7 OTC Antipyretics", "ORS & Pediatric Hydration"],
        "verifiedStock": "High",
    },

    # 9. Bhadrak
    {
        "id": "fac-bha-1",
        "name": "District Headquarters Hospital (DHH) Bhadrak",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Bhadrak",
        "ward": "Bhadrak Puruna Bazar",
        "address": "Puruna Bazar Road, Bhadrak",
        "latitude": 21.0574,
        "longitude": 86.4950,
        "phone": "+91-6784-251508",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Epidemic Response Ward", "Maternity & Pediatric"],
        "verifiedStock": "High",
    },
    {
        "id": "fac-bha-2",
        "name": "Salandi 24/7 Emergency Pharmacy",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Bhadrak",
        "ward": "Bhadrak Puruna Bazar",
        "address": "Bonth Chhak, Bhadrak",
        "latitude": 21.0600,
        "longitude": 86.5000,
        "phone": "+91-6784-252100",
        "isOpen24x7": True,
        "services": ["24/7 Medicines", "ORS Tablets", "Antipyretics"],
        "verifiedStock": "Verified Available",
    },

    # 10. Mayurbhanj
    {
        "id": "fac-may-1",
        "name": "PRM Medical College & Hospital Baripada",
        "type": "HOSPITAL",
        "category": "Govt Medical College",
        "district": "Mayurbhanj",
        "ward": "Baripada Palbani Heritage Ward",
        "address": "Palbani, Baripada, Mayurbhanj",
        "latitude": 21.9322,
        "longitude": 86.7262,
        "phone": "+91-6792-252108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "Tribal Health Outreach", "Pathology Hub"],
        "verifiedStock": "Fully Stocked",
    },
    {
        "id": "fac-may-2",
        "name": "Similipal 24/7 Emergency Pharmacy",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Mayurbhanj",
        "ward": "Baripada Palbani Heritage Ward",
        "address": "Station Road, Baripada",
        "latitude": 21.9300,
        "longitude": 86.7300,
        "phone": "+91-6792-254400",
        "isOpen24x7": True,
        "services": ["24/7 Emergency Drugs", "Anti-Venom & Antipyretics"],
        "verifiedStock": "High",
    },

    # 11. Keonjhar
    {
        "id": "fac-keo-1",
        "name": "Dharanidhar Medical College & Hospital",
        "type": "HOSPITAL",
        "category": "Govt Medical College",
        "district": "Keonjhar",
        "ward": "Keonjhar District Town",
        "address": "Hospital Road, Keonjhar Town",
        "latitude": 21.6289,
        "longitude": 85.5817,
        "phone": "+91-6766-255108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "Mining Belt Pulmonary Clinic", "Blood Bank"],
        "verifiedStock": "Fully Stocked",
    },

    # 12. Jharsuguda
    {
        "id": "fac-jha-1",
        "name": "District Headquarters Hospital Jharsuguda",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Jharsuguda",
        "ward": "Jharsuguda Industrial Ward",
        "address": "Industrial Bypass Road, Jharsuguda",
        "latitude": 21.8554,
        "longitude": 84.0062,
        "phone": "+91-6645-270108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Trauma Care", "Free Diagnostic Services"],
        "verifiedStock": "Adequate Stock",
    },

    # 13. Koraput
    {
        "id": "fac-kor-1",
        "name": "Saheed Laxman Nayak Medical College & Hospital",
        "type": "HOSPITAL",
        "category": "Govt Apex Medical College",
        "district": "Koraput",
        "ward": "Koraput Hill Town HQ",
        "address": "Medical College Road, Koraput",
        "latitude": 18.8135,
        "longitude": 82.7123,
        "phone": "+91-6852-250108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "Tribal Health Hub", "Vector-Borne Disease Control"],
        "verifiedStock": "High Reserve",
    },
    {
        "id": "fac-kor-2",
        "name": "Jeypore 24/7 Emergency Medicals",
        "type": "PHARMACY",
        "category": "24/7 Retail Pharmacy",
        "district": "Koraput",
        "ward": "Jeypore Main Commercial Ward",
        "address": "Main Road, Near Bus Stand, Jeypore",
        "latitude": 18.8500,
        "longitude": 82.5700,
        "phone": "+91-6854-233400",
        "isOpen24x7": True,
        "services": ["24/7 OTC Medicines", "ORS & Antipyretics"],
        "verifiedStock": "High",
    },

    # 14. Rayagada
    {
        "id": "fac-ray-1",
        "name": "District Headquarters Hospital Rayagada",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Rayagada",
        "ward": "Rayagada Town Ward",
        "address": "Main Hospital Road, Rayagada",
        "latitude": 19.1678,
        "longitude": 83.4158,
        "phone": "+91-6856-222108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Diarrhea Treatment Ward", "Blood Storage"],
        "verifiedStock": "High",
    },

    # 15. Kalahandi
    {
        "id": "fac-kal-1",
        "name": "Government Medical College & Hospital Kalahandi",
        "type": "HOSPITAL",
        "category": "Govt Medical College",
        "district": "Kalahandi",
        "ward": "Bhawanipatna District Town",
        "address": "Bhangabari, Bhawanipatna, Kalahandi",
        "latitude": 19.9075,
        "longitude": 83.1656,
        "phone": "+91-6670-230108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "Maternity Wing", "Pathology Lab"],
        "verifiedStock": "Fully Stocked",
    },

    # 16. Bolangir
    {
        "id": "fac-bol-1",
        "name": "Bhima Bhoi Medical College & Hospital Bolangir",
        "type": "HOSPITAL",
        "category": "Govt Medical College",
        "district": "Bolangir",
        "ward": "Bolangir Town Ward",
        "address": "Medical College Road, Bolangir",
        "latitude": 20.7107,
        "longitude": 83.4867,
        "phone": "+91-6652-232108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "ICU & Critical Care", "Blood Bank"],
        "verifiedStock": "Fully Stocked",
    },

    # 17. Bargarh
    {
        "id": "fac-bar-1",
        "name": "District Headquarters Hospital Bargarh",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Bargarh",
        "ward": "Bargarh Town Ward",
        "address": "Khedapali Road, Bargarh",
        "latitude": 21.3333,
        "longitude": 83.6167,
        "phone": "+91-6646-231108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Dialysis Centre", "Fever Clinic"],
        "verifiedStock": "High",
    },

    # 18. Dhenkanal
    {
        "id": "fac-dhe-1",
        "name": "District Headquarters Hospital Dhenkanal",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Dhenkanal",
        "ward": "Dhenkanal Town Ward",
        "address": "Station Road, Dhenkanal",
        "latitude": 20.6586,
        "longitude": 85.5967,
        "phone": "+91-6762-226108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Maternity Ward", "Free Diagnostics"],
        "verifiedStock": "Adequate Stock",
    },

    # 19. Jajpur
    {
        "id": "fac-jaj-1",
        "name": "Jajpur Medical College & Hospital",
        "type": "HOSPITAL",
        "category": "Govt Medical College",
        "district": "Jajpur",
        "ward": "Jajpur Town Ward",
        "address": "Ankula, Jajpur Town",
        "latitude": 20.8522,
        "longitude": 86.3333,
        "phone": "+91-6728-222108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency & ICU", "Trauma Unit", "Blood Bank"],
        "verifiedStock": "Fully Stocked",
    },

    # 20. Kendrapara
    {
        "id": "fac-ken-1",
        "name": "District Headquarters Hospital Kendrapara",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Kendrapara",
        "ward": "Kendrapara Town Ward",
        "address": "Hospital Road, Kendrapara",
        "latitude": 20.4994,
        "longitude": 86.4230,
        "phone": "+91-6727-232108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Cyclone & Epidemic Medical Unit", "Pathology"],
        "verifiedStock": "High",
    },

    # 21. Jagatsinghpur
    {
        "id": "fac-jag-1",
        "name": "District Headquarters Hospital Jagatsinghpur",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Jagatsinghpur",
        "ward": "Jagatsinghpur Town Ward",
        "address": "Hospital Chhak, Jagatsinghpur",
        "latitude": 20.2667,
        "longitude": 86.1667,
        "phone": "+91-6724-220108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Maternity Hub", "Blood Bank"],
        "verifiedStock": "Adequate Stock",
    },
    {
        "id": "fac-jag-2",
        "name": "Biju Memorial Hospital Paradip Port",
        "type": "HOSPITAL",
        "category": "Govt Port Hospital",
        "district": "Jagatsinghpur",
        "ward": "Paradip Port & Refinery Ward",
        "address": "Port Trust Road, Paradip",
        "latitude": 20.3167,
        "longitude": 86.6167,
        "phone": "+91-6722-222210",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Port Emergency", "Industrial Trauma Hub", "Ambulance Station"],
        "verifiedStock": "High",
    },

    # 22. Nayagarh
    {
        "id": "fac-nay-1",
        "name": "District Headquarters Hospital Nayagarh",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Nayagarh",
        "ward": "Nayagarh Town Ward",
        "address": "Old Hospital Road, Nayagarh",
        "latitude": 20.1333,
        "longitude": 85.1000,
        "phone": "+91-6753-252108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Surgical Wing", "Free Diagnostic Tests"],
        "verifiedStock": "Adequate Stock",
    },

    # 23. Kandhamal
    {
        "id": "fac-kan-1",
        "name": "District Headquarters Hospital Phulbani",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Kandhamal",
        "ward": "Phulbani District Town",
        "address": "Court Road, Phulbani, Kandhamal",
        "latitude": 20.1333,
        "longitude": 84.1500,
        "phone": "+91-6842-253108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Tribal Health Outreach", "Malaria & Febrile Clinic"],
        "verifiedStock": "High (Anti-Malarials & ORS in Stock)",
    },

    # 24. Boudh
    {
        "id": "fac-bou-1",
        "name": "District Headquarters Hospital Boudh",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Boudh",
        "ward": "Boudh Town Ward",
        "address": "Hospital Road, Boudh",
        "latitude": 20.8333,
        "longitude": 84.3167,
        "phone": "+91-6841-222108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Pediatric Wing", "Free Pathology"],
        "verifiedStock": "Adequate Stock",
    },

    # 25. Subarnapur (Sonepur)
    {
        "id": "fac-sub-1",
        "name": "District Headquarters Hospital Sonepur",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Subarnapur",
        "ward": "Sonepur Town Ward",
        "address": "Mahabir Chowk, Sonepur",
        "latitude": 20.8333,
        "longitude": 83.9167,
        "phone": "+91-6654-220108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Maternity & Child Health", "Blood Storage"],
        "verifiedStock": "Adequate Stock",
    },

    # 26. Nabarangpur
    {
        "id": "fac-nab-1",
        "name": "District Headquarters Hospital Nabarangpur",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Nabarangpur",
        "ward": "Nabarangpur Town Ward",
        "address": "Mission Road, Nabarangpur",
        "latitude": 19.2319,
        "longitude": 82.5511,
        "phone": "+91-6858-222108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Nutritional Rehabilitation Unit", "Blood Bank"],
        "verifiedStock": "High",
    },

    # 27. Nuapada
    {
        "id": "fac-nua-1",
        "name": "District Headquarters Hospital Nuapada",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Nuapada",
        "ward": "Nuapada Town Ward",
        "address": "National Highway Road, Nuapada",
        "latitude": 20.8333,
        "longitude": 82.5333,
        "phone": "+91-6678-223108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Fever Screening Triage", "Free Medicine Counter"],
        "verifiedStock": "Adequate Stock",
    },

    # 28. Malkangiri
    {
        "id": "fac-mal-1",
        "name": "District Headquarters Hospital Malkangiri",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Malkangiri",
        "ward": "Malkangiri Town Ward",
        "address": "Collectorate Road, Malkangiri",
        "latitude": 18.3500,
        "longitude": 81.9000,
        "phone": "+91-6861-230108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Japanese Encephalitis & Vector Unit", "Blood Bank", "Pediatric Intensive Care"],
        "verifiedStock": "High (Specialized Vector & Antiviral Drugs in Stock)",
    },

    # 29. Gajapati
    {
        "id": "fac-gaj-1",
        "name": "District Headquarters Hospital Paralakhemundi",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Gajapati",
        "ward": "Paralakhemundi Heritage Ward",
        "address": "Palace Street, Paralakhemundi, Gajapati",
        "latitude": 18.8089,
        "longitude": 84.1539,
        "phone": "+91-6815-222108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Maternity & Pediatric Hub", "Free Diagnostics"],
        "verifiedStock": "High",
    },

    # 30. Deogarh
    {
        "id": "fac-deo-1",
        "name": "District Headquarters Hospital Deogarh",
        "type": "HOSPITAL",
        "category": "Govt District Hospital",
        "district": "Deogarh",
        "ward": "Deogarh Town Ward",
        "address": "Hospital Road, Deogarh Town",
        "latitude": 21.5333,
        "longitude": 84.7333,
        "phone": "+91-6641-226108",
        "helpline": "108",
        "isOpen24x7": True,
        "services": ["24/7 Emergency", "Fever Clinic", "Pathology Lab"],
        "verifiedStock": "Adequate Stock",
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
