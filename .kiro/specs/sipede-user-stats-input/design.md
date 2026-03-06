# Design Document: Manual SIPEDE User Statistics Input

## Overview

Fitur Manual SIPEDE User Statistics Input memungkinkan pengguna untuk memasukkan statistik pegawai SIPEDE secara manual melalui form input dan memvisualisasikan data dalam tiga grafik terpisah di dashboard Insight. Fitur ini beroperasi secara independen dari fungsionalitas upload Excel yang sudah ada dan menyimpan data secara lokal di browser menggunakan localStorage.

### Key Features

- Form input manual dengan 6 field numerik untuk statistik pegawai SIPEDE
- Validasi input real-time (hanya integer non-negatif)
- Penyimpanan data persisten menggunakan localStorage
- Visualisasi data dalam 3 grafik terpisah menggunakan SVG custom
- Integrasi seamless dengan InsightTab yang sudah ada
- Feedback UI untuk success/error states
- Update grafik real-time setelah submit

### Design Goals

1. **Separation of Concerns**: Fitur SIPEDE terpisah secara visual dan fungsional dari fitur Excel upload
2. **Data Persistence**: Data tersimpan di localStorage dan bertahan antar session
3. **User Experience**: Validasi input yang jelas, feedback yang informatif, dan update real-time
4. **Type Safety**: Menggunakan TypeScript interfaces untuk semua data structures
5. **Maintainability**: Komponen modular dan reusable dengan state management yang jelas

## Architecture

### Component Hierarchy

```
InsightTab (existing)
├── Pengelompokan Data Surat Section (existing)
│   ├── Excel Upload (existing)
│   └── Grouping Tables (existing)
├── Dashboard SIPEDE Section (existing)
│   ├── Header with Period (existing)
│   ├── Top Row Cards (existing)
│   │   ├── Total Surat Card (existing)
│   │   ├── Persentase User SIPEDE Card (existing - TO BE ENHANCED)
│   │   └── Tren Frekuensi Card (existing)
│   └── Bottom Row Cards (existing)
└── NEW: SIPEDE Manual Input Section
    ├── SipedeInputForm (new component)
    │   ├── Form Header
    │   ├── 6 Numeric Input Fields
    │   ├── Submit Button
    │   └── Feedback Messages
    └── SipedeCharts (new component)
        ├── StatusChart (Status Aktif vs Tidak Aktif)
        ├── RegistrationChart (Tercatat vs Tidak Tercatat SIPEDE)
        └── EsignChart (Terdaftar vs Tidak Terdaftar E-sign)
```


### Data Flow

```
User Input → Form Validation → State Update → localStorage Save → Chart Re-render
     ↓                                                    ↓
Validation Error                                   Success Message
     ↓                                                    ↓
Error Display                                      Auto-dismiss (3s)

On Page Load:
localStorage → Retrieve Data → Populate Form → Render Charts
```

### Integration Points

1. **InsightTab.tsx**: Komponen utama yang akan menampung fitur baru
2. **localStorage**: Browser storage untuk data persistence
3. **Existing Dashboard**: Fitur baru akan ditambahkan sebagai section terpisah di bawah dashboard yang ada
4. **Persentase User SIPEDE Card**: Card yang sudah ada akan diupdate untuk menggunakan data dari manual input

## Components and Interfaces

### 1. SipedeInputForm Component

**Purpose**: Form untuk input manual statistik SIPEDE dengan validasi

**Props**:
```typescript
interface SipedeInputFormProps {
  onSubmit: (data: SipedeStats) => void;
  initialData?: SipedeStats;
}
```

**State**:
```typescript
interface FormState {
  statusAktif: string;
  statusTidakAktif: string;
  tercatatSipede: string;
  tidakTercatatSipede: string;
  terdaftarEsign: string;
  tidakTerdaftarEsign: string;
  errors: Record<string, string>;
  showSuccess: boolean;
}
```

**Behavior**:
- Validasi input real-time (hanya integer ≥ 0)
- Disable submit button jika ada error
- Tampilkan success message setelah submit (auto-dismiss 3 detik)
- Tampilkan error messages inline per field
- Clear form setelah successful submit (optional)


### 2. SipedeCharts Component

**Purpose**: Menampilkan 3 grafik donut untuk visualisasi statistik SIPEDE

**Props**:
```typescript
interface SipedeChartsProps {
  data: SipedeStats;
}
```

**Sub-components**:
- **StatusChart**: Donut chart untuk Status Aktif vs Tidak Aktif
- **RegistrationChart**: Donut chart untuk Tercatat vs Tidak Tercatat SIPEDE
- **EsignChart**: Donut chart untuk Terdaftar vs Tidak Terdaftar E-sign

