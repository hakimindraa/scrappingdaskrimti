# API Reference - DASTI Scraper

Base URL: `http://localhost:5002`

## Authentication
Tidak ada authentication untuk saat ini. Semua endpoints bisa diakses langsung.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

## Endpoints

### Browser Management

#### POST /api/scraper/open
Membuka browser Chrome dan navigasi ke URL.

**Request Body:**
```json
{
  "url": "https://dasti.example.com/login"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "currentUrl": "https://dasti.example.com/login",
  "navigationLevel": 1
}
```

---

#### POST /api/scraper/close
Menutup browser.

**Response:**
```json
{
  "success": true,
  "message": "Browser closed"
}
```

---

#### POST /api/scraper/navigate
Navigasi ke URL tertentu.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "currentUrl": "https://example.com"
}
```

---

#### GET /api/scraper/current-url
Mendapatkan URL saat ini.

**Response:**
```json
{
  "success": true,
  "currentUrl": "https://example.com"
}
```

---

#### GET /api/scraper/screenshot
Mengambil screenshot halaman saat ini.

**Query Parameters:**
- `filename` (optional): Nama file screenshot

**Response:**
```json
{
  "success": true,
  "filepath": "./screenshots/screenshot_20260302_100000.png"
}
```

---

### Login & Authentication

#### GET /api/scraper/detect-captcha
Mendeteksi keberadaan captcha di halaman.

**Response:**
```json
{
  "success": true,
  "captchaDetected": true,
  "captchaType": "reCAPTCHA"
}
```

**Captcha Types:**
- `reCAPTCHA`: Google reCAPTCHA
- `Image Captcha`: Image-based captcha
- `Text Captcha`: Text input captcha
- `null`: No captcha detected

---

#### GET /api/scraper/check-login
Mengecek apakah user sudah login.

**Response:**
```json
{
  "success": true,
  "isLoggedIn": true,
  "currentUrl": "https://dasti.example.com/dashboard",
  "navigationLevel": 2
}
```

---

#### POST /api/scraper/save-session
Menyimpan session cookies dan navigation state ke database.

**Response:**
```json
{
  "success": true
}
```

---

#### POST /api/scraper/load-session
Memuat session cookies dan navigation state dari database.

**Response:**
```json
{
  "success": true,
  "navigationState": {
    "loginUrl": "https://...",
    "afterLoginUrl": "https://...",
    "intermediateUrl": "https://...",
    "dataPageUrl": "https://...",
    "currentLevel": 4
  }
}
```

---

### Navigation Management

#### GET /api/scraper/navigation-state
Mendapatkan navigation state saat ini.

**Response:**
```json
{
  "success": true,
  "navigationState": {
    "loginUrl": "https://dasti.example.com/login",
    "afterLoginUrl": "https://dasti.example.com/dashboard",
    "intermediateUrl": "https://dasti.example.com/menu",
    "dataPageUrl": "https://dasti.example.com/data/table",
    "currentLevel": 4
  },
  "currentLevel": 4
}
```

**Navigation Levels:**
- `0`: None
- `1`: Login page
- `2`: After login (dashboard)
- `3`: Intermediate page
- `4`: Data page (target)

---

#### POST /api/scraper/set-data-url
Set URL halaman data secara manual.

**Request Body:**
```json
{
  "url": "https://dasti.example.com/data/table"
}
```

**Response:**
```json
{
  "success": true
}
```

---

#### POST /api/scraper/navigate-to-data
Navigasi otomatis ke halaman data menggunakan saved URL.

**Response:**
```json
{
  "success": true,
  "currentUrl": "https://dasti.example.com/data/table"
}
```

---

### Table Detection & Scraping

#### GET /api/scraper/detect-table
Mendeteksi tabel di halaman saat ini.

**Response:**
```json
{
  "success": true,
  "tableInfo": {
    "headers": ["No", "Nama", "Tanggal", "Status"],
    "row_count": 10,
    "pagination": {
      "type": "numbered",
      "totalPages": 50,
      "currentPage": 1,
      "totalEntries": 500,
      "entriesPerPage": 10,
      "isDynamic": false
    },
    "current_url": "https://dasti.example.com/data/table"
  }
}
```

**Pagination Types:**
- `numbered`: Pagination dengan nomor halaman (1, 2, 3, ...)
- `next-prev`: Pagination dengan Next/Prev button saja
- `infinite`: Infinite scroll
- `none`: Tidak ada pagination

---

#### POST /api/scraper/start
Memulai proses scraping.

**Request Body:**
```json
{
  "startPage": 1,
  "endPage": 0
}
```

**Parameters:**
- `startPage`: Halaman awal (default: 1)
- `endPage`: Halaman akhir (0 = semua halaman)

**Response:**
```json
{
  "success": true,
  "message": "Scraping started",
  "startPage": 1,
  "endPage": "all"
}
```

---

#### POST /api/scraper/stop
Menghentikan proses scraping.

**Response:**
```json
{
  "success": true,
  "message": "Scraping stopped"
}
```

---

#### GET /api/scraper/status
Mendapatkan status scraping real-time.

**Response:**
```json
{
  "success": true,
  "status": {
    "browserOpen": true,
    "isLoggedIn": true,
    "isRunning": true,
    "navigationLevel": 4,
    "currentPage": 15,
    "pagesScraped": 15,
    "itemsScraped": 150,
    "startTime": "2026-03-02T10:00:00",
    "elapsedTime": 45,
    "error": null,
    "currentUrl": "https://...",
    "tableInfo": {...},
    "dataCount": 150,
    "shouldStop": false,
    "captchaDetected": false,
    "sessionSaved": true
  }
}
```

---

### Data Management

#### GET /api/scraper/data
Mendapatkan data dengan pagination dan search.

**Query Parameters:**
- `page` (default: 1): Nomor halaman
- `limit` (default: 10, max: 100): Jumlah data per halaman
- `search` (optional): Keyword pencarian

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "No": "1",
      "Nama": "John Doe",
      "Tanggal": "2026-03-01",
      "Status": "Active"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

---

#### GET /api/scraper/data/all
Mendapatkan semua data tanpa pagination.

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 150
}
```

