# Design: Fitur Override Tahun Data Excel

## UI Design Overview
Fitur override tahun akan ditambahkan di bagian "Pengelompokan Data Surat" (InsightTab), mengikuti style yang sudah ada dengan warna hijau (#059669) sebagai tema utama.

## Visual Layout

### Lokasi Penempatan
Fitur ini akan ditempatkan di antara:
1. **Upload Success Notification** (jika ada)
2. **Filter Bulan** yang sudah ada

```
┌─────────────────────────────────────────────────────────────────┐
│  📥 Surat Masuk (.xlsx)      📤 Surat Keluar (.xlsx)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  ✅ Upload berhasil! 1,234 baris • 45 jenis • 67 asal          │
│  [Grafik Jenis ↓]  [Grafik Asal ↓]                      [×]    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  📅 Tahun Terdeteksi: 2024-2025                                 │
│  ✏️ Override Tahun: [Dropdown: Gunakan Tahun Asli ▼]           │
│  🔄 Reset ke Tahun Asli                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  Filter Bulan: [Januari ▼] — [Desember ▼]                      │
└─────────────────────────────────────────────────────────────────┘
```

## Component Structure

### 1. Year Override Section (New Component)

#### HTML Structure
```tsx
{dataYear && (
    <div className="pg-year-override">
        <div className="pg-year-info">
            <span className="pg-year-icon">📅</span>
            <div className="pg-year-info-text">
                <span className="pg-year-info-label">Tahun Terdeteksi:</span>
                <span className="pg-year-info-value">
                    {dataYear.min === dataYear.max 
                        ? dataYear.min 
                        : `${dataYear.min} - ${dataYear.max}`}
                </span>
            </div>
        </div>
        
        <div className="pg-year-control">
            <label className="pg-year-label">
                <span className="pg-year-label-icon">✏️</span>
                Override Tahun:
            </label>
            <select 
                className="pg-year-select"
                value={tahunOverride || ''}
                onChange={e => setTahunOverride(e.target.value ? Number(e.target.value) : null)}
            >
                <option value="">Gunakan Tahun Asli</option>
                {Array.from({ length: 11 }, (_, i) => 2020 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>
        
        {tahunOverride && (
            <button 
                className="pg-year-reset"
                onClick={() => setTahunOverride(null)}
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                </svg>
                Reset ke Tahun Asli
            </button>
        )}
    </div>
)}
```

### 2. CSS Styling (Following InsightTab Pattern)

```css
/* ===== Year Override Section ===== */
.pg-year-override {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.85rem 1.75rem;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border-bottom: 1px solid #a7f3d0;
    flex-wrap: wrap;
}

.pg-year-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.pg-year-icon {
    font-size: 1.3rem;
    line-height: 1;
}

.pg-year-info-text {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.pg-year-info-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #065f46;
    text-transform: uppercase;
    letter-spacing: 0.3px;
}

.pg-year-info-value {
    font-size: 1.1rem;
    font-weight: 800;
    color: #064e3b;
    letter-spacing: 0.5px;
}

.pg-year-control {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.pg-year-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: #064e3b;
}

.pg-year-label-icon {
    font-size: 1rem;
    line-height: 1;
}

.pg-year-select {
    padding: 0.5rem 0.85rem;
    border: 1.5px solid #a7f3d0;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 700;
    color: #064e3b;
    background: #fff;
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
    min-width: 180px;
}

.pg-year-select:hover {
    border-color: #6ee7b7;
    background: #f0fdf4;
}

.pg-year-select:focus {
    border-color: #059669;
    box-shadow: 0 0 0 3px rgba(5,150,105,0.12);
    background: #fff;
}

.pg-year-reset {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: #fff;
    border: 1.5px solid #a7f3d0;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 700;
    color: #059669;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: auto;
}

.pg-year-reset svg {
    width: 16px;
    height: 16px;
}

.pg-year-reset:hover {
    background: linear-gradient(135deg, #064e3b, #059669);
    color: #fff;
    border-color: #059669;
    transform: translateY(-1px);
    box-shadow: 0 3px 12px rgba(5,150,105,0.25);
}

.pg-year-reset:active {
    transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
    .pg-year-override {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .pg-year-reset {
        margin-left: 0;
        width: 100%;
        justify-content: center;
    }
}
```

## State Management

### New State Variables
```typescript
// Tahun override (null = gunakan tahun asli)
const [tahunOverride, setTahunOverride] = useState<number | null>(null);
```

### Updated Computed Values
```typescript
// Filtered rows dengan override tahun
const filteredRows = useMemo(() => {
    return rawRows
        .filter(r => r.month >= bulanDari && r.month <= bulanSampai)
        .map(r => tahunOverride ? { ...r, year: tahunOverride } : r);
}, [rawRows, bulanDari, bulanSampai, tahunOverride]);

const filteredRowsKeluar = useMemo(() => {
    return rawRowsKeluar
        .filter(r => r.month >= bulanDari && r.month <= bulanSampai)
        .map(r => tahunOverride ? { ...r, year: tahunOverride } : r);
}, [rawRowsKeluar, bulanDari, bulanSampai, tahunOverride]);
```

## User Interaction Flow

### Scenario 1: Override Tahun
1. User upload Excel dengan data tahun 2024
2. Sistem mendeteksi dan menampilkan "Tahun Terdeteksi: 2024"
3. User klik dropdown "Override Tahun"
4. User pilih "2025"
5. Semua data langsung menggunakan tahun 2025
6. **Dashboard SIPEDE di bawah menampilkan "2025" (bukan 2024)**
7. Grafik ter-update secara reactive
8. Tombol "Reset ke Tahun Asli" muncul

### Scenario 2: Reset ke Tahun Asli
1. User sudah override tahun ke 2025
2. User klik tombol "Reset ke Tahun Asli"
3. Dropdown kembali ke "Gunakan Tahun Asli"
4. Data kembali menggunakan tahun asli dari Excel (2024)
5. **Dashboard SIPEDE kembali menampilkan "2024"**
6. Tombol reset hilang

### Scenario 3: Multiple Years Detected
1. User upload Excel dengan data tahun 2024 dan 2025
2. Sistem menampilkan "Tahun Terdeteksi: 2024 - 2025"
3. Dashboard SIPEDE menampilkan "2024" (tahun minimum)
4. User override semua data ke tahun 2025
5. **Dashboard SIPEDE berubah menampilkan "2025"**
6. Semua data (baik yang aslinya 2024 maupun 2025) jadi 2025

### Scenario 4: Visual Sync Between Sections
```
┌─────────────────────────────────────────────────────────┐
│  PENGELOMPOKAN SURAT (Top)                              │
│  ✏️ Override Tahun: [2025 ▼]  ← User pilih 2025        │
└─────────────────────────────────────────────────────────┘
                        ↓ (Sinkron)
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD SIPEDE (Bottom)                              │
│  PERIODE  JAN — SEP  2025  ← Otomatis berubah jadi 2025│
└─────────────────────────────────────────────────────────┘
```

## Visual States

### State 1: No Data Uploaded
- Section tidak ditampilkan (hidden)

### State 2: Data Uploaded, No Override
```
┌─────────────────────────────────────────────────────────────┐
│  📅 Tahun Terdeteksi: 2024-2025                             │
│  ✏️ Override Tahun: [Gunakan Tahun Asli ▼]                 │
└─────────────────────────────────────────────────────────────┘
```

### State 3: Override Active
```
┌─────────────────────────────────────────────────────────────┐
│  📅 Tahun Terdeteksi: 2024-2025                             │
│  ✏️ Override Tahun: [2025 ▼]                                │
│  🔄 Reset ke Tahun Asli                                     │
└─────────────────────────────────────────────────────────────┘
```

## Color Palette (Following InsightTab Theme)

### Primary Colors
- **Background Gradient**: `linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)`
- **Border**: `#a7f3d0` (light green)
- **Text Primary**: `#064e3b` (dark green)
- **Text Secondary**: `#065f46` (medium green)
- **Accent**: `#059669` (main green)

### Interactive States
- **Hover Border**: `#6ee7b7` (lighter green)
- **Focus Shadow**: `rgba(5,150,105,0.12)`
- **Button Gradient**: `linear-gradient(135deg, #064e3b, #059669)`
- **Button Shadow**: `rgba(5,150,105,0.25)`

## Typography

### Font Sizes
- **Info Label**: `0.75rem` (uppercase, letter-spacing: 0.3px)
- **Info Value**: `1.1rem` (bold, letter-spacing: 0.5px)
- **Control Label**: `0.85rem` (bold)
- **Select**: `0.9rem` (bold)
- **Button**: `0.8rem` (bold)

### Font Weights
- **Label**: `600-700` (semi-bold to bold)
- **Value**: `800` (extra bold)
- **Select**: `700` (bold)

## Spacing & Layout

### Padding
- **Section**: `0.85rem 1.75rem`
- **Select**: `0.5rem 0.85rem`
- **Button**: `0.5rem 1rem`

### Gaps
- **Main Gap**: `1.5rem` (between elements)
- **Info Gap**: `0.6rem` (icon to text)
- **Control Gap**: `0.75rem` (label to select)
- **Button Gap**: `0.4rem` (icon to text)

### Border Radius
- **Select**: `10px`
- **Button**: `10px`

## Accessibility

### Keyboard Navigation
- Tab order: Info → Dropdown → Reset Button
- Enter/Space: Activate dropdown or button
- Arrow keys: Navigate dropdown options
- Escape: Close dropdown

### Screen Reader
```html
<label htmlFor="year-override-select" className="pg-year-label">
    <span aria-hidden="true">✏️</span>
    Override Tahun:
</label>
<select 
    id="year-override-select"
    className="pg-year-select"
    aria-label="Pilih tahun untuk override data"
    value={tahunOverride || ''}
    onChange={e => setTahunOverride(e.target.value ? Number(e.target.value) : null)}
>
    <option value="">Gunakan Tahun Asli</option>
    ...
</select>

<button 
    className="pg-year-reset"
    onClick={() => setTahunOverride(null)}
    aria-label="Reset ke tahun asli dari Excel"
>
    ...
</button>
```

### Focus Indicators
- Clear focus ring dengan `box-shadow: 0 0 0 3px rgba(5,150,105,0.12)`
- High contrast untuk keyboard users

## Animation & Transitions

### Smooth Transitions
```css
transition: all 0.2s ease;
```

### Hover Effects
- Border color change
- Background color change
- Transform: `translateY(-1px)` untuk button
- Box shadow enhancement

### Active State
- Transform: `translateY(0)` untuk button press feedback

## Edge Cases

### Case 1: Single Year Detected
```
📅 Tahun Terdeteksi: 2025
```

### Case 2: Multiple Years (2+ years)
```
📅 Tahun Terdeteksi: 2024 - 2025
```

### Case 3: Wide Year Range
```
📅 Tahun Terdeteksi: 2020 - 2025
```

### Case 4: Mobile View
- Stack vertically
- Full width button
- Maintain readability

## Integration Points

### 1. Pengelompokan Section (Top)

#### Before Month Filter
```tsx
{/* Year Override Section */}
{dataYear && (
    <div className="pg-year-override">
        ...
    </div>
)}

{/* Month Filter Dropdown */}
{availableRange && (
    <div className="pg-month-filter">
        ...
    </div>
)}
```

#### After Upload Notification
```tsx
{/* Upload Success Notification */}
{uploadInfo && (
    <div className="upload-notif">
        ...
    </div>
)}

{/* Year Override Section */}
{dataYear && (
    <div className="pg-year-override">
        ...
    </div>
)}
```

### 2. Dashboard SIPEDE Period Display (Bottom)

#### Current Code (2 Digit Vertical Format)
```tsx
<div className="dash-period">
    <span className="period-label">PERIODE</span>
    <span className="period-badge">{availableRange ? MONTH_LABELS[bulanDari - 1].toUpperCase() : 'JAN'}</span>
    <span className="period-sep">—</span>
    <span className="period-badge">{availableRange ? MONTH_LABELS[bulanSampai - 1].toUpperCase() : 'SEP'}</span>
    <span className="period-year">
        <span className="year-top">{dataYear ? String(dataYear.min).slice(0, 2) : '20'}</span>
        <span className="year-bottom">{dataYear ? String(dataYear.min).slice(2) : '25'}</span>
    </span>
</div>
```

#### Updated Code (4 Digit Horizontal Format + Override Integration)
```tsx
<div className="dash-period">
    <span className="period-label">PERIODE</span>
    <span className="period-badge">{availableRange ? MONTH_LABELS[bulanDari - 1].toUpperCase() : 'JAN'}</span>
    <span className="period-sep">—</span>
    <span className="period-badge">{availableRange ? MONTH_LABELS[bulanSampai - 1].toUpperCase() : 'SEP'}</span>
    <span className="period-year-full">
        {tahunOverride 
            ? tahunOverride 
            : (dataYear ? dataYear.min : 2025)}
    </span>
</div>
```

#### Visual Change
**Before (2 digit vertical):**
```
PERIODE  JAN — SEP  20
                    25
```

**After (4 digit horizontal):**
```
PERIODE  JAN — SEP  2025
```

#### Logic Explanation
- **Jika `tahunOverride` ada**: Gunakan tahun override (misal 2025)
- **Jika tidak ada override**: Gunakan `dataYear.min` (tahun asli dari Excel)
- **Fallback**: Default ke 2025 jika tidak ada data
- **Format**: 4 digit penuh horizontal, bukan 2 digit vertikal

## Success Criteria

### Visual Consistency
- ✅ Matches InsightTab color scheme (green theme)
- ✅ Uses same typography scale
- ✅ Follows same spacing patterns
- ✅ Consistent border radius and shadows

### User Experience
- ✅ Clear visual hierarchy
- ✅ Intuitive interaction flow
- ✅ Immediate visual feedback
- ✅ Smooth animations
- ✅ **Dashboard SIPEDE year syncs with override**

### Functional Requirements
- ✅ Override affects all data (Surat Masuk & Keluar)
- ✅ Override affects all charts and graphs
- ✅ **Override affects Dashboard SIPEDE period display**
- ✅ Reset button restores original year
- ✅ New upload resets override to null

### Responsive Design
- ✅ Works on desktop (1920px+)
- ✅ Works on tablet (768px-1024px)
- ✅ Works on mobile (320px-767px)

### Accessibility
- ✅ Keyboard navigable
- ✅ Screen reader friendly
- ✅ High contrast focus indicators
- ✅ Semantic HTML

## Implementation Notes

1. **Placement**: Insert after `uploadInfo` notification, before `availableRange` month filter
2. **Conditional Rendering**: Only show when `dataYear` exists (data uploaded)
3. **State Reset**: Reset `tahunOverride` to `null` when new Excel uploaded
4. **Reactive Updates**: All charts automatically update via `useMemo` dependencies
5. **No Data Mutation**: Override only affects display, not raw data
6. **Dashboard Sync**: Period year display in Dashboard SIPEDE automatically syncs with override
7. **Year Display Logic**: 
   - If `tahunOverride` exists → use override year
   - Else → use `dataYear.min` (original year from Excel)
   - Fallback → default to 2025

## Files to Modify

### frontend/src/components/InsightTab.tsx

#### Changes Required:
1. **Add State** (line ~100):
   ```typescript
   const [tahunOverride, setTahunOverride] = useState<number | null>(null);
   ```

2. **Update filteredRows** (line ~124):
   ```typescript
   const filteredRows = useMemo(() => {
       return rawRows
           .filter(r => r.month >= bulanDari && r.month <= bulanSampai)
           .map(r => tahunOverride ? { ...r, year: tahunOverride } : r);
   }, [rawRows, bulanDari, bulanSampai, tahunOverride]);
   ```

3. **Update filteredRowsKeluar** (line ~128):
   ```typescript
   const filteredRowsKeluar = useMemo(() => {
       return rawRowsKeluar
           .filter(r => r.month >= bulanDari && r.month <= bulanSampai)
           .map(r => tahunOverride ? { ...r, year: tahunOverride } : r);
   }, [rawRowsKeluar, bulanDari, bulanSampai, tahunOverride]);
   ```

4. **Add Year Override UI** (after line ~596, after uploadInfo):
   ```tsx
   {/* Year Override Section */}
   {dataYear && (
       <div className="pg-year-override">
           {/* Component code from design */}
       </div>
   )}
   ```

5. **Update Dashboard Period Display** (line ~984):
   ```tsx
   <span className="period-year-full">
       {tahunOverride 
           ? tahunOverride 
           : (dataYear ? dataYear.min : 2025)}
   </span>
   ```
   
   **Note:** Remove old `period-year` with `year-top` and `year-bottom` spans, replace with single `period-year-full` span for 4-digit horizontal display.

6. **Add/Update CSS Styles** (in `<style jsx>` section, line ~1200+):
   **a) Year Override Section styles:**
   ```css
   /* Year Override Section styles */
   .pg-year-override { ... }
   .pg-year-info { ... }
   /* ... all styles from design document */
   ```
   
   **b) Dashboard Period Year style (update existing or add new):**
   ```css
   .period-year-full {
       display: inline-flex;
       align-items: center;
       justify-content: center;
       padding: 0.35rem 0.85rem;
       background: linear-gradient(135deg, #1e1b4b, #4338ca);
       color: #fff;
       font-size: 1.1rem;
       font-weight: 800;
       border-radius: 8px;
       letter-spacing: 1px;
       margin-left: 0.5rem;
   }
   ```

7. **Reset Override on New Upload** (in handleExcelUpload, line ~300+):
   ```typescript
   setTahunOverride(null); // Reset override when new file uploaded
   ```

## Future Enhancements (Out of Scope v1)

- [ ] Save override to localStorage
- [ ] Year range picker (from-to)
- [ ] Per-row year override
- [ ] Export with overridden year
- [ ] Undo/Redo functionality
- [ ] Year override history
