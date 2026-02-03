@echo off
title SPP Backend - Port 5001
cd /d "E:\porto\spp-scraper"
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 5001
