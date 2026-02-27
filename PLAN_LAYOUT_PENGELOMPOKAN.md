# PLAN: Layout Pengelompokan — Tab + Filter Terpisah

## Masalah

1. **Tabel kepotong** — 2 panel side-by-side butuh ~1800px, layar cuma ~1366px
2. **Filter sidebar memakan ruang** — 220px per panel, tabel jadi sempit

---

## Solusi: Tab Switcher + Filter Dropdown Terpisah Per Tab

### Struktur

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PENGELOMPOKAN DATA SURAT                              [Upload Excel]   │
├──────────────────────────────────────────────────────────────────────────┤
│  Upload berhasil! 7,628 baris diproses                                  │
├──────────────────────────────────────────────────────────────────────────┤
│  Filter Bulan: [Januari ▼] — [Desember ▼]                               │
├──────────────────────────────────────────────────────────────────────────┤
│  [🔘 JENIS SURAT ✓8 ✗7]       [  ASAL SURAT ✓478 ✗250]                │
├──────────────────────────────────────────────────────────────────────────┤
│  (isi tab aktif — lihat detail di bawah)                                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Tab 1: JENIS SURAT PER KATEGORI

Filter: **7 kategori jenis surat** (dari `JENIS_KATEGORI_LIST`)

```
├──────────────────────────────────────────────────────────────────────────┤
│  15 dari 15 jenis                          [▼ Filter Kategori]          │
├──────────────────────────────────────────────────────────────────────────┤
│  JENIS SURAT                              │ JUMLAH │ KATEGORI           │
│  BIASA INTERNAL / EKSTERNAL               │ 6.350  │ Biasa Int/Eks      │
│  SURAT PENGANTAR                          │   810  │ Surat Peng/Lamp    │
│  SURAT UNDANGAN EKSTERNAL                 │   165  │ ⚠ Belum — Assign   │
│  KEPUTUSAN                                │    25  │ Keputusan/SP/ST    │
│  NOTA DINAS                               │   121  │ Nota Dinas/Memo    │
│  LAPINSUS                                 │    23  │ ⚠ Belum — Assign   │
│  SURAT PERINTAH / SURAT TUGAS            │    54  │ Keputusan/SP/ST    │
│  ...                                      │   ...  │ ...                │
├──────────────────────────────────────────────────────────────────────────┤
│  ✓ Sudah: 8  ✗ Belum: 7       [☐ Hanya belum dikategori]               │
└──────────────────────────────────────────────────────────────────────────┘
```

### Filter Kategori Expanded (klik "▼ Filter Kategori"):
```
│  15 dari 15 jenis                          [▲ Filter Kategori]          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ☑ Surat Edaran (1)                ☑ Nota Dinas/Memo (2)       │     │
│  │ ☑ Keputusan/SP/ST (1)             ☑ Laporan (1)               │     │
│  │ ☑ Undangan Int/Eks (0)            ☑ Biasa Int/Eks (1)         │     │
│  │ ☑ Surat Peng/Lampiran (2)                                     │     │
│  └────────────────────────────────────────────────────────────────┘     │
```

**Checkbox list:** `JENIS_KATEGORI_LIST` (7 item)
- Surat Edaran
- Keputusan / Surat Perintah / Surat Tugas
- Undangan Internal / Eksternal
- Surat Pengantar / Lampiran
- Nota Dinas / Memorandum
- Laporan
- Biasa Internal / Eksternal

---

## Tab 2: ASAL SURAT MASUK

Filter: **8 kelompok asal surat** (dari `KELOMPOK_LIST` + custom groups)

```
├──────────────────────────────────────────────────────────────────────────┤
│  728 dari 728 data                         [▼ Filter Kelompok]          │
├──────────────────────────────────────────────────────────────────────────┤
│  ASAL                                     │ JUMLAH │ KELOMPOK           │
│  KEJAKSAAN NEGERI KARIMUN                 │ 1.215  │ Kejaksaan          │
│  KEJAKSAAN NEGERI KEPULAUAN ANAMBAS       │    46  │ Kejaksaan          │
│  GUBERNUR KEPRI                           │    77  │ Gubernur/Pemda     │
│  FORKORINDO                               │   159  │ Instansi/BUMN      │
│  KAROPEG                                  │   288  │ ⚠ Belum — Assign   │
│  ...                                      │   ...  │ ...                │
├──────────────────────────────────────────────────────────────────────────┤
│  ✓ Sudah: 478  ✗ Belum: 250   [☐ Hanya belum dikelompok]  [+ Buat Kelompok Baru] │
└──────────────────────────────────────────────────────────────────────────┘
```

