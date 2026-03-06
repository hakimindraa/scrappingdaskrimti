# Web Scraper Application

A powerful web scraping tool built with **Next.js** (frontend) and **FastAPI** (backend).

## 📁 Project Structure

```
porto/
├── frontend/          # Next.js Application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/# React components
│   │   └── lib/       # API client & utilities
│   └── package.json
│
└── backend/           # FastAPI Application
    ├── app/
    │   ├── main.py    # Entry point
    │   ├── routers/   # API endpoints
    │   ├── services/  # Business logic
    │   └── models/    # Pydantic schemas
    └── requirements.txt
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+

### Cara Termudah: Gunakan Startup Script

```bash
# Jalankan semua services sekaligus
Start-WebScraper.bat
```

Script ini akan otomatis:
- ✅ Auto-detect IP laptop server dan update configuration
- ✅ Install dependencies (Node.js & Python)
- ✅ Setup environment files
- ✅ Start SIPEDE backend (port 5000)
- ✅ Start SPP backend (port 5001)
- ✅ Start DASTI backend (port 5002)
- ✅ Start Frontend (port 3000)
- ✅ Buka browser otomatis
- ✅ Tampilkan URL untuk akses dari laptop lain

### Akses dari Laptop Lain (Network Access)

**IP otomatis diupdate setiap kali Start-WebScraper.bat dijalankan!**

Jika muncul warning firewall (pertama kali saja):
```bash
# Klik kanan → Run as Administrator
Setup-NetworkAccess.bat
```

Setelah itu, cukup gunakan `Start-WebScraper.bat` seperti biasa.

📖 **Dokumentasi Lengkap:**
- [Quick Start Guide](NETWORK_ACCESS_QUICK_START.md)
- [Detailed Guide](NETWORK_ACCESS_GUIDE.md)

### Manual Start (Development)

**1. Start SIPEDE Backend:**
```bash
cd sipede-scraper/backend
npm run dev
```

**2. Start SPP Backend:**
```bash
cd spp-scraper
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 5001
```

**3. Start DASTI Backend:**
```bash
cd dasti-scraper
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 5002
```

**4. Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:3000

## ✨ Features

### 🎯 Multi-Source Scraping
- **SIPEDE**: Scraping data SIPEDE dengan login otomatis dan year filter
- **SPP (SPDP)**: Scraping data SPP dengan pagination support
- **DASTI**: Scraping data DASTI dengan login manual dan captcha handling

### 🌐 Network Access
- ✅ Akses dari laptop lain di WiFi yang sama
- ✅ Auto-detect IP address
- ✅ Firewall configuration helper
- ✅ Environment-based API URLs

### Backend Features
- 🔍 Auto table detection
- 📄 Multi-page scraping dengan pagination
- 💾 SQLite database storage
- 📊 Export ke CSV, JSON, Excel
- 🔐 Session management (save/load cookies)
- 📝 Activity logging
- 🔄 Real-time status updates

### Frontend Features
- 🎨 Modern dark theme UI
- 📊 Dashboard dengan real-time monitoring
- 🔄 Auto-refresh status (5 detik)
- 📈 Data workspace dengan search & pagination
- 💡 AI-powered insights (dengan Ollama)
- 📱 Responsive design
- 🔔 Browser notifications

## 📡 API Endpoints

### SIPEDE Backend (Port 5000)
- `GET /api/scraper/status` - Get scraper status
- `POST /api/scraper/open` - Open browser
- `POST /api/scraper/check-login` - Check login & navigate
- `POST /api/scraper/scrape` - Start scraping
- `GET /api/scraper/data` - Get scraped data
- `GET /api/scraper/export/{format}` - Export data (csv/json/excel)

### SPP Backend (Port 5001)
- `GET /api/scraper/status` - Get scraper status
- `POST /api/scraper/open` - Open browser
- `POST /api/scraper/navigate` - Navigate to URL
- `POST /api/scraper/start` - Start scraping
- `GET /api/scraper/data` - Get scraped data
- `GET /api/scraper/export/{format}` - Export data

### DASTI Backend (Port 5002)
- `GET /api/scraper/status` - Get scraper status
- `POST /api/scraper/open` - Open browser
- `POST /api/scraper/detect-captcha` - Detect captcha
- `POST /api/scraper/save-session` - Save login session
- `POST /api/scraper/navigate-to-data` - Navigate to data page
- `POST /api/scraper/start` - Start scraping
- `GET /api/scraper/data` - Get scraped data
- `GET /api/scraper/export/{format}` - Export data

### Health Check
All backends support: `GET /health`

## 🛠️ Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- React 18
- Tailwind CSS

### Backend
- **SIPEDE**: Node.js + Express + Selenium + SQLite
- **SPP & DASTI**: Python + FastAPI + Selenium + SQLite
- BeautifulSoup4 (HTML parsing)
- Pandas (data processing)

### AI Features (Optional)
- Ollama (local LLM)
- llama3.2:3b or gemma3:4b model

## 📚 Documentation

- [Network Access Guide](NETWORK_ACCESS_GUIDE.md) - Setup akses dari laptop lain
- [Quick Start Guide](NETWORK_ACCESS_QUICK_START.md) - Panduan cepat network access
- [SIPEDE Documentation](sipede-scraper/backend/README.md)
- [SPP Documentation](spp-scraper/README.md)
- [DASTI Documentation](dasti-scraper/README.md)

## 🔧 Troubleshooting

### Backend Offline dari Laptop Lain
1. Jalankan `Setup-NetworkAccess.bat` as Administrator
2. Cek firewall: port 3000, 5000, 5001, 5002 harus dibuka
3. Pastikan kedua laptop di WiFi yang sama
4. Restart services

### Port Already in Use
```bash
# Windows: Kill process on port
netstat -ano | findstr :5000
taskkill /PID [PID] /F
```

### SQLite Database Locked
```bash
# Stop semua services dulu
# Hapus file .db-shm dan .db-wal
# Start ulang
```

Dokumentasi lengkap: [NETWORK_ACCESS_GUIDE.md](NETWORK_ACCESS_GUIDE.md)

## 📄 License

MIT License
