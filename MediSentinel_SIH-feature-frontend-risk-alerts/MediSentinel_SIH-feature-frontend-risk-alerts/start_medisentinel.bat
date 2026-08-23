@echo off
title MEDISENTINEL - Early Warning Surveillance Platform
color 0A

echo =========================================================================
echo  MEDISENTINEL - Community Disease Early Warning Platform
echo  Tagline: "YOUR HEALTH, OUR WATCH"
echo =========================================================================
echo.

set "ROOT_DIR=%~dp0..\.."
set "SIH_BACKEND=%ROOT_DIR%\sih project\backend"
set "ALT_BACKEND=%~dp0backend"
set "FRONTEND_DIR=%~dp0frontend"

REM 1. Check Backend: Prefer FastAPI backend if available, otherwise Node backend
if exist "%SIH_BACKEND%\app\main.py" (
    echo [*] Preparing Python FastAPI Backend...
    cd /d "%SIH_BACKEND%"
    if not exist ".venv\Scripts\python.exe" (
        echo [*] Creating Python virtual environment...
        python -m venv .venv
        .\.venv\Scripts\python.exe -m pip install -r requirements.txt
    )
    echo [*] Starting FastAPI Backend on http://127.0.0.1:8000 ...
    start "MEDISENTINEL Backend (FastAPI)" cmd /k "cd /d ""%SIH_BACKEND%"" && .\.venv\Scripts\activate.bat && python -m uvicorn app.main:app --port 8000 --reload"
) else if exist "%ALT_BACKEND%\src\server.js" (
    echo [*] Preparing Node.js Express Backend...
    cd /d "%ALT_BACKEND%"
    if not exist "node_modules" (
        echo [*] Installing backend npm packages...
        call npm install
    )
    echo [*] Starting Node.js Backend on http://localhost:8080 ...
    start "MEDISENTINEL Backend (Express)" cmd /k "cd /d ""%ALT_BACKEND%"" && npm start"
)

REM 2. Prepare and launch Frontend
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo [*] Installing frontend npm packages...
    call npm install
)

echo [*] Starting React Frontend Dev Server on http://localhost:5173 ...
start "MEDISENTINEL Frontend (Vite)" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev"

REM 3. Launch browser
timeout /t 3 >nul
echo [*] Opening MEDISENTINEL Dashboard in browser...
start http://localhost:5173

echo.
echo =========================================================================
echo  MEDISENTINEL System is running!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://127.0.0.1:8000/docs
echo =========================================================================
echo.
pause


