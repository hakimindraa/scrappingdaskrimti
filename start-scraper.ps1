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
# Auto-detect and Update IP Address
# ============================================
Write-Color "[0/5] Auto-detect IP Address..." "Yellow"

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
    
    # Update frontend .env.local
    $envLocalPath = Join-Path $scriptDir "frontend\.env.local"
    $envContent = @"
# Backend API URLs
# Auto-updated by start-scraper.ps1 on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

NEXT_PUBLIC_SIPEDE_API_URL=http://${localIP}:5000
NEXT_PUBLIC_SPP_API_URL=http://${localIP}:5001
NEXT_PUBLIC_DASTI_API_URL=http://${localIP}:5002

# Laptop Server IP: $localIP
# Akses dari laptop lain: http://${localIP}:3000
"@
    
    $envContent | Out-File -FilePath $envLocalPath -Encoding UTF8 -Force
    Write-Color "  OK Frontend .env.local updated" "Green"
    
    # Check if running as Administrator
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    # Check firewall rules
    $firewallRules = Get-NetFirewallRule -DisplayName "Web Scraper*" -ErrorAction SilentlyContinue
    if ($firewallRules) {
        Write-Color "  OK Firewall rules exist" "Green"
        
        # Check specifically for DASTI rules (inbound and outbound)
        $dastiInbound = Get-NetFirewallRule -DisplayName "*DASTI*In*" -ErrorAction SilentlyContinue
        $dastiOutbound = Get-NetFirewallRule -DisplayName "*DASTI*Out*" -ErrorAction SilentlyContinue
        
        if (-not $dastiInbound -or -not $dastiOutbound) {
            if ($isAdmin) {
                Write-Color "  WARNING: DASTI firewall rules incomplete!" "Yellow"
                Write-Color "           Mencoba memperbaiki..." "Yellow"
                
                # Try to fix DASTI firewall rules
                try {
                    # Remove old DASTI rules
                    Remove-NetFirewallRule -DisplayName "*DASTI*" -ErrorAction SilentlyContinue
                    
                    # Create new DASTI rules (inbound + outbound)
                    New-NetFirewallRule -DisplayName "Web Scraper - DASTI (In)" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                    New-NetFirewallRule -DisplayName "Web Scraper - DASTI (Out)" -Direction Outbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                    
                    Write-Color "  OK DASTI firewall rules fixed!" "Green"
                } catch {
                    Write-Color "  ERROR: Gagal fix DASTI firewall" "Red"
                    Write-Color "         Jalankan Setup-NetworkAccess.bat as Administrator" "Yellow"
                }
            } else {
                Write-Color "  WARNING: DASTI firewall rules incomplete!" "Yellow"
                Write-Color "           Jalankan Setup-NetworkAccess.bat as Administrator" "Yellow"
            }
        } else {
            Write-Color "  OK DASTI firewall rules complete" "Green"
        }
    } else {
        if ($isAdmin) {
            Write-Color "  WARNING: Firewall rules not found!" "Yellow"
            Write-Color "           Creating firewall rules..." "Yellow"
            
            # Create all firewall rules
            try {
                # Frontend
                New-NetFirewallRule -DisplayName "Web Scraper - Frontend (In)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                New-NetFirewallRule -DisplayName "Web Scraper - Frontend (Out)" -Direction Outbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                
                # SIPEDE
                New-NetFirewallRule -DisplayName "Web Scraper - SIPEDE (In)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                New-NetFirewallRule -DisplayName "Web Scraper - SIPEDE (Out)" -Direction Outbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                
                # SPP
                New-NetFirewallRule -DisplayName "Web Scraper - SPP (In)" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                New-NetFirewallRule -DisplayName "Web Scraper - SPP (Out)" -Direction Outbound -LocalPort 5001 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                
                # DASTI
                New-NetFirewallRule -DisplayName "Web Scraper - DASTI (In)" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                New-NetFirewallRule -DisplayName "Web Scraper - DASTI (Out)" -Direction Outbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any -ErrorAction Stop | Out-Null
                
                Write-Color "  OK All firewall rules created!" "Green"
            } catch {
                Write-Color "  ERROR: Gagal membuat firewall rules" "Red"
                Write-Color "         $_" "Red"
            }
        } else {
            Write-Color "  WARNING: Firewall rules not found!" "Yellow"
            Write-Color "           Script akan restart dengan Administrator privileges..." "Yellow"
            Write-Host ""
            Write-Color "Restarting with Administrator privileges..." "Yellow"
            Start-Sleep -Seconds 2
            
            # Restart script as Administrator
            $scriptPath = $MyInvocation.MyCommand.Path
            Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
            exit
        }
    }
} else {
    Write-Color "  WARNING: Tidak dapat detect IP Address" "Yellow"
    Write-Color "           Menggunakan localhost (hanya akses lokal)" "Yellow"
    
    # Fallback to localhost
    $envLocalPath = Join-Path $scriptDir "frontend\.env.local"
    $envContent = @"
# Backend API URLs
# Auto-updated by start-scraper.ps1 on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

NEXT_PUBLIC_SIPEDE_API_URL=http://localhost:5000
NEXT_PUBLIC_SPP_API_URL=http://localhost:5001
NEXT_PUBLIC_DASTI_API_URL=http://localhost:5002

# No network IP detected - using localhost only
"@
    
    $envContent | Out-File -FilePath $envLocalPath -Encoding UTF8 -Force
}

