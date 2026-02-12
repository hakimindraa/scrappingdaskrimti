# SIPEDE SQLite Migration - Installer (PowerShell)

$Host.UI.RawUI.WindowTitle = "SIPEDE SQLite Migration - Installer"

function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

Clear-Host
Write-Color "============================================" "Cyan"
Write-Color "  SIPEDE SQLite Migration - Installer      " "Cyan"
Write-Color "============================================" "Cyan"
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "sipede-scraper\backend"

# Check if backend directory exists
if (!(Test-Path $backendDir)) {
    Write-Color "[ERROR] Backend directory not found!" "Red"
    Write-Color "Expected: $backendDir" "Red"
    Read-Host "Press Enter to exit"
    exit 1
}

Set-Location $backendDir

# Step 1: Install dependencies
Write-Color "[1/3] Installing dependencies..." "Yellow"
Write-Host ""

try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-Color "  OK Dependencies installed" "Green"
} catch {
    Write-Color "[ERROR] Failed to install dependencies!" "Red"
    Write-Color "Please check your internet connection and try again." "Red"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 2: Run migration
Write-Color "[2/3] Running migration script..." "Yellow"
Write-Host ""

try {
    npm run migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Color "  WARNING: Migration script failed or no data to migrate" "Yellow"
        Write-Color "           This is OK if you don't have old data" "Yellow"
    } else {
        Write-Color "  OK Migration completed" "Green"
    }
} catch {
    Write-Color "  WARNING: Migration error (this is OK if no old data)" "Yellow"
}

Write-Host ""

# Step 3: Verify database
Write-Color "[3/3] Verifying database..." "Yellow"
Write-Host ""

$dbPath = Join-Path $backendDir "data\sipede_data.db"
if (Test-Path $dbPath) {
    Write-Color "  OK Database file created" "Green"
    Write-Color "     Location: $dbPath" "Gray"
} else {
    Write-Color "  INFO: Database will be created on first server start" "Yellow"
}

Write-Host ""

# Summary
Write-Color "============================================" "Cyan"
Write-Color "  Installation Complete!                   " "Green"
Write-Color "============================================" "Cyan"
Write-Host ""
Write-Color "SQLite database is ready!" "Green"
Write-Host ""
Write-Color "Next steps:" "Yellow"
Write-Host "  1. Run Start-WebScraper.bat to start the app"
Write-Host "  2. Check SQLITE_MIGRATION_GUIDE.md for details"
Write-Host ""
Write-Color "============================================" "Cyan"
Write-Host ""

Set-Location $scriptDir
Read-Host "Press Enter to exit"
