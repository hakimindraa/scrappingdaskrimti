@echo off
title Web Scraper Launcher
cd /d "%~dp0"

:: ============================================
:: Smart Admin Check
:: Check firewall first, only request admin if needed
:: ============================================

:: Check if firewall rules exist (doesn't need admin)
powershell -Command "$rules = Get-NetFirewallRule -DisplayName 'Web Scraper*' -ErrorAction SilentlyContinue; if ($rules) { exit 0 } else { exit 1 }" >nul 2>&1

if %errorLevel% == 0 (
    echo Firewall rules OK, starting normally...
    powershell -ExecutionPolicy Bypass -File "start-scraper.ps1"
) else (
    echo Firewall rules not found, requesting Administrator privileges...
    powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0start-scraper.ps1\"' -Verb RunAs"
    exit
)

pause
