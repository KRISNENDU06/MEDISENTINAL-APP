@echo off
title Stop MEDISENTINEL
color 0C
echo =========================================================================
echo  Stopping MEDISENTINEL Surveillance System & Closing Terminal Windows...
echo =========================================================================
echo.

echo [*] Terminating Python & Uvicorn Backend processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM uvicorn.exe /T >nul 2>&1

echo [*] Terminating Node & Vite Frontend processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo [*] Cleaning temporary locks...
timeout /t 1 >nul

echo.
echo =========================================================================
echo  MEDISENTINEL has been safely stopped. All server windows closed.
echo =========================================================================
echo.
timeout /t 2 >nul
exit
