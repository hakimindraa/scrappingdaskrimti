# PLAN UI - Manual SIPEDE Statistics Input

## 📋 RINGKASAN
Plan UI untuk fitur input manual statistik SIPEDE yang akan ditambahkan ke InsightTab. Fitur ini memungkinkan user untuk input data statistik pegawai SIPEDE secara manual dan melihat visualisasi dalam bentuk pie chart.

---

## 🎯 TUJUAN
- Memberikan cara mudah untuk input statistik SIPEDE tanpa perlu upload Excel
- Menampilkan visualisasi data "Tercatat SIPEDE" vs "Tidak Tercatat SIPEDE"
- Menyimpan data di localStorage agar persisten
- Terpisah dari fitur upload Excel yang sudah ada

---

## 📐 STRUKTUR UI

### 1. LOKASI PENEMPATAN

Fitur ini terdiri dari 2 bagian yang terpisah:

**A. FORM INPUT** → Di section "Pengelompokan Data Surat" (bagian atas)
**B. GRAFIK** → Di Dashboard SIPEDE, Card "Persentase User SIPEDE" (menggantikan donut hardcode)

```
┌─────────────────────────────────────────────────────────┐
│  InsightTab                                             │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │  PENGELOMPOKAN DATA SURAT                         │  │
│  │  - Upload Excel (existing)                        │  │
│  │  - [BARU] Form Input SIPEDE (4 fields)           │  │ ← Form Input Baru
│  │  - Tab Jenis/Asal (existing)                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  DASHBOARD SIPEDE                                 │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ Card: PERSENTASE USER SIPEDE                │  │  │
│  │  │ [BARU] Pie Chart (Tercatat vs Tidak Tercatat)│  │ ← Grafik Baru
│  │  │ (menggantikan 3 donut hardcode)              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 DESAIN KOMPONEN

### A. SECTION HEADER
```
┌─────────────────────────────────────────────────────────────┐
│  📊 STATISTIK SIPEDE MANUAL                                 │
│  Input data statistik pegawai SIPEDE secara manual          │
└─────────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: Gradient ungu muda (sesuai tema SIPEDE)
- Icon: 📊 atau ChartPieIcon dari Heroicons
- Font: Bold untuk judul, regular untuk subtitle
- Padding: 1.5rem
- Border radius: 0.75rem

---

### B. FORM INPUT (4 Fields)

```
┌─────────────────────────────────────────────────────────────┐
│  INPUT DATA PEGAWAI                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Status Aktif         │  │ Status Tidak Aktif   │        │
│  │ [    131    ]        │  │ [      0      ]      │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │ Tercatat SIPEDE      │  │ Tidak Tercatat SIPEDE│        │
│  │ [    131    ]        │  │ [      8      ]      │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                              │
│  [💾 Simpan Data]                                           │
│                                                              │
│  ✅ Data berhasil disimpan! (auto-hide setelah 3 detik)    │
└─────────────────────────────────────────────────────────────┘
```

**Detail Komponen:**

