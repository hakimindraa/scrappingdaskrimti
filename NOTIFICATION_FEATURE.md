# 🔔 Browser Notification Feature

## Fitur yang Ditambahkan

Pop-up notifikasi browser yang muncul **otomatis saat scraping selesai**, bahkan ketika user membuka tab lain atau minimize browser.

---

## 📱 Cara Kerja

### 1. **Permission Request (Pertama Kali)**
Saat user pertama kali membuka tab Scraping (SIPEDE atau SPDP), browser akan meminta izin:

```
┌─────────────────────────────────────────┐
│ 🌐 localhost:3000 ingin mengirim        │
│    notifikasi                           │
│                                         │
│    [Blokir]  [Izinkan]                 │
└─────────────────────────────────────────┘
```

**User harus klik "Izinkan"** agar notifikasi bisa muncul.

---

### 2. **Saat Scraping Berjalan**
- User mulai scraping
- User bisa buka tab lain (YouTube, Email, dll)
- User bisa minimize browser
- User bisa buka aplikasi lain (Excel, Word, dll)
- **Scraping tetap jalan di background**

---

### 3. **Saat Scraping Selesai**
**POP-UP NOTIFIKASI** muncul di desktop Windows:

#### **SIPEDE:**
```
┌─────────────────────────────────────────┐
│ 🌐 Chrome - Dasta                       │
├─────────────────────────────────────────┤
│ ✅ Scraping SIPEDE Selesai!             │
│                                         │
│ 1,234 data berhasil di-scrape          │
│ (Tahun 2024)                            │
│ Waktu: 145 detik                        │
└─────────────────────────────────────────┘
```

#### **SPDP:**
```
┌─────────────────────────────────────────┐
│ 🌐 Chrome - Dasta                       │
├─────────────────────────────────────────┤
│ ✅ Scraping SPDP Selesai!               │
│                                         │
│ 567 data berhasil di-scrape             │
│ (Tahun 2024)                            │
│ Waktu: 89 detik                         │
└─────────────────────────────────────────┘
```

---

### 4. **Interaksi dengan Notifikasi**

**Klik Notifikasi:**
- Browser langsung focus ke tab Dasta
- Notifikasi otomatis hilang
- User langsung lihat hasil scraping

**Tidak Diklik:**
- Notifikasi otomatis hilang setelah 10 detik
- User tetap bisa lihat hasil di tab Dasta kapan saja

---

## 🎯 Kapan Notifikasi Muncul?

### ✅ **MUNCUL:**
1. User di tab lain (YouTube, Gmail, dll)
2. Browser di-minimize
3. User buka aplikasi lain (Excel, Word, File Explorer)
4. Komputer dalam keadaan lock screen (tergantung setting Windows)

### ❌ **TIDAK MUNCUL:**
1. User masih di tab Dasta (tidak perlu, sudah lihat langsung)
2. User belum izinkan notifikasi
3. Browser ditutup (scraping juga berhenti)

---

## 🔧 Implementasi Teknis

### **File yang Dimodifikasi:**

1. **`frontend/src/components/SipedeScraperTab.tsx`**
   - Tambah state tracking scraping
   - Request notification permission
   - Deteksi scraping selesai
   - Kirim notifikasi

2. **`frontend/src/components/SppScraperTab.tsx`**
   - Sama seperti SIPEDE

### **Kode yang Ditambahkan:**

```typescript
// 1. Request permission saat component mount
useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}, []);

// 2. Function untuk show notification
const showScrapingCompleteNotification = useCallback((dataCount: number, elapsedTime: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('✅ Scraping SIPEDE Selesai!', {
            body: `${dataCount.toLocaleString()} data berhasil di-scrape\nWaktu: ${elapsedTime} detik`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'sipede-scraping-complete',
            requireInteraction: false,
            silent: false
        });

        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000);

        // Focus window when clicked
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}, [selectedYear]);

// 3. Deteksi scraping selesai di pollStatus
if (prevStatus?.isRunning && !result.data.isRunning && result.data.dataCount > 0) {
    showScrapingCompleteNotification(result.data.dataCount, result.data.elapsedTime || 0);
}
```

---

## 🧪 Cara Testing

### **Test 1: Tab Lain**
1. Buka Dasta → Tab SIPEDE
2. Klik "Mulai Scraping"
3. Buka tab baru (YouTube)
4. Tunggu scraping selesai
5. ✅ **Notifikasi harus muncul**

### **Test 2: Minimize Browser**
1. Buka Dasta → Tab SPDP
2. Klik "Mulai Scraping"
3. Minimize Chrome
4. Buka File Explorer
5. Tunggu scraping selesai
6. ✅ **Notifikasi harus muncul di desktop**

### **Test 3: Aplikasi Lain**
1. Buka Dasta → Tab SIPEDE
2. Klik "Mulai Scraping"
3. Buka Excel atau Word
4. Tunggu scraping selesai
5. ✅ **Notifikasi harus muncul**

### **Test 4: Klik Notifikasi**
1. Saat notifikasi muncul
2. Klik notifikasi
3. ✅ **Browser harus focus ke tab Dasta**
4. ✅ **Notifikasi harus hilang**

---

## ⚙️ Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Yes  | Full support |
| Edge    | ✅ Yes  | Full support |
| Firefox | ✅ Yes  | Full support |
| Safari  | ⚠️ Limited | Perlu setting khusus |
| Opera   | ✅ Yes  | Full support |

---

## 🐛 Troubleshooting

### **Notifikasi Tidak Muncul?**

**1. Cek Permission:**
- Klik icon 🔒 di address bar
- Pastikan "Notifications" = "Allow"

**2. Cek Windows Notification Settings:**
- Windows Settings → System → Notifications
- Pastikan "Get notifications from apps and other senders" = ON
- Pastikan Chrome ada di list dan ON

**3. Cek Focus Assist (Windows):**
- Windows Settings → System → Focus assist
- Pastikan tidak dalam mode "Priority only" atau "Alarms only"

**4. Cek Browser Settings:**
- Chrome Settings → Privacy and security → Site settings → Notifications
- Pastikan localhost:3000 ada di "Allowed to send notifications"

---

## 📝 Notes

- Notifikasi hanya muncul **1 kali** per scraping session
- Notifikasi otomatis hilang setelah **10 detik**
- Tidak ada sound (silent notification)
- Tidak mengganggu jika user sedang di tab Dasta (sudah lihat langsung)
- Bekerja di background tanpa mengganggu performa

---

## 🎉 Keuntungan

✅ **Multitasking**: User bisa kerja lain sambil scraping  
✅ **No Distraction**: Hanya notif saat selesai, bukan setiap progress  
✅ **Instant Feedback**: Tahu langsung saat selesai  
✅ **User Friendly**: Klik notifikasi → langsung ke hasil  
✅ **Non-Intrusive**: Auto-close, tidak mengganggu  

---

## 🚀 Future Enhancements (Opsional)

Jika nanti mau ditambahkan:

1. **Sound Notification**: Play sound saat notifikasi muncul
2. **Progress Notification**: Notif setiap 25%, 50%, 75%
3. **Error Notification**: Notif jika scraping gagal
4. **Settings Panel**: User bisa on/off notifikasi
5. **Notification History**: Log semua notifikasi yang pernah muncul

---

**Status: ✅ IMPLEMENTED**  
**Date: 2024-01-20**  
**Version: 1.0**
