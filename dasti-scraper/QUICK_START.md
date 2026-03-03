# Quick Start Guide - DASTI Scraper

## Instalasi Cepat

### 1. Install Dependencies

```bash
cd dasti-scraper
pip install -r requirements.txt
```

### 2. Konfigurasi

Edit file `.env` dan sesuaikan URL DASTI:

```env
DASTI_LOGIN_URL=https://dasti.example.com/login
DASTI_BASE_URL=https://dasti.example.com
```

### 3. Jalankan Server

**Windows (CMD):**
```bash
start-dasti.bat
```

**Windows (PowerShell):**
```bash
.\start-dasti.ps1
```

**Manual:**
```bash
uvicorn app.main:app --reload --port 5002
```

Server akan berjalan di: http://localhost:5002

## Penggunaan Pertama Kali

### Step 1: Buka Browser

**Request:**
```bash
POST http://localhost:5002/api/scraper/open
Content-Type: application/json

{
  "url": "https://dasti.example.com/login"
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

Browser Chrome akan terbuka otomatis.

### Step 2: Login Manual

1. Di browser yang terbuka, input username dan password
2. Selesaikan captcha jika ada
3. Klik tombol login
4. Tunggu hingga redirect ke dashboard

### Step 3: Cek Login Status

**Request:**
```bash
GET http://localhost:5002/api/scraper/check-login
```

**Response:**
```json
{
  "success": true,
  "isLoggedIn": true,
  "currentUrl": "https://dasti.example.com/dashboard",
  "navigationLevel": 2
}
```

### Step 4: Simpan Session

**Request:**
```bash
POST http://localhost:5002/api/scraper/save-session
```

**Response:**
```json
{
  "success": true
}
```

Session cookies akan disimpan untuk digunakan lagi nanti.

### Step 5: Navigasi ke Halaman Data

**Manual:** Di browser, klik menu/link untuk menuju halaman tabel data.

**Atau Auto (jika URL sudah diketahui):**
```bash
POST http://localhost:5002/api/scraper/set-data-url
Content-Type: application/json

{
  "url": "https://dasti.example.com/data/table"
}
```

Kemudian:
```bash
POST http://localhost:5002/api/scraper/navigate-to-data
```

### Step 6: Deteksi Tabel

**Request:**
```bash
GET http://localhost:5002/api/scraper/detect-table
```

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
      "entriesPerPage": 10
    },
    "current_url": "https://dasti.example.com/data/table"
  }
}
```

### Step 7: Mulai Scraping

**Request:**
```bash
POST http://localhost:5002/api/scraper/start
Content-Type: application/json

{
  "startPage": 1,
  "endPage": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scraping started",
  "startPage": 1,
  "endPage": "all"
}
```

**Note:** `endPage: 0` berarti scrape semua halaman.

### Step 8: Monitor Progress

**Request (polling setiap 2 detik):**
```bash
GET http://localhost:5002/api/scraper/status
```

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
    "dataCount": 150,
    "shouldStop": false
  }
}
```

### Step 9: Download Hasil

**CSV:**
```bash
GET http://localhost:5002/api/scraper/export/csv
```

**Excel:**
```bash
GET http://localhost:5002/api/scraper/export/excel
```

**JSON:**
```bash
GET http://localhost:5002/api/scraper/export/json
```

File akan otomatis terdownload.

## Penggunaan Selanjutnya (dengan Session)

### Step 1: Buka Browser
```bash
POST http://localhost:5002/api/scraper/open
```

### Step 2: Load Session
```bash
POST http://localhost:5002/api/scraper/load-session
```

Session cookies akan dimuat, tidak perlu login lagi.

### Step 3: Navigasi ke Data
```bash
POST http://localhost:5002/api/scraper/navigate-to-data
```

### Step 4-9: Sama seperti penggunaan pertama

## Tips & Tricks

### Stop Scraping
Jika ingin menghentikan scraping:
```bash
POST http://localhost:5002/api/scraper/stop
```

### Clear Data
Untuk menghapus data lama sebelum scraping baru:
```bash
POST http://localhost:5002/api/scraper/data/clear
```

### View Logs
Untuk melihat activity logs:
```bash
GET http://localhost:5002/api/scraper/logs?limit=50
```

### Get Data (Paginated)
Untuk melihat data tanpa download:
```bash
GET http://localhost:5002/api/scraper/data?page=1&limit=20&search=keyword
```

### Take Screenshot
Untuk debugging, ambil screenshot halaman:
```bash
GET http://localhost:5002/api/scraper/screenshot
```

## Troubleshooting

### Browser tidak terbuka
- Pastikan Chrome terinstall
- Jalankan sebagai Administrator

### Login gagal
- Cek credentials
- Selesaikan captcha dengan benar
- Cek koneksi internet

### Table tidak terdeteksi
- Pastikan sudah di halaman yang benar
- Tunggu halaman fully loaded
- Refresh halaman

### Scraping error
- Cek logs: `GET /api/scraper/logs`
- Cek status: `GET /api/scraper/status`
- Restart browser: `POST /api/scraper/close` lalu `POST /api/scraper/open`

## API Documentation

Untuk dokumentasi lengkap, buka:
http://localhost:5002/docs

## Support

Jika ada masalah, cek:
1. Activity logs di `/api/scraper/logs`
2. Status di `/api/scraper/status`
3. README.md untuk dokumentasi lengkap
