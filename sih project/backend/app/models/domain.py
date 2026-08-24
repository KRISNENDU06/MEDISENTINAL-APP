from datetime import date, datetime
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Role(str, Enum):
    ADMIN = "ADMIN"
    HEALTH_OFFICIAL = "HEALTH_OFFICIAL"
    VIEWER = "VIEWER"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class AlertStatus(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(SqlEnum(Role), default=Role.VIEWER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Area(Base):
    __tablename__ = "areas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    district: Mapped[str] = mapped_column(String(120))
    state: Mapped[str] = mapped_column(String(120), default="Odisha")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    observations: Mapped[list["Observation"]] = relationship(back_populates="area")
    assessments: Mapped[list["RiskAssessment"]] = relationship(back_populates="area")


class AreaNeighbor(Base):
    __tablename__ = "area_neighbors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"), index=True)
    neighbor_area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"), index=True)


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"), index=True)
    observed_on: Mapped[date] = mapped_column(Date, index=True)
    signal_type: Mapped[str] = mapped_column(String(80), index=True)
    category: Mapped[str] = mapped_column(String(120), default="general")
    value: Mapped[float] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(120), default="synthetic")
    data_quality_score: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    area: Mapped[Area] = relationship(back_populates="observations")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"), index=True)
    assessed_on: Mapped[date] = mapped_column(Date, index=True)
    medicine_score: Mapped[float] = mapped_column(Float)
    health_score: Mapped[float] = mapped_column(Float)
    persistence_score: Mapped[float] = mapped_column(Float)
    geographic_score: Mapped[float] = mapped_column(Float)
    risk_score: Mapped[float] = mapped_column(Float, index=True)
    confidence: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[RiskLevel] = mapped_column(SqlEnum(RiskLevel), index=True)
    trend: Mapped[str] = mapped_column(String(30), default="STABLE")
    explanation: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    area: Mapped[Area] = relationship(back_populates="assessments")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="assessment")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("risk_assessments.id"), index=True)
    area_id: Mapped[int] = mapped_column(ForeignKey("areas.id"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[AlertStatus] = mapped_column(SqlEnum(AlertStatus), default=AlertStatus.OPEN)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    assessment: Mapped[RiskAssessment] = relationship(back_populates="alerts")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(30), default="SUCCESS")
    details: Mapped[str] = mapped_column(Text, default="")
    ip_address: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