### Filter Kelompok Expanded (klik "▼ Filter Kelompok"):
```
│  728 dari 728 data                         [▲ Filter Kelompok]          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │ ☑ Kejaksaan (178)                 ☑ Kepolisian dan BNN (22)   │     │
│  │ ☑ Kemenkeu (14)                   ☑ Gubernur / Pemda (52)     │     │
│  │ ☑ Pengadilan (8)                  ☑ Instansi Lainnya (89)     │     │
│  │ ☑ Perbankan (3)                   ☑ Aliansi/Pribadi/LSM (112) │     │
│  └────────────────────────────────────────────────────────────────┘     │
```

**Checkbox list:** `KELOMPOK_LIST` (8 item) + custom groups
- Kejaksaan
- Kemenkeu
- Pengadilan
- Perbankan
- Kepolisian dan BNN
- Gubernur / Pemda
- Instansi Lainnya / BUMN
- Aliansi Kemasyarakatan / Pribadi / LSM
- *(+ custom groups yang dibuat user)*

---

## Perbandingan: Filter Terpisah

| Aspek | Tab JENIS | Tab ASAL |
|-------|-----------|----------|
| Tombol | "Filter Kategori ▼" | "Filter Kelompok ▼" |
| Isi dropdown | 7 kategori (`JENIS_KATEGORI_LIST`) | 8+ kelompok (`KELOMPOK_LIST` + custom) |
| State toggle | `showJenisFilter` | `showAsalFilter` |
| State checked | `checkedJenisGroups` | `checkedGroups` |
| Footer kiri | ✓ Sudah: X  ✗ Belum: Y | ✓ Sudah: X  ✗ Belum: Y |
| Footer checkbox | "Hanya belum dikategori" | "Hanya belum dikelompok" |
| Footer extra | *(tidak ada)* | **"+ Buat Kelompok Baru"** |

Masing-masing tab memiliki **filter dropdown independen** dengan state buka/tutup sendiri dan daftar checkbox yang **berbeda**.

---

## State

```typescript
// Tab aktif
const [activeTab, setActiveTab] = useState<'jenis' | 'asal'>('jenis');

// Toggle filter dropdown (terpisah per tab)
const [showJenisFilter, setShowJenisFilter] = useState(false);
const [showAsalFilter, setShowAsalFilter] = useState(false);

// State yang sudah ada (tidak berubah):
// checkedJenisGroups, showJenisUnmappedOnly  → untuk tab Jenis
// checkedGroups, showUnmappedOnly            → untuk tab Asal
```

---

## JSX Structure

```tsx
{/* Tab Bar */}
<div className="pg-tab-bar">
    <button className={`pg-tab ${activeTab === 'jenis' ? 'pg-tab-active' : ''}`}
        onClick={() => setActiveTab('jenis')}>
        JENIS SURAT PER KATEGORI
        <span className="pg-badge-sm green"><CheckCircleIcon /> {jenisSudahCount}</span>
        <span className="pg-badge-sm red"><XCircleIcon /> {jenisBelumCount}</span>
    </button>
    <button className={`pg-tab ${activeTab === 'asal' ? 'pg-tab-active' : ''}`}
        onClick={() => setActiveTab('asal')}>
        ASAL SURAT MASUK
        <span className="pg-badge-sm green"><CheckCircleIcon /> {sudahCount}</span>
        <span className="pg-badge-sm red"><XCircleIcon /> {belumCount}</span>
    </button>
</div>

{/* === TAB JENIS === */}
{activeTab === 'jenis' && (
    <div className="pg-tab-content">
        {/* Toolbar */}
        <div className="pg-toolbar">
            <span>Menampilkan {filteredJenis.length} dari {jenisData.length} jenis</span>
            <button className="pg-filter-toggle" onClick={() => setShowJenisFilter(!showJenisFilter)}>
                Filter Kategori {showJenisFilter ? '▲' : '▼'}
            </button>
        </div>
        {/* Filter Panel — JENIS KATEGORI (7 item) */}
        {showJenisFilter && (
            <div className="pg-filter-panel">
                <div className="pg-filter-grid">
                    {allJenisKategori.map(g => (
                        <label className="pg-filter-chip" key={g}>
                            <input type="checkbox" checked={checkedJenisGroups.has(g)} onChange={...} />
                            <span>{g}</span>
                            <span>({jenisGroupCount(g)})</span>
                        </label>
                    ))}
                </div>
            </div>
        )}
        {/* Tabel Jenis (full width) */}
        <div className="pg-table-scroll">
            <table>...</table>
        </div>
        {/* Footer */}
        <div className="pg-table-footer">
            <span>✓ Sudah: {jenisSudahCount}</span>
            <span>✗ Belum: {jenisBelumCount}</span>
            <label><input type="checkbox" .../> Hanya belum dikategori</label>
        </div>
    </div>
)}

{/* === TAB ASAL === */}
{activeTab === 'asal' && (
    <div className="pg-tab-content">
        {/* Toolbar */}
        <div className="pg-toolbar">
            <span>Menampilkan {filteredAsal.length} dari {asalData.length} data</span>
            <button className="pg-filter-toggle" onClick={() => setShowAsalFilter(!showAsalFilter)}>
                Filter Kelompok {showAsalFilter ? '▲' : '▼'}
            </button>
        </div>
        {/* Filter Panel — KELOMPOK (8+ item, beda dari jenis) */}
        {showAsalFilter && (
            <div className="pg-filter-panel">
                <div className="pg-filter-grid">
                    {allKelompok.map(g => (
                        <label className="pg-filter-chip" key={g}>
                            <input type="checkbox" checked={checkedGroups.has(g)} onChange={...} />
                            <span>{g}</span>
                            <span>({groupCount(g)})</span>
                        </label>
                    ))}
                </div>
            </div>
        )}
        {/* Tabel Asal (full width) */}
        <div className="pg-table-scroll">
            <table>...</table>
        </div>
        {/* Footer */}
        <div className="pg-table-footer">
            <span>✓ Sudah: {sudahCount}</span>
            <span>✗ Belum: {belumCount}</span>
            <label><input type="checkbox" .../> Hanya belum dikelompok</label>
            <button>+ Buat Kelompok Baru</button>
        </div>
    </div>
)}
```

