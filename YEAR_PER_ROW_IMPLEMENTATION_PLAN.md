# Year Per-Row Edit Feature - Implementation Plan

## Status: READY TO IMPLEMENT

Saya sudah mulai implementasi dengan menambahkan:
1. ✅ Interface update (RawRow & RawRowKeluar dengan originalDate & rowKey)
2. ✅ State untuk per-row overrides
3. ✅ State untuk UI controls (search, filter, pagination)

## Remaining Implementation Steps

### Step 2: Update Excel Parser (handleExcelUpload)
**Location:** Line ~280

**Changes Needed:**
```typescript
rows.forEach(row => {
    const jenis = (row['Jenis Surat'] || '').toString().trim().toUpperCase();
    const asal = (row['Asal'] || '').toString().trim().toUpperCase();
    const tanggalRaw = row['Tanggal'];
    const d = parseDate(tanggalRaw);
    if (!d || d.month < 1 || d.month > 12) return;
    
    const rowKey = `${jenis}|${asal}|${tanggalRaw}`;  // ← ADD
    
    parsed.push({ 
        jenis, 
        asal, 
        month: d.month, 
        year: d.year,
        originalDate: String(tanggalRaw),  // ← ADD
        rowKey  // ← ADD
    });
    // ... rest of code
});
```

**Also add reset:**
```typescript
// Reset overrides on new upload
setJenisKategoriOverrides({});
setAsalKelompokOverrides({});
setTahunOverride(null);
setYearOverridesPerRow({});  // ← ADD
```

### Step 3: Update Excel Parser Keluar (handleExcelUploadKeluar)
**Location:** Line ~360

**Same changes as Step 2 but for Surat Keluar**

### Step 4: Update filteredRows Logic
**Location:** Line ~126

**Current:**
```typescript
const filteredRows = useMemo(() => {
    return rawRows
        .filter(r => r.month >= bulanDari && r.month <= bulanSampai)
        .map(r => tahunOverride ? { ...r, year: tahunOverride } : r);
}, [rawRows, bulanDari, bulanSampai, tahunOverride]);
```

**Update to:**
```typescript
const filteredRows = useMemo(() => {
    return rawRows
        .filter(r => r.month >= bulanDari && r.month <= bulanSampai)
        .map(r => {
            // Priority: per-row override > global override > original
            const perRowYear = r.rowKey ? yearOverridesPerRow[r.rowKey] : null;
            const finalYear = perRowYear || tahunOverride || r.year;
            return { ...r, year: finalYear };
        });
}, [rawRows, bulanDari, bulanSampai, tahunOverride, yearOverridesPerRow]);
```

**Same for filteredRowsKeluar**

### Step 5: Add Helper Functions
**Location:** After parseDate function (line ~270)

```typescript
// Format date for display
const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '-';
    const d = parseDate(dateStr);
    if (!d) return dateStr;
    return `${String(d.month).padStart(2, '0')}/${d.year}`;
};

// Get overridden year for a row
const getRowYear = (row: RawRow | RawRowKeluar): number => {
    const perRowYear = row.rowKey ? yearOverridesPerRow[row.rowKey] : null;
    return perRowYear || tahunOverride || row.year;
};

// Check if row year is modified
const isRowYearModified = (row: RawRow | RawRowKeluar): boolean => {
    return row.rowKey ? !!yearOverridesPerRow[row.rowKey] : false;
};

// Handle year change for a row
const handleRowYearChange = (row: RawRow | RawRowKeluar, newYear: number) => {
    if (!row.rowKey) return;
    if (newYear === row.year) {
        // Reset to original
        const newOverrides = { ...yearOverridesPerRow };
        delete newOverrides[row.rowKey];
        setYearOverridesPerRow(newOverrides);
    } else {
        setYearOverridesPerRow(prev => ({ ...prev, [row.rowKey!]: newYear }));
    }
};

// Reset year for a row
const resetRowYear = (row: RawRow | RawRowKeluar) => {
    if (!row.rowKey) return;
    const newOverrides = { ...yearOverridesPerRow };
    delete newOverrides[row.rowKey];
    setYearOverridesPerRow(newOverrides);
};

// Bulk action: change all rows with specific year
const bulkChangeYear = (fromYear: number, toYear: number) => {
    const newOverrides = { ...yearOverridesPerRow };
    [...rawRows, ...rawRowsKeluar].forEach(row => {
        if (row.year === fromYear && row.rowKey) {
            newOverrides[row.rowKey] = toYear;
        }
    });
    setYearOverridesPerRow(newOverrides);
};

// Reset all per-row overrides
const resetAllRowYears = () => {
    setYearOverridesPerRow({});
};
```

