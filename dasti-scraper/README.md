# DASTI Scraper Backend

Backend API untuk scraping data DASTI dengan sistem login dan captcha handling menggunakan Selenium.

## Features

- ✅ Browser automation dengan Selenium
- ✅ Login manual dengan captcha handling
- ✅ Multi-level navigation tracking (4 levels)
- ✅ Session management (save/load cookies)
- ✅ Auto table detection
- ✅ Auto pagination handling
- ✅ Data deduplication
- ✅ SQLite data persistence
- ✅ Export ke CSV, JSON, Excel
- ✅ Activity logging
- ✅ Real-time status monitoring

## Requirements

- Python 3.9+
- Google Chrome Browser
- Koneksi ke website DASTI

## Installation

```bash
cd dasti-scraper

# Buat virtual environment (opsional)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Edit file `.env` untuk konfigurasi:

```env
# Server Configuration
PORT=5002
HOST=0.0.0.0

# DASTI Configuration
DASTI_LOGIN_URL=https://dasti.example.com/login
DASTI_BASE_URL=https://dasti.example.com

# Database
DATABASE_PATH=./data/dasti_data.db

# Scraping Configuration
DEFAULT_TIMEOUT=30
PAGE_LOAD_TIMEOUT=60
MAX_RETRY_ATTEMPTS=3

# Session
SESSION_EXPIRY_HOURS=24
```

## Running

```bash
# Development
uvicorn app.main:app --reload --port 5002

# Production
uvicorn app.main:app --host 0.0.0.0 --port 5002
```

Server berjalan di: http://localhost:5002

API Documentation: http://localhost:5002/docs

## API Endpoints

### Browser Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scraper/open` | Buka browser |
| POST | `/api/scraper/close` | Tutup browser |
| POST | `/api/scraper/navigate` | Navigasi ke URL |
| GET | `/api/scraper/current-url` | Get current URL |
| GET | `/api/scraper/screenshot` | Ambil screenshot |

### Login & Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scraper/check-login` | Cek status login |
| POST | `/api/scraper/save-session` | Simpan session cookies |
| POST | `/api/scraper/load-session` | Load session cookies |
| GET | `/api/scraper/detect-captcha` | Deteksi captcha |

### Navigation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scraper/navigation-state` | Get navigation state |
| POST | `/api/scraper/navigate-to-data` | Auto navigate ke halaman data |
| POST | `/api/scraper/set-data-url` | Set URL halaman data manual |

### Table & Scraping
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scraper/detect-table` | Deteksi tabel di halaman |
| POST | `/api/scraper/start` | Mulai scraping |
| POST | `/api/scraper/stop` | Stop scraping |
| GET | `/api/scraper/status` | Status scraping |

### Data Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scraper/data` | Get data (paginated) |
| GET | `/api/scraper/data/all` | Get all data |
| POST | `/api/scraper/data/clear` | Clear data |
| GET | `/api/scraper/export/csv` | Export CSV |
| GET | `/api/scraper/export/json` | Export JSON |
| GET | `/api/scraper/export/excel` | Export Excel |

