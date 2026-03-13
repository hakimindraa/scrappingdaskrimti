# PLAN: Filter Tahun + Koreksi Tahun Data (Insight Tab Pengelompokkan)

## Status Saat Ini (Hasil Cek)

Hasil pengecekan di komponen Insight Tab menunjukkan:

1. Di area Pengelompokkan saat ini ada filter bulan (Dari - Sampai).
2. Belum ada filter tahun khusus untuk menampilkan data per tahun.
3. Sudah ada fitur Override Tahun, tetapi sifatnya mengganti nilai tahun seluruh data yang sedang tampil, bukan filter tahun terpisah.

Kesimpulan: benar, yang tersedia saat ini baru filter bulan.

## Tujuan Fitur yang Diinginkan

Menambahkan mekanisme agar user bisa:

1. Memilih tahun filter (contoh: 2025) sehingga tabel hanya menampilkan data tahun 2025.
2. Melakukan koreksi tahun data (contoh: data bertahun 2024 di dalam file yang seharusnya 2025 diubah ke 2025).
3. Setelah koreksi dilakukan, data yang tadi 2024 ikut terbaca saat filter tahun 2025 dipilih.

## Prinsip Data

Sumber tahun harus dibaca dari kolom Tanggal pada file Excel upload (nilai tanggal per baris), lalu diturunkan menjadi field year di data internal.

## Rancangan Solusi

### 1) Tambah State Filter Tahun

Tambahan state utama:

- selectedYear: number | null
- availableYears: number[]

Perilaku:

- availableYears dihasilkan dinamis dari data upload (rawRows + rawRowsKeluar).
- selectedYear default null (Semua Tahun) atau otomatis ke tahun terbesar (akan diputuskan saat implementasi).

### 2) Pisahkan Konsep Filter Tahun vs Override/Koreksi Tahun

Agar jelas dan tidak bentrok:

- Filter Tahun: menentukan data tahun berapa yang ditampilkan.
- Koreksi Tahun: mengubah nilai year pada data tampilan (atau data ter-normalisasi) dari tahun asal ke tahun tujuan.

Usulan kontrol koreksi:

- Dari Tahun (sourceYear)
- Ke Tahun (targetYear)
- Tombol Terapkan Koreksi

Contoh alur:

- User pilih Dari Tahun = 2024, Ke Tahun = 2025, klik Terapkan.
- Data baris yang year=2024 dianggap year=2025 untuk perhitungan tampilan.
- Saat filter tahun=2025 dipilih, data hasil koreksi ikut tampil.

### 3) Urutan Proses Data (Pipeline)

Urutan wajib agar hasil sesuai ekspektasi:

1. Parse tanggal dari Excel -> dapat month dan year.
2. Terapkan koreksi tahun (jika ada rule koreksi aktif).
3. Terapkan filter bulan (bulanDari - bulanSampai).
4. Terapkan filter tahun (selectedYear).
5. Hitung ulang seluruh agregasi tabel/grafik dari data hasil filter.

Catatan: filter tahun tidak boleh dijalankan sebelum koreksi tahun, supaya data hasil koreksi masuk ke tahun target.

### 4) Dampak ke Tampilan

Bagian Pengelompokkan akan punya:

1. Filter Bulan (existing, tetap dipakai).
2. Filter Tahun (baru, dropdown).
3. Panel Koreksi Tahun (baru, Dari -> Ke + tombol apply + reset).

Semua tabel detail dan ringkasan yang memakai filteredRows harus ikut patuh ke selectedYear.

### 5) Dampak ke Perhitungan

Semua bagian yang saat ini pakai filteredRows dan filteredRowsKeluar harus otomatis mengikuti filter tahun, termasuk:

- Tabel Jenis Surat per Kategori
- Tabel Asal Surat Masuk
- Detail accordion (tanggal per baris)
- Angka total dan chart yang bersumber dari filtered rows

## Rencana Implementasi (Saat Diperintah)

### Fase 1 - Data Foundation

1. Tambah state selectedYear dan availableYears.
2. Buat computed availableYears dari data upload.
3. Pastikan reset state konsisten saat upload file baru.

### Fase 2 - Pipeline Filter

1. Refactor filteredRows/filteredRowsKeluar agar memproses:
   - koreksi tahun
   - filter bulan
   - filter tahun
2. Validasi hasil hitung tabel dan dashboard tetap konsisten.

### Fase 3 - UI Kontrol

1. Tambah dropdown Filter Tahun.
2. Tambah panel Koreksi Tahun (Dari/Ke + tombol Terapkan + Reset).
3. Tambah indikator status saat koreksi aktif.

### Fase 4 - QA Skenario Kritis

1. Upload file campuran 2024 dan 2025.
2. Pilih filter 2025 -> hanya data 2025 tampil.
3. Koreksi 2024 -> 2025.
4. Tetap di filter 2025 -> data eks-2024 sekarang ikut tampil.
5. Reset koreksi -> data kembali ke tahun asli.

## Acceptance Criteria

1. Dropdown Filter Tahun tersedia di Pengelompokkan.
2. Filter Tahun benar-benar menyaring data berdasarkan year dari kolom Tanggal.
3. Koreksi tahun Dari -> Ke bekerja dan langsung mempengaruhi hasil filter tahun.
4. Kombinasi filter bulan + filter tahun berjalan bersamaan tanpa konflik.
5. Data detail dan agregasi menampilkan hasil yang sama (konsisten).
6. Upload ulang file mereset state yang perlu direset agar tidak membawa rule lama yang salah konteks.

## Catatan Risiko

1. Nama kolom Tanggal bisa bervariasi (spasi/case) di file tertentu.
2. Format tanggal campuran (serial Excel, dd/mm/yyyy, yyyy-mm-dd) harus tetap aman diparse.
3. Rule koreksi tahun harus jelas cakupannya (global per tahun, bukan per baris), supaya UI tidak membingungkan.

## Kandidat File yang Akan Diubah (Nanti, Saat Implementasi)

- frontend/src/components/InsightTab.tsx

Tidak ada implementasi dilakukan pada tahap ini. Dokumen ini hanya rencana kerja.
