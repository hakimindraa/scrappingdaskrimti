# Testing Guide - DASTI Scraper

## Manual Testing Checklist

### 1. Browser Management

#### ✅ Open Browser
```bash
POST http://localhost:5002/api/scraper/open
Body: { "url": "https://google.com" }
```
**Expected:** Browser terbuka, navigasi ke URL

#### ✅ Close Browser
```bash
POST http://localhost:5002/api/scraper/close
```
**Expected:** Browser tertutup

#### ✅ Navigate
```bash
POST http://localhost:5002/api/scraper/navigate
Body: { "url": "https://example.com" }
```
**Expected:** Browser navigasi ke URL baru

#### ✅ Get Current URL
```bash
GET http://localhost:5002/api/scraper/current-url
```
**Expected:** Return current URL

#### ✅ Take Screenshot
```bash
GET http://localhost:5002/api/scraper/screenshot
```
**Expected:** Screenshot tersimpan di folder `screenshots/`

### 2. Login & Captcha

#### ✅ Detect Captcha
```bash
GET http://localhost:5002/api/scraper/detect-captcha
```
**Expected:** Return captcha detection result

#### ✅ Check Login
```bash
GET http://localhost:5002/api/scraper/check-login
```
**Expected:** Return login status

#### ✅ Save Session
```bash
POST http://localhost:5002/api/scraper/save-session
```
**Expected:** Session tersimpan ke database

#### ✅ Load Session
```bash
POST http://localhost:5002/api/scraper/load-session
```
**Expected:** Session dimuat dari database

### 3. Navigation Management

#### ✅ Get Navigation State
```bash
GET http://localhost:5002/api/scraper/navigation-state
```
**Expected:** Return navigation state

#### ✅ Set Data URL
```bash
POST http://localhost:5002/api/scraper/set-data-url
Body: { "url": "https://example.com/data" }
```
**Expected:** Data URL tersimpan

#### ✅ Navigate to Data
```bash
POST http://localhost:5002/api/scraper/navigate-to-data
```
**Expected:** Browser navigasi ke data URL

### 4. Table Detection & Scraping

#### ✅ Detect Table
```bash
GET http://localhost:5002/api/scraper/detect-table
```
**Expected:** Return table info (headers, row count, pagination)

#### ✅ Start Scraping (Single Page)
```bash
POST http://localhost:5002/api/scraper/start
Body: { "startPage": 1, "endPage": 1 }
```
**Expected:** Scraping 1 halaman

#### ✅ Start Scraping (Multiple Pages)
```bash
POST http://localhost:5002/api/scraper/start
Body: { "startPage": 1, "endPage": 5 }
```
**Expected:** Scraping halaman 1-5

#### ✅ Start Scraping (All Pages)
```bash
POST http://localhost:5002/api/scraper/start
Body: { "startPage": 1, "endPage": 0 }
```
**Expected:** Scraping semua halaman

#### ✅ Stop Scraping
```bash
POST http://localhost:5002/api/scraper/stop
```
**Expected:** Scraping berhenti

#### ✅ Get Status
```bash
GET http://localhost:5002/api/scraper/status
```
**Expected:** Return real-time status

### 5. Data Management

#### ✅ Get Data (Paginated)
```bash
GET http://localhost:5002/api/scraper/data?page=1&limit=10
```
**Expected:** Return 10 data per page

#### ✅ Get Data (Search)
```bash
GET http://localhost:5002/api/scraper/data?search=keyword
```
**Expected:** Return filtered data

#### ✅ Get All Data
```bash
GET http://localhost:5002/api/scraper/data/all
```
**Expected:** Return semua data

#### ✅ Clear Data
```bash
POST http://localhost:5002/api/scraper/data/clear
```
**Expected:** Data terhapus

### 6. Export

#### ✅ Export CSV
```bash
GET http://localhost:5002/api/scraper/export/csv
```
**Expected:** Download CSV file

#### ✅ Export JSON
```bash
GET http://localhost:5002/api/scraper/export/json
```
**Expected:** Download JSON file

#### ✅ Export Excel
```bash
GET http://localhost:5002/api/scraper/export/excel
```
**Expected:** Download Excel file

### 7. Activity Logs

#### ✅ Get Logs
```bash
GET http://localhost:5002/api/scraper/logs?limit=50
```
**Expected:** Return 50 logs terbaru

#### ✅ Clear Logs
```bash
POST http://localhost:5002/api/scraper/logs/clear
```
**Expected:** Logs terhapus

