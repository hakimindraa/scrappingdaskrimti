@echo off
title SIPEDE SQLite Migration - Installer
color 0A

echo ============================================
echo   SIPEDE SQLite Migration - Installer
echo ============================================
echo.

cd /d "%~dp0sipede-scraper\backend"

echo [1/3] Installing dependencies...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo [2/3] Running migration script...
echo.
call npm run migrate
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Migration script failed or no data to migrate.
    echo This is OK if you don't have old data.
)

echo.
echo [3/3] Testing server...
echo.
echo Starting server for 5 seconds to verify...
start /B npm start
timeout /t 5 /nobreak >nul
taskkill /F /IM node.exe >nul 2>&1

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo SQLite database is ready at:
echo   sipede-scraper/backend/data/sipede_data.db
echo.
echo Next steps:
echo   1. Run Start-WebScraper.bat to start the app
echo   2. Check SQLITE_MIGRATION_GUIDE.md for details
echo.
echo ============================================
echo.
pause