**Chart Specifications**:
- Menggunakan SVG custom (konsisten dengan existing dashboard style)
- Menampilkan persentase di tengah donut
- Menampilkan label dan count untuk setiap segment
- Warna distinct untuk setiap segment (mengikuti color scheme existing)
- Responsive dan maintain aspect ratio

### 3. LocalStorage Manager

**Purpose**: Service untuk handle data persistence ke localStorage

**Functions**:
```typescript
interface LocalStorageManager {
  saveSipedeStats(data: SipedeStats): void;
  loadSipedeStats(): SipedeStats;
  clearSipedeStats(): void;
}
```

**Implementation Details**:
- Key: `'sipede-user-stats'`
- Serialization: JSON.stringify()
- Deserialization: JSON.parse() dengan error handling
- Default values: semua field = 0 jika tidak ada data

## Data Models

### SipedeStats Interface

```typescript
interface SipedeStats {
  statusAktif: number;
  statusTidakAktif: number;
  tercatatSipede: number;
  tidakTercatatSipede: number;
  terdaftarEsign: number;
  tidakTerdaftarEsign: number;
}
```

**Validation Rules**:
- Semua field harus integer (tidak boleh decimal)
- Semua field harus ≥ 0 (tidak boleh negatif)
- Semua field required (tidak boleh empty/null)

### Chart Data Interfaces

```typescript
interface DonutChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface ChartSegment {
  startAngle: number;
  endAngle: number;
  data: DonutChartData;
}
```


## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Pengelompokan Data Surat Section (existing)                │
│  - Excel Upload Buttons                                     │
│  - Tabs & Tables                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  NEW: Input Manual Statistik SIPEDE                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  SIPEDE Input Form                                    │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │ │
│  │  │ Status Aktif│ │ Tercatat    │ │ Terdaftar   │   │ │
│  │  │    [___]    │ │   SIPEDE    │ │   E-sign    │   │ │
│  │  │             │ │    [___]    │ │    [___]    │   │ │
│  │  │ Status Tidak│ │ Tidak       │ │ Tidak       │   │ │
│  │  │    Aktif    │ │  Tercatat   │ │  Terdaftar  │   │ │
│  │  │    [___]    │ │    [___]    │ │    [___]    │   │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │ │
│  │                                                       │ │
│  │  [Submit Button]  [Success/Error Message]           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Visualisasi Statistik SIPEDE                        │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │ │
│  │  │ Status  │  │ SIPEDE  │  │ E-sign  │             │ │
│  │  │  Chart  │  │  Chart  │  │  Chart  │             │ │
│  │  │  (SVG)  │  │  (SVG)  │  │  (SVG)  │             │ │
│  │  └─────────┘  └─────────┘  └─────────┘             │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Dashboard SIPEDE (existing)                                │
│  - Header with Period                                       │
│  - Top Row: 3 Cards (Total, Persentase, Tren)             │
│  - Bottom Row: 2 Cards (Jenis, Asal)                       │
└─────────────────────────────────────────────────────────────┘
```

### Form Input Design

**Container**:
- Background: White card dengan border-radius 20px
- Shadow: Soft shadow konsisten dengan existing cards
- Padding: 1.75rem
- Border: 1px solid #e2e8f0

**Header**:
- Title: "Input Manual Statistik SIPEDE"
- Subtitle: "Masukkan data statistik pegawai untuk visualisasi"
- Background: Linear gradient (teal theme, konsisten dengan existing)
- Color: White text

**Input Fields Layout**:
- Grid: 3 columns (2 fields per column)
- Gap: 1rem between fields
- Responsive: Stack to 1 column on mobile

**Individual Input Field**:
- Label: Font-weight 600, color #064e3b, font-size 0.85rem
- Input: 
  - Border: 1.5px solid #d1fae5
  - Border-radius: 10px
  - Padding: 0.65rem 0.9rem
  - Font-size: 0.9rem
  - Background: #fafdfb
  - Focus: Border color #059669, box-shadow glow
- Error state:
  - Border color: #ef4444
  - Error message: Red text below input, font-size 0.75rem

**Submit Button**:
- Background: Linear gradient (#064e3b to #059669)
- Color: White
- Padding: 0.65rem 1.5rem
- Border-radius: 12px
- Font-weight: 700
- Hover: Transform translateY(-2px), shadow
- Disabled: Opacity 0.4, no hover effects

**Success Message**:
- Background: Linear gradient (#dcfce7 to #d1fae5)
- Border: 1px solid #86efac
- Color: #166534
- Icon: CheckCircleIcon (green)
- Auto-dismiss: Fade out after 3 seconds
- Position: Below submit button


### Chart Visualization Design

**Container**:
- Background: White card
- Border-radius: 20px
- Shadow: Konsisten dengan existing cards
- Padding: 1.75rem

**Header**:
- Title: "Visualisasi Statistik SIPEDE"
- Background: Purple gradient (konsisten dengan existing)
- Color: White

**Charts Layout**:
- Display: Flex row, 3 charts side by side
- Gap: 2rem between charts
- Responsive: Stack to column on mobile
- Alignment: Center

**Individual Chart (Donut SVG)**:
- Size: 120x120px
- Donut thickness: 12px stroke-width
- Center text: Percentage (font-size 14px, font-weight 700)
- Colors:
  - Status Chart: #c026d3 (aktif), #e5e7eb (tidak aktif)
  - SIPEDE Chart: #c026d3 (tercatat), #f472b6 (tidak tercatat)
  - E-sign Chart: #c026d3 (terdaftar), #f472b6 (tidak terdaftar)

**Chart Labels**:
- Position: Below each donut
- Font-size: 0.75rem
- Color: #64748b
- Format: "Label: Count (Percentage%)"

### Visual Separation from Excel Upload

**Separation Techniques**:
1. **Spacing**: 2rem margin-top dari dashboard section
2. **Visual Divider**: Subtle border-top atau background color change
3. **Section Header**: Clear header "Input Manual Statistik SIPEDE"
4. **Card Style**: Distinct card dengan different header color (teal vs purple)
5. **Icon**: Different icon untuk manual input vs Excel upload

### Color Scheme

**Primary Colors** (konsisten dengan existing):
- Teal: #064e3b, #059669, #10b981
- Purple: #c026d3, #e879a8
- Orange: #f59e0b
- Gray: #64748b, #94a3b8, #e2e8f0

**Status Colors**:
- Success: #16a34a, #dcfce7
- Error: #ef4444, #fee2e2
- Warning: #f59e0b, #fef3c7

### Responsive Behavior

**Desktop (≥1100px)**:
- Form: 3 columns
- Charts: 3 columns (side by side)

**Tablet (640px - 1099px)**:
- Form: 2 columns
- Charts: 2 columns (third wraps)

**Mobile (<640px)**:
- Form: 1 column (stacked)
- Charts: 1 column (stacked)
- Reduced padding and font sizes


## State Management

### Component State Strategy

**InsightTab State** (existing + new):
```typescript
// Existing state (unchanged)
const [rawRows, setRawRows] = useState<RawRow[]>([]);
const [rawRowsKeluar, setRawRowsKeluar] = useState<RawRowKeluar[]>([]);
// ... other existing state

