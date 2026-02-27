// Mapping: Nama Jenis Surat (UPPERCASE) → 7 Kategori
// Digunakan untuk auto-mapping saat upload Excel kolom "Jenis Surat"

export const JENIS_KATEGORI_LIST = [
    'Surat Edaran',
    'Keputusan / Surat Perintah / Surat Tugas',
    'Undangan Internal / Eksternal',
    'Surat Pengantar / Lampiran',
    'Nota Dinas / Memorandum',
    'Laporan',
    'Biasa Internal / Eksternal',
];

export interface JenisEntry {
    jenis: string;        // nama surat individual dari Excel
    countMasuk: number;   // jumlah kemunculan surat masuk
    countKeluar: number;  // jumlah kemunculan surat keluar
    kategori: string;     // kategori yang di-assign ('' jika belum)
}

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
    'SURAT KEPUTUSAN': 'Keputusan / Surat Perintah / Surat Tugas',
    'KEPUTUSAN / SURAT PERINTAH / SURAT TUGAS': 'Keputusan / Surat Perintah / Surat Tugas',

    // === Undangan Internal / Eksternal ===
    'UNDANGAN': 'Undangan Internal / Eksternal',
    'UNDANGAN INTERNAL': 'Undangan Internal / Eksternal',
    'UNDANGAN EKSTERNAL': 'Undangan Internal / Eksternal',
    'UNDANGAN INTERNAL / EKSTERNAL': 'Undangan Internal / Eksternal',

    // === Surat Pengantar / Lampiran ===
    'SURAT PENGANTAR': 'Surat Pengantar / Lampiran',
    'SURAT PENGANTAR / LAMPIRAN': 'Surat Pengantar / Lampiran',
    'LAMPIRAN': 'Surat Pengantar / Lampiran',
    'PENGANTAR': 'Surat Pengantar / Lampiran',

    // === Nota Dinas / Memorandum ===
    'NOTA DINAS': 'Nota Dinas / Memorandum',
    'NOTA DINAS / MEMORANDUM': 'Nota Dinas / Memorandum',
    'MEMORANDUM': 'Nota Dinas / Memorandum',
    'MEMO': 'Nota Dinas / Memorandum',

    // === Laporan ===
    'LAPORAN': 'Laporan',
    'LAP': 'Laporan',

    // === Biasa Internal / Eksternal ===
    'BIASA': 'Biasa Internal / Eksternal',
    'BIASA INTERNAL': 'Biasa Internal / Eksternal',
    'BIASA EKSTERNAL': 'Biasa Internal / Eksternal',
    'BIASA INTERNAL / EKSTERNAL': 'Biasa Internal / Eksternal',
    'SURAT BIASA': 'Biasa Internal / Eksternal',
};
