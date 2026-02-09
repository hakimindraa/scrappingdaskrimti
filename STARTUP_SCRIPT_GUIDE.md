# 🚀 Startup Script Guide

Panduan lengkap untuk menggunakan script startup otomatis.

---

## 📋 Overview

Script `start-scraper.ps1` dan `Start-WebScraper.bat` sudah diupdate untuk mendukung **AI Assistant features**!

### ✨ Fitur Baru:
- ✅ Auto-detect Ollama installation
- ✅ Auto-check model availability
- ✅ Auto-start Ollama service
- ✅ Display AI Assistant status
- ✅ Smart cleanup (optional Ollama stop)

---

## 🎯 Cara Menggunakan

### Metode 1: Double-click BAT file (Recommended)
```
1. Double-click: Start-WebScraper.bat
2. Tunggu semua services start
3. Browser otomatis terbuka
4. Tekan Enter untuk stop semua services
```

### Metode 2: PowerShell langsung
```powershell
# Buka PowerShell di folder project
powershell -ExecutionPolicy Bypass -File "start-scraper.ps1"
```

---

## 📊 Proses Startup

### Step 1: Check Dependencies (1/5)
```
✅ Node.js version check
✅ Python version check
✅ Ollama installation check (optional)
✅ Model availability check (optional)
```

**Output:**
```
[1/5] Mengecek dependencies...
  OK Node.js: v20.10.0
  OK Python: Python 3.11.5
  OK Ollama: ollama version 0.1.17
  OK Model: llama3.2 ready
```

**Jika Ollama tidak terinstall:**
```
  WARNING: Ollama tidak terinstall
           AI features tidak akan berfungsi
           Download: https://ollama.com/download
```

**Jika Model belum di-download:**
```
  WARNING: Model llama3.2 belum di-download
           AI features tidak akan berfungsi
           Jalankan: ollama pull llama3.2:3b
```

### Step 2: Install Dependencies (2/5)
```
✅ Check & install frontend dependencies
✅ Check & install SIPEDE backend dependencies
✅ Check & install SPDP backend dependencies
```

**Output:**
```
[2/5] Mengecek & install dependencies...
  OK Frontend dependencies
  OK SIPEDE Backend dependencies
  OK SPP Backend dependencies
```

### Step 3: Start Ollama (3/5)
```
✅ Check if Ollama already running
✅ Start Ollama service if not running
✅ Verify Ollama started successfully
```

**Output jika Ollama terinstall:**
```
[3/5] Menjalankan Ollama...
  Starting Ollama service...
  OK Ollama service started
```

**Output jika Ollama tidak terinstall:**
```
[3/5] Skipping Ollama (tidak terinstall)...
```

### Step 4: Start Services (4/5)
```
✅ Start SIPEDE Backend (Port 5000)
✅ Start SPDP Backend (Port 5001)
✅ Start Frontend (Port 3000)
```

**Output:**
```
[4/5] Menjalankan services...
  Starting SIPEDE Backend (Port 5000)...
  OK SIPEDE Backend started
  Starting SPP Backend (Port 5001)...
  OK SPP Backend started
  Starting Frontend (Port 3000)...
  OK Frontend started
```

### Step 5: Open Browser (5/5)
```
✅ Wait 3 seconds for services to be ready
✅ Open browser at http://localhost:3000
```

**Output:**
```
[5/5] Membuka browser...
  OK Browser opened
```

---

## 📺 Status Display

### Jika Semua Ready (Ollama + Model)
```
============================================
  SEMUA SERVICES BERJALAN!
============================================

  Akses Lokal (laptop ini):
    Frontend:       http://localhost:3000
    SIPEDE Backend: http://localhost:5000
    SPP Backend:    http://localhost:5001
    Ollama Service: http://localhost:11434

  Akses dari Laptop Lain (WiFi sama):
    Frontend:       http://192.168.1.100:3000
    SIPEDE Backend: http://192.168.1.100:5000
    SPP Backend:    http://192.168.1.100:5001
    Ollama Service: http://192.168.1.100:11434

  AI Assistant: READY
    - Smart Categorization
    - Document Summarization
    - AI Chatbot

============================================
  Tekan ENTER untuk STOP semua services
============================================
```

### Jika Ollama Tidak Terinstall
```
  AI Assistant: NOT READY
    Install Ollama: https://ollama.com/download
```

### Jika Model Belum Di-download
```
  AI Assistant: NOT READY
    Download model: ollama pull llama3.2:3b
```

---

## 🛑 Cara Stop Services

### Step 1: Tekan Enter
```
Tekan ENTER di window PowerShell
```

### Step 2: Pilih Stop Ollama atau Tidak
```
Menghentikan Ollama? (Y/N)
```

**Pilih Y (Yes):**
- Ollama akan dihentikan
- AI features tidak bisa digunakan sampai start ulang

**Pilih N (No):**
- Ollama tetap berjalan di background
- AI features masih bisa digunakan
- Hemat waktu untuk start berikutnya

### Step 3: Cleanup
```
  OK Ollama dihentikan (atau tetap berjalan)
OK Semua services dihentikan
```

---

## 🔧 Troubleshooting

