@echo off
title Packaging ThunderAI Extension
echo Starting ThunderAI packaging...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package.ps1"
if %errorlevel% neq 0 (
    echo.
    echo Packaging failed!
    pause
    exit /b %errorlevel%
)
echo.
echo Packaging completed successfully!
pause
