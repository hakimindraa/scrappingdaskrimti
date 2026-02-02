@echo off
title Web Scraper Launcher
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "start-scraper.ps1"
pause