### Error: "Execution Policy"
```powershell
# Solusi: Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "Node.js tidak ditemukan"
```
1. Install Node.js dari https://nodejs.org/
2. Restart terminal
3. Jalankan script lagi
```

### Error: "Python tidak ditemukan"
```
1. Install Python dari https://www.python.org/
2. Centang "Add Python to PATH"
3. Restart terminal
4. Jalankan script lagi
```

### Warning: "Ollama tidak terinstall"
```
Ini bukan error! Script tetap jalan, tapi AI features tidak tersedia.

Untuk enable AI features:
1. Install Ollama: https://ollama.com/download
2. Download model: ollama pull llama3.2:3b
3. Jalankan script lagi
```

### Error: "Port already in use"
```
# Cek process yang pakai port
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5001

# Kill process
taskkill /PID <process_id> /F
```

### Ollama gagal start
```
# Manual start Ollama
ollama serve

# Atau restart Ollama
taskkill /F /IM ollama.exe
ollama serve
```

---

## 💡 Tips & Tricks

### Tip 1: Keep Ollama Running
```
Saat stop services, pilih N untuk keep Ollama running.
Keuntungan:
- Start lebih cepat next time
- AI features langsung ready
- Hemat waktu loading model
```

### Tip 2: Auto-start on Windows Startup
```
1. Buat shortcut Start-WebScraper.bat
2. Copy shortcut ke:
   C:\Users\<user>\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
3. Restart Windows
4. Services auto-start saat login
```

### Tip 3: Custom Ports
Edit `start-scraper.ps1`:
```powershell
# Change ports
$sipedePort = 5000  # Change to your port
$spdpPort = 5001    # Change to your port
$frontendPort = 3000 # Change to your port
```

### Tip 4: Silent Mode (No Browser)
Edit `start-scraper.ps1`:
```powershell
# Comment out browser opening
# Start-Process "http://localhost:3000"
```

### Tip 5: Check Services Status
```powershell
# Check running processes
Get-Process -Name "node"
Get-Process -Name "python"
Get-Process -Name "ollama"

# Check ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :5001
netstat -ano | findstr :11434
```

---

## 🔄 Update Script

Jika ada update di script:

### Metode 1: Git Pull
```bash
git pull origin main
```

### Metode 2: Manual Replace
```
1. Backup script lama
2. Copy script baru
3. Test script baru
```

---

## 📝 Script Files

### Start-WebScraper.bat
```bat
@echo off
title Web Scraper Launcher
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "start-scraper.ps1"
pause
```

**Fungsi:**
- Entry point untuk user
- Set execution policy
- Call PowerShell script
- Pause at end

### start-scraper.ps1
**Fungsi:**
- Check dependencies (Node.js, Python, Ollama)
- Install dependencies if needed
- Start Ollama service
- Start all backend & frontend services
- Open browser
- Display status
- Handle cleanup

---

## 🎯 Comparison: Before vs After Update

### Before (Old Script)
```
✅ Check Node.js & Python
✅ Install dependencies
✅ Start SIPEDE & SPDP backends
✅ Start Frontend
✅ Open browser
❌ No Ollama support
❌ No AI status
```

### After (New Script)
```
✅ Check Node.js & Python
✅ Check Ollama & Model (optional)
✅ Install dependencies
✅ Start Ollama service (if available)
✅ Start SIPEDE & SPDP backends
✅ Start Frontend
✅ Open browser
✅ Display AI Assistant status
✅ Smart Ollama cleanup
```

---

## 📊 Performance

### Startup Time

**Without Ollama:**
```
Check dependencies:     2 sec
Install dependencies:   0 sec (if already installed)
Start services:         5 sec
Open browser:           3 sec
────────────────────────────
TOTAL:                  10 sec
```

**With Ollama (First Time):**
```
Check dependencies:     2 sec
Install dependencies:   0 sec
Start Ollama:           3 sec
Start services:         5 sec
Open browser:           3 sec
────────────────────────────
TOTAL:                  13 sec
```

**With Ollama (Already Running):**
```
Check dependencies:     2 sec
Install dependencies:   0 sec
Detect Ollama running:  1 sec
Start services:         5 sec
Open browser:           3 sec
────────────────────────────
TOTAL:                  11 sec
```

---

## 🔐 Security Notes

### Execution Policy
Script uses `-ExecutionPolicy Bypass` untuk kemudahan.

**Untuk production:**
```powershell
# Set permanent policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Update Start-WebScraper.bat
powershell -File "start-scraper.ps1"
```

### Network Access
Script bind ke `0.0.0.0` untuk akses dari laptop lain.

**Untuk local only:**
Edit script, ganti `0.0.0.0` dengan `localhost`

---

## 📚 Related Documentation

- **QUICK_START_AI.md** - AI Assistant quick start
- **SETUP_NEW_LAPTOP.md** - Setup di laptop baru
- **DISTRIBUTION_GUIDE.md** - Distribusi ke laptop lain
- **AI_FAQ.md** - Frequently Asked Questions

---

## ✅ Checklist

Sebelum run script, pastikan:
- [ ] Node.js installed
- [ ] Python installed
- [ ] Ollama installed (optional, untuk AI features)
- [ ] Model downloaded (optional, untuk AI features)
- [ ] Port 3000, 5000, 5001 tidak dipakai
- [ ] Port 11434 tidak dipakai (jika pakai Ollama)

---

**Script updated and ready to use! 🚀**
