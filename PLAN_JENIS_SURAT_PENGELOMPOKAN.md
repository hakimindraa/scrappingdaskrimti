# PLAN: Pengelompokan Jenis Surat Per Kategori (Surat Masuk)

## Tujuan

Menambahkan tabel pengelompokan baru untuk **JENIS SURAT PER KATEGORI** di samping tabel **ASAL SURAT MASUK** yang sudah ada, sehingga kedua tabel berada bersebelahan (side-by-side). Satu file Excel diupload, langsung memproses kedua tabel sekaligus. Untuk saat ini hanya **Surat Masuk** saja.

---

## Layout Baru

```
┌──────────────────────────────────────────────────────────────────────┐
│  PENGELOMPOKAN DATA SURAT                         [Upload Excel]   │
├──────────────────────────────┬───────────────────────────────────────┤
│  JENIS SURAT PER KATEGORI   │  ASAL SURAT MASUK                    │
│  (Kiri)                      │  (Kanan - sudah ada)                 │
│                              │                                       │
│  Filter 7 Kategori           │  Filter 8 Kelompok                   │
│  ┌─────────────────────────┐ │  ┌──────────────────────────────────┐│
│  │ Sidebar  │  Tabel       │ │  │ Sidebar  │  Tabel               ││
│  │ Filter   │  Nama Surat  │ │  │ Filter   │  Nama Asal           ││
│  │          │  Jumlah      │ │  │          │  Jumlah              ││
│  │          │  Kategori    │ │  │          │  Kelompok            ││
│  └─────────────────────────┘ │  └──────────────────────────────────┘│
└──────────────────────────────┴───────────────────────────────────────┘
```

- Header satu baris dengan judul dan tombol Upload Excel (shared)
- Di bawahnya: dua panel side-by-side (50/50 atau responsive)
- Masing-masing panel punya sidebar filter + tabel sendiri

---

## 7 Kategori Jenis Surat (Surat Masuk)

| No | Kategori |
|----|----------|
| 1  | Surat Edaran |
| 2  | Keputusan / Surat Perintah / Surat Tugas |
| 3  | Undangan Internal / Eksternal |
| 4  | Surat Pengantar / Lampiran |
| 5  | Nota Dinas / Memorandum |
| 6  | Laporan |
| 7  | Biasa Internal / Eksternal |

---

## Alur Kerja

### 1. Upload Excel (Satu Tombol)

User upload 1 file Excel → sistem parse 2 kolom sekaligus:

- **Kolom "Jenis Surat"** → data untuk tabel kiri (Jenis Surat)
- **Kolom "Asal"** → data untuk tabel kanan (Asal Surat) — sudah ada

### 2. Parsing Kolom "Jenis Surat"

Dari Excel, kolom "Jenis Surat" berisi nama-nama surat individual (contoh: "BIASA", "NOTA DINAS", "SURAT TUGAS", "EDARAN", dll). Langkah:

1. Baca semua baris, ambil nilai kolom "Jenis Surat"
2. Uppercase + trim
3. Hitung jumlah per nama surat unik (deduplicate, gabung yang double)
4. Auto-mapping ke 7 kategori menggunakan **mapping table** (`JENIS_KATEGORI_MAP`)
5. Yang tidak terpetakan → kelompok kosong (bisa di-assign manual)

### 3. Mapping Table: `jenisMapping.ts`

Buat file baru `frontend/src/data/jenisMapping.ts`:

