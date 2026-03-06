# ============================================
# Setup Network Access - Web Scraper
# ============================================
# Script ini membantu setup akses dari laptop lain

$Host.UI.RawUI.WindowTitle = "Setup Network Access"

function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

Clear-Host
Write-Color "============================================" "Cyan"
Write-Color "   SETUP NETWORK ACCESS - WEB SCRAPER      " "Cyan"
Write-Color "============================================" "Cyan"
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Color "[WARNING] Script tidak berjalan sebagai Administrator!" "Yellow"
    Write-Color "          Beberapa fitur (firewall setup) tidak akan berfungsi." "Yellow"
    Write-Host ""
}

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# ============================================
# Step 1: Get Local IP Address
# ============================================
Write-Color "[1/4] Mencari IP Address laptop ini..." "Yellow"

$localIP = $null

# Try to get WiFi IP first
$wifiAdapter = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -like "*Wi-Fi*" -and $_.PrefixOrigin -eq "Dhcp" 
}

if ($wifiAdapter) {
    $localIP = $wifiAdapter.IPAddress
    Write-Color "  OK IP Address (WiFi): $localIP" "Green"
} else {
    # Try Ethernet
    $ethAdapter = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.InterfaceAlias -like "*Ethernet*" -and $_.PrefixOrigin -eq "Dhcp" 
    }
    
    if ($ethAdapter) {
        $localIP = $ethAdapter.IPAddress
        Write-Color "  OK IP Address (Ethernet): $localIP" "Green"
    } else {
        # Get any DHCP IP
        $anyAdapter = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
            $_.PrefixOrigin -eq "Dhcp" 
        } | Select-Object -First 1
        
        if ($anyAdapter) {
            $localIP = $anyAdapter.IPAddress
            Write-Color "  OK IP Address: $localIP" "Green"
        } else {
            Write-Color "  ERROR: Tidak dapat menemukan IP Address!" "Red"
            Write-Color "         Pastikan laptop terhubung ke WiFi/Ethernet" "Red"
            Read-Host "Tekan Enter untuk keluar"
            exit 1
        }
    }
}

Write-Host ""

# ============================================
# Step 2: Update Frontend .env.local
# ============================================
Write-Color "[2/4] Update frontend configuration..." "Yellow"

$envLocalPath = Join-Path $scriptDir "frontend\.env.local"

$envContent = @"
# Backend API URLs
# Updated by setup-network-access.ps1 on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

NEXT_PUBLIC_SIPEDE_API_URL=http://${localIP}:5000
NEXT_PUBLIC_SPP_API_URL=http://${localIP}:5001
NEXT_PUBLIC_DASTI_API_URL=http://${localIP}:5002

# Laptop Server IP: $localIP
# Akses dari laptop lain: http://${localIP}:3000
"@

$envContent | Out-File -FilePath $envLocalPath -Encoding UTF8 -Force
Write-Color "  OK File updated: frontend\.env.local" "Green"
Write-Color "     SIPEDE: http://${localIP}:5000" "Gray"
Write-Color "     SPP:    http://${localIP}:5001" "Gray"
Write-Color "     DASTI:  http://${localIP}:5002" "Gray"

Write-Host ""

# ============================================
# Step 3: Setup Windows Firewall
# ============================================
Write-Color "[3/4] Setup Windows Firewall..." "Yellow"

