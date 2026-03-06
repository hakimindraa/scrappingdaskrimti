@echo off
echo ========================================
echo DASTI Scraper Backend
echo ========================================
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "venv\" (
    echo Virtual environment tidak ditemukan.
    echo Membuat virtual environment...
    python -m venv venv
    echo.
)

REM Activate virtual environment
echo Mengaktifkan virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo.
echo Memeriksa dependencies...
pip install -r requirements.txt --quiet

REM Start server
echo.
echo ========================================
echo Starting DASTI Scraper API...
echo Server: http://0.0.0.0:5002 (Network Access)
echo Local:  http://localhost:5002
echo Docs:   http://localhost:5002/docs
echo ========================================
echo.
echo Tekan Ctrl+C untuk menghentikan server
echo.

uvicorn app.main:app --host 0.0.0.0 --port 5002 --reload

pause
