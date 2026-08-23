"""Unit and API tests for interactive surveillance features."""
from fastapi.testclient import TestClient
from app.main import app
from app.services.simulation_engine import simulate_outbreak_step
from app.services.differential_privacy import apply_differential_privacy
from app.services.ai_copilot import answer_epidemiologist_query


def test_simulation_engine_math():
    res = simulate_outbreak_step(step_index=3, r0=2.4, archetype="DENGUE", intervention="CONTAINMENT")
    assert len(res["timeline"]) == 6
    assert res["effectiveRt"] < 2.4
    assert res["activePoint"]["risk"] >= 0


def test_differential_privacy_laplace():
    data = [{"week": "W28", "fever": 290}, {"week": "W29", "fever": 310}]
    res = apply_differential_privacy(data=data, epsilon=1.0, sensitivity=1.0)
    assert res["epsilon"] == 1.0
    assert len(res["data"]) == 2
    assert "noisyCount" in res["data"][0]


def test_ai_copilot_reasoning():
    res = answer_epidemiologist_query(query="Why did the area surge?")
    assert res["intent"] == "ROOT_CAUSE_ANALYSIS"
    assert len(res["leadingIndicators"]) > 0
    assert len(res["recommendedSOP"]) > 0


def test_api_endpoints_interactive():
    client = TestClient(app)

    # 1. Health
    r = client.get("/health")
    assert r.status_code == 200

    # 2. Simulation run
    r_sim = client.post("/api/simulation/run", json={"stepIndex": 2, "r0": 2.4, "archetype": "DENGUE"})
    assert r_sim.status_code == 200
    assert "areas" in r_sim.json()

    # 3. Privacy perturb
    r_dp = client.post("/api/privacy/perturb", json={"data": [{"fever": 300}], "epsilon": 1.0})
    assert r_dp.status_code == 200
    assert "data" in r_dp.json()

    # 4. Incident Response Dispatch RRT
    r_rrt = client.post("/api/response/dispatch-rrt", json={"wardId": "area-1", "wardName": "Saheed Nagar"})
    assert r_rrt.status_code == 200
    assert r_rrt.json()["dispatch"]["status"] == "IN_TRANSIT"

    # 5. Multilingual Advisory
    r_adv = client.post("/api/response/generate-advisory", json={"wardName": "Saheed Nagar"})
    assert r_adv.status_code == 200
    assert "odia" in r_adv.json()["languages"]

    # 6. Copilot Query
    r_cop = client.post("/api/copilot/query", json={"query": "Why did Saheed Nagar surge?"})
    assert r_cop.status_code == 200
    assert "headline" in r_cop.json()

