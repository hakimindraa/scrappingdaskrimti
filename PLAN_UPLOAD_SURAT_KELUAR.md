# PLAN: Upload File Surat Keluar (Gabung Jenis)

## Situasi Saat Ini

- **1 upload button** → file Excel **Surat Masuk** (`Jenis Surat`, `Asal`, `Tanggal`)
- Feed ke: tabel Jenis, tabel Asal, grafik Jenis (bar masuk), grafik Tren (garis masuk), Total Surat Masuk

**Yang kosong:**
- Grafik JENIS SURAT PER KATEGORI → bar `keluar` selalu 0
- Grafik TREN → garis `Surat Keluar` selalu 0
- Total SURAT KELUAR → 0

## File Baru: Surat Keluar

Excel Surat Keluar (kolom: `Jenis Surat`, `Tanggal` — **TIDAK ada `Asal`**).

**Feed ke:**
- ✅ Grafik JENIS SURAT PER KATEGORI → bar `keluar`
- ✅ Grafik TREN FREKUENSI → garis `Surat Keluar` per bulan
- ✅ Total SURAT KELUAR
- ✅ Tabel JENIS SURAT → kolom "Keluar" (gabung dengan Masuk)
- ❌ TIDAK masuk ke grafik ASAL SURAT MASUK
- ❌ TIDAK masuk ke tabel Asal

---

## Solusi: 2 Tombol Upload + Tabel Jenis Gabung (Masuk & Keluar)

### Upload Header

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PENGELOMPOKAN DATA SURAT                                               │
│                                      [📥 Upload Surat Masuk]  [📤 Upload Surat Keluar]  │
└──────────────────────────────────────────────────────────────────────────┘
```

Dua tombol terpisah:
- **Upload Surat Masuk** (📥) → warna ungu, ikon panah bawah
- **Upload Surat Keluar** (📤) → warna pink/magenta, ikon panah atas

User bisa upload kapan saja, urutan bebas, bisa re-upload salah satu tanpa ganggu yang lain.

### Notifikasi Upload

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ✅ Upload berhasil!                                                       │
│ 📥 Surat Masuk: 7,628 baris (15 jenis, 728 asal)                        │
│ 📤 Surat Keluar: 5,200 baris (12 jenis)                [Grafik ↓] [x]  │
└──────────────────────────────────────────────────────────────────────────┘
```

Notif gabung 1 banner, tapi info terpisah per file. Muncul setiap upload (update isi sesuai file mana yang baru diupload).

---

## Tab Pengelompokan: 2 Tab (Bukan 3)

Karena jenis surat masuk & keluar **nama-namanya sama**, dijadikan **1 tabel gabungan** dengan kolom Masuk + Keluar.

### Saat Ini (2 Tab)
```
[🔘 JENIS SURAT ✓8 ✗7]          [ASAL SURAT ✓478 ✗250]
```

### Sesudah (Tetap 2 Tab, tapi tabel Jenis diperluas)
```
[🔘 JENIS SURAT ✓8 ✗7]          [ASAL SURAT ✓478 ✗250]
```

---

## Detail Tab JENIS SURAT (Gabung Masuk + Keluar)

