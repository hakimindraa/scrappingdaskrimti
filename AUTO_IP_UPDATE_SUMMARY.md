# Auto IP Update - Implementation Summary

## Update yang Dilakukan

`start-scraper.ps1` sekarang **otomatis detect dan update IP** setiap kali dijalankan!

## Perubahan di start-scraper.ps1

### Step Baru: [0/5] Auto-detect IP Address

Script sekarang menambahkan step baru sebelum check dependencies:

```powershell
# Auto-detect IP Address
$localIP = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -like "*Wi-Fi*" -and $_.PrefixOrigin -eq "Dhcp" 
}

# Update frontend/.env.local dengan IP terbaru
$envContent = @"
NEXT_PUBLIC_SIPEDE_API_URL=http://${localIP}:5000
NEXT_PUBLIC_SPP_API_URL=http://${localIP}:5001
NEXT_PUBLIC_DASTI_API_URL=http://${localIP}:5002
"@

$envContent | Out-File -FilePath "frontend\.env.local" -Encoding UTF8 -Force
```

### Fitur Baru:

1. **Auto-detect IP** dari WiFi/Ethernet adapter
2. **Auto-update** `frontend/.env.local` dengan IP terbaru
3. **Firewall check** - warning jika firewall belum dibuka
4. **Fallback to localhost** jika tidak ada network connection
5. **Tampilkan URL** untuk akses dari laptop lain

## Workflow Baru

### Penggunaan Sehari-hari:

```bash
# Cukup jalankan ini
Start-WebScraper.bat
```

Output akan menampilkan:
```
[0/5] Auto-detect IP Address...
  OK IP Address detected: 192.168.1.19
  OK Frontend .env.local updated
  OK Firewall rules exist

[1/5] Mengecek dependencies...
...

============================================
  SEMUA SERVICES BERJALAN!
============================================

  Akses Lokal (laptop ini):
    Frontend:       http://localhost:3000
    SIPEDE Backend: http://localhost:5000
    SPP Backend:    http://localhost:5001
    DASTI Backend:  http://localhost:5002

  Akses dari Laptop Lain (WiFi sama):
    Frontend:       http://192.168.1.19:3000
    SIPEDE Backend: http://192.168.1.19:5000
    SPP Backend:    http://192.168.1.19:5001
    DASTI Backend:  http://192.168.1.19:5002
```

### Setup Firewall (Sekali Saja):

Jika muncul warning:
```
⚠ FIREWALL WARNING:
  Akses dari laptop lain mungkin TIDAK BERFUNGSI
  Jalankan: Setup-NetworkAccess.bat (as Administrator)
```

Jalankan sekali saja:
```bash
Setup-NetworkAccess.bat
```

Setelah itu tidak perlu lagi!

## Keuntungan

### Sebelum Update:
1. Jalankan `Setup-NetworkAccess.bat` (detect IP)
2. Jalankan `Start-WebScraper.bat`
3. Kalau IP berubah, ulangi step 1

### Setelah Update:
1. Jalankan `Start-WebScraper.bat` ✅ SELESAI!
   - IP otomatis diupdate
   - Configuration otomatis diupdate
   - Tidak perlu manual setup lagi

## Skenario Penggunaan

### Skenario 1: Pertama Kali Setup
```bash
# 1. Jalankan Start-WebScraper.bat
Start-WebScraper.bat

# 2. Jika muncul warning firewall, jalankan sekali:
Setup-NetworkAccess.bat

# 3. Restart Start-WebScraper.bat
Start-WebScraper.bat

# SELESAI! Akses dari laptop lain: http://[IP]:3000
```

### Skenario 2: Penggunaan Sehari-hari
```bash
# Cukup jalankan ini setiap hari
Start-WebScraper.bat

# IP otomatis diupdate jika berubah
# Tidak perlu setup manual lagi
```

### Skenario 3: IP Berubah (Pindah WiFi, Restart Router)
```bash
# Cukup jalankan seperti biasa
Start-WebScraper.bat

# Script otomatis detect IP baru dan update configuration
# Tidak perlu jalankan Setup-NetworkAccess.bat lagi
```

### Skenario 4: Tidak Ada Network (Offline)
```bash
Start-WebScraper.bat

# Output:
# [0/5] Auto-detect IP Address...
#   WARNING: Tidak dapat detect IP Address
#   Menggunakan localhost (hanya akses lokal)

# Configuration fallback ke localhost
# Tetap bisa digunakan untuk akses lokal
```

## Technical Details

### IP Detection Priority:
1. WiFi adapter dengan DHCP
2. Ethernet adapter dengan DHCP
3. Any adapter dengan DHCP
4. Fallback to localhost

### File yang Diupdate Otomatis:
- `frontend/.env.local` - Updated setiap kali script dijalankan

### Firewall Check:
- Cek apakah firewall rules "Web Scraper*" exist
- Tampilkan warning jika tidak ada
- User hanya perlu jalankan Setup-NetworkAccess.bat sekali

## Backward Compatibility

✅ **Fully backward compatible**
- Setup-NetworkAccess.bat masih bisa digunakan
- Manual setup masih berfungsi
- Tidak ada breaking changes

## Files Modified

1. `start-scraper.ps1` - Added auto IP detection and update
2. `README.md` - Updated documentation
3. `NETWORK_ACCESS_GUIDE.md` - Updated workflow
4. `NETWORK_ACCESS_QUICK_START.md` - Updated quick start
5. `AUTO_IP_UPDATE_SUMMARY.md` - This file (new)

## Kesimpulan

User sekarang **tidak perlu** jalankan `Setup-NetworkAccess.bat` setiap kali IP berubah. Cukup gunakan `Start-WebScraper.bat` seperti biasa, dan IP akan otomatis diupdate!

**Setup-NetworkAccess.bat** hanya perlu dijalankan **sekali** untuk membuka firewall, setelah itu tidak perlu lagi.
