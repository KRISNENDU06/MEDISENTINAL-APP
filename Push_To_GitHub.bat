@echo off
title MEDISENTINEL - Git Push Helper
color 0B

echo =========================================================================
echo  MEDISENTINEL — GITHUB REPOSITORY UPLOAD HELPER
echo =========================================================================
echo.

cd /d "%~dp0"

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in your system PATH!
    echo         Please download and install Git from https://git-scm.com/
    echo.
    pause
    exit /b 1
)

if not exist ".git" (
    echo [*] Initializing new Git repository...
    git init
    git branch -M main
)

echo [*] Staging all files (respecting .gitignore)...
git add .

set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" set commit_msg=Initial commit: MEDISENTINEL AI Health Early Warning Platform

git commit -m "%commit_msg%"

echo.
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] No GitHub remote URL found.
    set /p repo_url="Enter your GitHub repository URL (e.g., https://github.com/username/medisentinel.git): "
    if not "!repo_url!"=="" (
        git remote add origin !repo_url!
    )
)

echo.
echo [*] Pushing code to GitHub (main branch)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo  SUCCESS! Your project has been uploaded to GitHub!
    echo =========================================================================
) else (
    echo.
    echo [!] If push failed, make sure your GitHub repo URL and credentials are correct.
)

echo.
pause