if ($isAdmin) {
    # Check if rules already exist
    $existingRules = Get-NetFirewallRule -DisplayName "Web Scraper*" -ErrorAction SilentlyContinue
    
    if ($existingRules) {
        Write-Color "  Firewall rules sudah ada, menghapus yang lama..." "Gray"
        Remove-NetFirewallRule -DisplayName "Web Scraper*" -ErrorAction SilentlyContinue
    }
    
    # Create new rules (Inbound and Outbound for better compatibility)
    try {
        # Frontend
        New-NetFirewallRule -DisplayName "Web Scraper - Frontend (In)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any | Out-Null
        New-NetFirewallRule -DisplayName "Web Scraper - Frontend (Out)" -Direction Outbound -LocalPort 3000 -Protocol TCP -Action Allow -Profile Any | Out-Null
        
        # SIPEDE
        New-NetFirewallRule -DisplayName "Web Scraper - SIPEDE (In)" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any | Out-Null
        New-NetFirewallRule -DisplayName "Web Scraper - SIPEDE (Out)" -Direction Outbound -LocalPort 5000 -Protocol TCP -Action Allow -Profile Any | Out-Null
        
        # SPP
        New-NetFirewallRule -DisplayName "Web Scraper - SPP (In)" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow -Profile Any | Out-Null
        New-NetFirewallRule -DisplayName "Web Scraper - SPP (Out)" -Direction Outbound -LocalPort 5001 -Protocol TCP -Action Allow -Profile Any | Out-Null
        
        # DASTI (with explicit inbound and outbound)
        New-NetFirewallRule -DisplayName "Web Scraper - DASTI (In)" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any | Out-Null
        New-NetFirewallRule -DisplayName "Web Scraper - DASTI (Out)" -Direction Outbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any | Out-Null
        
        Write-Color "  OK Firewall rules created (Inbound + Outbound):" "Green"
        Write-Color "     Port 3000 (Frontend) - ALLOWED" "Gray"
        Write-Color "     Port 5000 (SIPEDE)   - ALLOWED" "Gray"
        Write-Color "     Port 5001 (SPP)      - ALLOWED" "Gray"
        Write-Color "     Port 5002 (DASTI)    - ALLOWED" "Gray"
    } catch {
        Write-Color "  ERROR: Gagal membuat firewall rules" "Red"
        Write-Color "         $_" "Red"
    }
} else {
    Write-Color "  SKIPPED: Perlu Administrator untuk setup firewall" "Yellow"
    Write-Color "           Jalankan script ini sebagai Administrator atau" "Yellow"
    Write-Color "           buka firewall secara manual untuk port:" "Yellow"
    Write-Color "           3000, 5000, 5001, 5002" "Yellow"
}

Write-Host ""

# ============================================
# Step 4: Summary & Instructions
# ============================================
Write-Color "[4/4] Setup selesai!" "Green"
Write-Host ""

Write-Color "============================================" "Cyan"
Write-Color "  NETWORK ACCESS READY!" "Green"
Write-Color "============================================" "Cyan"
Write-Host ""

Write-Color "  IP Laptop Server: $localIP" "Magenta"
Write-Host ""

Write-Color "  Akses dari LAPTOP INI:" "Yellow"
Write-Color "    Frontend: http://localhost:3000" "White"
Write-Host ""

Write-Color "  Akses dari LAPTOP LAIN (WiFi sama):" "Yellow"
Write-Color "    Frontend: http://${localIP}:3000" "Magenta"
Write-Host ""

Write-Color "  Backend URLs (sudah dikonfigurasi):" "Yellow"
Write-Color "    SIPEDE: http://${localIP}:5000" "White"
Write-Color "    SPP:    http://${localIP}:5001" "White"
Write-Color "    DASTI:  http://${localIP}:5002" "White"
Write-Host ""

Write-Color "============================================" "Yellow"
Write-Color "  LANGKAH SELANJUTNYA:" "Yellow"
Write-Color "============================================" "Yellow"
Write-Host ""

Write-Color "  1. Restart frontend (jika sudah berjalan):" "White"
Write-Color "     - Tekan Ctrl+C di terminal frontend" "Gray"
Write-Color "     - Atau restart Start-WebScraper.bat" "Gray"
Write-Host ""

Write-Color "  2. Dari laptop lain, buka browser:" "White"
Write-Color "     http://${localIP}:3000" "Magenta"
Write-Host ""

Write-Color "  3. Jika masih offline, cek:" "White"
Write-Color "     - Kedua laptop di WiFi yang sama" "Gray"
Write-Color "     - Firewall sudah allow ports" "Gray"
Write-Color "     - Backend berjalan di 0.0.0.0" "Gray"
Write-Host ""

if (-not $isAdmin) {
    Write-Color "  CATATAN: Firewall belum dikonfigurasi!" "Red"
    Write-Color "  Jalankan script ini sebagai Administrator atau" "Yellow"
    Write-Color "  buka firewall manual untuk port 3000,5000,5001,5002" "Yellow"
    Write-Host ""
}

Write-Color "  Dokumentasi lengkap: NETWORK_ACCESS_GUIDE.md" "Cyan"
Write-Host ""

Read-Host "Tekan Enter untuk keluar"
