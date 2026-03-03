# DASTI Scraper Backend Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DASTI Scraper Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "Virtual environment tidak ditemukan." -ForegroundColor Yellow
    Write-Host "Membuat virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host ""
}

# Activate virtual environment
Write-Host "Mengaktifkan virtual environment..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

# Install/update dependencies
Write-Host ""
Write-Host "Memeriksa dependencies..." -ForegroundColor Green
pip install -r requirements.txt --quiet

# Start server
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting DASTI Scraper API..." -ForegroundColor Green
Write-Host "Server: http://localhost:5002" -ForegroundColor Yellow
Write-Host "Docs: http://localhost:5002/docs" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
Write-Host ""

uvicorn app.main:app --reload --port 5002
