# 🚀 Setup Guide - Untuk Clone dari GitHub

## 📋 Prerequisites

Pastikan sudah terinstall:
- ✅ Node.js (v18 atau lebih baru)
- ✅ Python (v3.8 atau lebih baru)
- ✅ Git

---

## 🎯 Quick Start (Super Simple!)

### **1. Clone Repository:**

```bash
git clone <repository-url>
cd scrappingdaskrimti
```

### **2. Jalankan Startup Script:**

```bash
Start-WebScraper.bat
```

atau

```powershell
powershell -ExecutionPolicy Bypass -File start-scraper.ps1
```

**SELESAI!** Script akan otomatis:
- ✅ Install semua dependencies (Node.js, Python, SQLite)
- ✅ Setup environment files
- ✅ Buat database SQLite
- ✅ Start semua services

---

## 📊 Apa yang Terjadi?

### **Pertama Kali (Auto-Install):**

```
[1/5] Mengecek dependencies...
  OK Node.js: v22.19.0
  OK Python: Python 3.14.0

[2/5] Mengecek & install dependencies...
  Installing frontend dependencies...
  Installing SIPEDE backend dependencies (including SQLite)...
  Creating Python virtual environment...
  OK All dependencies installed

[3/5] Menjalankan Ollama... (optional)
  Skipping Ollama (tidak terinstall)

[4/5] Menjalankan services...
  Starting SIPEDE Backend (Port 5000)...
  Starting SPP Backend (Port 5001)...
  Starting Frontend (Port 3000)...

[5/5] Membuka browser...
  OK Browser opened

============================================
  SEMUA SERVICES BERJALAN!
============================================
```

### **Setelah Itu (Langsung Start):**

```
[2/5] Mengecek & install dependencies...
  OK Frontend dependencies
  OK SIPEDE Backend dependencies (SQLite ready)
  OK SPP Backend dependencies

[4/5] Menjalankan services...
  (langsung start, tidak install lagi)
```

---

## 🌐 Akses Aplikasi:

### **Di Laptop yang Menjalankan:**
```
Frontend:       http://localhost:3000
SIPEDE Backend: http://localhost:5000
SPP Backend:    http://localhost:5001
```

### **Dari Laptop Lain (WiFi Sama):**
```
Frontend:       http://[IP-LAPTOP]:3000
SIPEDE Backend: http://[IP-LAPTOP]:5000
SPP Backend:    http://[IP-LAPTOP]:5001
```

IP laptop akan ditampilkan di console saat startup.

---

## 📁 Struktur Project:

```
scrappingdaskrimti/
├── frontend/                    # Next.js frontend
│   ├── src/
│   └── node_modules/           # Auto-generated (git ignored)
│
├── sipede-scraper/backend/     # SIPEDE scraper (Node.js)
│   ├── src/
│   ├── data/                   # Database folder
│   │   ├── .gitkeep           # Tracked by git
│   │   └── sipede_data.db     # Auto-created (git ignored)
│   └── node_modules/          # Auto-generated (git ignored)
│
├── spp-scraper/                # SPDP scraper (Python)
│   ├── app/
│   ├── data/                  # Database folder
│   │   ├── .gitkeep          # Tracked by git
│   │   └── spdp_data.db      # Auto-created (git ignored)
│   └── venv/                 # Auto-generated (git ignored)
│
├── Start-WebScraper.bat       # Main launcher (Windows)
├── start-scraper.ps1          # Main script (PowerShell)
└── README.md                  # Documentation
```

---

## 🔍 Yang Di-Push ke GitHub:

### ✅ **Akan Di-Push (Tracked):**
- Source code (`.js`, `.py`, `.tsx`, dll)
- Configuration files (`package.json`, `requirements.txt`)
- Scripts (`start-scraper.ps1`, `Start-WebScraper.bat`)
- Documentation (`.md` files)
- Folder structure (`.gitkeep` files)

