@echo off
title MEDISENTINEL Frontend (React+Vite)
color 0E

set "ROOT_DIR=%~dp0.."
set "FRONTEND_DIR=%ROOT_DIR%\sih project\frontend"

cd /d "%FRONTEND_DIR%"
echo =========================================================================
echo  MEDISENTINEL React Frontend Server
echo  URL: http://localhost:5173
echo =========================================================================
echo.

if not exist "node_modules" (
    echo [*] Installing frontend npm dependencies...
    call npm install
)

echo [*] Starting Vite Development Server on http://localhost:5173 ...
call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend failed to start or crashed.
    pause
)

