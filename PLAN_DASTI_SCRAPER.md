# PLAN: DASTI Scraper Backend

## Overview
Backend scraper untuk website DASTI yang memiliki sistem login dengan captcha dan navigasi multi-level sebelum mencapai halaman data tabel yang akan di-scrape.

## Teknologi Stack
- **Framework**: FastAPI (Python)
- **Web Scraping**: Selenium + BeautifulSoup4
- **Database**: SQLite (untuk persistensi data)
- **Browser**: Chrome/Chromium dengan ChromeDriver

## Struktur Direktori
```
dasti-scraper/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI app entry point
│   ├── routers/
│   │   ├── __init__.py
│   │   └── scraper.py               # Scraper endpoints
│   └── services/
│       ├── __init__.py
│       ├── scraper_service.py       # Core scraping logic
│       ├── captcha_handler.py       # Captcha handling service
│       ├── data_store.py            # SQLite data persistence
│       └── activity_logger.py       # Activity logging
├── data/
│   └── dasti_data.db                # SQLite database
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── requirements.txt                 # Python dependencies
├── railway.toml                     # Railway deployment config
├── Procfile                         # Process file untuk deployment
└── README.md                        # Documentation

```

## Alur Navigasi Website DASTI

### 1. Halaman Login (Level 1)
- **URL**: `[URL_LOGIN_DASTI]`
- **Elemen yang perlu dihandle**:
  - Input username
  - Input password
  - Captcha (image atau text-based)
  - Button submit login
- **Strategi**:
  - Browser dibuka dan navigasi ke halaman login
  - User melakukan login manual (input username, password, captcha)
  - Backend mendeteksi login berhasil dengan memeriksa URL redirect atau elemen tertentu

### 2. Halaman Setelah Login (Level 2)
- **Deskripsi**: Halaman dashboard atau menu utama setelah login berhasil
- **Elemen yang perlu dihandle**:
  - Menu navigasi
  - Link atau button untuk menuju halaman berikutnya
- **Strategi**:
  - Deteksi elemen navigasi yang menuju ke halaman level 3
  - Klik otomatis atau user manual (tergantung kompleksitas)

### 3. Halaman Intermediate (Level 3)
- **Deskripsi**: Halaman antara sebelum halaman data tabel
- **Elemen yang perlu dihandle**:
  - Filter atau form pencarian (jika ada)
  - Link atau button untuk menuju halaman data
- **Strategi**:
  - Navigasi otomatis atau manual ke halaman data tabel
  - Simpan state navigasi untuk re-scraping

### 4. Halaman Data Tabel (Level 4 - Target)
- **Deskripsi**: Halaman yang berisi tabel data yang akan di-scrape
- **Elemen yang perlu dihandle**:
  - Tabel data (thead, tbody)
  - Pagination controls
  - Filter atau search (jika ada)
- **Strategi**:
  - Deteksi struktur tabel otomatis
  - Scraping data per halaman
  - Navigasi pagination otomatis
  - Deduplication data

## Fitur Utama

### 1. Browser Management
- **Open Browser**: Membuka Chrome browser dengan konfigurasi anti-detection
- **Close Browser**: Menutup browser dan cleanup resources
- **Navigate**: Navigasi manual ke URL tertentu
- **Get Current URL**: Mendapatkan URL saat ini
- **Take Screenshot**: Capture screenshot untuk debugging

### 2. Login & Captcha Handling
- **Manual Login Mode**: User melakukan login manual melalui browser yang dibuka
- **Captcha Detection**: Deteksi keberadaan captcha di halaman
- **Captcha Manual Solve**: User menyelesaikan captcha secara manual
- **Login Status Check**: Verifikasi apakah login berhasil
- **Session Persistence**: Menyimpan cookies untuk re-use session

### 3. Navigation Management
- **Multi-Level Navigation**: Tracking navigasi dari login hingga halaman data
- **Navigation State**: Menyimpan state navigasi untuk resume scraping
- **Auto-Navigation**: Navigasi otomatis ke halaman data (jika memungkinkan)
- **Manual Navigation Mode**: User melakukan navigasi manual dengan guidance

