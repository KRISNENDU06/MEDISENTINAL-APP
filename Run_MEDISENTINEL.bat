@echo off
setlocal enabledelayedexpansion
title MEDISENTINEL - AI Disease Early Warning Surveillance Platform
color 0A

echo =========================================================================
echo  MEDISENTINEL - Community Disease Early Warning Surveillance Platform
echo  Tagline: "YOUR HEALTH, OUR WATCH"
echo  Smart India Hackathon (SIH)
echo =========================================================================
echo.

set "ROOT_DIR=%~dp0"
set "ASSETS_DIR=%ROOT_DIR%assets"
set "ICON_PATH=%ASSETS_DIR%\app_icon.ico"
set "VBS_SCRIPT=%ASSETS_DIR%\create_shortcut.vbs"
set "START_BACKEND=%ASSETS_DIR%\start_backend.bat"
set "START_FRONTEND=%ASSETS_DIR%\start_frontend.bat"

REM -------------------------------------------------------------------------
REM STEP 1: Verify / Generate Application Icon & Desktop Shortcut
REM -------------------------------------------------------------------------
echo [*] Checking Desktop Shortcut and Application Icon...
if not exist "%ICON_PATH%" (
    if exist "%ROOT_DIR%generate_icon.py" (
        echo [*] Generating high-resolution MediSentinel icon...
        python "%ROOT_DIR%generate_icon.py" >nul 2>&1
    )
)

if exist "%VBS_SCRIPT%" (
    cscript //nologo "%VBS_SCRIPT%" "%~dp0Run_MEDISENTINEL.bat" "%~dp0" "%ICON_PATH%" >nul 2>&1
    echo [OK] Desktop Shortcut refreshed: 'MEDISENTINEL - AI Health Surveillance'
)
echo.

REM -------------------------------------------------------------------------
REM STEP 2: Verify System Prerequisites
REM -------------------------------------------------------------------------
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3.10+ is required but not found in system PATH!
    echo         Please download and install Python from https://www.python.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / npm is required but not found in system PATH!
    echo         Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM -------------------------------------------------------------------------
REM STEP 3: Concurrently Launch Backend & Frontend Services
REM -------------------------------------------------------------------------
echo [*] Launching FastAPI Backend on port 8000...
start "MEDISENTINEL Backend (FastAPI)" "%START_BACKEND%"

echo [*] Launching React 19 Frontend on port 5173...
start "MEDISENTINEL Frontend (React+Vite)" "%START_FRONTEND%"

REM -------------------------------------------------------------------------
REM STEP 4: Wait for Services and Open Web Browser
REM -------------------------------------------------------------------------
echo.
echo [*] Waiting 5 seconds for servers to start...
timeout /t 5 >nul

echo [*] Launching MEDISENTINEL Dashboard in your default web browser...
start http://localhost:5173

echo.
echo =========================================================================
echo  MEDISENTINEL SYSTEM IS LIVE AND RUNNING!
echo =========================================================================
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API & Docs: http://127.0.0.1:8000/docs
echo  - Health Endpoint:    http://127.0.0.1:8000/health
echo -------------------------------------------------------------------------
echo  Default Login Credentials (3-Tier RBAC):
echo   - 1. Admin:           admin@sih.gov.in    / Admin@12345
echo   - 2. Health Official: official@sih.gov.in / Official@12345
echo   - 3. Citizen / Viewer: viewer@sih.gov.in   / Viewer@12345
echo =========================================================================
echo.
echo Note: The backend and frontend are running in separate terminal windows.
echo To stop MEDISENTINEL, simply close those terminal windows.
echo.
echo Press any key to exit this status screen...
pause >nul
