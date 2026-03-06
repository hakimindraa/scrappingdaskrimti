# Requirements: Fitur Override Tahun Data Excel

## Overview
Menambahkan kemampuan untuk mengubah/override tahun yang terdeteksi dari file Excel di halaman "Pengelompokan Data Surat". Ini berguna ketika data Excel memiliki tahun yang salah atau perlu diseragamkan (misalnya data tahun 2024 diubah jadi 2025).

## User Story
**Sebagai** pengguna yang mengupload data Excel  
**Saya ingin** bisa mengubah tahun data yang terdeteksi  
**Sehingga** semua data bisa diseragamkan ke tahun yang sama (misal semua jadi 2025)

## Functional Requirements

### FR-1: Deteksi Tahun Otomatis
- ✅ Sistem sudah mendeteksi tahun dari kolom "Tanggal" di Excel (SUDAH ADA)
- ✅ Tahun disimpan di state `dataYear: { min: number, max: number }` (SUDAH ADA)
- Format tanggal yang didukung: DD/MM/YYYY dan DD-MM-YYYY

### FR-2: UI Override Tahun
- Tampilkan informasi tahun yang terdeteksi dari Excel
- Sediakan input/dropdown untuk mengubah tahun
- Letakkan di bagian "Pengelompokan Data Surat", dekat dengan filter bulan
- UI harus jelas menunjukkan:
  - Tahun asli yang terdeteksi dari Excel
  - Tahun yang akan digunakan (setelah override)

### FR-3: Logika Override
- User bisa mengubah tahun untuk:
  - **Semua data sekaligus** (bulk override)
  - Contoh: Semua data tahun 2024 → 2025
- Override hanya mempengaruhi tampilan grafik, tidak mengubah file Excel asli
- Override tersimpan di state React (hilang saat refresh, kecuali disimpan ke localStorage)

### FR-4: Integrasi dengan Dashboard SIPEDE
- Override tahun harus sinkron dengan tampilan periode di Dashboard SIPEDE
- **Format tahun: 4 digit horizontal (2025) bukan 2 digit vertikal (20/25)**
- Ketika user override tahun di Pengelompokan → Dashboard SIPEDE ikut berubah
- Ketika user reset → Dashboard SIPEDE kembali ke tahun asli
- Contoh: Override 2024→2025, maka Dashboard menampilkan "2025" bukan "2024"
- Tampilan: `PERIODE JAN — SEP 2025` (horizontal, 4 digit)

### FR-5: Integrasi dengan Filter Bulan
- Override tahun harus bekerja bersama dengan filter bulan yang sudah ada
- Data yang ditampilkan di grafik menggunakan tahun yang sudah di-override
- Filter: `bulanDari`, `bulanSampai`, dan `tahunOverride`

### FR-6: Reset Functionality
- Sediakan tombol "Reset ke Tahun Asli" untuk membatalkan override
- Kembalikan ke tahun yang terdeteksi dari Excel

## Non-Functional Requirements

### NFR-1: User Experience
- UI harus intuitif dan mudah dipahami
- Perubahan tahun langsung terlihat di grafik (reactive)
- Tidak perlu re-upload Excel setelah override

### NFR-2: Performance
- Override tahun tidak boleh menyebabkan lag
- Gunakan `useMemo` untuk computed values

### NFR-3: Data Integrity
- Override tidak mengubah data asli (`rawRows`, `rawRowsKeluar`)
- Hanya mempengaruhi data yang ditampilkan (`filteredRows`, `filteredRowsKeluar`)

## Technical Context

### File yang Akan Dimodifikasi
- `frontend/src/components/InsightTab.tsx`

### State yang Perlu Ditambahkan
```typescript
const [tahunOverride, setTahunOverride] = useState<number | null>(null);
```

### Logika Filter yang Diperbarui
```typescript
// Sebelum (hanya filter bulan):
const filteredRows = useMemo(() => {
    return rawRows.filter(r => r.month >= bulanDari && r.month <= bulanSampai);
}, [rawRows, bulanDari, bulanSampai]);

// Sesudah (filter bulan + override tahun):
const filteredRows = useMemo(() => {
    return rawRows
        .filter(r => r.month >= bulanDari && r.month <= bulanSampai)
        .map(r => tahunOverride ? { ...r, year: tahunOverride } : r);
}, [rawRows, bulanDari, bulanSampai, tahunOverride]);
```

## UI Design Proposal

### Lokasi: Di bawah tombol upload, di atas filter bulan

```
┌─────────────────────────────────────────────────────────┐
│  📥 Surat Masuk (.xlsx)   📤 Surat Keluar (.xlsx)      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📅 Tahun Terdeteksi: 2024-2025                         │
│  ✏️ Override Tahun: [Dropdown: 2024, 2025, 2026, ...]  │
│  🔄 Reset ke Tahun Asli                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Filter Bulan: [Januari ▼] — [Desember ▼]              │
└─────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

### AC-1: Deteksi Tahun
- [x] Sistem mendeteksi tahun dari kolom "Tanggal" Excel
- [x] Menampilkan range tahun yang terdeteksi (min-max)

### AC-2: Override UI
- [ ] Tampilkan informasi tahun terdeteksi
- [ ] Dropdown untuk memilih tahun override (2020-2030)
- [ ] Tombol reset untuk kembali ke tahun asli

### AC-3: Fungsionalitas Override
- [ ] Ketika tahun di-override, semua data menggunakan tahun baru
- [ ] Grafik langsung ter-update setelah override
- [ ] Override bekerja untuk Surat Masuk dan Surat Keluar

### AC-4: Dashboard SIPEDE Integration
- [ ] Tahun di Dashboard SIPEDE sinkron dengan override
- [ ] Format tampilan 4 digit horizontal (2025) bukan 2 digit vertikal (20/25)
- [ ] Perubahan tahun langsung terlihat di Dashboard
- [ ] Reset mengembalikan Dashboard ke tahun asli
- [ ] Style konsisten dengan elemen periode lainnya

### AC-5: Reset
- [ ] Tombol reset mengembalikan ke tahun asli dari Excel
- [ ] Grafik kembali menampilkan data dengan tahun asli

### AC-6: Integrasi
- [ ] Override tahun bekerja bersama filter bulan
- [ ] Tidak ada bug atau error saat override
- [ ] Performance tetap smooth (tidak lag)

## Out of Scope (Tidak Termasuk)
- Override tahun per-row individual (hanya bulk/semua data)
- Menyimpan override ke localStorage (bisa ditambahkan nanti)
- Export data dengan tahun yang sudah di-override
- Override tahun untuk data yang sudah di-scrape dari backend

## Questions & Clarifications
1. ✅ Apakah override untuk semua data sekaligus? **Ya, bulk override**
2. ✅ Apakah perlu disimpan ke localStorage? **Tidak wajib di v1**
3. ⏳ Range tahun dropdown: 2020-2030 atau dinamis? **Menunggu konfirmasi**
4. ⏳ Apakah perlu warning jika mengubah tahun? **Menunggu konfirmasi**

## Success Metrics
- User bisa mengubah tahun data Excel dengan mudah
- Tidak ada bug atau error saat override
- Grafik langsung ter-update setelah perubahan tahun
