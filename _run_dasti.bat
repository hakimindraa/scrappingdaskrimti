@echo off
title DASTI Backend - Port 5002
cd /d "C:\scrappingdaskrimti\dasti-scraper"
echo Starting DASTI Backend...
echo.
call venv\Scripts\activate.bat
echo Uvicorn starting on 0.0.0.0:5002...
uvicorn app.main:app --host 0.0.0.0 --port 5002 --reload
