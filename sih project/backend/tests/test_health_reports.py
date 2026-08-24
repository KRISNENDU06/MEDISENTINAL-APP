from fastapi.testclient import TestClient
from app.db.init_db import init_db
from app.main import app

init_db()
client = TestClient(app)


def test_health_officer_create_and_view_report():
    # Login as Health Official
    login_res = client.post("/api/auth/login", json={"email": "official@sih.gov.in", "password": "Official@12345"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get an existing area
    areas_res = client.get("/api/areas/risk-summary")
    assert areas_res.status_code == 200
    areas = areas_res.json()
    assert len(areas) > 0
    area = areas[0]

    payload = {
        "area_id": int(str(area["id"]).replace("area-", "")),
        "report_title": "Field Directive: Vector Surveillance & Screening at Saheed Nagar",
        "observed_signals": {
            "fever_cases_spike": "+55%",
            "otc_medicine_demand": "+60%",
            "mosquito_density": "Critical (Breteau Index 42)",
        },
        "risk_level": "HIGH",
        "clinical_notes": "Significant localized cluster detected during door-to-door survey.",
        "recommendations": [
            "Initiate immediate chemical vector fogging",
            "Distribute free ORS and mosquito nets",
            "Establish fever triage desk at local UPHC",
        ],
        "is_public": True,
    }

    # 1. Create Report
    res = client.post("/api/reports", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["report_title"] == payload["report_title"]
    assert data["risk_level"] == "HIGH"
    assert "District Health Official" in data["officer_designation"]

    # 2. View Report publicly in Dashboard feed
    list_res = client.get("/api/reports")
    assert list_res.status_code == 200
    reports = list_res.json()
    assert any(r["report_title"] == payload["report_title"] for r in reports)


def test_viewer_cannot_create_report():
    # Login as Viewer
    login_res = client.post("/api/auth/login", json={"email": "viewer@sih.gov.in", "password": "Viewer@12345"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "report_title": "Unauthorized Report",
        "observed_signals": {"fever": "+10%"},
        "risk_level": "LOW",
        "recommendations": ["None"],
    }

    res = client.post("/api/reports", json=payload, headers=headers)
    assert res.status_code == 403  # Forbidden
