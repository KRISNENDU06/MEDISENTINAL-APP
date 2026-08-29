"""Incident Response & Multilingual Advisory API Router."""
import time
from datetime import datetime, timezone
from typing import Annotated, Any
from fastapi import APIRouter, Body, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.domain import Alert, AlertStatus

router = APIRouter(prefix="/response", tags=["response"])


@router.post("/dispatch-rrt")
def dispatch_rrt(
    db: Annotated[Session, Depends(get_db)],
    payload: Annotated[dict[str, Any], Body()] = None,
) -> dict[str, Any]:
    payload = payload or {}
    alert_id = payload.get("alertId")
    ward_id = payload.get("wardId", "area-1")
    ward_name = payload.get("wardName", "Saheed Nagar")
    priority = payload.get("priority", "CRITICAL")
    team_composition = payload.get("teamComposition", [
        "Field Epidemiologist",
        "Community Health Officer",
        "Water & Sanitation Inspector",
        "2x ASHA Mobile Workers",
    ])

    dispatch_id = f"RRT-{str(int(time.time()))[-6:]}"
    dispatch_record = {
        "dispatchId": dispatch_id,
        "alertId": alert_id,
        "wardId": ward_id,
        "wardName": ward_name,
        "priority": priority,
        "dispatchedAt": datetime.now(timezone.utc).isoformat(),
        "status": "IN_TRANSIT",
        "teamComposition": team_composition,
        "allocatedTasks": [
            f"Conduct rapid syndromic household survey (50 households) in {ward_name}",
            "Collect water samples for residual chlorine and bacterial culture",
            "Audit localized OTC fever/antipyretic sales with retail pharmacies",
        ],
    }

    # If alert_id is an integer or can be parsed, update DB alert status
    try:
        raw_id = int(str(alert_id).replace("alt-", ""))
        alert = db.get(Alert, raw_id)
        if alert:
            alert.status = AlertStatus.IN_INVESTIGATION
            db.commit()
    except Exception:
        pass

    return {"success": True, "dispatch": dispatch_record}


@router.post("/generate-advisory")
def generate_advisory(payload: Annotated[dict[str, Any], Body()] = None) -> dict[str, Any]:
    payload = payload or {}
    ward_name = payload.get("wardName", "Ward 12 - Saheed Nagar")
    risk_level = payload.get("riskLevel", "HIGH")
    disease_type = payload.get("diseaseType", "Vector-Borne (Dengue)")

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "wardName": ward_name,
        "riskLevel": risk_level,
        "diseaseType": disease_type,
        "languages": {
            "english": {
                "title": f"Public Health Alert: Elevated {disease_type} Anomaly in {ward_name}",
                "body": f"MediSentinel early surveillance has detected elevated fever and syndromic indicators in {ward_name}. Residents are advised to eliminate standing water, utilize mosquito repellents, and visit the nearest Urban Primary Health Center (UPHC) if experiencing high fever or body aches.",
                "precautions": [
                    "Inspect and empty all indoor/outdoor water containers.",
                    "Do not consume self-medicated antibiotics or painkillers without prescription.",
                    "Report uncollected waste or waterlogging to BMC Helpline: 1929.",
                ],
            },
            "odia": {
                "title": f"ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା: {ward_name} ରେ ସନ୍ଦିଗ୍ଧ ସଂକ୍ରମଣ ବୃଦ୍ଧି ସୂଚନା",
                "body": f"ମେଡିସେଣ୍ଟିନେଲ୍ ସର୍ଭେଲାନ୍ସ ଦ୍ୱାରା {ward_name} ଅଞ୍ଚଳରେ ଜ୍ୱର ଓ ଲକ୍ଷଣ ବୃଦ୍ଧି ଚିହ୍ନଟ ହୋଇଛି। ସମସ୍ତ ନାଗରିକଙ୍କୁ ଜମି ରହିଥିବା ପାଣି ନଷ୍ଟ କରିବାକୁ ଏବଂ ଜ୍ୱର ହେଲେ ନିକଟସ୍ଥ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ରକୁ ଯିବାକୁ ଅନୁରୋଧ।",
                "precautions": [
                    "ଘର ଚାରିପାଖେ ପାଣି ଜମିବାକୁ ଦିଅନ୍ତୁ ନାହିଁ।",
                    "ବିନା ଡାକ୍ତରୀ ପରାମର୍ଶରେ ଔଷଧ ସେବନ କରନ୍ତୁ ନାହିଁ।",
                    "ଜରୁରୀ ସହାୟତା ପାଇଁ ବିଏମସି ହେଲ୍ପଲାଇନ୍ ୧୯୨୯ କୁ ଫୋନ୍ କରନ୍ତୁ।",
                ],
            },
            "hindi": {
                "title": f"जन स्वास्थ्य चेतावनी: {ward_name} में संक्रमण के बढ़े हुए संकेत",
                "body": f"मेडीसेंटिनल सर्विलांस द्वारा {ward_name} में बुखार और संबंधित लक्षणों में वृद्धि दर्ज की गई है। नागरिकों से अपील है कि वे जलजमाव न होने दें और लक्षण दिखने पर नजदीकी प्राथमिक स्वास्थ्य केंद्र पर जांच कराएं।",
                "precautions": [
                    "कुलर व गमलों में जमा पानी तुरंत खाली करें।",
                    "बिना डॉक्टरी सलाह के दवाइयों का सेवन न करें।",
                    "सहायता हेतु हेल्पलाइन 1929 पर संपर्क करें।",
                ],
            },
        },
    }

