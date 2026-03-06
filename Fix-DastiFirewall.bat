@echo off
title Fix DASTI Firewall

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator...
    powershell -ExecutionPolicy Bypass -File "%~dp0fix-dasti-firewall.ps1"
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0fix-dasti-firewall.ps1\"' -Verb RunAs"
)