### Tabel (4 kolom, sebelumnya 3)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Menampilkan 15 dari 15 jenis                   [▼ Filter Kategori]     │
├──────────────────────────────────────────────────────────────────────────┤
│  JENIS SURAT                        │ MASUK  │ KELUAR │ KATEGORI        │
├──────────────────────────────────────┼────────┼────────┼─────────────────┤
│  BIASA INTERNAL / EKSTERNAL         │  4,810 │  4,540 │ Biasa Int/Eks   │
│  KEPUTUSAN / SURAT PERINTAH / ST    │  1,883 │     50 │ Keputusan/SP/ST │
│  NOTA DINAS                         │  1,015 │    103 │ Nota Dinas/Memo │
│  LAPORAN                            │     11 │    669 │ Laporan         │
│  SURAT PENGANTAR / LAMPIRAN        │    498 │    552 │ Surat Peng/Lamp │
│  SURAT UNDANGAN EKSTERNAL           │    165 │      — │ ⚠ Belum—Assign  │
│  LAPINSUS                           │     23 │      — │ ⚠ Belum—Assign  │
│  MEMORANDUM                         │      — │     45 │ ⚠ Belum—Assign  │
├──────────────────────────────────────────────────────────────────────────┤
│  ✓ Sudah: 8  ✗ Belum: 7       [☐ Hanya belum dikategori]               │
└──────────────────────────────────────────────────────────────────────────┘
```

**Aturan gabung:**
- Jika jenis ada di **kedua** file → tampil angka Masuk & Keluar
- Jika jenis hanya ada di **satu** file → kolom lainnya tampil "—"
- Assign kategori **1 kali** berlaku untuk masuk & keluar (karena nama jenis sama)
- "Sudah/Belum" dihitung dari **unique jenis** (gabungan), bukan per file

### Sebelum Upload Keluar (hanya Masuk)

```
│  JENIS SURAT                        │ MASUK  │ KELUAR │ KATEGORI        │
│  BIASA INTERNAL / EKSTERNAL         │  4,810 │      — │ Biasa Int/Eks   │
│  NOTA DINAS                         │  1,015 │      — │ Nota Dinas/Memo │
```

Kolom KELUAR semua "—" sampai user upload file Surat Keluar.

### Sebelum Upload Masuk (hanya Keluar)

```
│  JENIS SURAT                        │ MASUK  │ KELUAR │ KATEGORI        │
│  BIASA INTERNAL / EKSTERNAL         │      — │  4,540 │ Biasa Int/Eks   │
│  NOTA DINAS                         │      — │    103 │ Nota Dinas/Memo │
```

---

## Tab ASAL SURAT → Tidak Berubah

Tetap seperti sekarang. Hanya dari file Surat Masuk. Tidak terpengaruh upload Surat Keluar.

---

## Data Flow

### Interface

```typescript
// Surat Masuk (sudah ada)
interface RawRow {
    jenis: string;
    asal: string;
    month: number;
    year: number;
}

// Surat Keluar (baru)
interface RawRowKeluar {
    jenis: string;
    month: number;
    year: number;
    // TIDAK ada 'asal'
}
```

### State Baru

```typescript
const [rawRowsKeluar, setRawRowsKeluar] = useState<RawRowKeluar[]>([]);
const [hasUploadedKeluar, setHasUploadedKeluar] = useState(false);
```

### Filtered Rows

```typescript
// Surat Masuk (sudah ada)
const filteredRows = useMemo(() =>
    rawRows.filter(r => r.month >= bulanDari && r.month <= bulanSampai),
[rawRows, bulanDari, bulanSampai]);

// Surat Keluar (baru)
const filteredRowsKeluar = useMemo(() =>
    rawRowsKeluar.filter(r => r.month >= bulanDari && r.month <= bulanSampai),
[rawRowsKeluar, bulanDari, bulanSampai]);
```

### Jenis Data Gabungan

```typescript
// Interface diperluas
interface JenisEntry {
    jenis: string;
    countMasuk: number;   // sebelumnya: count
    countKeluar: number;  // baru
    kategori: string;
}

const jenisData = useMemo((): JenisEntry[] => {
    if (!hasUploadedJenis && !hasUploadedKeluar) return [];

    // Hitung masuk per jenis
    const masukCounts: Record<string, number> = {};
    filteredRows.forEach(r => {
        if (r.jenis) masukCounts[r.jenis] = (masukCounts[r.jenis] || 0) + 1;
    });

    // Hitung keluar per jenis
    const keluarCounts: Record<string, number> = {};
    filteredRowsKeluar.forEach(r => {
        if (r.jenis) keluarCounts[r.jenis] = (keluarCounts[r.jenis] || 0) + 1;
    });

    // Gabung semua jenis unik
    const allJenis = new Set([...Object.keys(masukCounts), ...Object.keys(keluarCounts)]);
    return Array.from(allJenis).map(jenis => ({
        jenis,
        countMasuk: masukCounts[jenis] || 0,
        countKeluar: keluarCounts[jenis] || 0,
        kategori: jenisKategoriOverrides[jenis] || JENIS_KATEGORI_MAP[jenis] || '',
    }));
}, [filteredRows, filteredRowsKeluar, hasUploadedJenis, hasUploadedKeluar, jenisKategoriOverrides]);
```

### Grafik JENIS SURAT PER KATEGORI

```typescript
const jenisKategori = useMemo(() => {
    if (!hasUploadedJenis && !hasUploadedKeluar) return [];

    const masukCounts: Record<string, number> = {};
    const keluarCounts: Record<string, number> = {};

    jenisData.forEach(d => {
        const key = d.kategori || 'Lainnya';
        masukCounts[key] = (masukCounts[key] || 0) + d.countMasuk;
        keluarCounts[key] = (keluarCounts[key] || 0) + d.countKeluar;
    });

    const allKat = new Set([...Object.keys(masukCounts), ...Object.keys(keluarCounts)]);
    return Array.from(allKat).map(label => ({
        label,
        masuk: masukCounts[label] || 0,
        keluar: keluarCounts[label] || 0,
    })).sort((a, b) => (b.masuk + b.keluar) - (a.masuk + a.keluar));
}, [hasUploadedJenis, hasUploadedKeluar, jenisData]);
```

### Total Surat

```typescript
const suratMasuk = useMemo(() => filteredRows.length, [filteredRows]);
const suratKeluar = useMemo(() => filteredRowsKeluar.length, [filteredRowsKeluar]);
```

### Tren Surat

```typescript
// Surat Masuk tren (tidak berubah, dari rawRows)
const trendMasukData = useMemo(() => { ... }, [...]);

