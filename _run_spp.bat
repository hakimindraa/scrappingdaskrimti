@echo off
title SPP Backend - Port 5001
cd /d "C:\scrappingdaskrimti\spp-scraper"
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 5001