### 4. Table Detection & Scraping
- **Auto Table Detection**: Deteksi tabel di halaman secara otomatis
- **Header Extraction**: Ekstraksi header kolom tabel
- **Row Scraping**: Scraping data per baris
- **Pagination Detection**: Deteksi jenis pagination (numbered, next/prev, infinite scroll)
- **Auto Pagination**: Navigasi pagination otomatis
- **Data Deduplication**: Menghindari duplikasi data

### 5. Data Management
- **SQLite Storage**: Persistensi data ke database SQLite
- **Paginated API**: API untuk mengambil data dengan pagination
- **Search & Filter**: Pencarian dan filter data
- **Export**: Export data ke CSV, JSON, Excel
- **Clear Data**: Hapus semua data scraped

### 6. Activity Logging
- **Action Logs**: Log setiap aksi scraping
- **Error Logs**: Log error dan exception
- **Success Logs**: Log keberhasilan scraping
- **Timestamp**: Semua log dengan timestamp

### 7. Status Monitoring
- **Real-time Status**: Status scraping real-time
- **Progress Tracking**: Tracking progress (halaman, items)
- **Error Reporting**: Reporting error yang terjadi
- **Performance Metrics**: Elapsed time, items per second

## API Endpoints

### Browser Management
```
POST   /api/scraper/open              # Buka browser
POST   /api/scraper/close             # Tutup browser
POST   /api/scraper/navigate          # Navigasi ke URL
GET    /api/scraper/current-url       # Get current URL
GET    /api/scraper/screenshot        # Ambil screenshot
```

### Login & Authentication
```
GET    /api/scraper/check-login       # Cek status login
POST   /api/scraper/save-session      # Simpan session cookies
POST   /api/scraper/load-session      # Load session cookies
GET    /api/scraper/detect-captcha    # Deteksi captcha
```

### Navigation
```
GET    /api/scraper/navigation-state  # Get navigation state
POST   /api/scraper/navigate-to-data  # Auto navigate ke halaman data
POST   /api/scraper/set-data-url      # Set URL halaman data manual
```

### Table & Scraping
```
GET    /api/scraper/detect-table      # Deteksi tabel di halaman
POST   /api/scraper/start             # Mulai scraping
POST   /api/scraper/stop              # Stop scraping
GET    /api/scraper/status            # Status scraping
```

### Data Management
```
GET    /api/scraper/data              # Get data (paginated)
GET    /api/scraper/data/all          # Get all data
POST   /api/scraper/data/clear        # Clear data
GET    /api/scraper/export/csv        # Export CSV
GET    /api/scraper/export/json       # Export JSON
GET    /api/scraper/export/excel      # Export Excel
```

### Activity Logs
```
GET    /api/scraper/logs              # Get activity logs
POST   /api/scraper/logs/clear        # Clear logs
```

### Health Check
```
GET    /health                        # Health check
GET    /                              # Root endpoint
```

## Data Models

### Scraper Status
```python
{
    "browserOpen": bool,
    "isLoggedIn": bool,
    "isRunning": bool,
    "navigationLevel": int,        # 1=login, 2=after-login, 3=intermediate, 4=data-page
    "currentPage": int,
    "pagesScraped": int,
    "itemsScraped": int,
    "startTime": str,
    "elapsedTime": int,
    "error": str | None,
    "currentUrl": str,
    "tableInfo": dict | None,
    "dataCount": int,
    "shouldStop": bool,
    "captchaDetected": bool,
    "sessionSaved": bool
}
```

### Table Info
```python
{
    "headers": List[str],
    "rowCount": int,
    "pagination": {
        "type": str,              # "numbered", "next-prev", "infinite", "none"
        "totalPages": int,
        "currentPage": int,
        "totalEntries": int,
        "entriesPerPage": int
    },
    "currentUrl": str
}
```

### Navigation State
```python
{
    "loginUrl": str,
    "afterLoginUrl": str,
    "intermediateUrl": str,
    "dataPageUrl": str,
    "currentLevel": int,
    "sessionCookies": List[dict]
}
```

## Alur Penggunaan (User Flow)

### Skenario 1: First Time Scraping
1. **Frontend**: User klik "Buka Browser"
   - `POST /api/scraper/open`
   - Browser Chrome terbuka, navigasi ke halaman login DASTI