### ❌ **TIDAK Di-Push (Ignored):**
- `node_modules/` - Dependencies (auto-install)
- `venv/` - Python virtual env (auto-create)
- `*.db` - Database files (auto-create)
- `.env` - Environment variables (sensitive)
- Build outputs (`.next/`, `dist/`)

---

## 🎯 Workflow untuk Tim:

### **Developer 1 (Anda):**
```bash
# 1. Develop fitur baru
# 2. Test lokal
# 3. Commit & push
git add .
git commit -m "Add new feature"
git push origin main
```

### **Developer 2 (Teman):**
```bash
# 1. Clone atau pull
git clone <repo-url>
# atau
git pull origin main

# 2. Jalankan startup script
Start-WebScraper.bat

# 3. Selesai! Aplikasi jalan
```

---

## 🚨 Troubleshooting:

### **Error: "Node.js not found"**
**Solusi:** Install Node.js dari https://nodejs.org/

### **Error: "Python not found"**
**Solusi:** Install Python dari https://www.python.org/

### **Error: "npm install failed"**
**Solusi:** 
```bash
# Hapus node_modules dan install ulang
cd frontend
rmdir /s /q node_modules
npm install

cd ../sipede-scraper/backend
rmdir /s /q node_modules
npm install
```

### **Error: "Port already in use"**
**Solusi:**
```bash
# Cek port yang dipakai
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5001

# Kill process
taskkill /PID <PID> /F
```

### **Database Tidak Dibuat**
**Solusi:**
Database akan otomatis dibuat saat server start pertama kali. Jika tidak ada:
```bash
# Jalankan ulang startup script
Start-WebScraper.bat
```

---

## 📊 Database:

### **Lokasi:**
```
sipede-scraper/backend/data/sipede_data.db  (SIPEDE)
spp-scraper/data/spdp_data.db               (SPDP)
```

### **Cara Lihat Data:**
1. **DB Browser for SQLite** (GUI)
   - Download: https://sqlitebrowser.org/
   - Open Database → Pilih file `.db`

2. **Via API**
   ```bash
   GET http://localhost:5000/api/scraper/data  (SIPEDE)
   GET http://localhost:5001/api/scraper/data  (SPDP)
   ```

3. **Check Script**
   ```bash
   node check-database-simple.js
   ```

---

## 🎁 Fitur Auto-Install:

Script `start-scraper.ps1` sudah pintar:
- ✅ Auto-detect dependencies yang belum terinstall
- ✅ Auto-install jika perlu
- ✅ Auto-create database
- ✅ Auto-setup environment files
- ✅ Skip install jika sudah ada

**Jadi cukup jalankan `Start-WebScraper.bat` dan semuanya otomatis!**

---

## 📝 Notes:

### **Data Scraping:**
- Database **TIDAK** di-push ke GitHub (git ignored)
- Setiap developer punya database lokal sendiri
- Jika mau share data, export ke Excel/JSON

### **Environment Variables:**
- File `.env` **TIDAK** di-push (git ignored)
- File `.env.example` di-push sebagai template
- Script otomatis copy `.env.example` → `.env` saat first run

### **Dependencies:**
- `node_modules/` dan `venv/` **TIDAK** di-push
- Script otomatis install saat first run
- Hemat space di GitHub

---

## ✅ Checklist Setup:

- [ ] Clone repository
- [ ] Jalankan `Start-WebScraper.bat`
- [ ] Tunggu auto-install selesai
- [ ] Browser otomatis buka `http://localhost:3000`
- [ ] Test scraping
- [ ] Selesai!

---

## 🎉 Kesimpulan:

**Untuk teman Anda:**
1. Clone dari GitHub
2. Jalankan `Start-WebScraper.bat`
3. Selesai!

**Tidak perlu:**
- ❌ Install dependencies manual
- ❌ Setup database manual
- ❌ Konfigurasi environment manual

**Semuanya otomatis!** 🚀

---

**Happy Coding!**
