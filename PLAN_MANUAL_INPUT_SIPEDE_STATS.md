# Plan: Manual Input SIPEDE Statistics

## 📋 Overview

Menambahkan fitur input manual untuk statistik SIPEDE di dashboard Insight, terpisah dari fitur upload Excel surat masuk/keluar yang sudah ada.

## 🎯 Requirements

### User Story
Sebagai user, saya ingin bisa input data statistik SIPEDE secara manual (bukan dari scraping) untuk ditampilkan di grafik dashboard Insight.

### Data yang Diinput
User akan input 4 data statistik:
1. **Status Aktif**: Jumlah pegawai dengan status aktif (contoh: 131)
2. **Status Tidak Aktif**: Jumlah pegawai dengan status tidak aktif (contoh: 0)
3. **Tercatat SIPEDE**: Jumlah pegawai yang tercatat di SIPEDE (contoh: 131)
4. **Tidak Tercatat SIPEDE**: Jumlah pegawai yang tidak tercatat di SIPEDE (contoh: 8)

### Data yang Ditampilkan di Grafik
Hanya 2 data yang ditampilkan di grafik:
- **Tercatat SIPEDE**: 131
- **Tidak Tercatat SIPEDE**: 8

Data "Status Aktif" dan "Status Tidak Aktif" diinput tapi tidak ditampilkan di grafik (mungkin untuk keperluan lain atau future use).

## 🎨 UI/UX Design

### Lokasi
- **Tab**: Insight
- **Section**: Buat section baru "Statistik SIPEDE Manual" atau "Input Data SIPEDE"
- **Posisi**: Terpisah dari section upload Excel (surat masuk/keluar)

### Form Input
```
┌─────────────────────────────────────────┐
│  📊 Input Statistik SIPEDE              │
├─────────────────────────────────────────┤
│                                         │
│  Status Aktif:                          │
│  [_____________] (number input)         │
│                                         │
│  Status Tidak Aktif:                    │
│  [_____________] (number input)         │
│                                         │
│  Tercatat SIPEDE:                       │
│  [_____________] (number input)         │
│                                         │
│  Tidak Tercatat SIPEDE:                 │
│  [_____________] (number input)         │
│                                         │
│  [Simpan Data]  [Reset]                 │
│                                         │
│  Last updated: 2026-03-05 10:30         │
└─────────────────────────────────────────┘
```

### Grafik Display
Grafik akan menampilkan:
- **Pie Chart** atau **Bar Chart**
- **Data**: Tercatat SIPEDE vs Tidak Tercatat SIPEDE
- **Label**: Jumlah dan persentase

```
Tercatat SIPEDE: 131 (94.2%)
Tidak Tercatat SIPEDE: 8 (5.8%)
```

## 🏗️ Technical Architecture

### Frontend Components

#### 1. New Component: `ManualSipedeInput.tsx`
**Location**: `frontend/src/components/ManualSipedeInput.tsx`

**Props**:
```typescript
interface ManualSipedeInputProps {
  onDataUpdate?: (data: SipedeStats) => void;
}
```

**State**:
```typescript
interface SipedeStats {
  statusAktif: number;
  statusTidakAktif: number;
  tercatatSipede: number;
  tidakTercatatSipede: number;
  lastUpdated: string;
}
```

**Features**:
- Form dengan 4 input fields (number type)
- Validation: harus angka positif
- Button: Simpan dan Reset
- Display last updated timestamp
- Save to localStorage
- Toast notification on save

#### 2. Update Component: `InsightTab.tsx`
**Location**: `frontend/src/components/InsightTab.tsx`

**Changes**:
- Import `ManualSipedeInput` component
- Add new section untuk manual input
- Add new chart untuk display data SIPEDE
- Fetch data dari localStorage
- Update chart saat data berubah

### Data Storage

#### LocalStorage
**Key**: `sipede_manual_stats`

**Structure**:
```json
{
  "statusAktif": 131,
  "statusTidakAktif": 0,
  "tercatatSipede": 131,
  "tidakTercatatSipede": 8,
  "lastUpdated": "2026-03-05T10:30:00.000Z"
}
```

**Why LocalStorage?**
- Simple implementation
- No backend needed
- Data persists across sessions
- Per-browser storage (sesuai untuk single user)

**Alternative (Future Enhancement)**:
- Save to backend API
- Save to SQLite database
- Export/Import JSON file

### Chart Library
**Existing**: Recharts (sudah digunakan di InsightTab)

**Chart Type Options**:
1. **Pie Chart** (Recommended)
   - Visual comparison yang jelas
   - Menampilkan persentase
   - Cocok untuk 2 kategori

2. **Bar Chart**
   - Comparison yang jelas
   - Mudah dibaca nilai exact

3. **Donut Chart**
   - Variant dari Pie Chart
   - Lebih modern

## 📁 File Structure