### Step 6: Computed Values for Year Editor
**Location:** After helper functions

```typescript
// Combined data for year editor
const yearEditorData = useMemo(() => {
    const combined = [
        ...rawRows.map(r => ({ ...r, type: 'masuk' as const })),
        ...rawRowsKeluar.map(r => ({ ...r, type: 'keluar' as const, asal: '-' }))
    ];
    
    // Apply search
    let filtered = combined;
    if (yearEditorSearch) {
        const query = yearEditorSearch.toLowerCase();
        filtered = filtered.filter(r => 
            r.jenis.toLowerCase().includes(query) ||
            (r.asal && r.asal.toLowerCase().includes(query))
        );
    }
    
    // Apply filter
    if (yearEditorFilter) {
        filtered = filtered.filter(r => r.year === yearEditorFilter);
    }
    
    return filtered;
}, [rawRows, rawRowsKeluar, yearEditorSearch, yearEditorFilter]);

// Paginated data
const yearEditorPaginatedData = useMemo(() => {
    const start = (yearEditorPage - 1) * yearEditorRowsPerPage;
    return yearEditorData.slice(start, start + yearEditorRowsPerPage);
}, [yearEditorData, yearEditorPage]);

const yearEditorTotalPages = Math.max(1, Math.ceil(yearEditorData.length / yearEditorRowsPerPage));

// Statistics
const yearEditorStats = useMemo(() => {
    const total = rawRows.length + rawRowsKeluar.length;
    const modified = Object.keys(yearOverridesPerRow).length;
    const yearCounts: Record<number, number> = {};
    [...rawRows, ...rawRowsKeluar].forEach(r => {
        yearCounts[r.year] = (yearCounts[r.year] || 0) + 1;
    });
    return { total, modified, yearCounts };
}, [rawRows, rawRowsKeluar, yearOverridesPerRow]);
```

### Step 7: Add Year Editor UI
**Location:** After Tab Asal content (line ~900)

