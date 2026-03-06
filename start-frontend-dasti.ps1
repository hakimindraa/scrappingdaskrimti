# ============================================
# Web Scraper - Start Frontend + DASTI Only
# ============================================

$Host.UI.RawUI.WindowTitle = "Frontend + DASTI Launcher"

function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

Clear-Host
Write-Color "============================================" "Cyan"
Write-Color "   FRONTEND + DASTI ONLY - LAUNCHER        " "Cyan"
Write-Color "============================================" "Cyan"
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Color "[INFO] Direktori: $scriptDir" "Gray"
Write-Host ""

# ============================================
# Auto-detect and Update IP Address
# ============================================
Write-Color "[0/4] Auto-detect IP Address..." "Yellow"

# Get local IP address
$localIP = $null
$wifiAdapter = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
    $_.InterfaceAlias -like "*Wi-Fi*" -and $_.PrefixOrigin -eq "Dhcp" 
}

if ($wifiAdapter) {
    $localIP = $wifiAdapter.IPAddress
} else {
    $ethAdapter = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
        $_.InterfaceAlias -like "*Ethernet*" -and $_.PrefixOrigin -eq "Dhcp" 
    }
    if ($ethAdapter) {
        $localIP = $ethAdapter.IPAddress
    } else {
        $anyAdapter = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { 
            $_.PrefixOrigin -eq "Dhcp" 
        } | Select-Object -First 1
        if ($anyAdapter) {
            $localIP = $anyAdapter.IPAddress
        }
    }
}

if ($localIP) {
    Write-Color "  OK IP Address detected: $localIP" "Green"
    
    # Update frontend .env.local (DASTI only)
    $envLocalPath = Join-Path $scriptDir "frontend\.env.local"
    $envContent = @"
# Backend API URLs
# Auto-updated by start-frontend-dasti.ps1 on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# DASTI Backend
NEXT_PUBLIC_DASTI_API_URL=http://${localIP}:5002

# SIPEDE & SPP - Offline (not started)
NEXT_PUBLIC_SIPEDE_API_URL=http://${localIP}:5000
NEXT_PUBLIC_SPP_API_URL=http://${localIP}:5001

# Laptop Server IP: $localIP
# Akses dari laptop lain: http://${localIP}:3000
"@
    
    $envContent | Out-File -FilePath $envLocalPath -Encoding UTF8 -Force
    Write-Color "  OK Frontend .env.local updated" "Green"
} else {
    Write-Color "  WARNING: Tidak dapat detect IP Address" "Yellow"
    Write-Color "           Menggunakan localhost (hanya akses lokal)" "Yellow"
    
    # Fallback to localhost
    $envLocalPath = Join-Path $scriptDir "frontend\.env.local"
    $envContent = @"
# Backend API URLs
# Auto-updated by start-frontend-dasti.ps1 on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# DASTI Backend
NEXT_PUBLIC_DASTI_API_URL=http://localhost:5002

# SIPEDE & SPP - Offline (not started)
NEXT_PUBLIC_SIPEDE_API_URL=http://localhost:5000
NEXT_PUBLIC_SPP_API_URL=http://localhost:5001

# No network IP detected - using localhost only
"@
    
    $envContent | Out-File -FilePath $envLocalPath -Encoding UTF8 -Force
}

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

# DASTI Backend dependencies (Python venv)
$dastiVenv = Join-Path $scriptDir "dasti-scraper\venv"
if (!(Test-Path $dastiVenv)) {
    Write-Color "  Creating Python virtual environment for DASTI..." "Gray"
    Set-Location (Join-Path $scriptDir "dasti-scraper")
    python -m venv venv
    $pipPath = Join-Path $scriptDir "dasti-scraper\venv\Scripts\pip.exe"
    & $pipPath install -r requirements.txt
    Set-Location $scriptDir
}
Write-Color "  OK DASTI Backend dependencies" "Green"

# Check & Create DASTI .env file
Write-Color "  Checking DASTI .env file..." "Gray"
$dastiEnv = Join-Path $scriptDir "dasti-scraper\.env"
if (!(Test-Path $dastiEnv)) {
    Write-Color "  Creating DASTI .env file..." "Gray"
    Copy-Item (Join-Path $scriptDir "dasti-scraper\.env.example") $dastiEnv
    Write-Color "  OK DASTI .env created" "Green"
} else {
    Write-Color "  OK DASTI .env exists" "Green"
}

