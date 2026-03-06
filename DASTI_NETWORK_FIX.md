# DASTI Network Access Fix

## Masalah
DASTI backend aktif di localhost tapi offline saat diakses via IP dari laptop lain, sementara SIPEDE dan SPP berfungsi normal.

## Root Cause
1. **Uvicorn binding issue**: Parameter `--host` dan `--port` harus dalam urutan yang benar
2. **Firewall rules**: Port 5002 mungkin tidak dibuka dengan benar (perlu inbound DAN outbound rules)
3. **HOST environment variable**: Variable `HOST=0.0.0.0` di `.env` bisa menyebabkan confusion

## Solusi yang Sudah Diimplementasi

### 1. Fix Uvicorn Command Order
**File**: `start-scraper.ps1`, `dasti-scraper/start-dasti.bat`

**Sebelum:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 5002
```

**Sesudah:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 5002 --reload
```

**Alasan**: Beberapa versi uvicorn lebih strict dengan urutan parameter. `--host` dan `--port` harus sebelum `--reload`.

### 2. Hapus HOST dari .env
**File**: `dasti-scraper/.env`, `dasti-scraper/.env.example`

**Sebelum:**
```env
PORT=5002
HOST=0.0.0.0
```

**Sesudah:**
```env
PORT=5002
```

**Alasan**: Variable `HOST` tidak digunakan di code tapi bisa menyebabkan confusion. Binding ke 0.0.0.0 sudah dihandle di uvicorn command.

### 3. Enhanced Firewall Rules
**File**: `setup-network-access.ps1`, `fix-dasti-firewall.ps1`

**Perubahan**: Sekarang membuat **Inbound DAN Outbound** rules untuk setiap port:
- Inbound: Untuk menerima request dari laptop lain
- Outbound: Untuk mengirim response ke laptop lain

**Rules yang dibuat:**
```
Web Scraper - DASTI (In)  - Port 5002 TCP Inbound
Web Scraper - DASTI (Out) - Port 5002 TCP Outbound
```

### 4. Dedicated Fix Script
**File**: `Fix-DastiFirewall.bat`, `fix-dasti-firewall.ps1`

Script khusus untuk fix firewall DASTI jika masih ada masalah.

## Cara Menggunakan Fix

### Opsi 1: Restart dengan Start-WebScraper (Recommended)

1. **Stop semua services** (tekan Enter di window Start-WebScraper)

2. **Jalankan Fix-DastiFirewall.bat** (as Administrator):
   ```bash
   # Klik kanan → Run as Administrator
   Fix-DastiFirewall.bat
   ```

3. **Start ulang services**:
   ```bash
   Start-WebScraper.bat
   ```

4. **Test dari laptop lain**:
   ```bash
   curl http://[IP-SERVER]:5002/health
   ```

### Opsi 2: Setup Ulang Network Access

```bash
# Klik kanan → Run as Administrator
Setup-NetworkAccess.bat
```

Script ini sekarang membuat inbound + outbound rules untuk semua ports.

### Opsi 3: Manual Firewall Setup

Jika script tidak bekerja, buka firewall manual:

**PowerShell (as Administrator):**
```powershell
# Hapus rules lama
Remove-NetFirewallRule -DisplayName "*DASTI*"

# Buat rules baru
New-NetFirewallRule -DisplayName "Web Scraper - DASTI (In)" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any
New-NetFirewallRule -DisplayName "Web Scraper - DASTI (Out)" -Direction Outbound -LocalPort 5002 -Protocol TCP -Action Allow -Profile Any

# Verifikasi
Get-NetFirewallRule -DisplayName "*DASTI*"
```

## Verifikasi Fix

### 1. Cek Uvicorn Binding
Di window "DASTI Backend - Port 5002", pastikan terlihat:
```
Uvicorn running on http://0.0.0.0:5002
```

Bukan:
```
Uvicorn running on http://127.0.0.1:5002
```

### 2. Cek Port Listening
```powershell
netstat -ano | Select-String "5002"
```

Harus terlihat:
```
TCP    0.0.0.0:5002    0.0.0.0:0    LISTENING
```

Bukan:
```
TCP    127.0.0.1:5002    0.0.0.0:0    LISTENING
```

### 3. Test dari Laptop Server
```powershell
# Test localhost
curl http://localhost:5002/health

# Test IP
curl http://192.168.1.18:5002/health
```

Keduanya harus return:
```json
{"status":"ok","message":"DASTI Scraper API is running","version":"1.0.0"}
```

### 4. Test dari Laptop Lain
```bash
# Ganti dengan IP server
curl http://192.168.1.18:5002/health
```

Harus return response yang sama.

### 5. Cek Firewall Rules
```powershell
Get-NetFirewallRule -DisplayName "*DASTI*" | Select-Object DisplayName, Direction, Enabled
```

Harus terlihat:
```
DisplayName                          Direction Enabled
-----------                          --------- -------
Web Scraper - DASTI (In)            Inbound   True
Web Scraper - DASTI (Out)           Outbound  True
```

## Troubleshooting

### DASTI Masih Offline dari Laptop Lain

**1. Restart DASTI Backend:**
- Tutup window "DASTI Backend - Port 5002"
- Jalankan `Start-WebScraper.bat` lagi

**2. Cek Antivirus:**
Beberapa antivirus memblokir Python. Tambahkan exception untuk:
- `dasti-scraper\venv\Scripts\python.exe`
- Port 5002

**3. Cek Windows Defender:**
```powershell
# Lihat blocked connections
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*python*"}
```

**4. Test dengan Firewall Disabled (Temporary):**
```powershell
# HANYA UNTUK TESTING!
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Test akses dari laptop lain

# ENABLE KEMBALI!
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

Jika berhasil saat firewall disabled, berarti masalahnya di firewall rules.

**5. Cek Network Profile:**
```powershell
Get-NetConnectionProfile
```

Pastikan network profile adalah "Private", bukan "Public". Jika Public:
```powershell
Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
```

### Port 5002 Already in Use

```powershell
# Cari process yang menggunakan port 5002
netstat -ano | Select-String "5002"

# Kill process (ganti [PID] dengan PID dari output di atas)
taskkill /PID [PID] /F
```

### Uvicorn Tidak Start

Cek error di window CMD DASTI. Kemungkinan:
- Dependencies belum terinstall: `pip install -r requirements.txt`
- Python version issue: Perlu Python 3.8+
- Import error: Cek apakah semua files ada

## Summary

Masalah DASTI offline dari network disebabkan oleh:
1. ✅ **FIXED**: Urutan parameter uvicorn
2. ✅ **FIXED**: Hapus HOST dari .env
3. ✅ **FIXED**: Firewall rules (inbound + outbound)

Setelah fix ini, DASTI seharusnya bisa diakses dari laptop lain seperti SIPEDE dan SPP.

## Files Modified

1. `start-scraper.ps1` - Fixed uvicorn command order
2. `dasti-scraper/start-dasti.bat` - Fixed uvicorn command
3. `dasti-scraper/.env` - Removed HOST variable
4. `dasti-scraper/.env.example` - Removed HOST variable
5. `setup-network-access.ps1` - Added inbound + outbound rules
6. `Fix-DastiFirewall.bat` - New dedicated fix script
7. `fix-dasti-firewall.ps1` - New dedicated fix script
8. `DASTI_NETWORK_FIX.md` - This documentation
