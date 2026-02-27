# PLAN: Tren Frekuensi Surat Masuk dari Excel (Kolom Tanggal) — Grafik Dinamis

## Tujuan

Membuat garis **Surat Masuk** pada grafik **TREN FREKUENSI SURAT PER BULAN** menjadi reaktif — dihitung dari kolom **"Tanggal"** di file Excel yang diupload. **Grafik sepenuhnya dinamis**: jumlah bulan yang tampil mengikuti data di Excel (misal Excel cuma Jan–Sep → grafik hanya Jan–Sep). Garis **Surat Keluar tetap hardcoded** apa adanya, tidak diubah.

---

## Kondisi Saat Ini

```typescript
const trendMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const trendMasuk  = [607, 807, 665, 608, 675, 458, 878, 701, 621];  // HARDCODED
const trendKeluar = [1104, 956, 1071, 1067, 1199, 955, 882, 691, 807]; // HARDCODED
```

Kedua array ini statis 9 bulan, tidak berubah meskipun Excel diupload.

---

## Format Kolom Tanggal di Excel

Dari screenshot, kolom **D** bernama **"Tanggal"** berisi:

```
31-12-2025
31-12-2025
19-12-2025
23-12-2025
18-12-2025
...
```

Format: **DD-MM-YYYY** (atau bisa jadi Excel serial number yang di-render sebagai tanggal).

> **Penting**: XLSX/SheetJS bisa mengembalikan tanggal sebagai:
> 1. String `"31-12-2025"` — jika kolom di Excel berformat teks
> 2. JavaScript Date object — jika `cellDates: true` diset saat parsing
> 3. Excel serial number (angka) — default SheetJS behavior
>
> Implementasi harus handle ketiga kemungkinan ini.

---

## Konsep Kunci: Grafik Dinamis

Grafik **tidak fixed 12 bulan** dan **tidak fixed 9 bulan**. Jumlah bulan yang tampil ditentukan oleh **range bulan yang ada di data Excel**:

1. Scan semua tanggal → cari `minMonth` dan `maxMonth`
2. Tampilkan bulan dari `minMonth` sampai `maxMonth` (contiguous/berurutan)
3. Bulan yang ada di range tapi tidak ada data → tampilkan sebagai 0

**Contoh:**
- Excel berisi data Jan–Sep → grafik tampil Jan–Sep (9 titik)
- Excel berisi data Mar–Dec → grafik tampil Mar–Dec (10 titik)
- Excel berisi data Jan–Dec → grafik tampil Jan–Dec (12 titik)
- Excel berisi data hanya Jun, Aug, Oct → grafik tampil Jun–Oct (5 titik, Jul & Sep = 0)

---

## Alur Kerja

### 1. Parsing Kolom "Tanggal" di `handleExcelUpload`

Saat Excel diupload (handler sudah ada, sudah parse "Jenis Surat" dan "Asal"):

```
rows.forEach(row => {
    const rawTanggal = row['Tanggal'];
    // Parse ke bulan (1-12)
    // Increment counter untuk bulan tersebut
});
```

### 2. Logika Parsing Tanggal

```typescript
function parseMonth(raw: unknown): number | null {
    if (!raw) return null;

    // Case 1: Date object (jika cellDates: true atau auto-parsed)
    if (raw instanceof Date) {
        return raw.getMonth() + 1; // 0-indexed → 1-indexed
    }

    const str = String(raw).trim();

    // Case 2: Excel serial number (angka seperti 45657)
    if (/^\d{5}$/.test(str)) {
        const date = new Date((Number(str) - 25569) * 86400000);
        return date.getMonth() + 1;
    }

    // Case 3: String format DD-MM-YYYY atau DD/MM/YYYY
    const match = str.match(/^\d{1,2}[-\/](\d{1,2})[-\/]\d{2,4}$/);
    if (match) return parseInt(match[1], 10);

    // Case 4: String format YYYY-MM-DD (ISO)
    const iso = str.match(/^\d{4}[-\/](\d{1,2})[-\/]\d{1,2}$/);
    if (iso) return parseInt(iso[1], 10);

    return null;
}
```

### 3. Hitung Per Bulan + Deteksi Range

