# Implementation Plan: Upload Excel → Asal Surat Masuk (Frontend Only)

## Konsep

Semua proses dilakukan di **frontend** (Insight tab). **Tidak pakai backend.**

Admin upload file Excel di section Pengelompokan (tombol Upload Excel yang **sudah ada**). Browser baca file, parse kolom **"Asal"**, cocokkan setiap nilai Asal ke salah satu dari **8 kelompok** menggunakan mapping table yang di-embed di frontend, aggregate per kelompok, lalu update chart **ASAL SURAT MASUK**.

### 8 Kelompok
| # | Kelompok |
|---|----------|
| 1 | Kejaksaan |
| 2 | Kemenkeu |
| 3 | Pengadilan |
| 4 | Perbankan |
| 5 | Kepolisian dan BNN |
| 6 | Gubernur / Pemda |
| 7 | Instansi Lainnya / BUMN |
| 8 | Aliansi Kemasyarakatan / Pribadi / LSM |

---

## Alur

```
Admin klik "Upload Excel" di Insight tab
        │
        ▼
Browser baca file (FileReader)
        │
        ▼
SheetJS (xlsx) parse .xlsx
        │
        ▼
Ambil kolom "Asal" dari setiap baris
        │
        ▼
Cocokkan setiap nilai Asal ke kelompok
(lookup dari ASAL_KELOMPOK_MAP di frontend)
        │
        ▼
Aggregate: hitung jumlah per kelompok
        │
        ▼
Update state uploadedAsal
        │
        ▼
Chart ASAL SURAT MASUK auto re-render
        │
        ▼
Tampil notifikasi + tombol "Lihat Grafik ↓"
```

> **Catatan:** Tombol upload yang sama juga memproses kolom "Jenis Surat" (sudah implementasi sebelumnya). Jadi **satu kali upload** langsung update **kedua** chart.

---

## Proposed Changes

### [CREATE] `frontend/src/data/asalMapping.ts`

File TypeScript berisi mapping 300+ Asal → Kelompok sebagai `Record<string, string>`.
Key = nama asal (UPPERCASE), Value = nama kelompok.

```ts
// Mapping: Asal Surat (UPPERCASE) → Kelompok
export const ASAL_KELOMPOK_MAP: Record<string, string> = {
    'ASDATUN': 'Kejaksaan',
    'ASINTEL': 'Kejaksaan',
    'ASPIDSUS': 'Kejaksaan',
    'BEA CUKAI BATAM': 'Kemenkeu',
    'POLDA KEPRI': 'Kepolisian dan BNN',
    'BNNP KEPRI': 'Kepolisian dan BNN',
    'GUBERNUR KEPRI': 'Gubernur / Pemda',
    'PENGADILAN NEGERI BATAM': 'Pengadilan',
    'BANK BSI': 'Perbankan',
    // ... total 300+ entri dari data yang diberikan user
};
```

---

### [MODIFY] `frontend/src/components/InsightTab.tsx`

#### 1. Import
```tsx
import { ASAL_KELOMPOK_MAP } from '../data/asalMapping';
```

#### 2. State baru
```tsx
const [uploadedAsal, setUploadedAsal] = useState<{label:string, value:number}[] | null>(null);
const [uploadAsalInfo, setUploadAsalInfo] = useState<{
    totalRows: number; categories: number; matched: number; unmatched: number;
} | null>(null);
const asalChartRef = useRef<HTMLDivElement>(null);
```

#### 3. Extend `handleExcelUpload` yang sudah ada

Di dalam `reader.onload`, **setelah** parsing "Jenis Surat" (yang sudah ada), tambahkan:

```tsx
// --- Asal Surat: mapping ke kelompok ---
const kelompokCounts: Record<string, number> = {};
let matched = 0, unmatched = 0;

rows.forEach(row => {
    const asal = (row['Asal'] || '').toString().trim().toUpperCase();
    if (!asal) return;

    const kelompok = ASAL_KELOMPOK_MAP[asal];
    if (kelompok) {
        kelompokCounts[kelompok] = (kelompokCounts[kelompok] || 0) + 1;
        matched++;
    } else {
        kelompokCounts['Lainnya'] = (kelompokCounts['Lainnya'] || 0) + 1;
        unmatched++;
    }
});

const asalResult = Object.entries(kelompokCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

if (asalResult.length > 0) {
    setUploadedAsal(asalResult);
    setUploadAsalInfo({
        totalRows: rows.length,
        categories: asalResult.length,
        matched,
        unmatched
    });
}
```

#### 4. Chart jadi dinamis
```tsx
const asalSuratDefault = [
    { label: 'Aliansi Kemasyarakatan / Pribadi / LSM', value: 146 },
    { label: 'Gubernur / Pemda', value: 150 },
    { label: 'Instansi Lainnya / BUMN', value: 179 },
    { label: 'Kejaksaan', value: 3257 },
    { label: 'Kemenkeu', value: 69 },
    { label: 'Kepolisian dan BNN', value: 1782 },
    { label: 'Pengadilan', value: 8 },
    { label: 'Perbankan', value: 6 },
];

// Dynamic: from upload or hardcoded default
const asalSurat = uploadedAsal ?? asalSuratDefault;
```
`asalMax` otomatis ikut karena sudah computed dari `asalSurat`.

#### 5. Notifikasi di section Pengelompokan

Setelah upload, muncul banner (di bawah notif Jenis Surat yang sudah ada):

```
┌──────────────────────────────────────────────────────────┐
│ ✅ Data Asal Surat berhasil diproses!                     │
│ 📄 1.245 baris • 8 kelompok • ✓ 1.230 cocok • ✗ 15 tidak │
│ [📊 Lihat Grafik Asal Surat ↓]                           │
└──────────────────────────────────────────────────────────┘
```
Tombol scroll: `asalChartRef.current?.scrollIntoView({ behavior: 'smooth' })`

#### 6. Ref pada card Asal Surat
```tsx
<div className="card card-asal" ref={asalChartRef}>
```

---

## Struktur File

```
frontend/
  src/
    data/
      asalMapping.ts            ← [CREATE] mapping 300+ asal → kelompok
    components/
      InsightTab.tsx            ← [MODIFY] import, state, extend handler, chart dinamis, notif
```

**Tidak ada perubahan di backend.** Tidak perlu install dependency baru (xlsx sudah ada).

---

## Verification Plan

### Build
```bash
cd frontend && npx next build
```

### Manual Test
1. Buka Insight tab
2. Klik "Upload Excel" → pilih file .xlsx yang punya kolom "Asal" (dan "Jenis Surat")
3. **Kedua chart** update sekaligus:
   - Chart JENIS SURAT PER KATEGORI → dari kolom "Jenis Surat"
   - Chart ASAL SURAT MASUK → dari kolom "Asal" (di-mapping ke 8 kelompok)
4. Notifikasi muncul untuk keduanya
5. Klik "Lihat Grafik Asal Surat ↓" → scroll ke chart
6. Tanpa upload → kedua chart tetap hardcoded default

---

## Timeline Estimasi
| Step | Waktu |
|------|-------|
| Create asalMapping.ts (300+ entri) | ~5 menit |
| Modify InsightTab.tsx (import, state, handler, chart, notif) | ~5 menit |
| Build & test | ~3 menit |
| **Total** | **~13 menit** |