---

## CSS Baru

```css
.pg-tab-bar {
    display: flex;
    background: #f8f7fc;
    border-bottom: 2px solid #e8e5f0;
}
.pg-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.85rem 1.25rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: #94a3b8;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
}
.pg-tab:hover { color: #7c3aed; background: #f0ecf9; }
.pg-tab-active { color: #312e81; border-bottom-color: #7c3aed; background: #fff; }

.pg-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.25rem;
    font-size: 0.82rem;
    color: #64748b;
    border-bottom: 1px solid #f0eef5;
    background: #fdfcff;
}
.pg-filter-toggle {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.9rem;
    background: #f0ecf9;
    border: 1px solid #e8e5f0;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #7c3aed;
    cursor: pointer;
}
.pg-filter-panel {
    padding: 0.75rem 1.25rem;
    background: #f8f7fc;
    border-bottom: 1px solid #e8e5f0;
}
.pg-filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.4rem;
}
.pg-filter-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.82rem;
    cursor: pointer;
}

.pg-table-footer {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.75rem 1.25rem;
    background: #faf9fd;
    border-top: 2px solid #e8e5f0;
    flex-wrap: wrap;
}
```

## CSS Dihapus

| Class | Alasan |
|-------|--------|
| `.pg-dual-panel` | Layout side-by-side dihapus |
| `.pg-panel`, `.pg-panel:last-child` | Panel terpisah tidak ada lagi |
| `.pg-panel-header` | Badge pindah ke tab |
| `.pg-panel-badges` | Badge pindah ke tab |
| `.pg-sidebar`, `.pg-sidebar-compact` | Sidebar diganti dropdown filter |
| `.pg-sidebar-title` | Diganti tombol toggle |
| `.pg-sidebar-divider` | Tidak perlu lagi |
| `.pg-sidebar-summary` | Pindah ke footer |
| `.pg-unmapped-toggle` | Pindah ke footer |
| `.pg-create-btn` (full-width) | Pindah ke footer (inline kecil) |

---

## Yang Tidak Berubah
- Filter dropdown bulan (tetap di atas tab bar)
- Upload Excel, notifikasi upload
- Semua modal: assign jenis, assign asal, create kelompok baru
- Dashboard SIPEDE di bawah
- Fungsionalitas checkbox filter, assign, create group

---

## File Yang Diubah

| File | Aksi |
|------|------|
| `frontend/src/components/InsightTab.tsx` | Refactor JSX layout + CSS |

---

## Ringkasan Langkah
1. Tambah state: `activeTab`, `showJenisFilter`, `showAsalFilter`
2. Hapus `pg-dual-panel > pg-panel` structure
3. Tambah tab bar JSX (2 button)
4. Tab Jenis: toolbar + filter dropdown **KATEGORI** (7 item) + tabel + footer
5. Tab Asal: toolbar + filter dropdown **KELOMPOK** (8+ item) + tabel + footer + "Buat Kelompok Baru"
6. Hapus CSS sidebar/panel, tambah CSS tab/toolbar/filter/footer
7. Build & test
