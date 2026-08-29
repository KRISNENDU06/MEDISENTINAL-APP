from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MEDISENTINEL - Early Warning Platform"
    tagline: str = "YOUR HEALTH, OUR WATCH"
    environment: str = "development"
    database_url: str = "sqlite:///./health_risk.db"
    secret_key: str = "change-this-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    backend_cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]
    allowed_hosts: list[str] = ["*"]
    enforce_https: bool = False
    rate_limit_requests: int = 120
    rate_limit_window_seconds: int = 60
    audit_log_retention_days: int = 90

    medicine_weight: float = 0.30
    health_weight: float = 0.30
    persistence_weight: float = 0.20
    geographic_weight: float = 0.20
    low_threshold: float = 40.0
    high_threshold: float = 70.0
    seed_demo_users: bool = True
    initial_admin_email: str | None = "admin@sih.gov.in"
    initial_admin_password: str | None = "Admin@12345"
    initial_admin_name: str = "System Administrator"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("allowed_hosts", mode="before")
    @classmethod
    def split_hosts(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [host.strip() for host in value.split(",") if host.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
