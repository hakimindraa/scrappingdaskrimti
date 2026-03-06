# Network Access Implementation Summary

## Masalah yang Diselesaikan

Ketika menjalankan server di laptop A dan mengakses dari laptop B via IP (contoh: `http://192.168.1.19:3000`), backend (SIPEDE, SPP, DASTI) menunjukkan status "offline" meskipun server berjalan dengan baik di laptop A.

## Root Cause

Frontend menggunakan dynamic hostname (`window.location.hostname`) untuk membuat URL backend. Ketika diakses dari laptop B, frontend mencoba connect ke backend di IP laptop B (bukan laptop A/server).

**Contoh:**
- Laptop A (server): `192.168.1.19`
- Laptop B (client): `192.168.1.20`
- User akses: `http://192.168.1.19:3000` (frontend di laptop A)
- Frontend mencoba connect: `http://192.168.1.19:5000` ✅ (seharusnya works)
- Tapi karena firewall/binding issue: ❌ FAILS

## Solusi yang Diimplementasi

### 1. Environment Variables System

**Files Created:**
- `frontend/.env.local` - Configuration file dengan IP server
- `frontend/.env.example` - Template untuk user

**Content:**
```env
NEXT_PUBLIC_SIPEDE_API_URL=http://localhost:5000
NEXT_PUBLIC_SPP_API_URL=http://localhost:5001
NEXT_PUBLIC_DASTI_API_URL=http://localhost:5002
```

User tinggal ganti `localhost` dengan IP laptop server untuk network access.

### 2. Priority System di API Clients

**Files Modified:**
- `frontend/src/lib/sipede-api.ts`
- `frontend/src/lib/spp-api.ts`
- `frontend/src/lib/dasti-api.ts`

**New Logic:**
```typescript
function getApiBaseUrl(): string {
    // Priority 1: Environment variable (untuk network access)
    if (process.env.NEXT_PUBLIC_SIPEDE_API_URL) {
        return process.env.NEXT_PUBLIC_SIPEDE_API_URL;
    }
    
    // Priority 2: Dynamic hostname (fallback)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:5000`;
    }
    
    // Priority 3: Default localhost
    return 'http://localhost:5000';
}
```

### 3. HomeTab Server Status Check

**File Modified:**
- `frontend/src/components/HomeTab.tsx`

**Changes:**
- Menggunakan environment variable untuk server URL
- Fallback ke localhost jika env tidak ada

### 4. Automated Setup Script

**Files Created:**
- `Setup-NetworkAccess.bat` - Launcher script
- `setup-network-access.ps1` - PowerShell script untuk:
  - Auto-detect IP laptop server
  - Update `frontend/.env.local` dengan IP yang benar
  - Buka Windows Firewall untuk port 3000, 5000, 5001, 5002
  - Tampilkan summary dan instructions

### 5. Documentation

**Files Created:**
- `NETWORK_ACCESS_GUIDE.md` - Dokumentasi lengkap dengan troubleshooting
- `NETWORK_ACCESS_QUICK_START.md` - Quick start guide
- `NETWORK_ACCESS_IMPLEMENTATION.md` - Technical implementation summary (this file)

**File Updated:**
- `README.md` - Added network access section

## Backend Configuration (Already Correct)

Semua backend sudah dikonfigurasi dengan benar untuk network access:

### SIPEDE (Node.js)
```javascript
// sipede-scraper/backend/src/server.js
const HOST = process.env.HOST || '0.0.0.0'; // ✅ Binds to all interfaces
app.listen(PORT, HOST, ...);
```

### SPP & DASTI (Python/FastAPI)
```bash
# start-scraper.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 5001  # ✅ Binds to all interfaces
```

### CORS Configuration
Semua backend sudah allow all origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ✅ Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## How to Use

### Cara Otomatis (Recommended)

1. **Jalankan Setup Script (as Administrator):**
   ```bash
   Setup-NetworkAccess.bat
   ```

2. **Restart Services:**
   ```bash
   Start-WebScraper.bat
   ```

3. **Akses dari Laptop Lain:**
   ```
   http://[IP-LAPTOP-SERVER]:3000
   ```

### Cara Manual

1. **Cari IP Laptop Server:**
   ```bash
   ipconfig
   ```

2. **Edit `frontend/.env.local`:**
   ```env
   NEXT_PUBLIC_SIPEDE_API_URL=http://192.168.1.19:5000
   NEXT_PUBLIC_SPP_API_URL=http://192.168.1.19:5001
   NEXT_PUBLIC_DASTI_API_URL=http://192.168.1.19:5002
   ```

3. **Buka Firewall (PowerShell as Admin):**
   ```powershell
   New-NetFirewallRule -DisplayName "Web Scraper - Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Web Scraper - SIPEDE" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Web Scraper - SPP" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Web Scraper - DASTI" -Direction Inbound -LocalPort 5002 -Protocol TCP -Action Allow
   ```

4. **Restart Services**

## Testing

### From Server Laptop
```bash
# Test localhost
curl http://localhost:5000/health
curl http://localhost:5001/health
curl http://localhost:5002/health