```typescript
const monthCounts: Record<number, number> = {};
let minMonth = 13, maxMonth = 0;

rows.forEach(row => {
    const month = parseMonth(row['Tanggal']);
    if (month && month >= 1 && month <= 12) {
        monthCounts[month] = (monthCounts[month] || 0) + 1;
        if (month < minMonth) minMonth = month;
        if (month > maxMonth) maxMonth = month;
    }
});

// Hasil: range bulan + data per bulan dalam range tersebut
// Contoh: minMonth=1, maxMonth=9 → array 9 elemen [Jan..Sep]
const trendArray: number[] = [];
for (let m = minMonth; m <= maxMonth; m++) {
    trendArray.push(monthCounts[m] || 0);
}
```

### 4. State Baru

```typescript
// Data tren dari Excel: { months: ['Jan','Feb',...], masuk: [607, 807,...] }
const [trendMasukData, setTrendMasukData] = useState<{
    months: string[];
    masuk: number[];
} | null>(null);
```

`null` = belum upload → pakai hardcoded default.

State menyimpan **sudah di-slice** ke bulan yang relevan, jadi JSX tinggal render langsung.

### 5. Update `handleExcelUpload`

Di dalam handler, **setelah** parse Jenis Surat dan Asal:

```typescript
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// --- Tren Surat Masuk: hitung per bulan dari kolom "Tanggal" ---
const monthCounts: Record<number, number> = {};
let minMonth = 13, maxMonth = 0;

rows.forEach(row => {
    const month = parseMonth(row['Tanggal']);
    if (month && month >= 1 && month <= 12) {
        monthCounts[month] = (monthCounts[month] || 0) + 1;
        if (month < minMonth) minMonth = month;
        if (month > maxMonth) maxMonth = month;
    }
});

if (minMonth <= maxMonth) {
    const months: string[] = [];
    const masuk: number[] = [];
    for (let m = minMonth; m <= maxMonth; m++) {
        months.push(MONTH_LABELS[m - 1]);
        masuk.push(monthCounts[m] || 0);
    }
    setTrendMasukData({ months, masuk });
}
```

### 6. Computed Values (Reactive & Dinamis)

```typescript
const DEFAULT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const DEFAULT_MASUK  = [607, 807, 665, 608, 675, 458, 878, 701, 621];

// Label bulan: dinamis dari Excel atau default 9 bulan
const trendMonths = useMemo(() => {
    return trendMasukData ? trendMasukData.months : DEFAULT_MONTHS;
}, [trendMasukData]);

// Data Surat Masuk: dari Excel atau hardcoded
const trendMasuk = useMemo(() => {
    return trendMasukData ? trendMasukData.masuk : DEFAULT_MASUK;
}, [trendMasukData]);

// Surat Keluar: TETAP HARDCODED, tidak diubah sama sekali
const trendKeluar = [1104, 956, 1071, 1067, 1199, 955, 882, 691, 807];
```

> **Catatan**: `trendKeluar` tetap 9 elemen hardcoded. Jika data Excel menghasilkan jumlah bulan berbeda dari 9, grafik Surat Keluar hanya ditampilkan untuk bulan yang datanya tersedia (misal dari Excel Jan–Dec → garis keluar tetap cuma Jan–Sep, sisanya tidak ada titik). Atau alternatif: garis keluar di-hide jika jumlah bulan tidak cocok.

### 7. Grid Lines Otomatis

Saat ini grid lines hardcoded `[0, 200, 400, 600, 800, 1000, 1200, 1400]`. Setelah data dari Excel bisa besar/kecil, grid lines harus dinamis:

```typescript
const trendMax = Math.max(...trendMasuk, ...trendKeluar);
const gridStep = trendMax <= 500 ? 100 : trendMax <= 1500 ? 200 : 500;
const gridLines = Array.from(
    { length: Math.ceil(trendMax / gridStep) + 1 },
    (_, i) => i * gridStep
);
```

---

## Perubahan Total Surat Masuk

`suratMasuk` bisa tetap dihitung dari `jenisData` (sudah ada), ATAU dari `trendMasukData`:

