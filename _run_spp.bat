@echo off
title SPP Backend - Port 5001
cd /d "C:\Users\akem\Music\scrappingdaskrimti\spp-scraper"
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --host 0.0.0.0 --port 5001
