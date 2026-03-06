# ============================================
# Fix DASTI Firewall - Port 5002
# ============================================
# Script ini memastikan port 5002 dibuka di Windows Firewall

$Host.UI.RawUI.WindowTitle = "Fix DASTI Firewall"

function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

Clear-Host
Write-Color "============================================" "Cyan"
Write-Color "   FIX DASTI FIREWALL - PORT 5002          " "Cyan"
Write-Color "============================================" "Cyan"
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Color "[ERROR] Script harus dijalankan sebagai Administrator!" "Red"
    Write-Host ""
    Write-Color "Klik kanan pada script ini dan pilih 'Run as Administrator'" "Yellow"
    Write-Host ""
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

Write-Color "[1/3] Menghapus firewall rules lama..." "Yellow"

# Remove old rules
$oldRules = Get-NetFirewallRule -DisplayName "*DASTI*" -ErrorAction SilentlyContinue
if ($oldRules) {
    Remove-NetFirewallRule -DisplayName "*DASTI*" -ErrorAction SilentlyContinue
    Write-Color "  OK Rules lama dihapus" "Green"
} else {
    Write-Color "  OK Tidak ada rules lama" "Green"
}

Write-Host ""

Write-Color "[2/3] Membuat firewall rules baru untuk DASTI..." "Yellow"

try {
    # Inbound rule (untuk akses dari laptop lain)
    New-NetFirewallRule `
        -DisplayName "Web Scraper - DASTI Backend (Inbound)" `
        -Direction Inbound `
        -LocalPort 5002 `
        -Protocol TCP `
        -Action Allow `
        -Profile Any `
        -Enabled True | Out-Null
    
    Write-Color "  OK Inbound rule created (port 5002)" "Green"
    
    # Outbound rule (untuk response ke laptop lain)
    New-NetFirewallRule `
        -DisplayName "Web Scraper - DASTI Backend (Outbound)" `
        -Direction Outbound `
        -LocalPort 5002 `
        -Protocol TCP `
        -Action Allow `
        -Profile Any `
        -Enabled True | Out-Null
    
    Write-Color "  OK Outbound rule created (port 5002)" "Green"
    
} catch {
    Write-Color "  ERROR: Gagal membuat firewall rules" "Red"
    Write-Color "         $_" "Red"
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

Write-Host ""

Write-Color "[3/3] Verifikasi firewall rules..." "Yellow"

$dastiRules = Get-NetFirewallRule -DisplayName "*DASTI*" -ErrorAction SilentlyContinue
if ($dastiRules) {
    Write-Color "  OK Firewall rules untuk DASTI:" "Green"
    foreach ($rule in $dastiRules) {
        Write-Color "     - $($rule.DisplayName) [$($rule.Direction)]" "Gray"
    }
} else {
    Write-Color "  WARNING: Tidak dapat verifikasi rules" "Yellow"
}

Write-Host ""
Write-Color "============================================" "Cyan"
Write-Color "  FIREWALL FIX SELESAI!" "Green"
Write-Color "============================================" "Cyan"
Write-Host ""

Write-Color "  Port 5002 sekarang terbuka untuk:" "Yellow"
Write-Color "    - Inbound connections (laptop lain → server)" "White"
Write-Color "    - Outbound connections (server → laptop lain)" "White"
Write-Host ""

Write-Color "  Langkah selanjutnya:" "Yellow"
Write-Color "    1. Restart DASTI backend" "White"
Write-Color "    2. Test dari laptop lain: http://[IP]:5002/health" "White"
Write-Host ""

Read-Host "Tekan Enter untuk keluar"