```tsx
{/* ===== YEAR EDITOR SECTION ===== */}
{(rawRows.length > 0 || rawRowsKeluar.length > 0) && (
    <div className="year-editor-section">
        <div 
            className="year-editor-header"
            onClick={() => setShowYearEditor(!showYearEditor)}
        >
            <div className="year-editor-header-left">
                <span className="year-editor-icon">📝</span>
                <div className="year-editor-header-text">
                    <h3>EDIT TAHUN PER-ROW (Advanced)</h3>
                    <p>Edit tahun untuk setiap data secara individual</p>
                </div>
            </div>
            <div className="year-editor-header-right">
                {yearEditorStats.modified > 0 && (
                    <span className="year-editor-badge">
                        ✏️ {yearEditorStats.modified} diubah
                    </span>
                )}
                <button className="year-editor-toggle">
                    {showYearEditor ? '▲ Sembunyikan' : '▼ Tampilkan Editor'}
                </button>
            </div>
        </div>

        {showYearEditor && (
            <div className="year-editor-content">
                {/* Toolbar */}
                <div className="year-editor-toolbar">
                    <div className="year-editor-search">
                        <MagnifyingGlassIcon className="hi-icon" />
                        <input
                            type="text"
                            placeholder="Cari jenis atau asal surat..."
                            value={yearEditorSearch}
                            onChange={e => {
                                setYearEditorSearch(e.target.value);
                                setYearEditorPage(1);
                            }}
                        />
                    </div>
                    <select
                        className="year-editor-filter"
                        value={yearEditorFilter || ''}
                        onChange={e => {
                            setYearEditorFilter(e.target.value ? Number(e.target.value) : null);
                            setYearEditorPage(1);
                        }}
                    >
                        <option value="">Semua Tahun</option>
                        {Object.keys(yearEditorStats.yearCounts).map(y => (
                            <option key={y} value={y}>
                                Tahun {y} ({yearEditorStats.yearCounts[Number(y)]} data)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Bulk Actions */}
                <div className="year-editor-bulk">
                    <span className="year-editor-bulk-label">⚡ Bulk Actions:</span>
                    {Object.keys(yearEditorStats.yearCounts).map(fromYear => (
                        <div key={fromYear} className="year-editor-bulk-group">
                            <span>Ubah semua {fromYear} →</span>
                            {Array.from({ length: 11 }, (_, i) => 2020 + i)
                                .filter(y => y !== Number(fromYear))
                                .map(toYear => (
                                    <button
                                        key={toYear}
                                        className="year-editor-bulk-btn"
                                        onClick={() => bulkChangeYear(Number(fromYear), toYear)}
                                    >
                                        {toYear}
                                    </button>
                                ))}
                        </div>
                    ))}
                    {yearEditorStats.modified > 0 && (
                        <button
                            className="year-editor-reset-all"
                            onClick={resetAllRowYears}
                        >
                            🔄 Reset Semua ({yearEditorStats.modified})
                        </button>
                    )}
                </div>

                {/* Statistics */}
                <div className="year-editor-stats">
                    <span>📊 Total: {yearEditorStats.total} data</span>
                    <span>✏️ Diubah: {yearEditorStats.modified} data</span>
                    <span>📄 Ditampilkan: {yearEditorData.length} data</span>
                </div>

                {/* Table */}
                <div className="year-editor-table-wrap">
                    <table className="year-editor-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Tipe</th>
                                <th>Jenis Surat</th>
                                <th>Asal</th>
                                <th>Tanggal</th>
                                <th>Tahun Asli</th>
                                <th>Tahun Baru</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {yearEditorPaginatedData.map((row, i) => {
                                const globalIndex = (yearEditorPage - 1) * yearEditorRowsPerPage + i;
                                const isModified = isRowYearModified(row);
                                const currentYear = getRowYear(row);
                                
                                return (
                                    <tr key={row.rowKey || i} className={isModified ? 'row-modified' : ''}>
                                        <td>{globalIndex + 1}</td>
                                        <td>
                                            <span className={`type-badge ${row.type}`}>
                                                {row.type === 'masuk' ? '📥 Masuk' : '📤 Keluar'}
                                            </span>
                                        </td>
                                        <td className="td-jenis">{row.jenis}</td>
                                        <td className="td-asal">{row.asal || '-'}</td>
                                        <td>{formatDateDisplay(row.originalDate || '')}</td>
                                        <td className="td-year-original">{row.year}</td>
                                        <td className="td-year-new">
                                            <select
                                                value={currentYear}
                                                onChange={e => handleRowYearChange(row, Number(e.target.value))}
                                                className={isModified ? 'year-select-modified' : ''}
                                            >
                                                {Array.from({ length: 11 }, (_, i) => 2020 + i).map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            {isModified && (
                                                <button
                                                    className="year-reset-btn"
                                                    onClick={() => resetRowYear(row)}
                                                    title="Reset ke tahun asli"
                                                >
                                                    🔄
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {yearEditorTotalPages > 1 && (
                    <div className="year-editor-pagination">
                        <button
                            onClick={() => setYearEditorPage(p => Math.max(1, p - 1))}
                            disabled={yearEditorPage === 1}
                        >
                            ← Prev
                        </button>
                        <span>
                            Page {yearEditorPage} of {yearEditorTotalPages}
                        </span>
                        <button
                            onClick={() => setYearEditorPage(p => Math.min(yearEditorTotalPages, p + 1))}
                            disabled={yearEditorPage === yearEditorTotalPages}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
)}
```

### Step 8: Add CSS Styles
**Location:** In `<style jsx>` section (line ~1700+)