1. **Input Fields (4 buah)**
   - Type: `number`
   - Min value: `0`
   - Default values:
     - Status Aktif: `131`
     - Status Tidak Aktif: `0`
     - Tercatat SIPEDE: `131`
     - Tidak Tercatat SIPEDE: `8`
   - Width: 48% (2 kolom layout)
   - Styling:
     - Border: 2px solid #e5e7eb
     - Focus: Border ungu (#7c3aed)
     - Padding: 0.75rem
     - Font size: 1rem
     - Text align: center
     - Border radius: 0.5rem

2. **Label Fields**
   - Font weight: 600
   - Color: #1e1b4b (dark purple)
   - Margin bottom: 0.5rem
   - Font size: 0.875rem

3. **Button Simpan**
   - Background: Gradient ungu (#7c3aed → #c026d3)
   - Color: White
   - Icon: 💾 atau CheckCircleIcon
   - Padding: 0.75rem 1.5rem
   - Border radius: 0.5rem
   - Hover: Scale 1.02, shadow
   - Disabled state: Opacity 0.5, cursor not-allowed

4. **Success Message**
   - Background: #d1fae5 (green-100)
   - Color: #065f46 (green-800)
   - Icon: ✅ CheckCircleIcon
   - Padding: 0.75rem 1rem
   - Border radius: 0.5rem
   - Border left: 4px solid #10b981
   - Animation: Fade in, auto-hide setelah 3 detik

5. **Error Message** (jika ada validasi error)
   - Background: #fee2e2 (red-100)
   - Color: #991b1b (red-800)
   - Icon: ⚠️ ExclamationCircleIcon
   - Styling sama dengan success message
   - Tidak auto-hide (harus diperbaiki user)

**Validasi:**
- Hanya terima angka (numeric)
- Tidak boleh negatif
- Tidak boleh kosong
- Error message spesifik per field

---

### C. PIE CHART VISUALIZATION

```
┌─────────────────────────────────────────────────────────────┐
│  VISUALISASI DATA SIPEDE                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    ╱────────╲                               │
│                  ╱            ╲                             │
│                 │   Tercatat   │  94.2%                     │
│                 │    SIPEDE    │  (131)                     │
│                  ╲            ╱                             │
│                    ╲────────╱                               │
│                      │  6%  │  Tidak Tercatat (8)          │
│                                                              │
│  Legend:                                                     │
│  🟣 Tercatat SIPEDE: 131 pegawai (94.2%)                   │
│  🟠 Tidak Tercatat SIPEDE: 8 pegawai (5.8%)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Detail Komponen:**

1. **Pie Chart (Recharts)**
   - Library: Recharts (sudah digunakan di InsightTab)
   - Type: `<PieChart>` dengan `<Pie>`
   - Size: 300x300px
   - Data: 2 segments
     - Tercatat SIPEDE (warna ungu #7c3aed)
     - Tidak Tercatat SIPEDE (warna orange #f59e0b)
   - Label: Tampilkan persentase + jumlah
   - Animation: Smooth transition saat data berubah

2. **Legend**
   - Position: Di bawah chart
   - Format: `🟣 Label: Jumlah (Persentase)`
   - Font size: 0.875rem
   - Color: Sesuai segment chart

3. **Empty State** (jika belum ada data)
   ```
   ┌─────────────────────────────────────┐
   │         📊                          │
   │   Belum ada data                    │
   │   Silakan input data di atas        │
   └─────────────────────────────────────┘
   ```

---

## 📱 RESPONSIVE DESIGN

### Desktop (> 1024px)
- Form: 2 kolom (2x2 grid)
- Chart: Di samping form (side by side)
- Layout: Flexbox horizontal

### Tablet (768px - 1024px)
- Form: 2 kolom (2x2 grid)
- Chart: Di bawah form
- Layout: Flexbox vertical

### Mobile (< 768px)
- Form: 1 kolom (4 fields stacked)
- Chart: Di bawah form, width 100%
- Button: Full width

---

## 🎨 COLOR PALETTE

Mengikuti tema SIPEDE yang sudah ada:

- **Primary Purple**: #7c3aed (violet-600)
- **Secondary Purple**: #c026d3 (fuchsia-600)
- **Orange**: #f59e0b (amber-500)
- **Background**: #f1f0f6 (gray-100 dengan hint purple)
- **Text Dark**: #1e1b4b (violet-950)
- **Text Light**: #64748b (slate-500)
- **Border**: #e5e7eb (gray-200)
- **Success**: #10b981 (green-500)
- **Error**: #ef4444 (red-500)

---

## 🔄 INTERAKSI & BEHAVIOR

### 1. Load Awal
- Baca data dari localStorage
- Jika ada data tersimpan → Populate form + tampilkan chart
- Jika tidak ada data → Gunakan default values + tampilkan chart default

### 2. User Input
- User mengubah nilai di salah satu field
- Validasi real-time (tidak boleh negatif, harus numeric)
- Button "Simpan" aktif jika semua field valid

### 3. Simpan Data
- User klik button "Simpan"
- Validasi semua field
- Jika valid:
  - Simpan ke localStorage
  - Update chart dengan animasi smooth
  - Tampilkan success message (3 detik)
- Jika tidak valid:
  - Tampilkan error message spesifik
  - Highlight field yang error

### 4. Update Chart
- Chart update otomatis setelah data disimpan
- Animasi smooth transition (duration: 500ms)
- Persentase dihitung ulang otomatis

---

## 📦 KOMPONEN YANG AKAN DIBUAT

### 1. `ManualSipedeInput.tsx`
**Props:**
```typescript
interface ManualSipedeInputProps {
  onDataSaved?: (data: SipedeStats) => void;
}
```

**State:**
- `statusAktif: number`
- `statusTidakAktif: number`
- `tercatatSipede: number`
- `tidakTercatatSipede: number`
- `showSuccess: boolean`
- `errors: Record<string, string>`

**Methods:**
- `handleInputChange(field, value)`
- `validateField(field, value)`
- `handleSave()`
- `loadFromStorage()`

---

### 2. `SipedeStatsChart.tsx`
**Props:**
```typescript
interface SipedeStatsChartProps {
  tercatatSipede: number;
  tidakTercatatSipede: number;
}
```

**Computed:**
- `total = tercatatSipede + tidakTercatatSipede`
- `percentTercatat = (tercatatSipede / total) * 100`
- `percentTidakTercatat = (tidakTercatatSipede / total) * 100`

**Chart Data:**
```typescript
const chartData = [
  { name: 'Tercatat SIPEDE', value: tercatatSipede, color: '#7c3aed' },
  { name: 'Tidak Tercatat SIPEDE', value: tidakTercatatSipede, color: '#f59e0b' }
];
```

---

### 3. `sipede-stats-storage.ts`
**Functions:**
```typescript
export function saveSipedeStats(data: SipedeStats): void
export function loadSipedeStats(): SipedeStats | null
export function clearSipedeStats(): void
```

**LocalStorage Key:** `'sipede-manual-stats'`

---

### 4. `sipede-stats.ts` (Types)
```typescript
export interface SipedeStats {
  statusAktif: number;
  statusTidakAktif: number;
  tercatatSipede: number;
  tidakTercatatSipede: number;
  lastUpdated?: string; // ISO timestamp
}
```

---

## 🔧 INTEGRASI KE INSIGHTTAB

### Struktur Baru InsightTab:
```tsx
export default function InsightTab() {
  // ... existing state ...

  return (
    <div className="insight-wrapper">
      
      {/* ===== SECTION BARU: MANUAL SIPEDE INPUT ===== */}
      <div className="sipede-manual-section">
        <div className="sipede-manual-header">
          <h2>📊 STATISTIK SIPEDE MANUAL</h2>
          <p>Input data statistik pegawai SIPEDE secara manual</p>
        </div>
        
        <div className="sipede-manual-content">
          <ManualSipedeInput />
        </div>
      </div>

      {/* ===== SECTION EXISTING: PENGELOMPOKAN ===== */}
      <div className="pg-section">
        {/* ... existing code ... */}
      </div>

      {/* ===== SECTION EXISTING: DASHBOARD ===== */}
      <div className="insight-page" ref={dashboardRef}>
        {/* ... existing code ... */}
      </div>
      
    </div>
  );
}
```

---

## 📏 SPACING & LAYOUT

```
┌─────────────────────────────────────────────────────────────┐
│  Padding: 2rem                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  STATISTIK SIPEDE MANUAL                              │  │
│  │  Margin bottom: 2rem                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Gap: 1.5rem                                                 │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PENGELOMPOKAN DATA SURAT                             │  │
│  │  Margin bottom: 2rem                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Gap: 1.5rem                                                 │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  DASHBOARD SIPEDE                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Spacing Values:**
- Section padding: `2rem`
- Section margin bottom: `2rem`
- Gap between sections: `1.5rem`
- Card padding: `1.5rem`
- Input field gap: `1rem`
- Button margin top: `1.5rem`

---

## ✅ CHECKLIST IMPLEMENTASI

### Phase 1: Setup & Types
- [ ] Buat `frontend/src/types/sipede-stats.ts`
- [ ] Buat `frontend/src/lib/sipede-stats-storage.ts`
- [ ] Test localStorage functions

### Phase 2: Chart Component
- [ ] Buat `frontend/src/components/SipedeStatsChart.tsx`
- [ ] Implementasi Recharts PieChart
- [ ] Styling & responsive
- [ ] Test dengan data dummy

### Phase 3: Input Component
- [ ] Buat `frontend/src/components/ManualSipedeInput.tsx`
- [ ] Implementasi form dengan 4 fields
- [ ] Validasi input
- [ ] Integrasi dengan localStorage
- [ ] Success/error messages
- [ ] Integrasi dengan SipedeStatsChart

### Phase 4: Integration
- [ ] Update `frontend/src/components/InsightTab.tsx`
- [ ] Tambahkan section baru di atas
- [ ] Styling sesuai tema existing
- [ ] Test responsive design

### Phase 5: Testing
- [ ] Test input validation
- [ ] Test localStorage persistence
- [ ] Test chart update
- [ ] Test responsive di berbagai ukuran
- [ ] Test browser compatibility

---

## 🎯 ACCEPTANCE CRITERIA

✅ User dapat input 4 field statistik SIPEDE
✅ Validasi input: hanya numeric, tidak negatif
✅ Data tersimpan di localStorage
✅ Data persisten setelah refresh browser
✅ Pie chart menampilkan "Tercatat" vs "Tidak Tercatat"
✅ Chart update smooth dengan animasi
✅ Success message muncul setelah save (3 detik)
✅ Error message muncul jika validasi gagal
✅ Responsive di desktop, tablet, mobile
✅ Styling konsisten dengan tema SIPEDE existing
✅ Tidak mengganggu fitur upload Excel yang ada

---

## 📝 CATATAN TAMBAHAN

1. **Pemisahan Concern**: Fitur ini sepenuhnya terpisah dari upload Excel. Tidak ada interaksi antara keduanya.

2. **Data Persistence**: Menggunakan localStorage karena:
   - Tidak perlu backend
   - Data bersifat lokal per user
   - Simple dan cepat

3. **Chart Library**: Menggunakan Recharts karena:
   - Sudah digunakan di InsightTab (konsistensi)
   - Mudah digunakan
   - Support animasi smooth

4. **Default Values**: Sesuai permintaan user:
   - Status Aktif: 131
   - Status Tidak Aktif: 0
   - Tercatat SIPEDE: 131
   - Tidak Tercatat SIPEDE: 8

5. **Display di Chart**: Hanya menampilkan "Tercatat SIPEDE" vs "Tidak Tercatat SIPEDE" (2 segments), bukan 4 fields.

---

## 🚀 READY TO IMPLEMENT

Plan UI ini sudah lengkap dan siap untuk diimplementasikan. Tunggu approval dari user sebelum mulai coding.