### Activity Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scraper/logs` | Get activity logs |
| POST | `/api/scraper/logs/clear` | Clear logs |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/` | Root endpoint |

## Usage Flow

### Skenario 1: First Time Scraping

1. **Buka Browser**
   ```bash
   POST /api/scraper/open
   Body: { "url": "https://dasti.example.com/login" }
   ```

2. **User Login Manual**
   - User input username, password
   - User selesaikan captcha
   - User klik login button

3. **Cek Login Status**
   ```bash
   GET /api/scraper/check-login
   ```

4. **Simpan Session**
   ```bash
   POST /api/scraper/save-session
   ```

5. **User Navigasi ke Halaman Data**
   - User klik menu/link yang diperlukan
   - Navigasi hingga halaman tabel data

6. **Deteksi Tabel**
   ```bash
   GET /api/scraper/detect-table
   ```

7. **Mulai Scraping**
   ```bash
   POST /api/scraper/start
   Body: {
     "startPage": 1,
     "endPage": 0  // 0 = semua halaman
   }
   ```

8. **Monitor Progress**
   ```bash
   GET /api/scraper/status
   ```

9. **Download Hasil**
   ```bash
   GET /api/scraper/export/csv
   GET /api/scraper/export/excel
   ```

### Skenario 2: Re-scraping dengan Session

1. **Buka Browser**
   ```bash
   POST /api/scraper/open
   ```

2. **Load Session**
   ```bash
   POST /api/scraper/load-session
   ```

3. **Navigasi ke Data**
   ```bash
   POST /api/scraper/navigate-to-data
   ```

4. **Lanjut ke step 6-9** dari Skenario 1

## Data Structure

### Scraper Status
```json
{
  "browserOpen": true,
  "isLoggedIn": true,
  "isRunning": false,
  "navigationLevel": 4,
  "currentPage": 10,
  "pagesScraped": 10,
  "itemsScraped": 100,
  "startTime": "2026-03-02T10:00:00",
  "elapsedTime": 120,
  "error": null,
  "currentUrl": "https://...",
  "tableInfo": {...},
  "dataCount": 100,
  "shouldStop": false,
  "captchaDetected": false,
  "sessionSaved": true
}
```

### Table Info
```json
{
  "headers": ["Kolom 1", "Kolom 2", "..."],
  "rowCount": 10,
  "pagination": {
    "type": "numbered",
    "totalPages": 50,
    "currentPage": 1,
    "totalEntries": 500,
    "entriesPerPage": 10
  },
  "currentUrl": "https://..."
}
```

## Database

SQLite database di `./data/dasti_data.db` dengan 3 tabel:

1. **scraped_data**: Data hasil scraping
2. **scraping_sessions**: Session cookies dan navigation state
3. **activity_logs**: Log aktivitas scraping

## Error Handling

API menggunakan format response standar:

**Success:**
```json
{
  "success": true,
  "data": {...}
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Development

### Project Structure
```
dasti-scraper/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app
│   ├── routers/
│   │   ├── __init__.py
│   │   └── scraper.py          # API endpoints
│   └── services/
│       ├── __init__.py
│       ├── scraper_service.py  # Core scraping logic
│       ├── data_store.py       # SQLite operations
│       └── activity_logger.py  # Logging
├── data/
│   └── dasti_data.db           # SQLite database
├── .env                        # Environment variables
├── requirements.txt            # Dependencies
└── README.md                   # This file
```

### Testing

```bash
# Test health check
curl http://localhost:5002/health

# Test open browser
curl -X POST http://localhost:5002/api/scraper/open \
  -H "Content-Type: application/json" \
  -d '{"url": "https://dasti.example.com/login"}'

# Test status
curl http://localhost:5002/api/scraper/status
```

## Deployment

### Railway

1. Push ke GitHub repository
2. Connect Railway ke repository
3. Set environment variables di Railway
4. Deploy otomatis

### Docker (Optional)

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5002"]
```

## Notes

- Browser akan dibuka dalam mode visible untuk memudahkan login manual
- Session cookies disimpan di database untuk re-use
- Data di-deduplikasi otomatis berdasarkan content
- Scraping bisa dihentikan kapan saja dengan endpoint `/stop`
- Data persisten di SQLite, tidak hilang saat restart

## Troubleshooting

### Browser tidak terbuka
- Pastikan Chrome terinstall
- Cek ChromeDriver compatible dengan Chrome version

### Login gagal
- Pastikan credentials benar
- Selesaikan captcha dengan benar
- Cek network connection

### Table tidak terdeteksi
- Pastikan sudah di halaman yang benar
- Cek struktur HTML tabel
- Tunggu halaman fully loaded

### Scraping lambat
- Adjust timeout di `.env`
- Cek network speed
- Reduce concurrent requests

## License

MIT

## Support

Untuk bantuan, buka issue di GitHub repository.
