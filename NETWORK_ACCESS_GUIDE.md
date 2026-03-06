# Panduan Akses dari Laptop Lain (Network Access)

## Masalah
Ketika menjalankan server di laptop A dan mengakses dari laptop B via IP, backend (SIPEDE, SPP, DASTI) menunjukkan status "offline" meskipun server berjalan dengan baik.

## Penyebab
Frontend menggunakan dynamic hostname yang menyebabkan laptop B mencoba connect ke backend di IP-nya sendiri, bukan ke IP laptop server.

## Solusi yang Sudah Diimplementasi

### 1. Environment Variables di Frontend
File `frontend/.env.local` sudah dibuat dengan konfigurasi default:

```env
NEXT_PUBLIC_SIPEDE_API_URL=http://localhost:5000
NEXT_PUBLIC_SPP_API_URL=http://localhost:5001
NEXT_PUBLIC_DASTI_API_URL=http://localhost:5002
```

### 2. Priority System di API Clients
Semua API client files (`sipede-api.ts`, `spp-api.ts`, `dasti-api.ts`) sekarang menggunakan priority system:
1. **Priority 1**: Environment variable (untuk network access)
2. **Priority 2**: Dynamic hostname (fallback untuk development)
3. **Priority 3**: Default localhost

### 3. Backend Configuration
Semua backend sudah dikonfigurasi untuk listen di `0.0.0.0`:
- **SIPEDE**: `HOST=0.0.0.0` di `.env`
- **SPP**: `uvicorn --host 0.0.0.0` di startup script
- **DASTI**: `uvicorn --host 0.0.0.0` di startup script

## Cara Setup untuk Network Access

### ⚡ Cara Otomatis (RECOMMENDED)

**Cukup jalankan Start-WebScraper.bat!**

Script `start-scraper.ps1` sekarang otomatis:
1. ✅ Detect IP laptop server setiap kali dijalankan
2. ✅ Update `frontend/.env.local` dengan IP terbaru
3. ✅ Cek firewall rules dan tampilkan warning jika belum dibuka
4. ✅ Tampilkan URL untuk akses dari laptop lain

**Tidak perlu setup manual lagi!**

### Jika Muncul Warning Firewall

Kalau muncul pesan:
```
⚠ FIREWALL WARNING:
  Akses dari laptop lain mungkin TIDAK BERFUNGSI
  Jalankan: Setup-NetworkAccess.bat (as Administrator)
```

Jalankan **sekali saja**:
```bash
# Klik kanan → Run as Administrator
Setup-NetworkAccess.bat
```

Setelah itu, firewall sudah terbuka dan tidak perlu dijalankan lagi.

---

### Langkah Manual (Opsional)

Jika ingin setup manual tanpa script otomatis:

### Langkah 1: Cari IP Laptop Server

**Windows:**
```bash
ipconfig
```
Cari "IPv4 Address" di adapter WiFi/Ethernet, contoh: `192.168.1.19`

**Mac/Linux:**
```bash
ifconfig
```

### Langkah 2: Update Frontend Environment Variables

Edit file `frontend/.env.local` dan ganti `localhost` dengan IP laptop server:

```env
NEXT_PUBLIC_SIPEDE_API_URL=http://192.168.1.19:5000
NEXT_PUBLIC_SPP_API_URL=http://192.168.1.19:5001
NEXT_PUBLIC_DASTI_API_URL=http://192.168.1.19:5002
```

### Langkah 3: Restart Frontend

**Development Mode:**
```bash
cd frontend
npm run dev
```

**Production Mode (Recommended untuk network access):**
```bash
cd frontend
npm run build
npm start
```

### Langkah 4: Konfigurasi Windows Firewall (PENTING!)

Backend ports harus diizinkan di Windows Firewall:

**Cara Manual:**
1. Buka "Windows Defender Firewall with Advanced Security"
2. Klik "Inbound Rules" → "New Rule"
3. Pilih "Port" → Next
4. Pilih "TCP" → Specific local ports: `3000,5000,5001,5002`
5. Pilih "Allow the connection"
6. Centang semua profiles (Domain, Private, Public)
7. Beri nama: "Web Scraper Ports"

**Cara Otomatis (Run as Administrator):**
```powershell
# Buka PowerShell as Administrator
New-NetFirewallRule -DisplayName "Web Scraper - Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Web Scraper - SIPEDE" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Web Scraper - SPP" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Web Scraper - DASTI" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow
```

### Langkah 5: Verifikasi Koneksi

**Dari Laptop Server:**
- Frontend: http://localhost:3000
- SIPEDE: http://localhost:5000/health
- SPP: http://localhost:5001/health
- DASTI: http://localhost:5002/health

**Dari Laptop Lain (ganti dengan IP server):**
- Frontend: http://192.168.1.19:3000
- SIPEDE: http://192.168.1.19:5000/health
- SPP: http://192.168.1.19:5001/health
- DASTI: http://192.168.1.19:5002/health

## Troubleshooting

### Backend Masih Offline dari Laptop Lain

**1. Cek Firewall:**
```powershell
# Cek apakah port sudah dibuka
Get-NetFirewallRule -DisplayName "*Web Scraper*" | Select-Object DisplayName, Enabled, Direction
```

**2. Test Koneksi dari Laptop Lain:**
```bash
# Test ping
ping 192.168.1.19

# Test port (PowerShell)
Test-NetConnection -ComputerName 192.168.1.19 -Port 5000
Test-NetConnection -ComputerName 192.168.1.19 -Port 5001
Test-NetConnection -ComputerName 192.168.1.19 -Port 5002
```

**3. Cek Backend Logs:**
Pastikan backend menunjukkan:
```
🚀 SIPEDE Scraper API running on 0.0.0.0:5000
```
Bukan:
```
🚀 SIPEDE Scraper API running on 127.0.0.1:5000
```

**4. Restart Semua Services:**
```bash
# Stop semua
# Tekan Enter di window Start-WebScraper.bat

# Start ulang
Start-WebScraper.bat
```

**5. Cek Antivirus:**
Beberapa antivirus memblokir incoming connections. Tambahkan exception untuk:
- `node.exe`
- `python.exe`
- Port 3000, 5000, 5001, 5002

### Frontend Tidak Bisa Diakses dari Laptop Lain

**1. Pastikan Frontend Running di Production Mode:**
```bash
cd frontend
npm run build
npm start -- -H 0.0.0.0
```

**2. Cek Next.js Configuration:**
File `next.config.ts` sudah dikonfigurasi untuk allow network access.

### IP Berubah Setelah Restart

Jika IP laptop server berubah setelah restart:
1. Cari IP baru dengan `ipconfig`
2. Update `frontend/.env.local`
3. Restart frontend

**Atau gunakan Static IP:**
1. Buka "Network Connections"
2. Properties → Internet Protocol Version 4 (TCP/IPv4)
3. Set static IP, contoh: `192.168.1.19`

## Catatan Penting

1. **Kedua laptop harus di WiFi/network yang sama**
2. **Firewall harus allow ports 3000, 5000, 5001, 5002**
3. **Frontend harus restart setelah update .env.local**
4. **Production mode lebih stabil untuk network access**
5. **IP address bisa berubah setelah restart (gunakan static IP jika perlu)**

## Quick Reference

| Service | Port | Health Check URL |
|---------|------|------------------|
| Frontend | 3000 | http://IP:3000 |
| SIPEDE | 5000 | http://IP:5000/health |
| SPP | 5001 | http://IP:5001/health |
| DASTI | 5002 | http://IP:5002/health |

Ganti `IP` dengan IP laptop server Anda.
