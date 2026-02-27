# PLAN: Dropdown Filter Bulan — Semua Data Dinamis Per Bulan

## Tujuan

Menambahkan **dropdown filter bulan** (dari–sampai) di atas tabel pengelompokan. Dropdown ini mengontrol **seluruh data** pada halaman Insight:
- Tabel JENIS SURAT PER KATEGORI → hanya data di bulan yang dipilih
- Tabel ASAL SURAT MASUK → hanya data di bulan yang dipilih
- Dashboard SIPEDE: Total Surat, Grafik Tren, Jenis Per Kategori, Asal Surat → hanya bulan yang dipilih
- Grafik TREN FREKUENSI → hanya menampilkan bulan yang dipilih

---

## Konsep Utama

### Perubahan Arsitektur Data

Saat ini data dihitung **flat** (total semua bulan sekaligus):
```
jenisData = [{ jenis: 'BIASA', count: 4810, kategori: '...' }]  // total semua bulan
asalData  = [{ asal: 'KEJAKSAAN', count: 3257, kelompok: '...' }] // total semua bulan
```

**Harus berubah** → simpan data **per baris mentah dengan bulan**, lalu filter & aggregate saat render:
```
// Simpan semua baris mentah dari Excel beserta bulannya
rawRows = [
    { jenis: 'BIASA', asal: 'KEJAKSAAN', month: 1 },
    { jenis: 'NOTA DINAS', asal: 'KEPOLISIAN', month: 3 },
    ...
]

// Filter berdasarkan dropdown: bulanDari=1, bulanSampai=9
filteredRows = rawRows.filter(r => r.month >= bulanDari && r.month <= bulanSampai)

// Baru dihitung jenisData, asalData, trendMasuk, suratMasuk dari filteredRows
```

---

## Layout UI

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  PENGELOMPOKAN DATA SURAT                                  [Upload Excel]  │
├──────────────────────────────────────────────────────────────────────────────┤
│  Filter Bulan:  [Dari: ▼ Januari ]  —  [Sampai: ▼ September ]             │
├──────────────────────────────┬───────────────────────────────────────────────┤
│  JENIS SURAT PER KATEGORI   │  ASAL SURAT MASUK                            │
│  (data sesuai filter bulan)  │  (data sesuai filter bulan)                  │
└──────────────────────────────┴───────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD SIPEDE  (semua data sesuai filter bulan)                         │
│  Total Surat | Persentase | Tren (bulan sesuai filter) | Jenis | Asal      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Dropdown ditempatkan di **baris baru** antara pg-header dan pg-dual-panel:
- 2 dropdown: "Dari" dan "Sampai"
- Opsi: Januari (1) – Desember (12)
- Default: otomatis dari `minMonth`–`maxMonth` yang terdeteksi dari Excel
- Jika belum upload: dropdown disabled / hidden

---

## State Baru

```typescript
// Raw rows dari Excel (semua baris, TIDAK di-aggregate)
interface RawRow {
    jenis: string;   // kolom "Jenis Surat" (UPPERCASE)
    asal: string;    // kolom "Asal" (UPPERCASE)
    month: number;   // bulan 1-12 dari kolom "Tanggal"
}
const [rawRows, setRawRows] = useState<RawRow[]>([]);

// Range bulan yang tersedia di data Excel
const [availableRange, setAvailableRange] = useState<{ min: number; max: number } | null>(null);

// Filter bulan yang dipilih user
const [bulanDari, setBulanDari] = useState<number>(1);
const [bulanSampai, setBulanSampai] = useState<number>(12);
```

---

## Perubahan `handleExcelUpload`

Saat ini handler langsung menghitung aggregate (jenisCounts, asalCounts). Harus diubah:

```typescript
reader.onload = (evt) => {
    const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

    // 1. Parse semua baris → rawRows
    const parsed: RawRow[] = [];
    let minMonth = 13, maxMonth = 0;

    rows.forEach(row => {
        const jenis = (row['Jenis Surat'] || '').toString().trim().toUpperCase();
        const asal = (row['Asal'] || '').toString().trim().toUpperCase();
        const month = parseMonth(row['Tanggal']);
        if (!month || month < 1 || month > 12) return; // skip baris tanpa tanggal valid
        parsed.push({ jenis, asal, month });
        if (month < minMonth) minMonth = month;
        if (month > maxMonth) maxMonth = month;
    });

    // 2. Simpan raw rows & range
    setRawRows(parsed);
    setAvailableRange({ min: minMonth, max: maxMonth });
    setBulanDari(minMonth);
    setBulanSampai(maxMonth);
    setHasUploadedJenis(true);
    setHasUploadedAsal(true);

    // 3. Upload info tetap dihitung dari total
    setUploadInfo({ ... });
};
```

