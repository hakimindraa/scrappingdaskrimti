# ============================================
# Web Scraper - Start All Services
# ============================================

$Host.UI.RawUI.WindowTitle = "Web Scraper - Launcher"

function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

Clear-Host
Write-Color "============================================" "Cyan"
Write-Color "       WEB SCRAPER - AUTO LAUNCHER         " "Cyan"
Write-Color "============================================" "Cyan"
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Color "[INFO] Direktori: $scriptDir" "Gray"
Write-Host ""

# ============================================
# Check Dependencies
# ============================================
Write-Color "[1/4] Mengecek dependencies..." "Yellow"

# Check Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Color "[ERROR] Node.js tidak ditemukan!" "Red"
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}
$nodeVersion = node -v
Write-Color "  OK Node.js: $nodeVersion" "Green"

# Check Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Color "[ERROR] Python tidak ditemukan!" "Red"
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}
$pythonVersion = python --version
Write-Color "  OK Python: $pythonVersion" "Green"

Write-Host ""

# ============================================
# Install Dependencies (if needed)
# ============================================
Write-Color "[2/4] Mengecek & install dependencies..." "Yellow"

# Frontend dependencies
$frontendModules = Join-Path $scriptDir "frontend\node_modules"
if (!(Test-Path $frontendModules)) {
    Write-Color "  Installing frontend dependencies..." "Gray"
    Set-Location (Join-Path $scriptDir "frontend")
    npm install
    Set-Location $scriptDir
}
Write-Color "  OK Frontend dependencies" "Green"

# SIPEDE Backend dependencies
$sipedeModules = Join-Path $scriptDir "sipede-scraper\backend\node_modules"
if (!(Test-Path $sipedeModules)) {
    Write-Color "  Installing SIPEDE backend dependencies..." "Gray"
    Set-Location (Join-Path $scriptDir "sipede-scraper\backend")
    npm install
    Set-Location $scriptDir
}
Write-Color "  OK SIPEDE Backend dependencies" "Green"

# SPP Backend dependencies (Python venv)
$sppVenv = Join-Path $scriptDir "spp-scraper\venv"
if (!(Test-Path $sppVenv)) {
    Write-Color "  Creating Python virtual environment..." "Gray"
    Set-Location (Join-Path $scriptDir "spp-scraper")
    python -m venv venv
    $pipPath = Join-Path $scriptDir "spp-scraper\venv\Scripts\pip.exe"
    & $pipPath install -r requirements.txt
    Set-Location $scriptDir
}
Write-Color "  OK SPP Backend dependencies" "Green"

Write-Host ""

# ============================================
# Start Services
# ============================================
Write-Color "[3/4] Menjalankan services..." "Yellow"

# Create temp batch files
$sipedeBat = Join-Path $scriptDir "_run_sipede.bat"
$sppBat = Join-Path $scriptDir "_run_spp.bat"
$frontendBat = Join-Path $scriptDir "_run_frontend.bat"

# SIPEDE Backend batch
@"
@echo off
title SIPEDE Backend - Port 5000
cd /d "$scriptDir\sipede-scraper\backend"
npm run dev
"@ | Out-File -FilePath $sipedeBat -Encoding ASCII

# SPP Backend batch
@"
@echo off
title SPP Backend - Port 5001
cd /d "$scriptDir\spp-scraper"
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --port 5001
"@ | Out-File -FilePath $sppBat -Encoding ASCII

# Frontend batch
@"
@echo off
title Frontend - Port 3000
cd /d "$scriptDir\frontend"
npm run dev
"@ | Out-File -FilePath $frontendBat -Encoding ASCII

# Start services
Write-Color "  Starting SIPEDE Backend (Port 5000)..." "Gray"
Start-Process cmd -ArgumentList "/c", $sipedeBat
Start-Sleep -Seconds 2
Write-Color "  OK SIPEDE Backend started" "Green"

Write-Color "  Starting SPP Backend (Port 5001)..." "Gray"
Start-Process cmd -ArgumentList "/c", $sppBat
Start-Sleep -Seconds 2
Write-Color "  OK SPP Backend started" "Green"

Write-Color "  Starting Frontend (Port 3000)..." "Gray"
Start-Process cmd -ArgumentList "/c", $frontendBat
Start-Sleep -Seconds 3
Write-Color "  OK Frontend started" "Green"

Write-Host ""

# ============================================
# Open Browser
# ============================================
Write-Color "[4/4] Membuka browser..." "Yellow"
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
Write-Color "  OK Browser opened" "Green"

Write-Host ""
Write-Color "============================================" "Cyan"
Write-Color "  SEMUA SERVICES BERJALAN!" "Green"
Write-Color "============================================" "Cyan"
Write-Host ""
Write-Color "  Frontend:       http://localhost:3000" "White"
Write-Color "  SIPEDE Backend: http://localhost:5000" "White"
Write-Color "  SPP Backend:    http://localhost:5001" "White"
Write-Host ""
Write-Color "============================================" "Yellow"
Write-Color "  Tekan ENTER untuk STOP semua services" "Yellow"
Write-Color "============================================" "Yellow"
Write-Host ""

Read-Host

# Cleanup
Write-Color "Menghentikan services..." "Yellow"

# Kill node and python processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove temp batch files
Remove-Item $sipedeBat -Force -ErrorAction SilentlyContinue
Remove-Item $sppBat -Force -ErrorAction SilentlyContinue
Remove-Item $frontendBat -Force -ErrorAction SilentlyContinue

Write-Color "OK Semua services dihentikan" "Green"
Write-Host ""
