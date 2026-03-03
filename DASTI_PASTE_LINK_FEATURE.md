# DASTI Scraper - Fitur Paste Link Langsung

## ✨ Fitur Baru: Paste Link Halaman Data

Sekarang Anda bisa langsung paste link halaman data tabel setelah login, tanpa perlu navigasi manual!

## Cara Menggunakan

### Step-by-Step

1. **Buka Browser & Login**
   - Klik "Buka Browser DASTI"
   - Login manual di browser Chromium yang terbuka
   - Selesaikan captcha jika ada

2. **Copy URL Halaman Data**
   - Di browser Chromium, navigasi ke halaman data tabel
   - Copy URL dari address bar
   - Contoh: `https://dasti.example.com/data/table?page=1`

3. **Paste Link di Aplikasi**
   - Kembali ke aplikasi web
   - Klik "Saya Sudah Login"
   - Pilih **Opsi 1: Paste Link Langsung**
   - Paste URL yang sudah di-copy
   - Klik "🔗 Navigasi ke URL"

4. **Auto Detect & Scraping**
   - Sistem akan otomatis navigasi ke URL tersebut
   - Tabel akan terdeteksi otomatis
   - Langsung bisa mulai scraping!

## Keuntungan

### ✅ Lebih Cepat
- Tidak perlu navigasi manual step-by-step
- Langsung ke halaman target

### ✅ Lebih Akurat
- Tidak ada kesalahan navigasi
- Langsung ke URL yang tepat

### ✅ Lebih Mudah
- Cukup copy-paste
- Tidak perlu klik-klik di browser

### ✅ Reusable
- URL bisa disimpan untuk next time
- Bisa share URL dengan tim

## Perbandingan

### Cara Lama (Manual Navigation)
```
1. Login ✓
2. Klik menu A
3. Klik submenu B
4. Klik link C
5. Tunggu load
6. Deteksi tabel
Total: ~5-10 klik, 30-60 detik
```

### Cara Baru (Paste Link)
```
1. Login ✓
2. Copy URL dari browser
3. Paste di aplikasi
4. Klik "Navigasi ke URL"
Total: 2 klik, 5-10 detik
```

## Screenshot Workflow

### 1. Login Berhasil
```
┌─────────────────────────────────────┐
│  ✓ Login Berhasil!                  │
│                                     │
│  Pilih cara menuju halaman data:   │
│                                     │
│  📋 Opsi 1: Paste Link Langsung    │
│  ┌─────────────────────────────┐   │
│  │ URL: [paste here]           │   │
│  └─────────────────────────────┘   │
│  [🔗 Navigasi ke URL]              │
│                                     │
│         ATAU                        │
│                                     │
│  🖱️ Opsi 2: Navigasi Manual        │
│  [🔍 Deteksi Tabel]                │
└─────────────────────────────────────┘
```

### 2. Paste URL
```
┌─────────────────────────────────────┐
│  📋 Opsi 1: Paste Link Langsung    │
│                                     │
│  URL Halaman Data Tabel:           │
│  ┌─────────────────────────────┐   │
│  │ https://dasti.example.com/  │   │
│  │ data/table?page=1           │   │
│  └─────────────────────────────┘   │
│                                     │
│  [🔗 Navigasi ke URL]              │
└─────────────────────────────────────┘
```

### 3. Auto Detect
```
┌─────────────────────────────────────┐
│  ⏳ Navigasi...                     │
│  ⏳ Mendeteksi tabel...             │
│  ✓ Tabel terdeteksi!                │
│                                     │
│  Total Data: 500                    │
│  Total Halaman: 50                  │
│  Kolom: 8                           │
│                                     │
│  [▶ Mulai Scraping]                │
└─────────────────────────────────────┘
```

## Tips & Tricks

### 💡 Tip 1: Bookmark URL
Simpan URL halaman data di notepad untuk digunakan lagi nanti.