> **Penting**: `jenisData`, `asalData`, `trendMasukData` **tidak lagi di-set langsung dari handler**. Semuanya dihitung via `useMemo` dari `rawRows` + filter bulan.

---

## Computed Data (Semua Reactive dari Filter Bulan)

### Filtered Rows
```typescript
const filteredRows = useMemo(() => {
    return rawRows.filter(r => r.month >= bulanDari && r.month <= bulanSampai);
}, [rawRows, bulanDari, bulanSampai]);
```

### Jenis Data
```typescript
const jenisData = useMemo(() => {
    if (filteredRows.length === 0 && !hasUploadedJenis) return [];
    const counts: Record<string, number> = {};
    filteredRows.forEach(r => {
        if (!r.jenis) return;
        counts[r.jenis] = (counts[r.jenis] || 0) + 1;
    });
    return Object.entries(counts).map(([jenis, count]) => ({
        jenis,
        count,
        kategori: JENIS_KATEGORI_MAP[jenis] || '',
    }));
}, [filteredRows, hasUploadedJenis]);
```

> **Catatan**: `jenisData` berubah dari **state** menjadi **computed (useMemo)**. Assign manual kategori perlu pendekatan berbeda — simpan override map: `jenisKategoriOverrides: Record<string, string>`.

### Asal Data
```typescript
const asalData = useMemo(() => {
    if (filteredRows.length === 0 && !hasUploadedAsal) return [];
    const counts: Record<string, number> = {};
    filteredRows.forEach(r => {
        if (!r.asal) return;
        counts[r.asal] = (counts[r.asal] || 0) + 1;
    });
    return Object.entries(counts).map(([asal, count]) => ({
        asal,
        count,
        kelompok: asalKelompokOverrides[asal] || ASAL_KELOMPOK_MAP[asal] || '',
    }));
}, [filteredRows, hasUploadedAsal, asalKelompokOverrides]);
```

### Tren Masuk
```typescript
const trendMasukData = useMemo(() => {
    if (rawRows.length === 0) return null;
    const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const months: string[] = [];
    const masuk: number[] = [];
    // Hanya tampilkan bulan dalam range filter
    for (let m = bulanDari; m <= bulanSampai; m++) {
        months.push(MONTH_LABELS[m - 1]);
        masuk.push(filteredRows.filter(r => r.month === m).length);
    }
    return { months, masuk };
}, [rawRows, filteredRows, bulanDari, bulanSampai]);
```

### Surat Masuk Total
```typescript
const suratMasuk = useMemo(() => {
    if (filteredRows.length > 0) return filteredRows.length;
    return 5597; // default
}, [filteredRows]);
```

---

## Manual Assign Override

Karena `jenisData` dan `asalData` sekarang computed dari `rawRows`, assign manual tidak bisa langsung mutate state. Solusi: simpan **override map**:

```typescript
// Override maps: jenis/asal yang di-assign manual
const [jenisKategoriOverrides, setJenisKategoriOverrides] = useState<Record<string, string>>({});
const [asalKelompokOverrides, setAsalKelompokOverrides] = useState<Record<string, string>>({});

// Assign jenis → update override
const handleAssignJenis = (kategori: string) => {
    if (!assignJenis) return;
    setJenisKategoriOverrides(prev => ({ ...prev, [assignJenis.jenis]: kategori }));
    setAssignJenis(null);
};

// Assign asal → update override  
const handleAssign = (kelompok: string) => {
    if (!assignAsal) return;
    setAsalKelompokOverrides(prev => ({ ...prev, [assignAsal.asal]: kelompok }));
    setAssignAsal(null);
};
```

Di computed `jenisData`, pakai override:
```typescript
kategori: jenisKategoriOverrides[jenis] || JENIS_KATEGORI_MAP[jenis] || '',
```

---

## Dropdown UI

```tsx
{/* Filter Bulan Bar — di antara pg-header dan pg-dual-panel */}
{availableRange && (
    <div className="pg-month-filter">
        <span className="pg-month-label">Filter Bulan:</span>
        <select
            className="pg-month-select"
            value={bulanDari}
            onChange={e => {
                const v = Number(e.target.value);
                setBulanDari(v);
                if (v > bulanSampai) setBulanSampai(v);
            }}
        >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{MONTH_LABELS[m - 1]}</option>
            ))}
        </select>
        <span className="pg-month-dash">—</span>
        <select
            className="pg-month-select"
            value={bulanSampai}
            onChange={e => {
                const v = Number(e.target.value);
                setBulanSampai(v);
                if (v < bulanDari) setBulanDari(v);
            }}
        >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{MONTH_LABELS[m - 1]}</option>
            ))}
        </select>
    </div>
)}
```

---