2. **User Manual**: User login manual
   - Input username, password
   - Selesaikan captcha
   - Klik login button
   - Tunggu redirect ke dashboard

3. **Frontend**: User klik "Cek Login Status"
   - `GET /api/scraper/check-login`
   - Backend verifikasi login berhasil

4. **Frontend**: User klik "Simpan Session"
   - `POST /api/scraper/save-session`
   - Backend simpan cookies untuk re-use

5. **User Manual**: User navigasi ke halaman data
   - Klik menu/link yang diperlukan
   - Navigasi hingga sampai halaman tabel data

6. **Frontend**: User klik "Deteksi Tabel"
   - `GET /api/scraper/detect-table`
   - Backend deteksi struktur tabel dan pagination

7. **Frontend**: User klik "Mulai Scraping"
   - `POST /api/scraper/start` dengan parameter:
     - `startPage`: halaman awal (default: 1)
     - `endPage`: halaman akhir (0 = semua)
     - `filterYear`: filter tahun (optional)
   - Backend mulai scraping otomatis

8. **Frontend**: Monitoring progress
   - `GET /api/scraper/status` (polling setiap 2 detik)
   - Tampilkan progress bar dan statistik

9. **Frontend**: Download hasil
   - `GET /api/scraper/export/csv` atau `/export/excel`

### Skenario 2: Re-scraping dengan Session
1. **Frontend**: User klik "Buka Browser"
   - `POST /api/scraper/open`

2. **Frontend**: User klik "Load Session"
   - `POST /api/scraper/load-session`
   - Backend load cookies yang tersimpan

3. **Frontend**: User klik "Navigasi ke Data"
   - `POST /api/scraper/navigate-to-data`
   - Backend navigasi otomatis ke halaman data (jika URL tersimpan)

4. **Lanjut ke step 6-9** dari Skenario 1

## Strategi Captcha Handling

### Tipe Captcha yang Mungkin
1. **Image Captcha**: Gambar dengan teks yang harus diketik
2. **reCAPTCHA**: Google reCAPTCHA v2/v3
3. **Simple Math**: Pertanyaan matematika sederhana
4. **Text Captcha**: Teks yang harus diketik ulang

### Pendekatan
1. **Manual Solving** (Recommended untuk MVP):
   - User menyelesaikan captcha secara manual
   - Backend menunggu hingga captcha selesai
   - Deteksi captcha selesai dengan memeriksa elemen atau URL change

2. **Future Enhancement**:
   - Integrasi dengan 2Captcha atau Anti-Captcha service
   - OCR untuk simple captcha
   - Audio captcha solving

## Strategi Anti-Detection

### Browser Configuration
```python
chrome_options = Options()
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--window-size=1920,1080")

# Remove webdriver flag
driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
    "source": """
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        })
    """
})
```

### User Agent Rotation
- Random user agent untuk setiap session
- Mimic real browser behavior

### Timing & Delays
- Random delays antara actions (1-3 detik)
- Smooth scrolling
- Human-like mouse movements (jika diperlukan)

## Database Schema (SQLite)

### Table: scraped_data
```sql
CREATE TABLE scraped_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,              -- 'DASTI'
    data_json TEXT NOT NULL,           -- JSON string of row data
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_number INTEGER,
    UNIQUE(source, data_json)          -- Prevent duplicates
);
```

### Table: scraping_sessions
```sql
CREATE TABLE scraping_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    session_cookies TEXT,              -- JSON string of cookies
    navigation_state TEXT,             -- JSON string of navigation URLs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: activity_logs
```sql
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    level TEXT NOT NULL,               -- 'info', 'success', 'error', 'warning'
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables (.env)
```env
# Server Configuration
PORT=5002
HOST=0.0.0.0

# DASTI Configuration
DASTI_LOGIN_URL=https://dasti.example.com/login
DASTI_BASE_URL=https://dasti.example.com

# Chrome Driver
CHROME_DRIVER_PATH=auto

# Database
DATABASE_PATH=./data/dasti_data.db

# Scraping Configuration
DEFAULT_TIMEOUT=30
PAGE_LOAD_TIMEOUT=60
MAX_RETRY_ATTEMPTS=3

# Session
SESSION_EXPIRY_HOURS=24
```

