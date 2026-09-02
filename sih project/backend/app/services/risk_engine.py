from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.models.domain import Alert, AlertStatus, Area, AreaNeighbor, Observation, RiskAssessment, RiskLevel

MEDICINE_SIGNALS = {"medicine_demand", "medicine_sales", "pharmacy_demand"}
HEALTH_SIGNALS = {
    "fever_cases", "respiratory_symptoms", "gi_symptoms", "clinic_visits", "reported_cases",
    "confirmed_cases", "lab_positivity", "hospital_admissions", "emergency_visits", "vector_risk", "water_quality",
}


@dataclass
class BaselineComparison:
    current_value: float
    baseline_value: float
    deviation_percent: float
    anomaly_score: float


class RiskEngine:
    def __init__(self, db: Session, settings: Settings | None = None) -> None:
        self.db = db
        self.settings = settings or get_settings()

    def run_for_all_areas(self, assessed_on: date | None = None) -> tuple[list[RiskAssessment], int]:
        target_date = assessed_on or self._latest_observation_date() or date.today()
        areas = self.db.scalars(select(Area).order_by(Area.name)).all()
        assessments = [self.assess_area(area, target_date) for area in areas]
        generated_alerts = sum(1 for assessment in assessments if self._maybe_create_alert(assessment))
        self.db.commit()
        return assessments, generated_alerts

    def assess_area(self, area: Area, assessed_on: date) -> RiskAssessment:
        medicine = self.compare_signal_group(area.id, MEDICINE_SIGNALS, assessed_on)
        health = self.compare_signal_group(area.id, HEALTH_SIGNALS, assessed_on)
        persistence = self.persistence_score(area.id, assessed_on)
        geographic = self.geographic_spread_score(area.id, assessed_on)
        weighted_score = (medicine.anomaly_score * self.settings.medicine_weight + health.anomaly_score * self.settings.health_weight + persistence * self.settings.persistence_weight + geographic * self.settings.geographic_weight)
        max_signal = max(medicine.anomaly_score, health.anomaly_score)
        if max_signal >= 50:
            acute_override = max_signal * 0.90 + min(medicine.anomaly_score, health.anomaly_score) * 0.10
            risk_score = max(weighted_score, acute_override)
        else:
            risk_score = weighted_score
        risk_score = round(max(0, min(100, risk_score)), 2)
        risk_level = self.classify_risk(risk_score)
        confidence = self.confidence_score(medicine, health, persistence, geographic)
        trend = self.trend_for_area(area.id, assessed_on, risk_score)
        explanation = self.build_explanation(medicine, health, persistence, geographic)
        action = self.recommended_action(risk_level)
        assessment = RiskAssessment(area_id=area.id, assessed_on=assessed_on, medicine_score=round(medicine.anomaly_score, 2), health_score=round(health.anomaly_score, 2), persistence_score=round(persistence, 2), geographic_score=round(geographic, 2), risk_score=risk_score, confidence=round(confidence, 2), risk_level=risk_level, trend=trend, explanation=explanation, recommended_action=action)
        self.db.add(assessment)
        self.db.flush()
        return assessment

    def compare_signal_group(self, area_id: int, signal_types: set[str], current_on: date) -> BaselineComparison:
        current_start = current_on - timedelta(days=6)
        baseline_start = current_on - timedelta(days=91)
        baseline_end = current_on - timedelta(days=7)
        current_value = self._sum_observations(area_id, signal_types, current_start, current_on)
        latest_daily = self._sum_observations(area_id, signal_types, current_on, current_on)
        baseline_weekly = self._weekly_baseline(area_id, signal_types, baseline_start, baseline_end)
        if baseline_weekly <= 0 and current_value > 0:
            baseline_weekly = 70.0 if any("fever" in s or "symptom" in s or "case" in s for s in signal_types) else 100.0
        weekly_dev = ((current_value - baseline_weekly) / baseline_weekly * 100) if baseline_weekly > 0 else 0
        baseline_daily = (baseline_weekly / 7.0) if baseline_weekly > 0 else 10.0
        daily_dev = ((latest_daily - baseline_daily) / baseline_daily * 100) if latest_daily > 0 and baseline_daily > 0 else 0
        deviation = max(weekly_dev, daily_dev) if daily_dev > weekly_dev else weekly_dev
        return BaselineComparison(current_value=round(current_value, 2), baseline_value=round(baseline_weekly, 2), deviation_percent=round(deviation, 2), anomaly_score=self.normalize_deviation(deviation))

    def persistence_score(self, area_id: int, assessed_on: date) -> float:
        abnormal_weeks = 0
        for week_index in range(3):
            week_end = assessed_on - timedelta(days=7 * week_index)
            comparison = self.compare_signal_group(area_id, MEDICINE_SIGNALS | HEALTH_SIGNALS, week_end)
            if comparison.anomaly_score >= 50:
                abnormal_weeks += 1
        return min(100, abnormal_weeks / 3 * 100)

    def geographic_spread_score(self, area_id: int, assessed_on: date) -> float:
        neighbor_ids = self.db.scalars(select(AreaNeighbor.neighbor_area_id).where(AreaNeighbor.area_id == area_id)).all()
        if not neighbor_ids:
            return 0
        abnormal_neighbors = 0
        for neighbor_id in neighbor_ids:
            comparison = self.compare_signal_group(neighbor_id, MEDICINE_SIGNALS | HEALTH_SIGNALS, assessed_on)
            if comparison.anomaly_score >= 50:
                abnormal_neighbors += 1
        return min(100, abnormal_neighbors / len(neighbor_ids) * 100)

    def confidence_score(self, medicine: BaselineComparison, health: BaselineComparison, persistence: float, geographic: float) -> float:
        supporting_signals = sum([medicine.anomaly_score >= 40, health.anomaly_score >= 40, persistence >= 40, geographic >= 40])
        data_strength = min(100, (medicine.current_value + health.current_value) / 25)
        return min(100, supporting_signals * 20 + data_strength * 0.2)

    def classify_risk(self, risk_score: float) -> RiskLevel:
        if risk_score >= self.settings.high_threshold:
            return RiskLevel.HIGH
        if risk_score >= self.settings.low_threshold:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    @staticmethod
    def normalize_deviation(deviation_percent: float) -> float:
        if deviation_percent <= 0:
            return 0
        return round(min(100, deviation_percent * 1.25), 2)

    def trend_for_area(self, area_id: int, assessed_on: date, current_score: float) -> str:
        previous = self.db.scalar(select(RiskAssessment).where(RiskAssessment.area_id == area_id, RiskAssessment.assessed_on < assessed_on).order_by(RiskAssessment.assessed_on.desc()))
        if not previous:
            return "STABLE"
        if current_score >= previous.risk_score + 5:
            return "INCREASING"
        if current_score <= previous.risk_score - 5:
            return "DECREASING"
        return "STABLE"

    @staticmethod
    def build_explanation(medicine: BaselineComparison, health: BaselineComparison, persistence: float, geographic: float) -> str:
        parts = [f"Medicine demand changed by {medicine.deviation_percent}% against baseline.", f"Health indicators changed by {health.deviation_percent}% against baseline."]
        if persistence >= 40:
            parts.append("The abnormal pattern has persisted across recent weeks.")
        if geographic >= 40:
            parts.append("Nearby areas also show elevated aggregated signals.")
        return " ".join(parts)

    @staticmethod
    def recommended_action(risk_level: RiskLevel) -> str:
        if risk_level == RiskLevel.HIGH:
            return "Potential health risk detected. Increase monitoring and initiate official verification."
        if risk_level == RiskLevel.MEDIUM:
            return "Increase monitoring, watch trend, and check supporting indicators."
        return "Continue routine monitoring."

    def comparison_rows(self, assessed_on: date | None = None, area_id: int | None = None) -> list[dict]:
        target_date = assessed_on or self._latest_observation_date() or date.today()
        areas_query = select(Area).order_by(Area.name)
        if area_id:
            areas_query = areas_query.where(Area.id == area_id)
        rows = []
        for area in self.db.scalars(areas_query).all():
            for label, signals in [("medicine_demand", MEDICINE_SIGNALS), ("health_indicators", HEALTH_SIGNALS)]:
                comparison = self.compare_signal_group(area.id, signals, target_date)
                rows.append({"area_id": area.id, "area_name": area.name, "signal_type": label, "current_value": comparison.current_value, "baseline_value": comparison.baseline_value, "deviation_percent": comparison.deviation_percent, "anomaly_score": comparison.anomaly_score})
        return rows

    def _maybe_create_alert(self, assessment: RiskAssessment) -> bool:
        if assessment.risk_level == RiskLevel.LOW:
            return False
        existing = self.db.scalar(select(Alert).where(Alert.assessment_id == assessment.id, Alert.status.in_([AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED])))
        if existing:
            return False
        area = self.db.get(Area, assessment.area_id)
        area_name = area.name if area else f"Ward {assessment.area_id}"
        title = f"Syndromic Outbreak Signal: Clustered Febrile Anomaly in {area_name}" if assessment.risk_level == RiskLevel.HIGH else f"Sentinel Warning: Elevated Medicine & Symptom Velocity in {area_name}"
        evidence_lines = [f"Medicine demand anomaly: {round(assessment.medicine_score)}/100.", f"Aggregated health-indicator anomaly: {round(assessment.health_score)}/100.", f"Multi-week syndromic persistence indicator: {round(assessment.persistence_score)}/100.", f"Spatial cross-correlation anomaly: {round(assessment.geographic_score)}/100 across neighboring areas."]
        self.db.add(Alert(assessment_id=assessment.id, area_id=assessment.area_id, title=title, message="\n".join(evidence_lines)))
        return True

    def _sum_observations(self, area_id: int, signal_types: set[str], start: date, end: date) -> float:
        return float(self.db.scalar(select(func.coalesce(func.sum(Observation.value), 0)).where(Observation.area_id == area_id, Observation.signal_type.in_(signal_types), Observation.observed_on >= start, Observation.observed_on <= end, Observation.value >= 0, Observation.data_quality_score >= 0.5)) or 0)

    def _weekly_baseline(self, area_id: int, signal_types: set[str], start: date, end: date) -> float:
        total = self._sum_observations(area_id, signal_types, start, end)
        days = max(1, (end - start).days + 1)
        return total / days * 7

    def _latest_observation_date(self) -> date | None:
        return self.db.scalar(select(func.max(Observation.observed_on)))
