from functools import lru_cache
from typing import Any
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
    backend_cors_origins: Any = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]
    allowed_hosts: Any = ["*"]
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

    @property
    def cors_origins_list(self) -> list[str]:
        if isinstance(self.backend_cors_origins, str):
            val = self.backend_cors_origins.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    import json
                    return json.loads(val)
                except Exception:
                    pass
            return [origin.strip() for origin in val.split(",") if origin.strip()]
        elif isinstance(self.backend_cors_origins, list):
            return [str(o).strip() for o in self.backend_cors_origins]
        return ["*"]

    @property
    def allowed_hosts_list(self) -> list[str]:
        if isinstance(self.allowed_hosts, str):
            val = self.allowed_hosts.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    import json
                    return json.loads(val)
                except Exception:
                    pass
            return [host.strip() for host in val.split(",") if host.strip()]
        elif isinstance(self.allowed_hosts, list):
            return [str(h).strip() for h in self.allowed_hosts]
        return ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
