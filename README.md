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

## 👥 3. 3-Tier Persona Architecture & Default Credentials

| Role | Email | Password | Access Scope & Features |
|---|---|---|---|
| 👑 **Admin** | `admin@sih.gov.in` | `Admin@12345` | **Full Master Control**: Ingest new health signals/observations, trigger risk engine, system parameters, alerts management, full anomaly matrix. |
| 🏥 **Health Official** | `official@sih.gov.in` | `Official@12345` | **Operational Hub**: Manage alerts & triage, dispatch Rapid Response Teams (RRT), generate multilingual advisories, deep anomaly matrix tables, SEIR outbreak simulations. |
| 👨‍👩‍👧 **Citizen / Customer** | `viewer@sih.gov.in` | `Viewer@12345` | **Public Health Guardian**: GPS neighborhood risk lookup, 3-step smart symptom checker & triage, nearest UPHCs & 24/7 pharmacies locator with live stock, multilingual voice bulletins (English/Odia/Hindi), anonymous Community Watch reporting, 24/7 AI chatbot, educational outbreak what-if lab. |

---

## 🚀 4. Citizen-Friendly Interactive Features

1. 📍 **GPS "Check My Neighborhood Risk"**: One-click ward status lookup giving actionable community safety scores.
2. 🩺 **3-Step Smart Symptom Checker**: Instant syndromic triage categorizing symptoms into Home Care (ORS/Hydration), UPHC Clinic visit, or 108 Emergency Ambulance.
3. 🏥 **Find Nearest Care & 24/7 Pharmacies Locator**: Live verified directory of Urban Primary Health Centers (UPHCs), Government District Hospitals, and 24/7 Open Pharmacies with one-tap phone calls and directions.
4. 🔊 **Multilingual Voice & Audio Bulletins**: Built-in voice broadcasts in **English**, **Odia (ଓଡ଼ିଆ)**, and **Hindi (हिन्दी)** for accessible public alerts.
5. 📢 **Community Watch (15-Sec Anonymous Report)**: Crowdsource local fever symptoms with guaranteed $(\epsilon=1.0, \delta=0)$ Laplace Differential Privacy.
6. 🧪 **Outbreak Science & What-If Action Lab**: Interactive SEIR mathematical model showing how community actions flatten the epidemic curve.

---

## 🛠️ 5. Tech Stack & Architecture

- **Backend**: Python FastAPI 3.13, SQLAlchemy, SQLite, Pydantic v2, Pytest
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Leaflet Maps, Recharts
- **Surveillance Engine**: 4-Pillar Composite Risk Index (`0–100` score)
  $$\text{Risk Score} = (0.30 \times \text{Medicine}) + (0.30 \times \text{Health}) + (0.20 \times \text{Persistence}) + (0.20 \times \text{Geographic Spread})$$
- **Privacy & Security**: $(\epsilon, \delta)$-Differential Privacy Laplace perturbation engine, JWT authentication, role-based access control.

---

## 🧪 6. Testing & Quality Assurance

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
