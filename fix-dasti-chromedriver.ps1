# ============================================
# Fix DASTI ChromeDriver Issue
# ============================================

$Host.UI.RawUI.WindowTitle = "Fix DASTI ChromeDriver"

function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

Clear-Host
Write-Color "============================================" "Cyan"
Write-Color "    FIX DASTI CHROMEDRIVER ISSUE           " "Cyan"
Write-Color "============================================" "Cyan"
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Color "[1/4] Clearing ChromeDriver cache..." "Yellow"

# Clear webdriver-manager cache
$cachePath = Join-Path $env:USERPROFILE ".wdm"
if (Test-Path $cachePath) {
    try {
        Remove-Item -Recurse -Force $cachePath -ErrorAction Stop
        Write-Color "  OK Cache cleared: $cachePath" "Green"
    } catch {
        Write-Color "  WARNING: Could not clear cache: $_" "Yellow"
    }
} else {
    Write-Color "  OK No cache found (already clean)" "Green"
}

Write-Host ""
Write-Color "[2/4] Updating Python packages..." "Yellow"

# Navigate to DASTI directory
Set-Location (Join-Path $scriptDir "dasti-scraper")

# Activate virtual environment
$venvActivate = ".\venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    Write-Color "  Activating virtual environment..." "Gray"
    & $venvActivate
    
    Write-Color "  Upgrading webdriver-manager..." "Gray"
    pip install --upgrade webdriver-manager --quiet
    
    Write-Color "  Upgrading selenium..." "Gray"
    pip install --upgrade selenium --quiet
    
    Write-Color "  OK Packages updated" "Green"
} else {
    Write-Color "  ERROR: Virtual environment not found!" "Red"
    Write-Color "  Please run: python -m venv venv" "Yellow"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Color "[3/4] Checking Chrome version..." "Yellow"

# Try to get Chrome version
try {
    $chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    if (Test-Path $chromePath) {
        $chromeVersion = (Get-Item $chromePath).VersionInfo.ProductVersion
        Write-Color "  OK Chrome version: $chromeVersion" "Green"
    } else {
        $chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
        if (Test-Path $chromePath) {
            $chromeVersion = (Get-Item $chromePath).VersionInfo.ProductVersion
            Write-Color "  OK Chrome version: $chromeVersion" "Green"
        } else {
            Write-Color "  WARNING: Chrome not found in default location" "Yellow"
        }
    }
} catch {
    Write-Color "  WARNING: Could not detect Chrome version" "Yellow"
}

Write-Host ""
Write-Color "[4/4] Testing ChromeDriver..." "Yellow"

# Create test script
$testScript = @"
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

try:
    print('[Test] Setting up Chrome options...')
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--no-sandbox')
    
    print('[Test] Installing ChromeDriver...')
    driver_path = ChromeDriverManager().install()
    print(f'[Test] ChromeDriver path: {driver_path}')
    
    print('[Test] Creating Chrome driver...')
    service = Service(driver_path)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    print('[Test] Testing navigation...')
    driver.get('https://www.google.com')
    print(f'[Test] Page title: {driver.title}')
    
    driver.quit()
    print('[Test] SUCCESS - ChromeDriver is working!')
    exit(0)
    
except Exception as e:
    print(f'[Test] ERROR: {e}')
    exit(1)
"@

$testFile = "test_chromedriver.py"
$testScript | Out-File -FilePath $testFile -Encoding UTF8

Write-Color "  Running ChromeDriver test..." "Gray"
python $testFile

if ($LASTEXITCODE -eq 0) {
    Write-Color "  OK ChromeDriver test passed!" "Green"
} else {
    Write-Color "  ERROR: ChromeDriver test failed!" "Red"
    Write-Host ""
    Write-Color "Possible solutions:" "Yellow"
    Write-Color "  1. Update Chrome browser to latest version" "White"
    Write-Color "  2. Restart your computer" "White"
    Write-Color "  3. Run: pip install --force-reinstall selenium webdriver-manager" "White"
}

# Cleanup test file
Remove-Item $testFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Color "============================================" "Cyan"
Write-Color "  FIX COMPLETED!" "Green"
Write-Color "============================================" "Cyan"
Write-Host ""
Write-Color "Next steps:" "Yellow"
Write-Color "  1. Restart DASTI backend" "White"
Write-Color "  2. Try opening browser again" "White"
Write-Host ""

Set-Location $scriptDir
Read-Host "Press Enter to exit"