### 💡 Tip 2: URL dengan Filter
Bisa paste URL yang sudah ada filter/parameter:
- `https://dasti.example.com/data?year=2024`
- `https://dasti.example.com/data?status=active`

### 💡 Tip 3: Session Management
Setelah paste URL pertama kali:
1. Klik "Simpan Session"
2. Next time: Load Session → Paste URL → Scrape
3. Tidak perlu login lagi!

### 💡 Tip 4: Multiple Pages
URL bisa mengarah ke halaman mana saja:
- Page 1: `...?page=1`
- Page 10: `...?page=10`
- Scraper akan mulai dari halaman tersebut

## Troubleshooting

### ❌ "Gagal navigasi ke URL"
**Penyebab:**
- URL salah atau tidak valid
- Session expired
- Network error

**Solusi:**
- Check URL di browser dulu
- Load session lagi
- Refresh browser

### ❌ "Tidak dapat mendeteksi tabel"
**Penyebab:**
- URL bukan halaman tabel
- Tabel belum load
- Struktur tabel berbeda

**Solusi:**
- Pastikan URL mengarah ke halaman tabel
- Tunggu beberapa detik, coba lagi
- Gunakan Opsi 2 (Manual) sebagai fallback

### ❌ "URL tidak bisa di-paste"
**Penyebab:**
- Copy tidak lengkap
- Ada karakter special

**Solusi:**
- Copy ulang dari address bar
- Pastikan copy full URL (https://...)
- Hapus spasi di awal/akhir

## API Endpoint yang Digunakan

### 1. Set Data URL
```
POST /api/scraper/set-data-url
Body: { "url": "https://..." }
```

### 2. Navigate to Data
```
POST /api/scraper/navigate-to-data
```

### 3. Detect Table
```
GET /api/scraper/detect-table
```

## Code Implementation

### Frontend (DastiScraperTab.tsx)
```typescript
const handleNavigateToDataUrl = async () => {
    // 1. Set URL
    await api.setDataUrl(dataPageUrl);
    
    // 2. Navigate
    await api.navigateToData();
    
    // 3. Wait for page load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Auto detect table
    const result = await api.detectTable();
    if (result.success) {
        setStep('ready');
    }
};
```

### Backend (scraper_service.py)
```python
def set_data_url(self, url: str):
    self.navigation_state["dataPageUrl"] = url
    self.navigation_state["currentLevel"] = 4
    
def navigate_to_data(self):
    data_url = self.navigation_state.get("dataPageUrl")
    self.driver.get(data_url)
    time.sleep(2)
```

## Best Practices

### ✅ DO
- Copy URL dari address bar browser
- Paste full URL (dengan https://)
- Test URL di browser dulu
- Simpan session setelah berhasil

### ❌ DON'T
- Paste URL yang salah
- Paste URL login page
- Paste URL tanpa protocol
- Lupa save session

## FAQ

**Q: Apakah URL harus exact sama dengan yang di browser?**
A: Ya, sebaiknya copy exact URL dari address bar.

**Q: Bisa paste URL dengan query parameters?**
A: Ya, bisa. Contoh: `?page=1&filter=active`

**Q: Apakah URL disimpan?**
A: Ya, URL disimpan di navigation state dan database.

**Q: Bisa ganti URL setelah scraping?**
A: Ya, bisa paste URL baru untuk scraping data lain.

**Q: Apakah harus login ulang setiap kali?**
A: Tidak, gunakan "Load Session" untuk skip login.

## Update Log

**Version 1.1.0** (2 Maret 2026)
- ✅ Added paste link feature
- ✅ Added two navigation options
- ✅ Auto detect after navigation
- ✅ Improved UX with visual options

**Version 1.0.0** (2 Maret 2026)
- Initial release
- Manual navigation only

## Support

Jika ada masalah dengan fitur paste link:
1. Check console browser untuk error
2. Check backend logs
3. Try manual navigation sebagai fallback
4. Report issue dengan screenshot

---

**Fitur ini membuat scraping DASTI 5x lebih cepat!** 🚀
