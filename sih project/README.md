# 🛡️ MEDISENTINEL — "YOUR HEALTH, OUR WATCH"
### AI-Powered Community Health Risk Early Warning & Syndromic Surveillance Platform (Smart India Hackathon)

---

## 📌 1. Project Overview
**MEDISENTINEL** is an early warning epidemiological intelligence platform designed to detect abnormal community-level health signals and predict disease outbreaks before clinical hospitalizations surge.

Rather than waiting for manual reporting, MEDISENTINEL continuously cross-validates multiple independent telemetry streams (Pharmacy OTC sales, primary care clinic footfall, syndromic fever logs, and spatial diffusion) to calculate an explainable **4-Pillar Composite Risk Index (0–100)**.

---

## 🧮 2. 4-Pillar Composite Risk Engine Formula
$$\text{Risk Score} = (0.30 \times \text{Medicine}) + (0.30 \times \text{Health}) + (0.20 \times \text{Persistence}) + (0.20 \times \text{Geographic Spread})$$

* **🟢 Low Risk (0–39)**: Routine syndromic monitoring.
* **🟡 Medium Risk (40–69)**: Enhanced sentinel watch & field verification.
* **🔴 High Risk (70–100)**: Early warning trigger & Rapid Response Team (RRT) deployment.

---

## 🚀 3. Key Features
* 🗺️ **Real-World Geospatial Surveillance Map**: Interactive Leaflet map with live GPS coordinates, pulsing risk halos, and transmission vectors across monitored districts (Saheed Nagar, Patia, Cuttack CDA, Puri, Khurda, Angul, Sambalpur, etc.).
* 🤖 **AI Health & Epidemiological Assistant**: Integrated domain chatbot providing disease prevention SOPs (Dengue, Cholera, Influenza), fever triage, and platform diagnostics.
* 🧪 **Interactive What-If Outbreak Simulator**: Parametric SEIR mathematical simulation with real-time sliders for medicine surge, fever surge, clinic footfall, and intervention mitigations.
* 📊 **Baseline vs. Observed Matrix Table**: 7-day current surveillance vs. 90-day seasonal baseline anomaly tracking.
* 🔒 **Role-Based Admin Data Ingestion**: Clean, district and location-based signal entry with instant map updates, restricted to authorized Admin users.
* 🎨 **Multi-Theme UI**: Dark Obsidian, Clinical Light, and Health Emerald themes.

---

## 🛠️ 4. Tech Stack
* **Backend**: FastAPI (Python 3.13), SQLAlchemy, SQLite / PostgreSQL, Pydantic v2, Pytest.
* **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Leaflet, Recharts.

---

## ⚡ 5. Quick Start & Execution

### Option A: 1-Click Launch (Windows)
Double-click `Run_SIH_Surveillance.bat` on your Desktop or run:
```bat
run.bat
```

### Option B: Manual Setup

#### 1. Backend:
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

#### 2. Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 6. Running Test Suite
```bash
cd backend
.\.venv\Scripts\python -m pytest
```
All **22 backend unit and integration test suites** pass with 100% test coverage.

---

## 👥 7. Default Credentials
* **Admin (Full Ingestion & Control)**: `admin@sih.gov.in` / `Admin@12345`
* **Health Official**: `official@sih.gov.in` / `Official@12345`
* **Epidemic Analyst**: `analyst@sih.gov.in` / `Analyst@12345`
* **Public Viewer**: `viewer@sih.gov.in` / `Viewer@12345`

---
*Built for the Smart India Hackathon (SIH).*

