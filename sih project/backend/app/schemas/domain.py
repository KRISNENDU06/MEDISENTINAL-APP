from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.domain import AlertStatus, RiskLevel, Role


class Token(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(min_length=8)
    role: Role = Role.VIEWER


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: Role
    is_active: bool


class ActivityLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    user_email: str | None
    action: str
    status: str
    details: str
    ip_address: str | None
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AreaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    district: str
    state: str
    latitude: float | None
    longitude: float | None


class ObservationCreate(BaseModel):
    area_name: str | None = None
    district: str | None = None
    area_id: int | None = None
    custom_area_name: str | None = None
    custom_district: str | None = None
    state: str = "Odisha"
    custom_state: str = "Odisha"
    latitude: float | None = None
    longitude: float | None = None
    observed_on: date
    signal_type: str
    category: str = "general"
    value: float = Field(ge=0)
    source: str = "manual"
    data_quality_score: float = Field(default=1.0, ge=0, le=1)


class ObservationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    area_id: int
    observed_on: date
    signal_type: str
    category: str
    value: float
    source: str
    data_quality_score: float


class SignalScore(BaseModel):
    medicine_demand: float
    health_indicators: float
    persistence: float
    geographic_spread: float


class RiskAssessmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    area_id: int
    assessed_on: date
    medicine_score: float
    health_score: float
    persistence_score: float
    geographic_score: float
    risk_score: float
    confidence: float
    risk_level: RiskLevel
    trend: str
    explanation: str
    recommended_action: str


class AreaRiskSummary(BaseModel):
    area: AreaRead
    assessment: RiskAssessmentRead | None


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    assessment_id: int
    area_id: int
    title: str
    message: str
    status: AlertStatus
    created_at: datetime
    risk_level: RiskLevel | None = None
    risk_score: float | None = None
    confidence: float | None = None
    area_name: str | None = None


class DashboardSummary(BaseModel):
    overall_risk_score: float
    overall_risk_level: RiskLevel
    average_confidence: float
    active_alerts: int
    areas_monitored: int
    signals_processed: int
    high_risk_areas: int
    medium_risk_areas: int
    low_risk_areas: int
    last_updated: datetime | None


class ComparisonRow(BaseModel):
    area_id: int
    area_name: str
    signal_type: str
    current_value: float
    baseline_value: float
    deviation_percent: float
    anomaly_score: float


class RiskRunResponse(BaseModel):
    processed_areas: int
    generated_alerts: int
    assessments: list[RiskAssessmentRead]