Write-Host ""

# ============================================
# Check Dependencies
# ============================================
Write-Color "[1/5] Mengecek dependencies..." "Yellow"

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

# Check Ollama (Optional - AI features)
$ollamaInstalled = $false
$ollamaModelReady = $false
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    $ollamaInstalled = $true
    Write-Color "  OK Ollama: installed" "Green"
    
    # Check if model is downloaded
    try {
        $ollamaList = ollama list 2>&1 | Out-String
        if ($ollamaList -match "llama3\.2:3b") {
            $ollamaModelReady = $true
            Write-Color "  OK Model: llama3.2:3b ready" "Green"
        } elseif ($ollamaList -match "gemma3:4b") {
            $ollamaModelReady = $true
            Write-Color "  OK Model: gemma3:4b ready" "Green"
        } else {
            Write-Color "  WARNING: Model AI belum di-download" "Yellow"
            Write-Color "           AI features tidak akan berfungsi" "Yellow"
            Write-Color "           Jalankan: ollama pull llama3.2:3b" "Yellow"
        }
    } catch {
        Write-Color "  WARNING: Tidak bisa check Ollama models" "Yellow"
    }
} else {
    Write-Color "  WARNING: Ollama tidak terinstall" "Yellow"
    Write-Color "           AI features tidak akan berfungsi" "Yellow"
    Write-Color "           Download: https://ollama.com/download" "Yellow"
}

Write-Host ""

# ============================================
# Install Dependencies (if needed)
# ============================================
Write-Color "[2/5] Mengecek & install dependencies..." "Yellow"

# Frontend dependencies
$frontendModules = Join-Path $scriptDir "frontend\node_modules"
if (!(Test-Path $frontendModules)) {
    Write-Color "  Installing frontend dependencies..." "Gray"
    Set-Location (Join-Path $scriptDir "frontend")
    npm install
    Set-Location $scriptDir
}
Write-Color "  OK Frontend dependencies" "Green"

# SIPEDE Backend dependencies + SQLite check
$sipedeModules = Join-Path $scriptDir "sipede-scraper\backend\node_modules"
$sipedeSqlite = Join-Path $scriptDir "sipede-scraper\backend\node_modules\sql.js"
$sipedeBackendDir = Join-Path $scriptDir "sipede-scraper\backend"

if (!(Test-Path $sipedeModules)) {
    Write-Color "  Installing SIPEDE backend dependencies (including SQLite)..." "Gray"
    Set-Location $sipedeBackendDir
    npm install
    Set-Location $scriptDir
    Write-Color "  OK SIPEDE Backend dependencies installed" "Green"
} elseif (!(Test-Path $sipedeSqlite)) {
    Write-Color "  SQLite not found, installing sql.js..." "Yellow"
    Set-Location $sipedeBackendDir
    npm install sql.js --save
    Set-Location $scriptDir
    Write-Color "  OK SQLite installed" "Green"
} else {
    Write-Color "  OK SIPEDE Backend dependencies (SQLite ready)" "Green"
}

# Check if migration needed (JSON files exist but no SQLite DB)
$sipedeDataDir = Join-Path $scriptDir "sipede-scraper\backend\data"
$sipedeDb = Join-Path $sipedeDataDir "sipede_data.db"
$activityJson = Join-Path $sipedeDataDir "activity_logs.json"
$scrapedJson = Join-Path $sipedeDataDir "scraped_data.json"

if ((Test-Path $activityJson) -or (Test-Path $scrapedJson)) {
    if (!(Test-Path $sipedeDb)) {
        Write-Color "  Detected old JSON data, running migration to SQLite..." "Yellow"
        Set-Location $sipedeBackendDir
        npm run migrate
        Set-Location $scriptDir
        Write-Color "  OK Data migrated to SQLite" "Green"
    }
}