### 8. Health Check

#### ✅ Health Check
```bash
GET http://localhost:5002/health
```
**Expected:** Return status OK

#### ✅ Root
```bash
GET http://localhost:5002/
```
**Expected:** Return API info

## Integration Testing

### Test Scenario 1: Complete Flow (First Time)

1. Open browser → Login page
2. User login manual
3. Check login status → Success
4. Save session
5. Navigate to data page
6. Detect table → Success
7. Start scraping (5 pages)
8. Monitor status → Running
9. Wait until complete
10. Get data → 50 items
11. Export CSV → Success
12. Close browser

### Test Scenario 2: Re-scraping with Session

1. Open browser
2. Load session → Success
3. Navigate to data page → Success
4. Detect table → Success
5. Clear old data
6. Start scraping (all pages)
7. Monitor status
8. Export Excel → Success
9. Close browser

### Test Scenario 3: Error Handling

1. Open browser
2. Navigate to invalid URL → Error
3. Detect table (no table) → Error
4. Start scraping (no table) → Error
5. Stop scraping → Success
6. Close browser

### Test Scenario 4: Pagination Types

#### Numbered Pagination
- Test dengan website yang punya pagination 1, 2, 3, ...
- Verify scraping semua halaman

#### Next/Prev Pagination
- Test dengan website yang hanya punya Next/Prev button
- Verify scraping sampai halaman terakhir

#### No Pagination
- Test dengan website tanpa pagination
- Verify scraping 1 halaman saja

## Performance Testing

### Test 1: Large Dataset
- Scrape 100+ halaman
- Monitor memory usage
- Check for memory leaks
- Verify data integrity

### Test 2: Concurrent Requests
- Multiple API calls bersamaan
- Verify no race conditions
- Check response time

### Test 3: Long Running
- Scraping 1000+ items
- Monitor stability
- Check error recovery

## Database Testing

### Test 1: Data Persistence
1. Scrape data
2. Restart server
3. Check data masih ada

### Test 2: Session Persistence
1. Save session
2. Restart server
3. Load session → Success

### Test 3: Logs Persistence
1. Generate logs
2. Restart server
3. Check logs masih ada

## Error Recovery Testing

### Test 1: Network Error
- Disconnect network saat scraping
- Verify error handling
- Reconnect network
- Retry scraping

### Test 2: Browser Crash
- Force close browser saat scraping
- Verify error handling
- Reopen browser
- Resume scraping

### Test 3: Invalid Data
- Navigate to page dengan invalid table
- Verify error handling
- Navigate to valid page
- Scraping success

## Security Testing

### Test 1: SQL Injection
- Try SQL injection di search parameter
- Verify no SQL injection vulnerability

### Test 2: XSS
- Try XSS di data fields
- Verify data sanitization

### Test 3: Session Security
- Check session cookies encryption
- Verify session expiry

## Automated Testing (Future)

### Unit Tests
```python
# test_scraper_service.py
def test_open_browser():
    scraper = DastiScraperService()
    result = scraper.open_browser("https://google.com")
    assert result["success"] == True
    scraper.close_browser()

def test_detect_table():
    # Mock table HTML
    # Test detection
    pass

def test_pagination_detection():
    # Mock pagination HTML
    # Test detection
    pass
```

### Integration Tests
```python
# test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_open_browser():
    response = client.post("/api/scraper/open", json={"url": "https://google.com"})
    assert response.status_code == 200
    assert response.json()["success"] == True
```

## Test Results Template

```
Test Date: 2026-03-02
Tester: [Name]
Environment: Windows 10, Python 3.11, Chrome 120

| Test Case | Status | Notes |
|-----------|--------|-------|
| Open Browser | ✅ Pass | - |
| Close Browser | ✅ Pass | - |
| Detect Table | ✅ Pass | - |
| Scraping (5 pages) | ✅ Pass | 50 items in 30s |
| Export CSV | ✅ Pass | - |
| Session Save/Load | ✅ Pass | - |
| Error Handling | ✅ Pass | - |

Overall: PASS
```

## Reporting Issues

Jika menemukan bug, report dengan format:

```
**Bug Title:** [Short description]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- OS: Windows 10
- Python: 3.11
- Chrome: 120
- API Version: 1.0.0

**Logs:**
[Paste relevant logs from /api/scraper/logs]

**Screenshots:**
[Attach screenshots if applicable]
```