Write-Host ""

# ============================================
# Start Services
# ============================================
Write-Color "[3/4] Menjalankan services..." "Yellow"

# Create temp batch files
$dastiBat = Join-Path $scriptDir "_run_dasti.bat"
$frontendBat = Join-Path $scriptDir "_run_frontend.bat"

# DASTI Backend batch
@"
@echo off
title DASTI Backend - Port 5002
cd /d "$scriptDir\dasti-scraper"
echo Starting DASTI Backend...
echo.
call venv\Scripts\activate.bat
echo Uvicorn starting on 0.0.0.0:5002...
uvicorn app.main:app --host 0.0.0.0 --port 5002 --reload
"@ | Out-File -FilePath $dastiBat -Encoding ASCII

# Frontend batch - Development mode
@"
@echo off
title Frontend - Port 3000 (Dev Mode)
cd /d "$scriptDir\frontend"
echo Starting Frontend (Development Mode)...
npm run dev -- -H 0.0.0.0
"@ | Out-File -FilePath $frontendBat -Encoding ASCII

# Start services
Write-Color "  Starting DASTI Backend (Port 5002)..." "Gray"
Start-Process cmd -ArgumentList "/c", $dastiBat
Start-Sleep -Seconds 3
Write-Color "  OK DASTI Backend started" "Green"

Write-Color "  Starting Frontend (Port 3000) - Dev Mode..." "Gray"
Start-Process cmd -ArgumentList "/c", $frontendBat
Start-Sleep -Seconds 5
Write-Color "  OK Frontend started (Development)" "Green"

Write-Host ""

# ============================================
# Verify DASTI Network Binding
# ============================================
Write-Color "Verifying DASTI network binding..." "Gray"
Start-Sleep -Seconds 3

try {
    $dastiBinding = netstat -ano | Select-String "5002" | Select-String "LISTENING"
    if ($dastiBinding -match "0\.0\.0\.0:5002") {
        Write-Color "  OK DASTI listening on 0.0.0.0:5002 (Network Access Ready)" "Green"
    } elseif ($dastiBinding -match "127\.0\.0\.1:5002") {
        Write-Color "  WARNING: DASTI only listening on 127.0.0.1:5002 (Localhost Only)" "Yellow"
        Write-Color "           Restart DASTI backend jika masalah berlanjut" "Yellow"
    } else {
        Write-Color "  INFO: DASTI binding check inconclusive" "Gray"
    }
} catch {
    Write-Color "  INFO: Could not verify DASTI binding" "Gray"
}

Write-Host ""

# ============================================
# Open Browser
# ============================================
Write-Color "[4/4] Membuka browser..." "Yellow"
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
Write-Color "  OK Browser opened" "Green"

Write-Host ""
Write-Color "============================================" "Cyan"
Write-Color "  FRONTEND + DASTI BERJALAN!" "Green"
Write-Color "============================================" "Cyan"
Write-Host ""
Write-Color "  Mode: DEVELOPMENT (Hot Reload)" "Magenta"
Write-Host ""
Write-Color "  Akses Lokal (laptop ini):" "Yellow"
Write-Color "    Frontend:      http://localhost:3000" "White"
Write-Color "    DASTI Backend: http://localhost:5002" "White"
Write-Host ""

if ($localIP) {
    Write-Color "  Akses dari Laptop Lain (WiFi sama):" "Yellow"
    Write-Color "    Frontend:      http://${localIP}:3000" "Magenta"
    Write-Color "    DASTI Backend: http://${localIP}:5002" "Magenta"
    Write-Host ""
}

Write-Host ""
Write-Color "  Tab yang Aktif:" "Green"
Write-Color "    - Home" "White"
Write-Color "    - DASTI Scraper ✓" "Green"
Write-Color "    - Dashboard (SIPEDE & SPP offline)" "Gray"
Write-Color "    - Insight" "White"
Write-Host ""
Write-Color "  SIPEDE & SPP Backend: OFFLINE" "Red"
Write-Color "    Gunakan start-scraper.ps1 untuk menjalankan semua" "Gray"
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
Remove-Item $dastiBat -Force -ErrorAction SilentlyContinue
Remove-Item $frontendBat -Force -ErrorAction SilentlyContinue

Write-Color "OK Semua services dihentikan" "Green"
Write-Host ""
