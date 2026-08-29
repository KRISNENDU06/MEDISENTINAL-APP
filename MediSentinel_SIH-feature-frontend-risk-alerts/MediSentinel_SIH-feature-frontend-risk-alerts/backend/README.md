# SIH Health Risk Early Warning Backend

Python/FastAPI backend for an explainable, privacy-aware community health risk early warning prototype.

It uses aggregated area-level observations, compares current signals with historical baseline, calculates anomaly scores, cross-validates medicine demand with health indicators, persistence, and geographic spread, then creates explainable alerts.

## Features

- FastAPI REST API
- SQLite by default, configurable for PostgreSQL
- JWT login with role-based access
- Refresh tokens and logout token revocation
- Basic rate limiting and security headers
- Synthetic demo data on first startup
- Configurable risk weights and thresholds
- Dashboard summary, area risk, alerts, observations, and data comparison APIs
- Explainable alert messages that say "potential health risk", not "outbreak confirmed"

## Quick Start

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000/docs
```

Create an admin user privately from the terminal:

```bash
python scripts/create_admin.py
```

In Swagger docs, click `Authorize` and enter your admin credentials:

```text
username: your-admin-email
password: your-admin-password
```

Leave `client_id` and `client_secret` empty.

Admin-only activity endpoints:

- `GET /api/admin/users`
- `GET /api/admin/activity-logs`

## Main Endpoints

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/admin/users`
- `GET /api/admin/activity-logs`
- `DELETE /api/admin/activity-logs/expired`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/area-risk`
- `GET /api/areas`
- `GET /api/areas/{area_id}`
- `GET /api/alerts`
- `POST /api/risk/run`
- `GET /api/risk/assessments`
- `GET /api/risk/comparison`
- `POST /api/observations`

## Risk Model

Default weights:

```text
Medicine Demand: 30%
Health Indicators: 30%
Persistence: 20%
Geographic Spread: 20%
```

Default thresholds:

```text
0-40: LOW
40-70: MEDIUM
70-100: HIGH
```

These are prototype thresholds, not medically validated thresholds.

## Run Tests

```bash
pytest
```

## Production Security Notes

Before deploying:

- Set a strong private `SECRET_KEY` in `.env`.
- Keep `BACKEND_CORS_ORIGINS` limited to your real frontend domains.
- Set `ALLOWED_HOSTS` to your production API host.
- Set `ENFORCE_HTTPS=true` behind a proper HTTPS deployment.
- Keep admin credentials private and create admin users using `scripts/create_admin.py`.
- Use PostgreSQL for deployment by setting `DATABASE_URL`.
- Use Alembic migrations for database schema changes.
- Clean old audit logs with `DELETE /api/admin/activity-logs/expired` or a scheduled job.

Migration commands:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```
