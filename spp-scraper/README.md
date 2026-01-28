# SPP Scraper Backend

Backend API untuk scraping data SPP (Surat Perintah Penyelidikan) menggunakan Selenium.

## Requirements

- Python 3.9+
- Google Chrome Browser
- Koneksi LAN ke server SPP (10.35.0.101)

## Installation

```bash
cd spp-scraper

# Buat virtual environment (opsional)
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

## Running

```bash
# Development
uvicorn app.main:app --reload --port 5001

# Atau gunakan virtual environment porto
e:\porto\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 5001
```

Server berjalan di: http://localhost:5001

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/scraper/open` | Buka browser |
| POST | `/api/scraper/close` | Tutup browser |
| GET | `/api/scraper/status` | Status scraper |
| POST | `/api/scraper/navigate` | Navigasi ke URL |
| GET | `/api/scraper/detect-table` | Deteksi tabel di halaman |
| POST | `/api/scraper/start` | Mulai scraping |
| POST | `/api/scraper/stop` | Stop scraping |
| GET | `/api/scraper/data` | Get data (paginated) |
| GET | `/api/scraper/export/csv` | Export ke CSV |
| GET | `/api/scraper/export/json` | Export ke JSON |
| POST | `/api/scraper/clear` | Hapus data |

## Alur Penggunaan

1. `POST /api/scraper/open` - Membuka browser Chrome
2. User login manual ke SPP dan navigasi ke halaman data
3. `GET /api/scraper/detect-table` - Deteksi tabel di halaman
4. `POST /api/scraper/start` - Mulai scraping otomatis
5. `GET /api/scraper/status` - Pantau progress
6. `GET /api/scraper/export/csv` - Download hasil

## URL SPP

- Login: http://10.35.0.101:4111/
- Surat Terkirim: http://10.35.0.101:4111/pidum/spdp/index