// NEW: SIPEDE manual input state
const [sipedeStats, setSipedeStats] = useState<SipedeStats>({
  statusAktif: 0,
  statusTidakAktif: 0,
  tercatatSipede: 0,
  tidakTercatatSipede: 0,
  terdaftarEsign: 0,
  tidakTerdaftarEsign: 0,
});
```

### State Update Flow

1. **On Page Load**:
   ```typescript
   useEffect(() => {
     const savedStats = loadSipedeStats();
     setSipedeStats(savedStats);
   }, []);
   ```

2. **On Form Submit**:
   ```typescript
   const handleSipedeSubmit = (data: SipedeStats) => {
     setSipedeStats(data);
     saveSipedeStats(data);
     // Trigger success message
   };
   ```

3. **Chart Re-render**:
   - Charts automatically re-render when `sipedeStats` changes (React reactivity)
   - No manual chart update needed

### localStorage Integration

**Storage Key**: `'sipede-user-stats'`

**Save Function**:
```typescript
const saveSipedeStats = (data: SipedeStats): void => {
  try {
    localStorage.setItem('sipede-user-stats', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save SIPEDE stats:', error);
  }
};
```

**Load Function**:
```typescript
const loadSipedeStats = (): SipedeStats => {
  try {
    const saved = localStorage.getItem('sipede-user-stats');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load SIPEDE stats:', error);
  }
  // Return default values
  return {
    statusAktif: 0,
    statusTidakAktif: 0,
    tercatatSipede: 0,
    tidakTercatatSipede: 0,
    terdaftarEsign: 0,
    tidakTerdaftarEsign: 0,
  };
};
```

**Clear Function** (optional, for testing):
```typescript
const clearSipedeStats = (): void => {
  localStorage.removeItem('sipede-user-stats');
};
```


## Input Validation

### Validation Rules

**Rule 1: Integer Only**
- Pattern: `/^[0-9]+$/`
- Reject: Decimals, negative signs, letters, special characters
- Error message: "Hanya angka bulat yang diperbolehkan"

**Rule 2: Non-negative**
- Check: `value >= 0`
- Reject: Negative numbers
- Error message: "Nilai tidak boleh negatif"

**Rule 3: Required**
- Check: `value !== '' && value !== null && value !== undefined`
- Error message: "Field ini wajib diisi"

### Validation Implementation

**Real-time Validation** (onChange):
```typescript
const validateField = (name: string, value: string): string => {
  // Check if empty
  if (value === '') {
    return 'Field ini wajib diisi';
  }
  
  // Check if integer
  if (!/^[0-9]+$/.test(value)) {
    return 'Hanya angka bulat yang diperbolehkan';
  }
  
  // Check if non-negative (redundant with regex, but explicit)
  const numValue = parseInt(value, 10);
  if (numValue < 0) {
    return 'Nilai tidak boleh negatif';
  }
  
  return ''; // No error
};
```

**Form-level Validation** (onSubmit):
```typescript
const validateForm = (formData: FormState): boolean => {
  const fields = [
    'statusAktif',
    'statusTidakAktif',
    'tercatatSipede',
    'tidakTercatatSipede',
    'terdaftarEsign',
    'tidakTerdaftarEsign',
  ];
  
  let isValid = true;
  const newErrors: Record<string, string> = {};
  
  fields.forEach(field => {
    const error = validateField(field, formData[field]);
    if (error) {
      newErrors[field] = error;
      isValid = false;
    }
  });
  
  setErrors(newErrors);
  return isValid;
};
```

### Submit Button State

**Disabled Conditions**:
- Any field has validation error
- Any field is empty
- Form is currently submitting (optional loading state)

**Implementation**:
```typescript
const isSubmitDisabled = useMemo(() => {
  const hasErrors = Object.values(errors).some(error => error !== '');
  const hasEmptyFields = Object.values(formState).some(value => value === '');
  return hasErrors || hasEmptyFields;
}, [errors, formState]);
```


## Chart Implementation

### SVG Donut Chart

**Donut Arc Calculation** (reuse existing helper):
```typescript
const donutArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string => {
  const rad = (deg: number) => (deg - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
};
```

**Percentage Calculation**:
```typescript
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};
```

### Status Chart (Aktif vs Tidak Aktif)

```typescript
const StatusChart: React.FC<{ data: SipedeStats }> = ({ data }) => {
  const total = data.statusAktif + data.statusTidakAktif;
  const aktifPercentage = calculatePercentage(data.statusAktif, total);
  const aktifAngle = (aktifPercentage / 100) * 360;
  
  return (
    <div className="sipede-chart">
      <svg viewBox="0 0 100 100" width="120" height="120">
        {/* Background circle */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="12" />
        
        {/* Aktif segment */}
        <path
          d={donutArc(50, 50, 38, 0, aktifAngle)}
          fill="none"
          stroke="#c026d3"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Center percentage */}
        <text x="50" y="46" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1e1b4b">
          {aktifPercentage}%
        </text>
        <text x="50" y="58" textAnchor="middle" fontSize="8" fill="#64748b">
          Aktif
        </text>
      </svg>
      
      <div className="chart-labels">
        <div className="chart-label">
          <span className="label-dot" style={{ background: '#c026d3' }}></span>
          Aktif: {data.statusAktif} ({aktifPercentage}%)
        </div>
        <div className="chart-label">
          <span className="label-dot" style={{ background: '#e5e7eb' }}></span>
          Tidak Aktif: {data.statusTidakAktif} ({100 - aktifPercentage}%)
        </div>
      </div>
    </div>
  );
};
```

### Registration Chart (Tercatat vs Tidak Tercatat SIPEDE)

Similar structure to StatusChart, dengan:
- Primary color: #c026d3 (tercatat)
- Secondary color: #f472b6 (tidak tercatat)
- Label: "Tercatat SIPEDE"

### E-sign Chart (Terdaftar vs Tidak Terdaftar)

Similar structure to StatusChart, dengan:
- Primary color: #c026d3 (terdaftar)
- Secondary color: #f472b6 (tidak terdaftar)
- Label: "Terdaftar E-sign"

### Chart Update Mechanism

Charts automatically re-render when `sipedeStats` prop changes (React reactivity):
```typescript
// In parent component (InsightTab)
<SipedeCharts data={sipedeStats} />

// Charts will re-render whenever sipedeStats changes
```


## Integration with Existing InsightTab

### Modification Strategy

**Minimal Changes Approach**:
1. Add new state for SIPEDE stats
2. Add localStorage functions
3. Add new section at the bottom of the component
4. Update existing "Persentase User SIPEDE" card to use manual input data
5. No changes to existing Excel upload functionality

### Updated Persentase User SIPEDE Card

**Current State**: Hardcoded percentages (94%, 62%, 100%)

**New Implementation**: Use data from `sipedeStats`

```typescript
// Calculate percentages from sipedeStats
const totalStatus = sipedeStats.statusAktif + sipedeStats.statusTidakAktif;
const statusAktifPercentage = calculatePercentage(sipedeStats.statusAktif, totalStatus);

const totalSipede = sipedeStats.tercatatSipede + sipedeStats.tidakTercatatSipede;
const tercatatPercentage = calculatePercentage(sipedeStats.tercatatSipede, totalSipede);

const totalEsign = sipedeStats.terdaftarEsign + sipedeStats.tidakTerdaftarEsign;
const esignPercentage = calculatePercentage(sipedeStats.terdaftarEsign, totalEsign);

// Update the existing card JSX to use these calculated values
```

### New Section Placement

**Location**: After the Excel upload section (Pengelompokan Data Surat), before the Dashboard SIPEDE section

**Structure**:
```tsx
{/* Existing Excel Upload Section */}
<div className="pengelompokan-section">
  {/* ... existing Excel upload content ... */}
</div>

{/* NEW: Manual Input Section */}
<div className="sipede-manual-section">
  <div className="sipede-input-card">
    <div className="card-header">
      <h2>Input Manual Statistik SIPEDE</h2>
      <p>Masukkan data statistik pegawai untuk visualisasi</p>
    </div>
    <SipedeInputForm
      onSubmit={handleSipedeSubmit}
      initialData={sipedeStats}
    />
  </div>
  
  <div className="sipede-charts-card">
    <div className="card-header">
      <h2>Visualisasi Statistik SIPEDE</h2>
    </div>
    <SipedeCharts data={sipedeStats} />
  </div>
</div>

{/* Existing Dashboard SIPEDE Section */}
<div className="insight-page" ref={dashboardRef}>
  {/* ... existing dashboard content ... */}
</div>
```

### CSS Integration

**Approach**: Extend existing styles with new classes

**New CSS Classes**:
- `.sipede-manual-section`: Container for new section
- `.sipede-input-card`: Card styling for input form
- `.sipede-charts-card`: Card styling for charts
- `.sipede-chart`: Individual chart container
- `.chart-labels`: Labels below charts
- `.chart-label`: Individual label with dot

**Style Consistency**:
- Reuse existing color variables
- Match existing card border-radius (20px)
- Match existing shadow styles
- Use existing font sizes and weights
- Follow existing responsive breakpoints


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 2.4 and 2.5 (serialize/deserialize) are both covered by the round-trip property 7.4
- Property 3.7 and 7.3 are identical (charts update when data changes)
- Properties 1.2, 1.3, and 8.3 all test input rejection and can be combined into comprehensive validation properties

The following properties represent the unique, non-redundant correctness requirements:

### Property 1: Non-numeric Input Rejection

*For any* input field and any non-numeric string value, when a user enters that value, the form SHALL reject it and display a validation error message.

**Validates: Requirements 1.2**

### Property 2: Negative Number Rejection

*For any* input field and any negative integer value, when a user enters that value, the form SHALL reject it and display a validation error message.

**Validates: Requirements 1.3**

### Property 3: Decimal Number Rejection

*For any* input field and any decimal number value, when a user enters that value, the form SHALL reject it and display a validation error message.

**Validates: Requirements 8.3**

### Property 4: Valid Integer Acceptance

*For any* input field and any non-negative integer value, when a user enters that value, the form SHALL accept it without displaying an error.

**Validates: Requirements 8.1**

### Property 5: Data Persistence Round-trip

*For any* valid SIPEDE statistics object, saving it to localStorage then loading it SHALL produce an equivalent object with all field values preserved.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5, 7.4**

### Property 6: Form Population from Saved Data

*For any* valid SIPEDE statistics object stored in localStorage, when the dashboard loads, the input form SHALL populate all six fields with the corresponding saved values.

**Validates: Requirements 7.1**

### Property 7: Data Overwrite on Update

*For any* two valid SIPEDE statistics objects (initial and modified), when the initial data is saved, then modified data is submitted, the localStorage SHALL contain only the modified data.

**Validates: Requirements 7.2**


### Property 8: Chart Data Synchronization

*For any* valid SIPEDE statistics object, when the data is updated and saved, all three charts (Status, Registration, E-sign) SHALL immediately re-render displaying the new values.

**Validates: Requirements 3.7, 7.3**

### Property 9: Chart Label Completeness

*For any* valid SIPEDE statistics object with non-zero values, each chart SHALL display labels containing both the category name and the count for each segment.

**Validates: Requirements 3.5**

### Property 10: Success Message Display

*For any* valid SIPEDE statistics object, when a user successfully submits the data, the form SHALL display a success message.

**Validates: Requirements 6.1**

### Property 11: Error Message Display for Invalid Data

*For any* SIPEDE statistics object containing at least one invalid field value, when a user attempts to submit, the form SHALL display specific error messages indicating which fields are invalid.

**Validates: Requirements 6.2**

### Property 12: Error Message Persistence

*For any* input field with a validation error, the error message SHALL remain visible until the user corrects the invalid input to a valid value.

**Validates: Requirements 6.4**

### Property 13: Inline Error Display

*For any* input field with a validation error, the error message SHALL be displayed inline adjacent to that specific field.

**Validates: Requirements 8.4**

### Property 14: Submit Button Disabled State

*For any* form state where at least one field contains invalid data, the submit button SHALL be disabled and non-clickable.

**Validates: Requirements 8.5**

### Example-Based Tests

The following requirements are best tested with specific examples rather than properties:

**Example 1: Form Structure**
- Verify the form renders exactly 6 input fields with correct labels
- **Validates: Requirements 1.1**

**Example 2: Submit Button Presence**
- Verify the form contains a submit button
- **Validates: Requirements 1.4**

**Example 3: Default Values on Empty localStorage**
- When localStorage is empty, verify all fields default to 0
- **Validates: Requirements 2.3**

**Example 4: Zero Value Acceptance**
- Verify that entering 0 in any field is accepted as valid
- **Validates: Requirements 8.2**

**Example 5: Success Message Auto-dismiss**
- Verify success message disappears after exactly 3 seconds
- **Validates: Requirements 6.3**

**Example 6: Chart Components Presence**
- Verify all three chart components (Status, Registration, E-sign) are rendered
- **Validates: Requirements 3.1, 3.2, 3.3, 4.2**

**Example 7: Section Separation**
- Verify SIPEDE input section and Excel upload section are separate DOM elements
- **Validates: Requirements 4.1, 4.4**


## Error Handling

### Input Validation Errors

**Error Types**:
1. **Empty Field**: "Field ini wajib diisi"
2. **Non-numeric**: "Hanya angka bulat yang diperbolehkan"
3. **Negative Number**: "Nilai tidak boleh negatif"
4. **Decimal Number**: "Hanya angka bulat yang diperbolehkan"

**Error Display**:
- Position: Inline below the input field
- Color: #ef4444 (red)
- Font-size: 0.75rem
- Icon: XCircleIcon (optional)

**Error Clearing**:
- Errors clear automatically when user corrects the input
- Errors persist until correction (no auto-dismiss)

### localStorage Errors

**Error Scenarios**:
1. **localStorage Full**: Quota exceeded
2. **localStorage Disabled**: Browser settings or private mode
3. **JSON Parse Error**: Corrupted data

**Error Handling Strategy**:
```typescript
try {
  localStorage.setItem('sipede-user-stats', JSON.stringify(data));
} catch (error) {
  console.error('Failed to save SIPEDE stats:', error);
  // Fallback: Continue with in-memory state only
  // Show warning message to user (optional)
}
```

**Graceful Degradation**:
- If localStorage fails, app continues to work with in-memory state
- Data will not persist across sessions, but current session works normally
- Optional: Display warning banner to user

### Chart Rendering Errors

**Error Scenarios**:
1. **Division by Zero**: Total is 0 (all fields are 0)
2. **Invalid Data**: NaN or undefined values

**Error Handling**:
```typescript
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0 || isNaN(total) || isNaN(value)) {
    return 0; // Safe default
  }
  return Math.round((value / total) * 100);
};
```

**Display Behavior**:
- If all values are 0, show "0%" in chart center
- Chart still renders (empty donut with gray background)
- No error message needed (valid state)

### Form Submission Errors

**Error Scenarios**:
1. **Validation Errors**: Caught before submission
2. **localStorage Error**: Handled gracefully (see above)

**User Feedback**:
- Validation errors: Show inline error messages
- localStorage errors: Log to console, continue with in-memory state
- Success: Show success message


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and UI component structure
**Property Tests**: Verify universal properties across all possible inputs

Together, these approaches ensure both concrete correctness (unit tests) and general correctness (property tests).

### Property-Based Testing

**Library**: `fast-check` (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with reference to design document property
- Tag format: `Feature: sipede-user-stats-input, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
import fc from 'fast-check';

