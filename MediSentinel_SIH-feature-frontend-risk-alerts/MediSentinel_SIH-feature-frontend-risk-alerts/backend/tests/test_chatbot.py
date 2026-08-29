"""Test AI Chatbot Engine and API Endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.chatbot_engine import process_chat_message


@pytest.fixture
def client():
    return TestClient(app)


def test_chatbot_greeting():
    res = process_chat_message("Hello, can you help me?")
    assert "Namaste" in res["response"] or "MEDISENTINEL" in res["response"]
    assert len(res["suggested_questions"]) > 0


def test_chatbot_risk_formula_query():
    res = process_chat_message("How is the 4-pillar risk score calculated?")
    assert "4-Pillar" in res["response"]
    assert "30%" in res["response"]
    assert "Persistence" in res["response"]
    assert "Geographic" in res["response"]


def test_chatbot_dengue_outbreak_sop():
    res = process_chat_message("Tell me about dengue outbreak prevention SOP and symptoms")
    assert "Dengue" in res["response"]
    assert "Aedes" in res["response"] or "Vector" in res["response"]
    assert "Paracetamol" in res["response"]
    assert "Aspirin" in res["response"]  # warning against aspirin


def test_chatbot_cholera_waterborne_sop():
    res = process_chat_message("What is the protocol for waterborne disease and cholera diarrhea?")
    assert "Waterborne" in res["response"] or "Cholera" in res["response"]
    assert "ORS" in res["response"]
    assert "Chlorine" in res["response"] or "Chlorination" in res["response"]


def test_chatbot_ward_specific_query():
    mock_areas = [
        {
            "id": "area-1",
            "name": "Area A (Saheed Nagar)",
            "district": "Bhubaneswar",
            "riskScore": 87,
            "riskLevel": "HIGH",
            "persistenceWeeks": 3,
            "signals": {
                "medicineDemand": {"current": 1850, "baseline": 1140, "deviation": "+62.3%"},
                "feverIndicators": {"current": 490, "baseline": 330, "deviation": "+48.5%"},
                "clinicVisits": {"current": 110, "baseline": 80, "deviation": "+37.5%"},
            },
            "explanation": "Elevated anti-infective OTC demand followed by outpatient fever surge.",
            "recommendedAction": "Deploy Rapid Response Team and initiate larval fogging.",
        }
    ]
    res = process_chat_message("Why is Saheed Nagar at high risk?", areas_data=mock_areas)
    assert "Saheed Nagar" in res["response"]
    assert "87" in res["response"] or "+62.3%" in res["response"]
    assert "Rapid Response Team" in res["response"]


def test_chat_api_endpoint(client):
    response = client.post(
        "/api/chat",
        json={"message": "What is the Dengue Outbreak Prevention Protocol?", "selected_area_id": "area-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "suggested_questions" in data
    assert len(data["suggested_questions"]) >= 1
    assert "Dengue" in data["response"]

