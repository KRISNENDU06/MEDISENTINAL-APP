@echo off
setlocal enabledelayedexpansion
title MEDISENTINEL - Desktop Shortcut Setup
color 0B

echo =========================================================================
echo  MEDISENTINEL — DESKTOP SHORTCUT SETUP
echo  Tagline: "YOUR HEALTH, OUR WATCH"
echo =========================================================================
echo.

set "ROOT_DIR=%~dp0"
set "ASSETS_DIR=%ROOT_DIR%assets"
set "ICON_PATH=%ASSETS_DIR%\app_icon.ico"
set "VBS_SCRIPT=%ASSETS_DIR%\create_shortcut.vbs"
set "TARGET_BAT=%ROOT_DIR%Run_MEDISENTINEL.bat"

if not exist "%ICON_PATH%" (
    if exist "%ROOT_DIR%generate_icon.py" (
        echo [*] Generating icon asset...
        python "%ROOT_DIR%generate_icon.py" >nul 2>&1
    )
)

echo [*] Target Launcher: %TARGET_BAT%
echo [*] Application Icon: %ICON_PATH%
echo.

if exist "%VBS_SCRIPT%" (
    cscript //nologo "%VBS_SCRIPT%" "%TARGET_BAT%" "%ROOT_DIR%" "%ICON_PATH%"
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws=New-Object -ComObject WScript.Shell;$s=$ws.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'),'MEDISENTINEL - AI Health Surveillance.lnk'));$s.TargetPath='%TARGET_BAT%';$s.WorkingDirectory='%ROOT_DIR%';if(Test-Path '%ICON_PATH%'){$s.IconLocation='%ICON_PATH%,0'};$s.Save()"
)

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo  SUCCESS! 'MEDISENTINEL - AI Health Surveillance' shortcut is ready on Desktop!
    echo =========================================================================
) else (
    echo [ERROR] Failed to create shortcut.
)

echo.
pause

