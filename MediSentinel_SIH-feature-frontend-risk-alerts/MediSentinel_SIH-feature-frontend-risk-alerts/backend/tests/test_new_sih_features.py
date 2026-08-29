"""Unit and integration tests for all 10 SIH features."""
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_area_drill_down_and_time_ranges():
    # 7 days
    r7 = client.get("/api/areas/risk-summary?days=7")
    assert r7.status_code == 200
    areas7 = r7.json()
    assert len(areas7) > 0
    assert "signals" in areas7[0]
    assert "medicineDemand" in areas7[0]["signals"]
    assert "feverIndicators" in areas7[0]["signals"]
    assert "clinicVisits" in areas7[0]["signals"]
    assert "geographicSpread" in areas7[0]["signals"]
    assert "explanation" in areas7[0]
    assert "recommendedAction" in areas7[0]
    assert len(areas7[0]["timeline"]) <= 7

    # 30 days
    r30 = client.get("/api/areas/risk-summary?days=30")
    assert r30.status_code == 200

    # 90 days
    r90 = client.get("/api/areas/risk-summary?days=90")
    assert r90.status_code == 200


def test_live_risk_engine_run():
    login_res = client.post("/api/auth/login", json={"email": "admin@sih.gov.in", "password": "Admin@12345"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    r = client.post("/api/risk/run", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "processed_areas" in data
    assert data["processed_areas"] > 0
    assert "generated_alerts" in data


def test_alert_actions_and_filters():
    # List active
    r_active = client.get("/api/alerts?status=ACTIVE")
    assert r_active.status_code == 200
    alerts = r_active.json()
    assert isinstance(alerts, list)

    if alerts:
        target_id = alerts[0]["id"]
        # Acknowledge
        r_ack = client.patch(f"/api/alerts/{target_id}/status", json={"status": "ACKNOWLEDGED"})
        assert r_ack.status_code == 200
        assert r_ack.json()["success"] is True

        # Resolve
        r_res = client.patch(f"/api/alerts/{target_id}/status", json={"status": "RESOLVED"})
        assert r_res.status_code == 200
        assert r_res.json()["success"] is True


def test_add_observation_with_auto_risk_run():
    # Login as Admin
    login_res = client.post("/api/auth/login", json={"email": "admin@sih.gov.in", "password": "Admin@12345"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "area_id": 1,
        "observed_on": "2026-08-22",
        "signal_type": "medicine_demand",
        "category": "fever_respiratory_medicines",
        "value": 350.0,
        "source": "Sentinel Pharmacy A",
        "data_quality_score": 0.95,
    }
    r = client.post("/api/observations?auto_run_risk=true", json=payload, headers=headers)
    assert r.status_code == 201
    res = r.json()
    assert res["success"] is True
    assert "generated_alerts" in res


def test_non_admin_cannot_add_observation():
    # Non-admin / unauthenticated user should be rejected
    payload = {
        "area_id": 1,
        "observed_on": "2026-08-22",
        "signal_type": "medicine_demand",
        "category": "fever_respiratory_medicines",
        "value": 350.0,
        "source": "Sentinel Pharmacy A",
    }
def test_add_observation_custom_location_angul():
    # Login as Admin
    login_res = client.post("/api/auth/login", json={"email": "admin@sih.gov.in", "password": "Admin@12345"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "area_name": "Angul (Nalco Nagar)",
        "district": "Angul",
        "latitude": 20.8444,
        "longitude": 85.1511,
        "observed_on": "2026-08-22",
        "signal_type": "medicine_demand",
        "category": "fever_respiratory_medicines",
        "value": 420.0,
        "source": "Angul District Central Pharmacy",
        "data_quality_score": 0.95,
    }
    r = client.post("/api/observations?auto_run_risk=true", json=payload, headers=headers)
    assert r.status_code == 201
    res = r.json()
    assert res["success"] is True
    assert "Successfully Added" in res["message"]
    assert "Angul" in res["message"] or res["observation"]["area_name"] == "Angul (Nalco Nagar)"

    # Verify that the new area is present in areas list and map feed
    r_areas = client.get("/api/areas/risk-summary")
    assert r_areas.status_code == 200
    all_areas = r_areas.json()
    angul_match = next((a for a in all_areas if "Angul" in a["name"]), None)
    assert angul_match is not None
    assert angul_match["latitude"] == 20.8444
    assert angul_match["longitude"] == 85.1511


def test_add_observation_existing_location_no_area_id():
    # Adding to existing ward Saheed Nagar without any area_id
    login_res = client.post("/api/auth/login", json={"email": "admin@sih.gov.in", "password": "Admin@12345"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "area_name": "Area A (Saheed Nagar)",
        "district": "Bhubaneswar",
        "observed_on": "2026-08-22",
        "signal_type": "fever_cases",
        "value": 190.0,
        "source": "Community Health Center",
    }
    r = client.post("/api/observations?auto_run_risk=true", json=payload, headers=headers)
    assert r.status_code == 201
    res = r.json()
    assert res["success"] is True
    assert "Successfully Added" in res["message"]
    assert "Saheed Nagar" in res["observation"]["area_name"]


def test_what_if_simulator():
    payload = {
        "medicineDemandSpike": 45.0,
        "feverCasesSpike": 30.0,
        "clinicVisitsSpike": 25.0,
        "geographicSpread": 3,
        "persistenceWeeks": 3,
        "archetype": "DENGUE",
        "intervention": "CONTAINMENT",
    }
    r = client.post("/api/simulation/what-if", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "riskScore" in data
    assert "riskLevel" in data
    assert "effectiveRt" in data
    assert "explanation" in data
    assert "timeline" in data
    assert len(data["timeline"]) == 6

