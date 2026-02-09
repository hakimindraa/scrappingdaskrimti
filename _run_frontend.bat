@echo off
title Frontend - Port 3000 (Production)
cd /d "C:\scrappingdaskrimti\frontend"
echo Building production...
call npm run build
echo Starting production server...
npm start -- -H 0.0.0.0