## CSS Tambahan

```css
.pg-month-filter {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.75rem;
    background: #faf9fd;
    border-bottom: 1px solid #e8e5f0;
}
.pg-month-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #1e1b4b;
}
.pg-month-select {
    padding: 0.45rem 0.75rem;
    border: 1.5px solid #e8e5f0;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e1b4b;
    background: #fff;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
}
.pg-month-select:focus {
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
}
.pg-month-dash {
    font-size: 1rem;
    color: #94a3b8;
    font-weight: 600;
}
```

---

## Dampak pada Dashboard SIPEDE

Semua card di dashboard membaca dari computed values yang sudah ter-filter:

| Card | Data Source | Sebelum | Sesudah |
|------|-----------|---------|---------|
| TOTAL SURAT MASUK | `suratMasuk` | dari jenisData total | dari `filteredRows.length` |
| JENIS SURAT PER KATEGORI (chart) | `jenisKategori` | dari jenisData total | dari jenisData (filtered) |
| ASAL SURAT MASUK (chart) | `asalSurat` | dari asalData total | dari asalData (filtered) |
| TREN FREKUENSI (chart) | `trendMasuk` | dari trendMasukData | dari filteredRows per bulan dalam range |

**Semua otomatis berubah** ketika dropdown bulan diubah, karena chain reactive:
```
bulanDari/bulanSampai → filteredRows → jenisData/asalData/trendMasukData/suratMasuk → UI
```

---

## Visualisasi Skenario

### Skenario 1: Upload Excel Jan–Dec, filter Jan–Apr
```
Dropdown: [Januari ▼] — [April ▼]
Tren grafik: Jan Feb Mar Apr (4 titik)
Total Surat Masuk: hanya count dari Jan-Apr
Tabel Jenis: hanya surat di Jan-Apr
Tabel Asal: hanya surat di Jan-Apr
```

### Skenario 2: Upload Excel Jan–Dec, filter Jun–Sep
```
Dropdown: [Juni ▼] — [September ▼]
Tren grafik: Jun Jul Aug Sep (4 titik)
Total Surat Masuk: hanya count dari Jun-Sep
Tabel Jenis: hanya surat di Jun-Sep
Tabel Asal: hanya surat di Jun-Sep
```

### Skenario 3: Belum upload
```
Dropdown: hidden / disabled
Semua data: hardcoded default (tidak berubah)
```

---

## Perubahan dari Sebelumnya

| Aspek | Sebelumnya | Sesudah |
|-------|-----------|---------|
| `jenisData` | `useState` — di-set di handler | `useMemo` — computed dari `filteredRows` |
| `asalData` | `useState` — di-set di handler | `useMemo` — computed dari `filteredRows` |
| `trendMasukData` | `useState` — di-set di handler | `useMemo` — computed dari `filteredRows` |
| Assign manual | `setJenisData(prev => ...)` | Override map: `jenisKategoriOverrides` |
| Assign asal | `setAsalData(prev => ...)` | Override map: `asalKelompokOverrides` |
| Create group | `setAsalData(prev => ...)` | Override map: `asalKelompokOverrides` |
| Upload handler | Aggregate langsung | Simpan `rawRows` saja + range |

---

## Yang TIDAK Berubah

- **Surat Keluar** → tetap hardcoded
- **Persentase User SIPEDE** → tetap hardcoded (donut chart)
- **Backend** → tidak ada perubahan
- **jenisMapping.ts, asalMapping.ts** → tidak berubah
- **Buat Kelompok Baru** modal → tetap ada, pakai override map

---

## File yang Diubah

| File | Aksi | Keterangan |
|------|------|------------|
| `frontend/src/components/InsightTab.tsx` | **EDIT** | Refactor besar: rawRows state, dropdown bulan, semua data jadi computed, override maps untuk assign manual |

---

## Ringkasan Langkah Implementasi

1. Tambah state: `rawRows`, `availableRange`, `bulanDari`, `bulanSampai`, `jenisKategoriOverrides`, `asalKelompokOverrides`
2. Ubah `handleExcelUpload` → simpan rawRows, hapus aggregate langsung
3. Ubah `jenisData` dari state → useMemo (dari filteredRows + overrides)
4. Ubah `asalData` dari state → useMemo (dari filteredRows + overrides)
5. Ubah `trendMasukData` dari state → useMemo (dari filteredRows + range)
6. Ubah `suratMasuk` → dari filteredRows.length
7. Update `handleAssignJenis`, `handleAssign`, `handleCreateGroup` → pakai override maps
8. Tambah dropdown UI (2 select: dari–sampai) di antara pg-header dan pg-dual-panel
9. Tambah CSS untuk `.pg-month-filter`, `.pg-month-select`
10. Build & test
