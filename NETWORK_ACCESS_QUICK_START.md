# Quick Start: Akses dari Laptop Lain

## ⚡ Cara Tercepat (Otomatis) - RECOMMENDED

### Cukup Jalankan Start-WebScraper.bat!

```bash
Start-WebScraper.bat
```

Script ini sekarang **otomatis**:
- ✅ Detect IP laptop server
- ✅ Update `frontend/.env.local` dengan IP yang benar
- ✅ Cek firewall rules
- ✅ Tampilkan URL untuk akses dari laptop lain

**Tidak perlu jalankan Setup-NetworkAccess.bat lagi!**

### Jika Firewall Belum Dibuka

Kalau muncul warning firewall, jalankan sekali saja:
```bash
# Klik kanan → Run as Administrator
Setup-NetworkAccess.bat
```

Setelah itu, cukup gunakan `Start-WebScraper.bat` seperti biasa.

---

## 🔧 Cara Manual (Opsional)

### 1. Cari IP Laptop Server
```bash
ipconfig
```
Cari "IPv4 Address", contoh: `192.168.1.19`

### 2. Edit `frontend/.env.local`
```env
NEXT_PUBLIC_SIPEDE_API_URL=http://192.168.1.19:5000
NEXT_PUBLIC_SPP_API_URL=http://192.168.1.19:5001
NEXT_PUBLIC_DASTI_API_URL=http://192.168.1.19:5002
```

### 3. Buka Firewall (PowerShell as Administrator)
```powershell
New-NetFirewallRule -DisplayName "Web Scraper - Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Web Scraper - SIPEDE" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Web Scraper - SPP" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Web Scraper - DASTI" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow
```

### 4. Restart Services
```bash
Start-WebScraper.bat
```

---

## Troubleshooting Cepat

### Backend Masih Offline?

**1. Test koneksi dari laptop lain:**
```bash
ping 192.168.1.19
```

**2. Test port (PowerShell):**
```powershell
Test-NetConnection -ComputerName 192.168.1.19 -Port 5000
```

**3. Cek firewall:**
```powershell
Get-NetFirewallRule -DisplayName "*Web Scraper*"
```

**4. Restart semua:**
- Stop: Tekan Enter di window Start-WebScraper
- Start: Jalankan `Start-WebScraper.bat` lagi

### Masih Gagal?

Baca dokumentasi lengkap: `NETWORK_ACCESS_GUIDE.md`

---

## Checklist

- [ ] Jalankan `Start-WebScraper.bat` (otomatis detect IP)
- [ ] Jika ada warning firewall, jalankan `Setup-NetworkAccess.bat` as Administrator (sekali saja)
- [ ] Kedua laptop di WiFi yang sama
- [ ] Test akses dari laptop lain: `http://[IP]:3000`

**Catatan:** IP otomatis diupdate setiap kali `Start-WebScraper.bat` dijalankan!

---

## URLs Reference

| Dari | Frontend | SIPEDE | SPP | DASTI |
|------|----------|--------|-----|-------|
| Laptop Server | localhost:3000 | localhost:5000 | localhost:5001 | localhost:5002 |
| Laptop Lain | [IP]:3000 | [IP]:5000 | [IP]:5001 | [IP]:5002 |

Ganti `[IP]` dengan IP laptop server Anda.