// Property 1: Non-numeric Input Rejection
test('Feature: sipede-user-stats-input, Property 1: Non-numeric input rejection', () => {
  fc.assert(
    fc.property(
      fc.string().filter(s => !/^[0-9]+$/.test(s)), // Generate non-numeric strings
      (invalidInput) => {
        const error = validateField('statusAktif', invalidInput);
        expect(error).toBeTruthy();
        expect(error).toContain('angka');
      }
    ),
    { numRuns: 100 }
  );
});

// Property 5: Data Persistence Round-trip
test('Feature: sipede-user-stats-input, Property 5: Data persistence round-trip', () => {
  fc.assert(
    fc.property(
      fc.record({
        statusAktif: fc.nat(),
        statusTidakAktif: fc.nat(),
        tercatatSipede: fc.nat(),
        tidakTercatatSipede: fc.nat(),
        terdaftarEsign: fc.nat(),
        tidakTerdaftarEsign: fc.nat(),
      }),
      (stats) => {
        saveSipedeStats(stats);
        const loaded = loadSipedeStats();
        expect(loaded).toEqual(stats);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 8: Chart Data Synchronization
test('Feature: sipede-user-stats-input, Property 8: Chart data synchronization', () => {
  fc.assert(
    fc.property(
      fc.record({
        statusAktif: fc.nat(),
        statusTidakAktif: fc.nat(),
        tercatatSipede: fc.nat(),
        tidakTercatatSipede: fc.nat(),
        terdaftarEsign: fc.nat(),
        tidakTerdaftarEsign: fc.nat(),
      }),
      (stats) => {
        const { rerender } = render(<SipedeCharts data={stats} />);
        // Verify charts display correct data
        expect(screen.getByText(stats.statusAktif.toString())).toBeInTheDocument();
        
        // Update data
        const newStats = { ...stats, statusAktif: stats.statusAktif + 10 };
        rerender(<SipedeCharts data={newStats} />);
        
        // Verify charts updated
        expect(screen.getByText(newStats.statusAktif.toString())).toBeInTheDocument();
      }
    ),
    { numRuns: 100 }
  );
});
```


### Unit Testing

**Testing Library**: React Testing Library + Jest (Next.js default)

**Unit Test Focus Areas**:

1. **Component Structure Tests**:
   - Form renders 6 input fields with correct labels
   - Submit button is present
   - All three charts render
   - Sections are properly separated

2. **Edge Case Tests**:
   - Zero values are accepted
   - Empty localStorage returns default values
   - Success message auto-dismisses after 3 seconds

3. **Integration Tests**:
   - Form submission updates charts
   - localStorage integration works correctly
   - Existing Excel upload functionality remains unchanged

**Example Unit Tests**:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Example 1: Form Structure
test('renders all 6 input fields with correct labels', () => {
  render(<SipedeInputForm onSubmit={jest.fn()} />);
  
  expect(screen.getByLabelText(/status aktif/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/status tidak aktif/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/tercatat sipede/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/tidak tercatat sipede/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/terdaftar e-sign/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/tidak terdaftar e-sign/i)).toBeInTheDocument();
});

// Example 4: Zero Value Acceptance
test('accepts zero as valid input', () => {
  render(<SipedeInputForm onSubmit={jest.fn()} />);
  
  const input = screen.getByLabelText(/status aktif/i);
  fireEvent.change(input, { target: { value: '0' } });
  
  expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
});

// Example 5: Success Message Auto-dismiss
test('success message dismisses after 3 seconds', async () => {
  const onSubmit = jest.fn();
  render(<SipedeInputForm onSubmit={onSubmit} />);
  
  // Fill form with valid data
  const statusAktifInput = screen.getByLabelText(/status aktif/i);
  fireEvent.change(statusAktifInput, { target: { value: '100' } });
  // ... fill other fields
  
  // Submit form
  const submitButton = screen.getByRole('button', { name: /submit/i });
  fireEvent.click(submitButton);
  
  // Success message should appear
  expect(screen.getByText(/berhasil/i)).toBeInTheDocument();
  
  // Wait 3 seconds
  await waitFor(() => {
    expect(screen.queryByText(/berhasil/i)).not.toBeInTheDocument();
  }, { timeout: 3500 });
});

// Example 7: Section Separation
test('SIPEDE input and Excel upload are separate sections', () => {
  render(<InsightTab />);
  
  const sipedeSection = screen.getByText(/input manual statistik sipede/i).closest('div');
  const excelSection = screen.getByText(/pengelompokan data surat/i).closest('div');
  
  expect(sipedeSection).not.toBe(excelSection);
  expect(sipedeSection).toBeInTheDocument();
  expect(excelSection).toBeInTheDocument();
});
```

### Test Coverage Goals

**Minimum Coverage**:
- Line coverage: 80%
- Branch coverage: 75%
- Function coverage: 85%

**Critical Paths** (must have 100% coverage):
- Input validation logic
- localStorage save/load functions
- Form submission handler
- Chart data calculation

### Testing Best Practices

1. **Avoid Testing Implementation Details**: Test behavior, not internal state
2. **Use Semantic Queries**: Prefer `getByLabelText`, `getByRole` over `getByTestId`
3. **Test User Interactions**: Simulate real user behavior with `userEvent`
4. **Mock localStorage**: Use jest.mock for localStorage in tests
5. **Cleanup**: Ensure localStorage is cleared between tests


## Implementation Notes

### Development Approach

**Phase 1: Data Layer**
1. Define TypeScript interfaces
2. Implement localStorage functions
3. Write tests for localStorage functions

**Phase 2: Form Component**
1. Create SipedeInputForm component structure
2. Implement input validation
3. Add form submission logic
4. Style the form (match existing design)
5. Write unit and property tests

**Phase 3: Chart Components**
1. Create SipedeCharts component
2. Implement individual chart components (Status, Registration, E-sign)
3. Add SVG donut chart rendering
4. Style the charts
5. Write tests for chart rendering

**Phase 4: Integration**
1. Add state management to InsightTab
2. Integrate form and charts
3. Update existing "Persentase User SIPEDE" card
4. Add new section to InsightTab
5. Test integration

**Phase 5: Polish**
1. Add success/error messages
2. Implement auto-dismiss for success message
3. Add responsive styles
4. Test on different screen sizes
5. Final QA and bug fixes

### File Structure

```
frontend/src/
├── components/
│   ├── InsightTab.tsx (modified)
│   ├── SipedeInputForm.tsx (new)
│   └── SipedeCharts.tsx (new)
├── lib/
│   └── sipede-storage.ts (new)
├── types/
│   └── sipede.ts (new)
└── __tests__/
    ├── SipedeInputForm.test.tsx (new)
    ├── SipedeCharts.test.tsx (new)
    └── sipede-storage.test.ts (new)
```

### Dependencies

**No New Dependencies Required**:
- React: Already installed
- TypeScript: Already installed
- Heroicons: Already installed (for icons)
- Testing: Jest + React Testing Library (Next.js default)

**Optional Dependencies** (for property-based testing):
- `fast-check`: Property-based testing library
  ```bash
  npm install --save-dev fast-check
  ```

### Performance Considerations

**Optimization Strategies**:
1. **Memoization**: Use `useMemo` for chart calculations
2. **Debouncing**: Debounce input validation (optional, if performance issues)
3. **localStorage**: Async operations are fast, no optimization needed
4. **Chart Rendering**: SVG is performant, no canvas needed

**Expected Performance**:
- Form validation: < 1ms per field
- localStorage save/load: < 5ms
- Chart re-render: < 10ms
- Total interaction time: < 20ms (imperceptible to user)

### Accessibility Considerations

**WCAG Compliance Efforts**:
1. **Form Labels**: All inputs have associated labels
2. **Error Messages**: Linked to inputs via `aria-describedby`
3. **Color Contrast**: Ensure text meets WCAG AA standards
4. **Keyboard Navigation**: All interactive elements keyboard accessible
5. **Screen Reader**: Semantic HTML and ARIA labels

**Note**: Full WCAG compliance requires manual testing with assistive technologies.

### Browser Compatibility

**Target Browsers**:
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions

**localStorage Support**: All modern browsers (IE11+ not required)

### Security Considerations

**localStorage Security**:
- Data is stored client-side only (no server transmission)
- No sensitive data (only statistics counts)
- XSS protection: React escapes all rendered content
- No eval() or innerHTML usage

**Input Validation**:
- Client-side validation prevents malformed data
- No SQL injection risk (no database)
- No script injection risk (React escaping)

