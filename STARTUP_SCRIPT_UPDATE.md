# ✅ Startup Script Updated - Auto SQLite Check!

## 🎉 Apa yang Berubah?

Script `start-scraper.ps1` sekarang **OTOMATIS** cek dan install SQLite dependencies!

---

## 🚀 Cara Pakai (SUPER SIMPLE):

### **Di Laptop Manapun:**

```bash
# Cukup jalankan ini saja!
Start-WebScraper.bat
```

atau

```powershell
powershell -ExecutionPolicy Bypass -File start-scraper.ps1
```

**Script akan otomatis:**
1. ✅ Cek apakah `better-sqlite3` sudah terinstall
2. ✅ Install jika belum ada
3. ✅ Migrasi data JSON lama (jika ada)
4. ✅ Start semua services

**TIDAK PERLU** jalankan `INSTALL_SQLITE.bat` lagi!

---

## 📋 Skenario Penggunaan:

### **Skenario 1: Laptop Pertama (Fresh Install)**

```bash
# Pertama kali
Start-WebScraper.bat
```

**Yang Terjadi:**
```
[2/5] Mengecek & install dependencies...
  Installing SIPEDE backend dependencies (including SQLite)...
  OK SIPEDE Backend dependencies installed
  OK SQLite installed
```

### **Skenario 2: Laptop Pertama (Sudah Install)**

```bash
# Jalankan lagi
Start-WebScraper.bat
```

**Yang Terjadi:**
```
[2/5] Mengecek & install dependencies...
  OK SIPEDE Backend dependencies (SQLite ready)
```

**Langsung skip, tidak install ulang!**

---

### **Skenario 3: Pindah ke Laptop Baru**

**Di Laptop Lama:**
1. Copy folder `scrappingdaskrimti` ke USB/cloud

**Di Laptop Baru:**
1. Paste folder
2. Jalankan:
```bash
Start-WebScraper.bat
```

**Yang Terjadi:**
```
[2/5] Mengecek & install dependencies...
  Installing SIPEDE backend dependencies (including SQLite)...
  OK SIPEDE Backend dependencies installed
  OK SQLite installed
```

**Otomatis install, tidak perlu manual!**

---

### **Skenario 4: Ada Data JSON Lama**

Jika Anda punya file JSON lama (`activity_logs.json`, `scraped_data.json`):

```bash
Start-WebScraper.bat
```

**Yang Terjadi:**
```
[2/5] Mengecek & install dependencies...
  OK SIPEDE Backend dependencies (SQLite ready)
  Detected old JSON data, running migration to SQLite...
  
===========================================
  SIPEDE: JSON to SQLite Migration Tool
===========================================

[1/2] Migrating activity logs...
  ✓ Migrated 45 activity logs
  ✓ Backed up to: activity_logs.json.backup

[2/2] Migrating scraped data...
  ✓ Migrated 2 scraped data records
  ✓ Backed up to: scraped_data.json.backup

===========================================
✓ Migration completed! (47 records)
===========================================

  OK Data migrated to SQLite
```

**Otomatis migrasi, tidak perlu manual!**

---

## 🎯 Keuntungan Update Ini:

### ✅ **One-Click Setup**
- Tidak perlu jalankan 2 script berbeda
- Cukup `Start-WebScraper.bat` saja

### ✅ **Smart Detection**
- Auto-detect apakah SQLite sudah terinstall
- Auto-detect apakah ada data JSON lama
- Auto-migrate jika perlu

### ✅ **Portable**
- Copy project ke laptop lain
- Jalankan `Start-WebScraper.bat`
- Selesai!

### ✅ **No Breaking Changes**
- Script lama tetap bisa dipakai
- `INSTALL_SQLITE.bat` tetap ada (opsional)
- Backward compatible

---

## 📊 Perbandingan:

| Aspek | Sebelum Update | Setelah Update |
|-------|----------------|----------------|
| **First Install** | 1. `INSTALL_SQLITE.bat`<br>2. `Start-WebScraper.bat` | 1. `Start-WebScraper.bat` |
| **Pindah Laptop** | 1. `INSTALL_SQLITE.bat`<br>2. `Start-WebScraper.bat` | 1. `Start-WebScraper.bat` |
| **Migrasi Data** | 1. `npm run migrate`<br>2. `Start-WebScraper.bat` | 1. `Start-WebScraper.bat` |
| **Daily Use** | `Start-WebScraper.bat` | `Start-WebScraper.bat` |

---

## 🔍 Apa yang Dicek Script?

### **1. Check Dependencies:**
```powershell
# Cek apakah node_modules ada
if (!(Test-Path "sipede-scraper\backend\node_modules")) {
    npm install  # Install semua
}
```

### **2. Check SQLite:**
```powershell
# Cek apakah better-sqlite3 ada
if (!(Test-Path "node_modules\better-sqlite3")) {
    npm install better-sqlite3  # Install SQLite
}
```

### **3. Check Migration:**
```powershell
# Cek apakah ada JSON lama tapi belum ada DB
if ((Test-Path "activity_logs.json") -and !(Test-Path "sipede_data.db")) {
    npm run migrate  # Migrasi otomatis
}
```

---

## 🚨 Troubleshooting:

### **Script Stuck di "Installing dependencies"?**

**Penyebab:** Internet lambat atau npm error

**Solusi:**
1. Tunggu sampai selesai (bisa 1-5 menit)
2. Atau cancel (Ctrl+C) dan jalankan manual:
   ```bash
   cd sipede-scraper/backend
   npm install
   ```

### **Error: "npm not found"?**

**Penyebab:** Node.js belum terinstall

**Solusi:**
1. Install Node.js dari: https://nodejs.org/
2. Restart terminal
3. Jalankan script lagi

### **Migration Failed?**

**Penyebab:** File JSON corrupt atau format salah

**Solusi:**
1. Backup file JSON
2. Hapus file JSON
3. Jalankan script lagi (akan buat DB baru)

---

## 📝 File yang Tidak Perlu Lagi:

### **Opsional (Bisa Dihapus):**
- `INSTALL_SQLITE.bat` - Sudah tidak perlu (tapi tidak masalah jika tetap ada)
- `Install-SQLite.ps1` - Sudah tidak perlu (tapi tidak masalah jika tetap ada)

### **Tetap Perlu:**
- `Start-WebScraper.bat` - WAJIB (main launcher)
- `start-scraper.ps1` - WAJIB (main script)

---

## 🎉 Kesimpulan:

**Sekarang cukup 1 script saja untuk semua:**

```bash
Start-WebScraper.bat
```

**Script ini akan:**
- ✅ Auto-check dependencies
- ✅ Auto-install jika perlu
- ✅ Auto-migrate data lama
- ✅ Start semua services

**Tidak perlu script tambahan lagi!**

---

## 📚 Dokumentasi Lama (Masih Valid):

Dokumentasi lama tetap bisa dibaca untuk referensi:
- `SQLITE_MIGRATION_GUIDE.md` - Detail teknis
- `SIPEDE_SQLITE_SUMMARY.md` - Summary
- `README_SQLITE_MIGRATION.md` - Panduan lengkap

Tapi untuk daily use, **cukup jalankan `Start-WebScraper.bat` saja!**

---

**Status:** ✅ UPDATED & READY  
**Version:** 2.1.0 (Auto-Install)  
**Date:** 2024-01-20  

**One Script to Rule Them All! 🚀**