```css
/* ===== Year Editor Section ===== */
.year-editor-section {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.05);
    margin-top: 1.5rem;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

.year-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.75rem;
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
    cursor: pointer;
    transition: opacity 0.2s;
    flex-wrap: wrap;
    gap: 1rem;
}

.year-editor-header:hover {
    opacity: 0.95;
}

.year-editor-header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.year-editor-icon {
    font-size: 1.5rem;
}

.year-editor-header-text h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.5px;
}

.year-editor-header-text p {
    margin: 0;
    font-size: 0.78rem;
    color: rgba(255,255,255,0.8);
}

.year-editor-header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.year-editor-badge {
    background: rgba(255,255,255,0.2);
    color: #fff;
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    border: 1px solid rgba(255,255,255,0.3);
}

.year-editor-toggle {
    background: rgba(255,255,255,0.15);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
}

.year-editor-toggle:hover {
    background: rgba(255,255,255,0.25);
}

.year-editor-content {
    padding: 1.5rem 1.75rem;
}

.year-editor-toolbar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
}

.year-editor-search {
    flex: 1;
    min-width: 250px;
    position: relative;
    display: flex;
    align-items: center;
}

.year-editor-search input {
    width: 100%;
    padding: 0.6rem 0.9rem 0.6rem 2.5rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.9rem;
    outline: none;
}

.year-editor-search input:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
}

.year-editor-search .hi-icon {
    position: absolute;
    left: 0.75rem;
    width: 1.1rem;
    height: 1.1rem;
    color: #94a3b8;
}

.year-editor-filter {
    padding: 0.6rem 0.9rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 600;
    outline: none;
    cursor: pointer;
}

.year-editor-filter:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
}

.year-editor-bulk {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 1rem;
    background: #fef3c7;
    border-radius: 10px;
    margin-bottom: 1rem;
    align-items: center;
}

.year-editor-bulk-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #92400e;
}

.year-editor-bulk-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: #92400e;
}

.year-editor-bulk-btn {
    padding: 0.3rem 0.7rem;
    background: #fff;
    border: 1px solid #fbbf24;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #f59e0b;
    cursor: pointer;
    transition: all 0.2s;
}

.year-editor-bulk-btn:hover {
    background: #f59e0b;
    color: #fff;
}

.year-editor-reset-all {
    margin-left: auto;
    padding: 0.5rem 1rem;
    background: #dc2626;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
}

.year-editor-reset-all:hover {
    background: #b91c1c;
}

.year-editor-stats {
    display: flex;
    gap: 1.5rem;
    padding: 0.75rem 1rem;
    background: #f8fafc;
    border-radius: 10px;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
}

.year-editor-table-wrap {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
}

.year-editor-table {
    width: 100%;
    border-collapse: collapse;
}

.year-editor-table thead {
    background: #fef3c7;
}

.year-editor-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 700;
    color: #92400e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #fbbf24;
}

.year-editor-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s;
}

.year-editor-table tbody tr:hover {
    background: #fef3c7;
}

.year-editor-table tbody tr.row-modified {
    background: #dcfce7;
}

.year-editor-table tbody tr.row-modified:hover {
    background: #bbf7d0;
}

.year-editor-table td {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
}

.type-badge {
    display: inline-block;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
}

.type-badge.masuk {
    background: #dbeafe;
    color: #1e40af;
}

.type-badge.keluar {
    background: #fce7f3;
    color: #be123c;
}

.td-jenis {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.td-asal {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.td-year-original {
    font-weight: 600;
    color: #64748b;
}

.td-year-new select {
    padding: 0.4rem 0.6rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 700;
    outline: none;
    cursor: pointer;
}

.td-year-new select:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
}

.td-year-new select.year-select-modified {
    border-color: #10b981;
    background: #ecfdf5;
    color: #059669;
}

.year-reset-btn {
    padding: 0.3rem 0.6rem;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
}

.year-reset-btn:hover {
    background: #fef2f2;
    border-color: #fca5a5;
}

.year-editor-pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
}

.year-editor-pagination button {
    padding: 0.5rem 1rem;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.year-editor-pagination button:hover:not(:disabled) {
    background: #f59e0b;
    color: #fff;
    border-color: #f59e0b;
}

.year-editor-pagination button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.year-editor-pagination span {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
}
```

## Summary

Total changes needed:
1. ✅ Interface updates (DONE)
2. ✅ State additions (DONE)
3. ⏳ Excel parser updates (2 functions)
4. ⏳ filteredRows logic update
5. ⏳ Helper functions (10 functions)
6. ⏳ Computed values (3 useMemo)
7. ⏳ UI component (large JSX block)
8. ⏳ CSS styles (comprehensive)

**Estimated lines to add:** ~800 lines
**Current file size:** ~2500 lines
**Final file size:** ~3300 lines

This is a substantial feature. Would you like me to:
1. Continue with full implementation now?
2. Break it into smaller commits?
3. Create a separate component file?