```
frontend/src/
├── components/
│   ├── InsightTab.tsx              (UPDATE - add manual input section)
│   ├── ManualSipedeInput.tsx       (NEW - input form component)
│   └── SipedeStatsChart.tsx        (NEW - chart display component)
├── lib/
│   └── sipede-stats-storage.ts     (NEW - localStorage helper)
└── types/
    └── sipede-stats.ts             (NEW - TypeScript types)
```

## 🔄 Data Flow

```
User Input Form
    ↓
Validation
    ↓
Save to localStorage
    ↓
Trigger onDataUpdate callback
    ↓
InsightTab updates state
    ↓
Chart re-renders with new data
```

## 🎯 Implementation Steps

### Phase 1: Types & Storage
1. Create `frontend/src/types/sipede-stats.ts`
   - Define `SipedeStats` interface
   - Define validation types

2. Create `frontend/src/lib/sipede-stats-storage.ts`
   - `saveSipedeStats(data: SipedeStats): void`
   - `getSipedeStats(): SipedeStats | null`
   - `clearSipedeStats(): void`

### Phase 2: Input Component
3. Create `frontend/src/components/ManualSipedeInput.tsx`
   - Form with 4 number inputs
   - Validation logic
   - Save/Reset buttons
   - Toast notifications
   - Last updated display

### Phase 3: Chart Component
4. Create `frontend/src/components/SipedeStatsChart.tsx`
   - Pie Chart using Recharts
   - Display "Tercatat SIPEDE" vs "Tidak Tercatat SIPEDE"
   - Show count and percentage
   - Handle empty state

### Phase 4: Integration
5. Update `frontend/src/components/InsightTab.tsx`
   - Import new components
   - Add new section for manual input
   - Add chart display
   - Handle data updates
   - Styling and layout

### Phase 5: Testing & Polish
6. Test all scenarios:
   - Input validation
   - Save/Reset functionality
   - Chart rendering
   - LocalStorage persistence
   - Empty state handling

## 🎨 UI Design Details

### Color Scheme
- **Tercatat SIPEDE**: Green (#10b981) - positive
- **Tidak Tercatat SIPEDE**: Red (#ef4444) - needs attention

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Insight Tab                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Existing sections: Surat Masuk/Keluar charts]        │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📊 Statistik SIPEDE                                    │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │                 │  │                             │  │
│  │  Input Form     │  │  Pie Chart                  │  │
│  │  (4 fields)     │  │  - Tercatat: 131 (94.2%)    │  │
│  │                 │  │  - Tidak Tercatat: 8 (5.8%) │  │
│  │  [Simpan]       │  │                             │  │
│  │                 │  │                             │  │
│  └─────────────────┘  └─────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## ✅ Validation Rules

### Input Validation
1. **Required**: Semua field harus diisi
2. **Type**: Harus angka (number)
3. **Range**: Harus >= 0 (tidak boleh negatif)
4. **Integer**: Harus bilangan bulat (tidak boleh desimal)

### Business Logic Validation
1. **Consistency Check** (Optional warning):
   - `tercatatSipede` + `tidakTercatatSipede` should equal total pegawai
   - Show warning jika tidak konsisten (tapi tetap allow save)

## 🔮 Future Enhancements

### Phase 2 (Optional)
1. **Export/Import**
   - Export data to JSON
   - Import data from JSON
   - Backup/Restore functionality

2. **History**
   - Save history of changes
   - View previous data
   - Compare over time

3. **Backend Integration**
   - Save to database
   - Multi-user support
   - Sync across devices

4. **Additional Charts**
   - Trend over time
   - Comparison with scraped data
   - Status Aktif/Tidak Aktif chart

5. **Validation Enhancement**
   - Cross-check with scraped data
   - Auto-calculate totals
   - Suggest values based on history

## 📝 Notes

### Separation from Excel Upload
- **Excel Upload**: Untuk surat masuk/keluar (existing feature)
- **Manual Input**: Untuk statistik SIPEDE (new feature)
- **No Overlap**: Dua fitur terpisah, tidak saling mempengaruhi

### Data Independence
- Manual input data disimpan terpisah dari scraped data
- Tidak mempengaruhi data dari SIPEDE scraper
- User bisa input data manual meskipun scraper tidak jalan

### Use Case
- User punya data statistik SIPEDE dari sumber lain (manual count, report, etc.)
- User ingin visualisasi data tanpa harus scraping
- User ingin compare manual data dengan scraped data (future)

## 🚀 Success Criteria

1. ✅ User bisa input 4 data statistik SIPEDE
2. ✅ Data tersimpan di localStorage
3. ✅ Grafik menampilkan "Tercatat SIPEDE" vs "Tidak Tercatat SIPEDE"
4. ✅ Form validation berfungsi dengan baik
5. ✅ UI responsive dan user-friendly
6. ✅ Data persist setelah refresh browser
7. ✅ Terpisah dari fitur upload Excel yang sudah ada

## 📚 References

- Recharts Documentation: https://recharts.org/
- LocalStorage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- React Hook Form (optional): https://react-hook-form.com/

---

**Status**: Planning Phase
**Next Step**: Review plan dengan user, lalu implementasi setelah approval