## Dependencies (requirements.txt)
```txt
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
selenium>=4.15.0
webdriver-manager>=4.0.1
beautifulsoup4>=4.12.3
pandas>=2.1.0
openpyxl>=3.1.2
python-multipart>=0.0.6
pydantic>=2.5.0
httpx>=0.26.0
pillow>=10.0.0
python-dotenv>=1.0.0
```

## Error Handling

### Common Errors
1. **Browser Crash**: Auto-restart browser
2. **Login Failed**: Return error, user retry manual
3. **Captcha Timeout**: Notify user to solve captcha
4. **Navigation Failed**: Return error with current state
5. **Table Not Found**: Return error, user verify page
6. **Pagination Failed**: Stop scraping, save current data
7. **Network Error**: Retry with exponential backoff

### Error Response Format
```json
{
    "success": false,
    "error": "Error message",
    "errorCode": "ERROR_CODE",
    "details": {
        "currentUrl": "...",
        "navigationLevel": 2,
        "suggestion": "Please check..."
    }
}
```

## Testing Strategy

### Manual Testing Checklist
- [ ] Browser open/close
- [ ] Login manual dengan captcha
- [ ] Session save/load
- [ ] Navigasi multi-level
- [ ] Table detection
- [ ] Scraping single page
- [ ] Scraping multiple pages
- [ ] Pagination handling
- [ ] Data deduplication
- [ ] Export CSV/JSON/Excel
- [ ] Error handling
- [ ] Stop scraping mid-process

### Test Data
- Gunakan akun test DASTI
- Test dengan berbagai skenario pagination
- Test dengan data yang banyak (100+ halaman)

## Deployment

### Local Development
```bash
cd dasti-scraper
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5002
```

### Railway Deployment
- Push ke GitHub repository
- Connect Railway ke repository
- Set environment variables di Railway
- Deploy otomatis

### Docker (Optional)
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y chromium chromium-driver
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5002"]
```

## Future Enhancements

### Phase 2
- [ ] Auto-login dengan credential storage (encrypted)
- [ ] Captcha solving service integration
- [ ] Auto-navigation dengan AI/ML
- [ ] Scheduled scraping (cron jobs)
- [ ] Email notification on completion
- [ ] Data validation & cleaning
- [ ] Incremental scraping (only new data)

### Phase 3
- [ ] Multi-user support dengan authentication
- [ ] Dashboard untuk monitoring
- [ ] Data analytics & visualization
- [ ] API rate limiting
- [ ] Webhook notifications
- [ ] Data export ke database eksternal

## Notes & Considerations

### Keamanan
- Jangan simpan password di code atau .env
- Encrypt session cookies di database
- Implement rate limiting untuk API
- Validate semua input dari user

### Performance
- Gunakan connection pooling untuk database
- Implement caching untuk data yang sering diakses
- Optimize query database
- Limit concurrent scraping sessions

### Maintenance
- Regular update dependencies
- Monitor error logs
- Backup database secara berkala
- Update anti-detection strategies

### Legal & Ethics
- Pastikan scraping sesuai dengan terms of service website
- Respect robots.txt
- Implement rate limiting untuk tidak overload server
- Gunakan hanya untuk keperluan yang sah

## Timeline Estimasi

### Week 1: Setup & Core Infrastructure
- Setup project structure
- Implement browser management
- Implement basic navigation
- Setup database & models

### Week 2: Login & Captcha Handling
- Implement login detection
- Implement captcha detection
- Implement session management
- Test login flow

### Week 3: Scraping Logic
- Implement table detection
- Implement data scraping
- Implement pagination handling
- Implement data deduplication

### Week 4: API & Integration
- Complete all API endpoints
- Implement export functionality
- Implement activity logging
- Integration testing

### Week 5: Testing & Deployment
- Comprehensive testing
- Bug fixes
- Documentation
- Deployment ke Railway

## Referensi
- SPP Scraper: `spp-scraper/` (sebagai template)
- SIPEDE Scraper: `sipede-scraper/backend/` (untuk referensi Node.js)
- Selenium Documentation: https://selenium-python.readthedocs.io/
- FastAPI Documentation: https://fastapi.tiangolo.com/

---

**Status**: Planning Phase
**Created**: 2026-03-02
**Last Updated**: 2026-03-02
