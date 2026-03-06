@echo off
title Setup Network Access - Web Scraper

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator...
    powershell -ExecutionPolicy Bypass -File "%~dp0setup-network-access.ps1"
) else (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -File \"%~dp0setup-network-access.ps1\"' -Verb RunAs"
)
