@echo off
title MEDISENTINEL - YOUR HEALTH, OUR WATCH
color 0A

echo =========================================================================
echo  MEDISENTINEL - Community Disease Early Warning Platform
echo  Tagline: "YOUR HEALTH, OUR WATCH"
echo =========================================================================
echo.

set "ROOT_DIR=%~dp0"
set "ICON_PATH=%ROOT_DIR%frontend\public\app_icon.ico"
if not exist "%ICON_PATH%" set "ICON_PATH=%ROOT_DIR%..\assets\app_icon.ico"

REM 0. Ensure Desktop Shortcut exists
if exist "%ROOT_DIR%..\assets\create_shortcut.vbs" (
    cscript //nologo "%ROOT_DIR%..\assets\create_shortcut.vbs" "%~dp0run.bat" "%~dp0" "%ICON_PATH%" >nul 2>&1
)

set "ASSETS_DIR=%ROOT_DIR%..\assets"
if exist "%ASSETS_DIR%\start_backend.bat" (
    echo [*] Starting FastAPI Backend on http://127.0.0.1:8000 ...
    start "MEDISENTINEL Backend (FastAPI)" "%ASSETS_DIR%\start_backend.bat"
    echo [*] Starting React Frontend Dev Server on http://localhost:5173 ...
    start "MEDISENTINEL Frontend (React+Vite)" "%ASSETS_DIR%\start_frontend.bat"
) else (
    cd /d "%~dp0backend"
    if not exist ".venv\Scripts\python.exe" (
        echo [*] Creating virtual environment...
        python -m venv .venv
        .\.venv\Scripts\python.exe -m pip install -r requirements.txt
    )
    start "MEDISENTINEL Backend (FastAPI)" cmd /k "cd /d ""%~dp0backend"" && .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

    cd /d "%~dp0frontend"
    if not exist "node_modules" (
        echo [*] Installing frontend npm packages...
        call npm install
    )
    start "MEDISENTINEL Frontend (React+Vite)" cmd /k "cd /d ""%~dp0frontend"" && call npm run dev"
)

REM 3. Wait a moment and launch browser
timeout /t 5 >nul
echo [*] Opening MEDISENTINEL Dashboard in browser...
start http://localhost:5173

echo.
echo =========================================================================
echo  MEDISENTINEL System is running!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API & Docs: http://127.0.0.1:8000/docs
echo =========================================================================
echo.
pause