# SPP Backend dependencies (Python venv)
$sppVenv = Join-Path $scriptDir "spp-scraper\venv"
if (!(Test-Path $sppVenv)) {
    Write-Color "  Creating Python virtual environment for SPP..." "Gray"
    Set-Location (Join-Path $scriptDir "spp-scraper")
    python -m venv venv
    $pipPath = Join-Path $scriptDir "spp-scraper\venv\Scripts\pip.exe"
    & $pipPath install -r requirements.txt
    Set-Location $scriptDir
}
Write-Color "  OK SPP Backend dependencies" "Green"

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

# Check & Create .env files
Write-Color "  Checking .env files..." "Gray"

# SIPEDE .env
$sipedeEnv = Join-Path $scriptDir "sipede-scraper\backend\.env"
if (!(Test-Path $sipedeEnv)) {
    Write-Color "  Creating SIPEDE .env file..." "Gray"
    Copy-Item (Join-Path $scriptDir "sipede-scraper\backend\.env.example") $sipedeEnv
    Write-Color "  OK SIPEDE .env created" "Green"
} else {
    Write-Color "  OK SIPEDE .env exists" "Green"
}

# SPP .env
$sppEnv = Join-Path $scriptDir "spp-scraper\.env"
if (!(Test-Path $sppEnv)) {
    Write-Color "  Creating SPP .env file..." "Gray"
    Copy-Item (Join-Path $scriptDir "spp-scraper\.env.example") $sppEnv
    Write-Color "  OK SPP .env created" "Green"
} else {
    Write-Color "  OK SPP .env exists" "Green"
}

# DASTI .env
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
# Start Ollama (if available)
# ============================================
if ($ollamaInstalled) {
    Write-Color "[3/5] Menjalankan Ollama..." "Yellow"
    
    # Check if Ollama is already running
    $ollamaRunning = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
    
    if ($ollamaRunning) {
        Write-Color "  OK Ollama sudah berjalan" "Green"
    } else {
        Write-Color "  Starting Ollama service..." "Gray"
        
        # Create Ollama batch file
        $ollamaBat = Join-Path $scriptDir "_run_ollama.bat"
        @"
@echo off
title Ollama Service - Port 11434
ollama serve
"@ | Out-File -FilePath $ollamaBat -Encoding ASCII
        
        # Start Ollama
        Start-Process cmd -ArgumentList "/c", $ollamaBat
        Start-Sleep -Seconds 3
        
        # Verify Ollama started
        $ollamaCheck = Get-Process -Name "ollama" -ErrorAction SilentlyContinue
        if ($ollamaCheck) {
            Write-Color "  OK Ollama service started" "Green"
        } else {
            Write-Color "  WARNING: Ollama gagal start" "Yellow"
        }
    }
    Write-Host ""
} else {
    Write-Color "[3/5] Skipping Ollama (tidak terinstall)..." "Gray"
    Write-Host ""
}

# ============================================
# Start Services
# ============================================
Write-Color "[4/5] Menjalankan services..." "Yellow"

# Create temp batch files
$sipedeBat = Join-Path $scriptDir "_run_sipede.bat"
$sppBat = Join-Path $scriptDir "_run_spp.bat"
$dastiBat = Join-Path $scriptDir "_run_dasti.bat"
$frontendBat = Join-Path $scriptDir "_run_frontend.bat"

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -and $_.PrefixOrigin -eq "Dhcp" }).IPAddress
if (-not $localIP) {
    $localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -eq "Dhcp" } | Select-Object -First 1).IPAddress
}
if (-not $localIP) {
    $localIP = "localhost"
}

# SIPEDE Backend batch
@"
@echo off
title SIPEDE Backend - Port 5000
cd /d "$scriptDir\sipede-scraper\backend"
set HOST=0.0.0.0
npm start
"@ | Out-File -FilePath $sipedeBat -Encoding ASCII

# SPP Backend batch
@"
@echo off
title SPP Backend - Port 5001
cd /d "$scriptDir\spp-scraper"
echo Starting SPP Backend...
echo.
call venv\Scripts\activate.bat
echo Uvicorn starting on 0.0.0.0:5001...
uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
"@ | Out-File -FilePath $sppBat -Encoding ASCII

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

# Frontend batch - Production mode for network stability
@"
@echo off
title Frontend - Port 3000 (Production)
cd /d "$scriptDir\frontend"
echo Building production...
call npm run build
echo Starting production server...
npm start -- -H 0.0.0.0
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