```typescript
// Mapping: Nama Jenis Surat (UPPERCASE) → Kategori
export const JENIS_KATEGORI_MAP: Record<string, string> = {
    // === Surat Edaran ===
    'SURAT EDARAN': 'Surat Edaran',
    'EDARAN': 'Surat Edaran',
    'SE': 'Surat Edaran',

    // === Keputusan / Surat Perintah / Surat Tugas ===
    'KEPUTUSAN': 'Keputusan / Surat Perintah / Surat Tugas',
    'SURAT PERINTAH': 'Keputusan / Surat Perintah / Surat Tugas',
    'SURAT TUGAS': 'Keputusan / Surat Perintah / Surat Tugas',
    'SK': 'Keputusan / Surat Perintah / Surat Tugas',
    'SPRINT': 'Keputusan / Surat Perintah / Surat Tugas',

    // === Undangan Internal / Eksternal ===
    'UNDANGAN': 'Undangan Internal / Eksternal',
    'UNDANGAN INTERNAL': 'Undangan Internal / Eksternal',
    'UNDANGAN EKSTERNAL': 'Undangan Internal / Eksternal',

    // === Surat Pengantar / Lampiran ===
    'SURAT PENGANTAR': 'Surat Pengantar / Lampiran',
    'LAMPIRAN': 'Surat Pengantar / Lampiran',
    'PENGANTAR': 'Surat Pengantar / Lampiran',

    // === Nota Dinas / Memorandum ===
    'NOTA DINAS': 'Nota Dinas / Memorandum',
    'MEMORANDUM': 'Nota Dinas / Memorandum',
    'MEMO': 'Nota Dinas / Memorandum',

    // === Laporan ===
    'LAPORAN': 'Laporan',
    'LAP': 'Laporan',

    // === Biasa Internal / Eksternal ===
    'BIASA': 'Biasa Internal / Eksternal',
    'BIASA INTERNAL': 'Biasa Internal / Eksternal',
    'BIASA EKSTERNAL': 'Biasa Internal / Eksternal',
    'SURAT BIASA': 'Biasa Internal / Eksternal',
    // ... tambah entry lain sesuai variasi data Excel
};

export const JENIS_KATEGORI_LIST = [
    'Surat Edaran',
    'Keputusan / Surat Perintah / Surat Tugas',
    'Undangan Internal / Eksternal',
    'Surat Pengantar / Lampiran',
    'Nota Dinas / Memorandum',
    'Laporan',
    'Biasa Internal / Eksternal',
];
```

> **Catatan**: Mapping ini bisa ditambah setelah melihat variasi nama dari data Excel yang sebenarnya. Polanya sama seperti `asalMapping.ts`.

### 4. State Baru di InsightTab

```typescript
// Interface (bisa pakai interface baru atau reuse)
interface JenisEntry {
    jenis: string;    // nama surat individual dari Excel
    count: number;    // jumlah kemunculan
    kategori: string; // kategori yang di-assign ('' jika belum)
}

// State
const [jenisData, setJenisData] = useState<JenisEntry[]>([]);
const [hasUploadedJenis, setHasUploadedJenis] = useState(false);
const [checkedJenisGroups, setCheckedJenisGroups] = useState<Set<string>>(new Set(JENIS_KATEGORI_LIST));
const [showJenisUnmappedOnly, setShowJenisUnmappedOnly] = useState(false);
const [assignJenis, setAssignJenis] = useState<JenisEntry | null>(null);

// Computed
const jenisSudahCount = useMemo(() => jenisData.filter(d => d.kategori !== '').length, [jenisData]);
const jenisBelumCount = useMemo(() => jenisData.filter(d => d.kategori === '').length, [jenisData]);

// Chart data — reactive (sama seperti asalSurat useMemo)
const jenisKategori = useMemo(() => {
    if (!hasUploadedJenis) return jenisKategoriDefault;
    const kategoriCounts: Record<string, number> = {};
    jenisData.forEach(d => {
        const key = d.kategori || 'Lainnya';
        kategoriCounts[key] = (kategoriCounts[key] || 0) + d.count;
    });
    return Object.entries(kategoriCounts)
        .map(([label, value]) => ({ label, masuk: value, keluar: 0 }))
        .sort((a, b) => b.masuk - a.masuk);
}, [hasUploadedJenis, jenisData]);
```

### 5. Update `handleExcelUpload`

Di dalam handler yang sudah ada, tambahkan logika untuk kolom "Jenis Surat":

```
// Sekarang sudah:
// 1. Parse "Jenis Surat" → setUploadedJenis (flat count per nama)
// 2. Parse "Asal" → setAsalData (individual entries + mapping)

// Ubah menjadi:
// 1. Parse "Jenis Surat" → setJenisData (individual entries + mapping ke 7 kategori)
//    - Menggunakan JENIS_KATEGORI_MAP untuk auto-mapping
//    - Yang tidak kenal → kategori kosong
// 2. Parse "Asal" → setAsalData (tetap seperti sekarang)
```