// Surat Keluar tren (dari rawRowsKeluar)
const trendKeluar = useMemo(() => {
    if (rawRowsKeluar.length === 0) return [] as number[];
    const result: number[] = [];
    for (let m = bulanDari; m <= bulanSampai; m++) {
        result.push(filteredRowsKeluar.filter(r => r.month === m).length);
    }
    return result;
}, [rawRowsKeluar, filteredRowsKeluar, bulanDari, bulanSampai]);

// Months: dari salah satu / kedua file
const trendMonths = useMemo(() => {
    if (rawRows.length === 0 && rawRowsKeluar.length === 0) return [];
    const months: string[] = [];
    for (let m = bulanDari; m <= bulanSampai; m++) {
        months.push(MONTH_LABELS[m - 1]);
    }
    return months;
}, [rawRows, rawRowsKeluar, bulanDari, bulanSampai]);
```

---

## Upload Handler

### Surat Masuk (update — tidak reset keluar)

```typescript
const handleExcelUpload = (e) => {
    // ... parse Jenis Surat, Asal, Tanggal → rawRows
    // Set rawRows, hasUploadedJenis, hasUploadedAsal
    // Update bulanDari/bulanSampai (merge dengan range keluar jika ada)
    // ⚠ JANGAN reset rawRowsKeluar — biarkan data keluar tetap ada
    // Reset jenisKategoriOverrides hanya jika belum ada keluar, atau selalu reset
};
```

### Surat Keluar (baru)

```typescript
const handleExcelUploadKeluar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

        const parsed: RawRowKeluar[] = [];
        let minM = 13, maxM = 0;
        const yearsFound = new Set<number>();

        rows.forEach(row => {
            const jenis = (row['Jenis Surat'] || '').toString().trim().toUpperCase();
            const d = parseDate(row['Tanggal']);
            if (!d || d.month < 1 || d.month > 12) return;
            parsed.push({ jenis, month: d.month, year: d.year });
            if (d.month < minM) minM = d.month;
            if (d.month > maxM) maxM = d.month;
            yearsFound.add(d.year);
        });

        setRawRowsKeluar(parsed);
        setHasUploadedKeluar(true);

        // Merge filter range: expand min/max jika keluar lebih lebar
        if (minM <= maxM) {
            setBulanDari(prev => Math.min(prev, minM));
            setBulanSampai(prev => Math.max(prev, maxM));
            setAvailableRange(prev => prev
                ? { min: Math.min(prev.min, minM), max: Math.max(prev.max, maxM) }
                : { min: minM, max: maxM });
        }
        // ... year merge, uploadInfo
    };
    reader.readAsBinaryString(file);
};
```

---

## Notifikasi

### State

```typescript
const [uploadInfo, setUploadInfo] = useState<{
    totalRowsMasuk?: number;
    jenisCount?: number;
    jenisMatched?: number;
    jenisUnmatched?: number;
    asalCount?: number;
    asalMatched?: number;
    asalUnmatched?: number;
    totalRowsKeluar?: number;
    keluarJenisCount?: number;
    keluarJenisMatched?: number;
    keluarJenisUnmatched?: number;
} | null>(null);
```

Upload masuk → set field `totalRowsMasuk`, `jenisCount`, dst (preserve field keluar).
Upload keluar → set field `totalRowsKeluar`, `keluarJenisCount`, dst (preserve field masuk).

### Banner JSX

```
┌──────────────────────────────────────────────────────────────────────┐
│ ✅ Upload berhasil!                                                   │
│ 📥 Surat Masuk: 7,628 baris • 15 jenis (8 cocok, 7 belum)          │
│    728 asal (478 cocok, 250 belum)                                   │
│ 📤 Surat Keluar: 5,200 baris • 12 jenis (10 cocok, 2 belum)        │
│                                            [Grafik Jenis ↓] [x]     │
└──────────────────────────────────────────────────────────────────────┘
```

Baris masuk hanya muncul jika `totalRowsMasuk` ada. Baris keluar hanya muncul jika `totalRowsKeluar` ada.

---

## Filter Bulan

Shared antara kedua file. Range otomatis expand saat upload file ke-2:
- Upload Masuk (Jan-Sep) → bulanDari=1, bulanSampai=9
- Upload Keluar (Jan-Dec) → bulanDari=1, bulanSampai=12 (expand)

Muncul jika salah satu / keduanya sudah diupload.

---

## Tabel JSX (Tab Jenis)

### Sebelum (3 kolom)

```html
<thead><tr><th>Jenis Surat</th><th>Jumlah</th><th>Kategori</th></tr></thead>
<td className="pg-td-count">{d.count.toLocaleString()}</td>
```

### Sesudah (4 kolom)

```html
<thead><tr><th>Jenis Surat</th><th>Masuk</th><th>Keluar</th><th>Kategori</th></tr></thead>
<td className="pg-td-count">{d.countMasuk > 0 ? d.countMasuk.toLocaleString() : '—'}</td>
<td className="pg-td-count">{d.countKeluar > 0 ? d.countKeluar.toLocaleString() : '—'}</td>
```

`—` ditampilkan jika jenis tersebut tidak ada di file yang bersangkutan (0 baris).

---

## Perubahan Interface JenisEntry

```diff
// jenisMapping.ts
interface JenisEntry {
    jenis: string;
-   count: number;
+   countMasuk: number;
+   countKeluar: number;
    kategori: string;
}
```

**Dampak:** Semua tempat yang pakai `d.count` harus diupdate ke `d.countMasuk` atau `d.countMasuk + d.countKeluar`.

---

## Yang Tidak Berubah

- Tab ASAL SURAT MASUK → tidak berubah
- Grafik ASAL SURAT MASUK → tetap hanya dari file masuk
- Modal assign jenis → tetap sama (assign berlaku untuk masuk & keluar)
- Modal assign asal, create kelompok → tetap sama
- Donut chart PERSENTASE USER SIPEDE → tidak berubah
- Download PNG → tetap sama

---

## CSS Perubahan

| Baru/Update | Keterangan |
|-------------|------------|
| `.pg-upload-btn-keluar` | Warna pink/magenta untuk tombol upload keluar |
| `.pg-td-count` | Tetap, tapi sekarang 2 kolom (Masuk & Keluar) |
| `.pg-td-dash` | Style untuk "—" (warna abu-abu muda) |

---

## Ringkasan Langkah Implementasi

1. Tambah `RawRowKeluar` interface
2. Tambah state: `rawRowsKeluar`, `hasUploadedKeluar`
3. Tambah `filteredRowsKeluar` useMemo
4. Ubah `JenisEntry` → `countMasuk` + `countKeluar` (gabung masuk & keluar)
5. Update `jenisData` useMemo → gabung unique jenis dari kedua file
6. Update `jenisKategori` useMemo → ambil masuk & keluar per kategori
7. Update `trendKeluar` useMemo → dari rawRowsKeluar
8. Update `trendMonths` useMemo → dari salah satu / kedua file
9. Update `suratKeluar` useMemo → `filteredRowsKeluar.length`
10. Tambah `handleExcelUploadKeluar` handler
11. Update header: 2 tombol upload (Surat Masuk + Surat Keluar)
12. Update notifikasi: gabung info masuk & keluar di 1 banner
13. Update tabel tab Jenis: 4 kolom (Jenis, Masuk, Keluar, Kategori)
14. Update filter bulan: merge range dari kedua file
15. Hapus `HARDCODED_KELUAR`
16. Update semua referensi `d.count` → `d.countMasuk`/`d.countKeluar`
17. Build & test

---

## File Yang Diubah

| File | Aksi |
|------|------|
| `frontend/src/components/InsightTab.tsx` | Semua perubahan utama |
| `frontend/src/data/jenisMapping.ts` | Update `JenisEntry` interface (countMasuk + countKeluar) |