Write-Color "  Starting DASTI Backend (Port 5002)..." "Gray"
Start-Process cmd -ArgumentList "/c", $dastiBat
Start-Sleep -Seconds 2
Write-Color "  OK DASTI Backend started" "Green"

Write-Color "  Starting Frontend (Port 3000) - Production Mode..." "Gray"
Start-Process cmd -ArgumentList "/c", $frontendBat
Start-Sleep -Seconds 5
Write-Color "  OK Frontend started (Production)" "Green"

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
Write-Color "[5/5] Membuka browser..." "Yellow"
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
Write-Color "  OK Browser opened" "Green"

Write-Host ""
Write-Color "============================================" "Cyan"
Write-Color "  SEMUA SERVICES BERJALAN!" "Green"
Write-Color "============================================" "Cyan"
Write-Host ""
Write-Color "  Mode: PRODUCTION (Stable for Network Access)" "Magenta"
Write-Host ""
Write-Color "  Akses Lokal (laptop ini):" "Yellow"
Write-Color "    Frontend:       http://localhost:3000" "White"
Write-Color "    SIPEDE Backend: http://localhost:5000" "White"
Write-Color "    SPP Backend:    http://localhost:5001" "White"
Write-Color "    DASTI Backend:  http://localhost:5002" "White"
if ($ollamaInstalled) {
    Write-Color "    Ollama Service: http://localhost:11434" "White"
}
Write-Host ""

if ($localIP) {
    Write-Color "  Akses dari Laptop Lain (WiFi sama):" "Yellow"
    Write-Color "    Frontend:       http://${localIP}:3000" "Magenta"
    Write-Color "    SIPEDE Backend: http://${localIP}:5000" "Magenta"
    Write-Color "    SPP Backend:    http://${localIP}:5001" "Magenta"
    Write-Color "    DASTI Backend:  http://${localIP}:5002" "Magenta"
    if ($ollamaInstalled) {
        Write-Color "    Ollama Service: http://${localIP}:11434" "Magenta"
    }
    Write-Host ""
    
    # Check firewall warning
    $firewallRules = Get-NetFirewallRule -DisplayName "Web Scraper*" -ErrorAction SilentlyContinue
    if (-not $firewallRules) {
        Write-Color "  ⚠ FIREWALL WARNING:" "Red"
        Write-Color "    Akses dari laptop lain mungkin TIDAK BERFUNGSI" "Yellow"
        Write-Color "    Jalankan: Setup-NetworkAccess.bat (as Administrator)" "Yellow"
        Write-Host ""
    }
} else {
    Write-Color "  Network Access: DISABLED (localhost only)" "Gray"
    Write-Color "    Pastikan laptop terhubung ke WiFi/Ethernet" "Gray"
    Write-Host ""
}
Write-Host ""
Write-Color "  Frontend Mode: PRODUCTION BUILD" "Green"
Write-Color "    - No auto-refresh (stable)" "White"
Write-Color "    - Optimized performance" "White"
Write-Color "    - Perfect for network access" "White"
Write-Host ""
if ($ollamaModelReady) {
    Write-Color "  AI Assistant: READY" "Green"
    Write-Color "    - Smart Categorization" "White"
    Write-Color "    - Document Summarization" "White"
    Write-Color "    - AI Chatbot" "White"
} else {
    Write-Color "  AI Assistant: NOT READY" "Red"
    if (!$ollamaInstalled) {
        Write-Color "    Install Ollama: https://ollama.com/download" "Yellow"
    } else {
        Write-Color "    Download model: ollama pull llama3.2:3b" "Yellow"
    }
}
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

# Kill Ollama process (optional - user might want to keep it running)
Write-Color "Menghentikan Ollama? (Y/N)" "Yellow"
$stopOllama = Read-Host
if ($stopOllama -eq "Y" -or $stopOllama -eq "y") {
    Get-Process -Name "ollama" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Color "  OK Ollama dihentikan" "Green"
} else {
    Write-Color "  OK Ollama tetap berjalan" "Green"
}

# Remove temp batch files
Remove-Item $sipedeBat -Force -ErrorAction SilentlyContinue
Remove-Item $sppBat -Force -ErrorAction SilentlyContinue
Remove-Item $dastiBat -Force -ErrorAction SilentlyContinue
Remove-Item $frontendBat -Force -ErrorAction SilentlyContinue
$ollamaBat = Join-Path $scriptDir "_run_ollama.bat"
Remove-Item $ollamaBat -Force -ErrorAction SilentlyContinue

Write-Color "OK Semua services dihentikan" "Green"
Write-Host ""
