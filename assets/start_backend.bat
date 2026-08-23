@echo off
title MEDISENTINEL Backend (FastAPI)
color 0B

set "ROOT_DIR=%~dp0.."
set "BACKEND_DIR=%ROOT_DIR%\sih project\backend"

cd /d "%BACKEND_DIR%"
echo =========================================================================
echo  MEDISENTINEL FastAPI Backend Server
echo  Port: http://127.0.0.1:8000
echo  API Documentation: http://127.0.0.1:8000/docs
echo =========================================================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [*] Initializing virtual environment...
    python -m venv .venv
    .\.venv\Scripts\python.exe -m pip install --upgrade pip
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt
)

echo [*] Starting Uvicorn server on http://127.0.0.1:8000 ...
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend failed to start or crashed.
    pause
)