Hapus `uploadedJenis` state yang lama — ganti dengan `jenisData` + `useMemo`.

### 6. Fitur Assign Kelompok (Jenis Surat)

Sama persis mekanismenya seperti Asal Surat:
- Klik "Belum — Klik assign" di tabel → modal pilih kategori
- Pilih salah satu dari 7 kategori → update `jenisData`
- Chart JENIS SURAT PER KATEGORI otomatis update (reactive via `useMemo`)

### 7. Ganti Layout `pg-section` Menjadi Side-by-Side

Saat ini:
```
pg-section
  ├── pg-header (judul + upload + badge)
  └── pg-body
       ├── pg-sidebar (filter asal)
       └── pg-table-wrap (tabel asal)
```

Menjadi:
```
pg-section
  ├── pg-header (judul + upload)
  └── pg-dual-panel
       ├── pg-panel pg-panel-left (JENIS SURAT)
       │    ├── pg-panel-header ("JENIS SURAT PER KATEGORI" + badges)
       │    ├── pg-panel-body
       │    │    ├── pg-sidebar (filter 7 kategori)
       │    │    └── pg-table-wrap (tabel jenis)
       │    └── (empty state jika belum upload)
       │
       └── pg-panel pg-panel-right (ASAL SURAT - sudah ada)
            ├── pg-panel-header ("ASAL SURAT MASUK" + badges)
            ├── pg-panel-body
            │    ├── pg-sidebar (filter 8 kelompok)
            │    └── pg-table-wrap (tabel asal)
            └── (empty state jika belum upload)
```

### 8. CSS Tambahan

```css
.pg-dual-panel {
    display: flex;
    gap: 1rem;
}

.pg-panel {
    flex: 1;
    min-width: 0;
    background: #fff;
    border-radius: 14px;
    border: 1.5px solid #ede9f7;
    overflow: hidden;
}

.pg-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #f8f7fc, #f0edf9);
    border-bottom: 1px solid #ede9f7;
    font-weight: 700;
    font-size: 0.85rem;
    color: #1e1b4b;
}

/* Responsive: stack vertikal di mobile */
@media (max-width: 1024px) {
    .pg-dual-panel {
        flex-direction: column;
    }
}
```

---

## File yang Diubah / Dibuat

| File | Aksi | Keterangan |
|------|------|------------|
| `frontend/src/data/jenisMapping.ts` | **BARU** | Mapping nama jenis surat → 7 kategori + list kategori |
| `frontend/src/components/InsightTab.tsx` | **EDIT** | State baru, layout side-by-side, handleExcelUpload update, assign modal jenis, CSS |

---

## Integrasi dengan Grafik

- **Grafik JENIS SURAT PER KATEGORI**: Data diambil dari `useMemo` yang menghitung `jenisData` per kategori. Reactive — jika user assign manual, chart langsung update.
- **Grafik ASAL SURAT MASUK**: Tetap seperti sekarang, reactive dari `asalData`.
- Kedua grafik terintegrasi dari 1x upload Excel.

---

## Yang TIDAK berubah

- Grafik Surat Keluar di "JENIS SURAT PER KATEGORI" → tetap hardcoded/0 untuk sekarang (nanti dikerjakan terpisah)
- Grafik lainnya (trend, donut, dsb) → tidak berubah
- Backend → tidak ada perubahan (semua frontend-only)

---

## Ringkasan Langkah Implementasi

1. Buat `jenisMapping.ts` dengan mapping & list kategori
2. Tambah state & computed baru di InsightTab.tsx
3. Update `handleExcelUpload` → parse "Jenis Surat" ke `jenisData` (bukan `uploadedJenis`)
4. Ubah layout `pg-section` dari single panel → `pg-dual-panel` (kiri: jenis, kanan: asal)
5. Tambah sidebar filter + tabel + assign modal untuk jenis surat
6. Update `jenisKategori` menjadi `useMemo` reactive dari `jenisData`
7. Tambah CSS `.pg-dual-panel`, `.pg-panel`, `.pg-panel-header`, responsive
8. Hapus state `uploadedJenis` yang lama (diganti `jenisData`)
9. Build & test
