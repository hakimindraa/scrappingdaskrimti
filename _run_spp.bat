@echo off
title SPP Backend - Port 5001
cd /d "C:\scrappingdaskrimti\spp-scraper"
echo Starting SPP Backend...
echo.
call venv\Scripts\activate.bat
echo Uvicorn starting on 0.0.0.0:5001...
uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
