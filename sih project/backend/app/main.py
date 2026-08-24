from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.api import (
    admin,
    alerts,
    areas,
    auth,
    chat,
    copilot,
    dashboard,
    observations,
    privacy,
    reports,
    response,
    risk,
    simulation,
    telemetry,
)
from app.core.config import get_settings
from app.core.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.services.seed_data import seed_database

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.environment.lower() == "production" and settings.secret_key == "change-this-secret-key":
        raise RuntimeError("Set a strong SECRET_KEY before running in production.")
    init_db()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="MEDISENTINEL - Community-Level Health Risk Early Warning & Outbreak Prediction Platform. Tagline: YOUR HEALTH, OUR WATCH.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    RateLimitMiddleware,
    requests_per_window=settings.rate_limit_requests,
    window_seconds=settings.rate_limit_window_seconds,
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts)

if settings.enforce_https:
    app.add_middleware(HTTPSRedirectMiddleware)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(areas.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(observations.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(privacy.router, prefix="/api")
app.include_router(response.router, prefix="/api")
app.include_router(copilot.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
assets_dir = os.path.join(frontend_dist, "assets")
if os.path.isdir(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        return {"error": "Not found"}
    file_path = os.path.join(frontend_dist, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    index_file = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_file):
        return FileResponse(index_file)
    return {"status": "MEDISENTINEL Early Warning Platform Active", "tagline": "YOUR HEALTH, OUR WATCH", "docs": "/docs"}
