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
    provider_type: str = "PUBLIC_CITIZEN"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: Role
    provider_type: str
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
    email: str
    password: str


class SendOTPRequest(BaseModel):
    target: str
    channel: str = "MOBILE"
    purpose: str = "REGISTER"


class VerifyOTPRequest(BaseModel):
    target: str
    otp: str
    purpose: str = "REGISTER"


class RegisterWithOTPRequest(BaseModel):
    target: str
    otp: str
    full_name: str
    password: str = Field(min_length=8)
    role: Role = Role.VIEWER
    district: str | None = "Khurda"
    ward: str | None = "Saheed Nagar"
    designation: str | None = None
    language: str | None = "english"


class ResetPasswordOTPRequest(BaseModel):
    target: str
    otp: str
    new_password: str = Field(min_length=8)


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


class MultiSignalObservationCreate(BaseModel):
    area_name: str | None = None
    district: str | None = None
    area_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    observed_on: date
    medicine_demand: float = Field(default=0.0, ge=0)
    fever_cases: float = Field(default=0.0, ge=0)
    water_quality: float | None = Field(default=None, ge=0)
    pharmacy_source: str = "Retail Chemist Network"
    hospital_source: str = "Hospital & PHC OPD Register"
    water_source: str = "Water Quality Surveillance Lab"
    data_quality_score: float = Field(default=0.95, ge=0, le=1)


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


class HealthReportCreate(BaseModel):
    area_id: int | None = None
    area_name: str | None = None
    report_title: str
    observed_signals: dict | list | str
    risk_level: RiskLevel = RiskLevel.MEDIUM
    clinical_notes: str = ""
    recommendations: list[str] | str
    officer_name: str | None = None
    officer_designation: str | None = None
    reported_date: date | None = None
    is_public: bool = True


class HealthReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    area_id: int
    area_name: str | None = None
    district: str | None = None
    officer_id: int | None = None
    officer_name: str
    officer_designation: str
    report_title: str
    observed_signals: str
    risk_level: RiskLevel
    clinical_notes: str
    recommendations: str
    reported_date: date
    is_public: bool
    created_at: datetime
