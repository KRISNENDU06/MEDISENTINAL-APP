from app.models.domain import RiskLevel
from app.services.risk_engine import RiskEngine


def test_medicine_only_spike_does_not_force_high_risk() -> None:
    engine = RiskEngine.__new__(RiskEngine)
    engine.settings = type(
        "Settings",
        (),
        {
            "high_threshold": 70,
            "low_threshold": 40,
            "medicine_weight": 0.30,
            "health_weight": 0.30,
            "persistence_weight": 0.20,
            "geographic_weight": 0.20,
        },
    )()

    risk_score = 100 * 0.30 + 0 * 0.30 + 0 * 0.20 + 0 * 0.20

    assert risk_score == 30
    assert engine.classify_risk(risk_score) == RiskLevel.LOW


def test_multi_signal_persistent_spread_classifies_high() -> None:
    engine = RiskEngine.__new__(RiskEngine)
    engine.settings = type("Settings", (), {"high_threshold": 70, "low_threshold": 40})()

    assert engine.classify_risk(82) == RiskLevel.HIGH


def test_negative_deviation_has_zero_anomaly_score() -> None:
    assert RiskEngine.normalize_deviation(-20) == 0


def test_large_deviation_is_capped_at_100() -> None:
    assert RiskEngine.normalize_deviation(500) == 100
