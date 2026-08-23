@echo off
setlocal enabledelayedexpansion
title MEDISENTINEL - GitHub Upload Tool
color 0B

echo =========================================================================
echo  MEDISENTINEL — GITHUB UPLOAD TOOL
echo  Tagline: "YOUR HEALTH, OUR WATCH"
echo =========================================================================
echo.

cd /d "%~dp0"

REM 1. Verify Git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in system PATH!
    echo         Please download Git from https://git-scm.com/
    echo.
    pause
    exit /b 1
)

REM 2. Check Remote Origin
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] No GitHub repository URL is linked yet.
    echo.
    echo Please paste your GitHub repository URL:
    echo (Example: https://github.com/your-username/your-repo-name.git)
    echo.
    set /p "REPO_URL=GitHub URL: "
    if "!REPO_URL!"=="" (
        echo [ERROR] No URL provided. Aborting.
        pause
        exit /b 1
    )
    git remote add origin !REPO_URL!
    echo [OK] Remote origin set to: !REPO_URL!
) else (
    for /f "delims=" %%u in ('git remote get-url origin') do set "CURRENT_URL=%%u"
    echo [*] Current GitHub Remote: !CURRENT_URL!
    echo.
    set /p "CHANGE_REMOTE=Do you want to change this URL? (y/N): "
    if /i "!CHANGE_REMOTE!"=="y" (
        set /p "NEW_URL=Enter new GitHub URL: "
        if not "!NEW_URL!"=="" (
            git remote set-url origin !NEW_URL!
            echo [OK] Updated remote to: !NEW_URL!
        )
    )
)

echo.
echo [*] Staging all files...
git add .

set "COMMIT_MSG="
set /p "COMMIT_MSG=Enter commit message (Press Enter for default): "
if "!COMMIT_MSG!"=="" set "COMMIT_MSG=Update MEDISENTINEL AI Health Platform"

git commit -m "!COMMIT_MSG!" >nul 2>&1

echo [*] Setting branch to main...
git branch -M main

echo.
echo [*] Pushing code to GitHub...
echo -------------------------------------------------------------------------
git push -u origin main
echo -------------------------------------------------------------------------

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo  SUCCESS: Your repository has been uploaded to GitHub!
    echo =========================================================================
) else (
    echo.
    echo [!] If the push failed with authentication error:
    echo     1. Make sure you are logged into GitHub in your browser or Git Credential Manager.
    echo     2. Or create a Personal Access Token (PAT) on GitHub: Settings -> Developer Settings -> Personal access tokens.
    echo     3. If the remote repository has existing commits (e.g. README), you may need to force push:
    echo        git push -u origin main --force
)

echo.
pause