```typescript
const suratMasuk = useMemo(() => {
    if (trendMasukData) {
        return trendMasukData.masuk.reduce((sum, v) => sum + v, 0);
    }
    if (hasUploadedJenis && jenisData.length > 0) {
        return jenisData.reduce((sum, d) => sum + d.count, 0);
    }
    return 5597;
}, [trendMasukData, hasUploadedJenis, jenisData]);
```

> Ini membuat Card "TOTAL SURAT MASUK" juga reaktif dari kolom Tanggal.

---

## Visualisasi Skenario

### Skenario 1: Belum upload (default)
```
Grafik: Jan Feb Mar Apr May Jun Jul Aug Sep  (9 titik)
Masuk:  607 807 665 608 675 458 878 701 621  (hardcoded)
Keluar: 1104 956 1071 1067 1199 955 882 691 807 (hardcoded)
→ Kedua garis tampil normal (9 titik, sama panjang)
```

### Skenario 2: Upload Excel Jan–Sep 2025
```
Grafik: Jan Feb Mar Apr May Jun Jul Aug Sep  (9 titik)
Masuk:  523 810 ... (dari Excel kolom Tanggal)
Keluar: 1104 956 1071 1067 1199 955 882 691 807 (hardcoded tetap)
→ Kedua garis tampil normal (9 titik, sama panjang)
```

### Skenario 3: Upload Excel Jan–Dec 2025
```
Grafik: Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec  (12 titik)
Masuk:  523 810 ... 401 350 290  (dari Excel, 12 titik)
Keluar: 1104 956 1071 1067 1199 955 882 691 807 (hardcoded 9 titik, berhenti di Sep)
→ Garis masuk 12 titik, garis keluar 9 titik (berhenti di Sep, tidak diperpanjang)
```

### Skenario 4: Upload Excel Apr–Aug 2025
```
Grafik: Apr May Jun Jul Aug  (5 titik)
Masuk:  608 675 458 878 701  (dari Excel, 5 titik)
Keluar: 1104 956 1071 1067 1199 955 882 691 807 (hardcoded 9 titik, TETAP TIDAK BERUBAH)
→ Garis keluar tetap render 9 titik dengan label Jan–Sep sendiri? TIDAK.
→ Garis keluar TIDAK ditampilkan jika range bulan berbeda dari default, ATAU
→ Garis keluar tetap ditampilkan tapi hanya titik yang overlap (Apr–Aug = 5 titik keluar)
```

> **Keputusan implementasi**: Jika range Excel = Jan–Sep (sama persis default), garis keluar tampil normal. Jika range berbeda, garis keluar tetap tampil untuk titik-titik yang ada di range (mapping per bulan).

---

## Yang TIDAK Berubah

- **Surat Keluar** pada grafik tren → tetap hardcoded apa adanya
- Grafik lain (donut, jenis surat per kategori, asal surat masuk) → tidak terpengaruh
- Backend → tidak ada perubahan (semua frontend-only)
- Pengelompokan (tabel Jenis & Asal) → tidak terpengaruh

---

## Ringkasan File yang Diubah

| File | Aksi | Keterangan |
|------|------|------------|
| `frontend/src/components/InsightTab.tsx` | **EDIT** | Tambah state `trendMasukData`, fungsi `parseMonth`, update `handleExcelUpload`, ubah `trendMonths/trendMasuk/trendKeluar` jadi `useMemo` dinamis, grid lines dinamis |

---

## Ringkasan Langkah Implementasi

1. Tambah state `trendMasukData` (`{ months: string[], masuk: number[] } | null`)
2. Buat fungsi helper `parseMonth(raw)` — handle Date, serial number, string DD-MM-YYYY
3. Di `handleExcelUpload`: parse kolom "Tanggal" → deteksi minMonth/maxMonth → hitung per bulan dalam range → `setTrendMasukData({ months, masuk })`
4. Ubah `trendMonths` → `useMemo` (dari `trendMasukData.months` atau default 9 bulan)
5. Ubah `trendMasuk` → `useMemo` (dari `trendMasukData.masuk` atau default)
6. `trendKeluar` → **tidak diubah**, tetap hardcoded apa adanya
7. Grid lines dinamis berdasarkan `trendMax`
8. Opsional: update `suratMasuk` untuk juga bisa dari `trendMasukData`
9. Build & test