# Test IP
curl http://192.168.1.19:5000/health
curl http://192.168.1.19:5001/health
curl http://192.168.1.19:5002/health
```

### From Client Laptop
```bash
# Test ping
ping 192.168.1.19

# Test ports (PowerShell)
Test-NetConnection -ComputerName 192.168.1.19 -Port 5000
Test-NetConnection -ComputerName 192.168.1.19 -Port 5001
Test-NetConnection -ComputerName 192.168.1.19 -Port 5002
Test-NetConnection -ComputerName 192.168.1.19 -Port 3000
```

## Troubleshooting

### Issue: Backend Still Offline from Client Laptop

**Possible Causes:**
1. Windows Firewall blocking ports
2. Antivirus blocking connections
3. Different WiFi networks
4. IP address changed

**Solutions:**
1. Run `Setup-NetworkAccess.bat` as Administrator
2. Check firewall rules: `Get-NetFirewallRule -DisplayName "*Web Scraper*"`
3. Verify both laptops on same WiFi
4. Check IP hasn't changed: `ipconfig`

### Issue: Frontend Can't Be Accessed from Client Laptop

**Solution:**
Frontend must run in production mode for network access:
```bash
cd frontend
npm run build
npm start -- -H 0.0.0.0
```

Or use `Start-WebScraper.bat` which already uses production mode.

## Files Changed Summary

### Created Files (9)
1. `frontend/.env.local` - Environment configuration
2. `frontend/.env.example` - Template
3. `Setup-NetworkAccess.bat` - Launcher
4. `setup-network-access.ps1` - Setup script
5. `NETWORK_ACCESS_GUIDE.md` - Full documentation
6. `NETWORK_ACCESS_QUICK_START.md` - Quick guide
7. `NETWORK_ACCESS_IMPLEMENTATION.md` - This file

### Modified Files (5)
1. `frontend/src/lib/sipede-api.ts` - Priority system
2. `frontend/src/lib/spp-api.ts` - Priority system
3. `frontend/src/lib/dasti-api.ts` - Priority system
4. `frontend/src/components/HomeTab.tsx` - Use env variables
5. `README.md` - Added network access section

### Backend Files (No Changes Needed)
- `sipede-scraper/backend/src/server.js` - Already binds to 0.0.0.0 ✅
- `spp-scraper/app/main.py` - Already has CORS * ✅
- `dasti-scraper/app/main.py` - Already has CORS * ✅
- `start-scraper.ps1` - Already uses --host 0.0.0.0 ✅

## Security Considerations

1. **CORS Allow All**: Currently allows all origins for development. For production, specify allowed origins.
2. **Firewall**: Only open ports on trusted networks (home/office WiFi).
3. **No Authentication**: Backend APIs have no authentication. Add auth for production use.
4. **Local Network Only**: This setup is for local network access only, not internet-facing.

## Future Improvements

1. **Dynamic IP Detection**: Auto-update .env.local when IP changes
2. **HTTPS Support**: Add SSL certificates for secure connections
3. **Authentication**: Add API key or JWT authentication
4. **Docker**: Containerize for easier deployment
5. **Static IP Helper**: Script to set static IP on Windows

## Conclusion

Implementasi ini menyelesaikan masalah network access dengan:
- ✅ Environment-based configuration
- ✅ Automated setup script
- ✅ Firewall configuration
- ✅ Comprehensive documentation
- ✅ Backward compatible (localhost still works)

User sekarang bisa dengan mudah mengakses aplikasi dari laptop lain di network yang sama dengan menjalankan `Setup-NetworkAccess.bat` dan restart services.