---

#### POST /api/scraper/data/clear
Menghapus semua data.

**Response:**
```json
{
  "success": true,
  "message": "Data cleared"
}
```

---

### Export

#### GET /api/scraper/export/csv
Export data ke CSV.

**Response:**
File download: `dasti_data.csv`

---

#### GET /api/scraper/export/json
Export data ke JSON.

**Response:**
File download: `dasti_data.json`

---

#### GET /api/scraper/export/excel
Export data ke Excel.

**Response:**
File download: `dasti_data.xlsx`

---

### Activity Logs

#### GET /api/scraper/logs
Mendapatkan activity logs.

**Query Parameters:**
- `limit` (default: 100, max: 1000): Jumlah logs

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "level": "info",
      "message": "Scraping dimulai",
      "timestamp": "2026-03-02T10:00:00"
    }
  ],
  "count": 50
}
```

**Log Levels:**
- `info`: Informasi umum
- `success`: Operasi berhasil
- `warning`: Peringatan
- `error`: Error

---

#### POST /api/scraper/logs/clear
Menghapus semua logs.

**Response:**
```json
{
  "success": true
}
```

---

### Health Check

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "DASTI Scraper API is running",
  "version": "1.0.0"
}
```

---

#### GET /
Root endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "DASTI Scraper API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Endpoint tidak ditemukan |
| 500 | Internal Server Error | Server error |

## Rate Limiting
Tidak ada rate limiting untuk saat ini.

## CORS
CORS enabled untuk semua origins (`*`).

## WebSocket
Tidak ada WebSocket support. Gunakan polling untuk real-time updates.

## Examples

### JavaScript (Fetch API)
```javascript
// Open browser
const response = await fetch('http://localhost:5002/api/scraper/open', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://dasti.example.com/login' })
});
const data = await response.json();
console.log(data);

// Get status
const status = await fetch('http://localhost:5002/api/scraper/status');
const statusData = await status.json();
console.log(statusData.status);

// Export CSV
window.open('http://localhost:5002/api/scraper/export/csv', '_blank');
```

### Python (requests)
```python
import requests

# Open browser
response = requests.post('http://localhost:5002/api/scraper/open', 
  json={'url': 'https://dasti.example.com/login'})
print(response.json())

# Get status
status = requests.get('http://localhost:5002/api/scraper/status')
print(status.json()['status'])

# Download CSV
csv = requests.get('http://localhost:5002/api/scraper/export/csv')
with open('data.csv', 'wb') as f:
  f.write(csv.content)
```

### cURL
```bash
# Open browser
curl -X POST http://localhost:5002/api/scraper/open \
  -H "Content-Type: application/json" \
  -d '{"url": "https://dasti.example.com/login"}'

# Get status
curl http://localhost:5002/api/scraper/status

# Download CSV
curl -O http://localhost:5002/api/scraper/export/csv
```

## Interactive Documentation
Swagger UI: http://localhost:5002/docs
ReDoc: http://localhost:5002/redoc
