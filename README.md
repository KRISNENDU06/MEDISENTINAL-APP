# 🛡️ MEDISENTINEL — "YOUR HEALTH, OUR WATCH"
### AI-Powered Community Health Risk Early Warning & Syndromic Surveillance Platform (Smart India Hackathon)

---

## 📌 1. Overview
**MEDISENTINEL** is a privacy-preserving epidemiological early warning system that aggregates multi-source community signals (pharmacy anti-infective sales, clinic footfalls, fever logs, and spatial contagion) to detect disease outbreaks up to **5–7 days before clinical hospitalizations surge**.

---

## ⚡ 2. 1-Click Quick Start (Windows)

When cloned or downloaded from GitHub onto **any Windows PC**:

### Option 1: Double-Click the Master Launcher
Simply double-click:
```bat
Run_MEDISENTINEL.bat
```
* Automatically verifies Python 3.10+ and Node.js.
* Installs dependencies (`.venv` and `node_modules`) on first launch.
* Automatically creates a **`MEDISENTINEL - AI Health Surveillance`** shortcut on your Desktop with the app icon.
* Starts the FastAPI backend (`http://127.0.0.1:8000`) and React frontend (`http://localhost:5173`).
* Automatically opens your default browser to the live dashboard!

### Option 2: Setup Desktop Shortcut
Double-click `Setup_Desktop_Shortcut.bat` to create or refresh the desktop shortcut with the official app icon anytime.

---

## 👥 3. Default Login Credentials

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Admin** | `admin@sih.gov.in` | `Admin@12345` | Full signal ingestion, system config & surveillance |
| **Health Official** | `official@sih.gov.in` | `Official@12345` | Area surveillance, alert acknowledgment & RRT dispatch |
| **Epidemic Analyst** | `analyst@sih.gov.in` | `Analyst@12345` | Anomaly matrix, what-if simulations & trend analytics |
| **Public Viewer** | `viewer@sih.gov.in` | `Viewer@12345` | Public district risk advisories & disease prevention SOPs |

---

## 🛠️ 4. Tech Stack & Architecture

- **Backend**: Python FastAPI 3.13, SQLAlchemy, SQLite, Pydantic v2, Pytest
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Leaflet Maps, Recharts
- **Surveillance Engine**: 4-Pillar Composite Risk Index (`0–100` score)
  $$\text{Risk Score} = (0.30 \times \text{Medicine}) + (0.30 \times \text{Health}) + (0.20 \times \text{Persistence}) + (0.20 \times \text{Geographic Spread})$$
- **Privacy & Security**: $(\epsilon, \delta)$-Differential Privacy Laplace perturbation engine, JWT authentication, rate limiting.

---

## 🧪 5. Testing & Quality Assurance

### Run Backend Pytest Suite:
```powershell
cd "sih project\backend"
.\.venv\Scripts\python -m pytest
```
*All 22 unit & integration tests pass with 100% success rate.*

### Run Frontend Production Build:
```powershell
cd "sih project\frontend"
npm run build
```
*TypeScript type-checks and Vite production builds complete with 0 errors.*

---
*Developed for Smart India Hackathon (SIH).*

