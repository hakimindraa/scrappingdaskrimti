'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';

interface DataWorkspaceProps {
    source: 'sipede' | 'spdp';
}

interface FilterConfig {
    column: string;
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'notContains';
    value: string;
}

interface SortConfig {
    column: string;
    direction: 'asc' | 'desc';
}

interface ColumnStats {
    name: string;
    uniqueCount: number;
    topValues: { value: string; count: number }[];
}

export default function DataWorkspace({ source }: DataWorkspaceProps) {
    const [data, setData] = useState<Record<string, unknown>[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    
    // Search & Filter
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterConfig[]>([]);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    
    // Sort
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    
    // Selection
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    
    // View mode
    const [viewMode, setViewMode] = useState<'table' | 'cards' | 'summary'>('table');
    
    // Print ref
    const printRef = useRef<HTMLDivElement>(null);

    const sourceTitle = source === 'sipede' ? 'SIPEDE' : 'SPDP';
    const sourceColor = source === 'sipede' ? '#0ea5e9' : '#8b5cf6';
    const apiUrl = source === 'spdp' ? 'http://localhost:5001' : 'http://localhost:5000';

    // Load data from API
    const loadFromApi = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const infoRes = await fetch(`${apiUrl}/api/scraper/data-info`);
            const info = await infoRes.json();
            
            if (!info.exists || info.row_count === 0) {
                setError('Tidak ada data tersedia. Silakan scrape data terlebih dahulu.');
                return;
            }

            const dataRes = await fetch(`${apiUrl}/api/scraper/data?page=1&limit=${info.row_count + 100}`);
            const result = await dataRes.json();
            
            if (result.success && result.data && result.data.length > 0) {
                setData(result.data);
                setHeaders(Object.keys(result.data[0]));
                setFileName(`Data ${sourceTitle} (${result.data.length} records)`);
            } else {
                setError('Gagal memuat data dari server');
            }
        } catch {
            setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
        } finally {
            setIsLoading(false);
        }
    }, [apiUrl, sourceTitle]);

    // Load from Excel file
    const loadFromFile = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

            if (jsonData.length === 0) {
                throw new Error('File tidak memiliki data');
            }

            setData(jsonData);
            setHeaders(Object.keys(jsonData[0]));
            setFileName(file.name);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal memproses file');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            loadFromFile(file);
        } else {
            setError('Harap upload file Excel (.xlsx atau .xls)');
        }
    }, [loadFromFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) loadFromFile(file);
    }, [loadFromFile]);

    // Filter & Search Logic
    const filteredData = useMemo(() => {
        let result = [...data];

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(row =>
                headers.some(h => String(row[h] || '').toLowerCase().includes(query))
            );
        }

        // Apply filters
        filters.forEach(filter => {
            if (filter.value) {
                result = result.filter(row => {
                    const cellValue = String(row[filter.column] || '').toLowerCase();
                    const filterValue = filter.value.toLowerCase();
                    switch (filter.operator) {
                        case 'contains': return cellValue.includes(filterValue);
                        case 'equals': return cellValue === filterValue;
                        case 'startsWith': return cellValue.startsWith(filterValue);
                        case 'endsWith': return cellValue.endsWith(filterValue);
                        case 'notContains': return !cellValue.includes(filterValue);
                        default: return true;
                    }
                });
            }
        });

        // Apply sort
        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = String(a[sortConfig.column] || '');
                const bVal = String(b[sortConfig.column] || '');
                const comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        return result;
    }, [data, searchQuery, filters, sortConfig, headers]);

    // Pagination
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(start, start + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);

    // Column Statistics
    const columnStats = useMemo((): ColumnStats[] => {
        return headers.map(header => {
            const values = data.map(row => row[header]);
            const uniqueValues = new Set(values.map(v => String(v || '')));
            const valueCounts: Record<string, number> = {};
            values.forEach(v => {
                const str = String(v || '');
                valueCounts[str] = (valueCounts[str] || 0) + 1;
            });
            const topValues = Object.entries(valueCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([value, count]) => ({ value, count }));
            return { name: header, uniqueCount: uniqueValues.size, topValues };
        });
    }, [data, headers]);

    // Status/Category summary for SPDP
    const statusSummary = useMemo(() => {
        const statusCol = headers.find(h => h.toLowerCase().includes('status'));
        if (!statusCol) return null;
        
        const counts: Record<string, number> = {};
        data.forEach(row => {
            const status = String(row[statusCol] || 'Tidak Ada');
            counts[status] = (counts[status] || 0) + 1;
        });
        
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([status, count]) => ({ status, count, percentage: Math.round((count / data.length) * 100) }));
    }, [data, headers]);

    // Export Functions
    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `${sourceTitle}_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToCsv = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${sourceTitle}_Export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportToPdf = () => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan ${sourceTitle}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #1e293b; border-bottom: 2px solid ${sourceColor}; padding-bottom: 10px; }
                    .summary { display: flex; gap: 20px; margin: 20px 0; }
                    .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; min-width: 120px; }
                    .summary-card .value { font-size: 24px; font-weight: bold; color: ${sourceColor}; }
                    .summary-card .label { font-size: 12px; color: #64748b; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                    th { background: ${sourceColor}; color: white; }
                    tr:nth-child(even) { background: #f8fafc; }
                    .status-summary { margin: 20px 0; }
                    .status-item { display: inline-block; margin-right: 15px; padding: 5px 10px; background: #f1f5f9; border-radius: 4px; }
                    .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                </style>
            </head>
            <body>
                <h1>Laporan Data ${sourceTitle}</h1>
                <div class="summary">
                    <div class="summary-card"><div class="value">${filteredData.length}</div><div class="label">Total Data</div></div>
                    <div class="summary-card"><div class="value">${headers.length}</div><div class="label">Kolom</div></div>
                    <div class="summary-card"><div class="value">${new Date().toLocaleDateString('id-ID')}</div><div class="label">Tanggal</div></div>
                </div>
                ${statusSummary ? `
                <div class="status-summary">
                    <strong>Ringkasan Status:</strong><br>
                    ${statusSummary.map(s => `<span class="status-item">${s.status}: ${s.count} (${s.percentage}%)</span>`).join('')}
                </div>
                ` : ''}
                <table>
                    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                    <tbody>${filteredData.slice(0, 100).map(row => 
                        `<tr>${headers.map(h => `<td>${row[h] || '-'}</td>`).join('')}</tr>`
                    ).join('')}</tbody>
                </table>
                ${filteredData.length > 100 ? `<p><em>Menampilkan 100 dari ${filteredData.length} data</em></p>` : ''}
                <div class="footer">
                    Digenerate oleh Dasta - ${new Date().toLocaleString('id-ID')}
                </div>
            </body>
            </html>
        `;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const copyToClipboard = () => {
        const text = filteredData.map(row => headers.map(h => row[h]).join('\t')).join('\n');
        navigator.clipboard.writeText(headers.join('\t') + '\n' + text);
        alert('Data berhasil disalin ke clipboard!');
    };

    // Add filter
    const addFilter = () => {
        if (headers.length > 0) {
            setFilters([...filters, { column: headers[0], operator: 'contains', value: '' }]);
        }
    };

    const updateFilter = (index: number, updates: Partial<FilterConfig>) => {
        const newFilters = [...filters];
        newFilters[index] = { ...newFilters[index], ...updates };
        setFilters(newFilters);
    };

    const removeFilter = (index: number) => {
        setFilters(filters.filter((_, i) => i !== index));
    };

    // Sort handler
    const handleSort = (column: string) => {
        setSortConfig(prev => {
            if (prev?.column === column) {
                return prev.direction === 'asc' 
                    ? { column, direction: 'desc' }
                    : null;
            }
            return { column, direction: 'asc' };
        });
    };

    // Row selection
    const toggleRowSelection = (index: number) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedRows(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === paginatedData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(paginatedData.map((_, i) => i)));
        }
    };

    // Clear data
    const clearData = () => {
        setData([]);
        setHeaders([]);
        setFileName('');
        setFilters([]);
        setSearchQuery('');
        setSortConfig(null);
        setSelectedRows(new Set());
    };

    if (data.length === 0) {
        return (
            <div className="workspace-container">
                <div className="upload-section">
                    <div className="upload-header">
                        <div className="upload-icon" style={{ background: `${sourceColor}20`, color: sourceColor }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                        </div>
                        <h2>Data Workspace {sourceTitle}</h2>
                        <p>Muat data dari server atau upload file Excel untuk mulai bekerja</p>
                    </div>

                    <div className="source-options">
                        <button className="source-btn primary" onClick={loadFromApi} disabled={isLoading}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                            </svg>
                            Muat dari Server
                        </button>
                        <span className="divider">atau</span>
                        <div
                            className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="file-input" id="file-upload" />
                            <label htmlFor="file-upload">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <span>Upload File Excel</span>
                            </label>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="loading-state">
                            <div className="spinner" style={{ borderTopColor: sourceColor }}></div>
                            <span>Memuat data...</span>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {error}
                        </div>
                    )}
                </div>

                <style jsx>{`
                    .workspace-container { padding: 2rem; min-height: calc(100vh - 80px); }
                    .upload-section { max-width: 600px; margin: 3rem auto; text-align: center; }
                    .upload-header { margin-bottom: 2rem; }
                    .upload-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
                    .upload-icon svg { width: 32px; height: 32px; }
                    .upload-header h2 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
                    .upload-header p { color: #64748b; }
                    .source-options { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                    .source-btn { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; border: none; border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
                    .source-btn.primary { background: ${sourceColor}; color: white; }
                    .source-btn.primary:hover { filter: brightness(1.1); }
                    .source-btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
                    .source-btn svg { width: 20px; height: 20px; }
                    .divider { color: #94a3b8; font-size: 0.875rem; }
                    .upload-dropzone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 2rem; cursor: pointer; transition: all 0.2s; }
                    .upload-dropzone:hover, .upload-dropzone.drag-over { border-color: ${sourceColor}; background: ${sourceColor}08; }
                    .file-input { display: none; }
                    .upload-dropzone label { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; color: #64748b; }
                    .upload-dropzone svg { width: 32px; height: 32px; color: ${sourceColor}; }
                    .loading-state { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1.5rem; color: #64748b; }
                    .spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: ${sourceColor}; border-radius: 50%; animation: spin 1s linear infinite; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    .error-message { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; padding: 1rem; background: #fef2f2; color: #dc2626; border-radius: 8px; }
                    .error-message svg { width: 20px; height: 20px; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="workspace-container" ref={printRef}>
            {/* Toolbar */}
            <div className="toolbar">
                <div className="toolbar-left">
                    <h2 style={{ color: sourceColor }}>{fileName}</h2>
                    <span className="data-count">{filteredData.length} dari {data.length} data</span>
                </div>
                <div className="toolbar-right">
                    <button className="tool-btn" onClick={() => setViewMode('table')} data-active={viewMode === 'table'}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="9" x2="9" y2="21" /><line x1="15" y1="9" x2="15" y2="21" /></svg>
                    </button>
                    <button className="tool-btn" onClick={() => setViewMode('summary')} data-active={viewMode === 'summary'}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                    </button>
                    <div className="toolbar-divider"></div>
                    <button className="tool-btn" onClick={clearData} title="Ganti Data">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="search-bar">
                <div className="search-input-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                        type="text"
                        placeholder="Cari di semua kolom..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                    {searchQuery && (
                        <button className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
                    )}
                </div>
                <button className="filter-toggle" onClick={() => setShowFilterPanel(!showFilterPanel)} data-active={filters.length > 0}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                    Filter {filters.length > 0 && `(${filters.length})`}
                </button>
                <div className="export-dropdown">
                    <button className="export-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Export
                    </button>
                    <div className="export-menu">
                        <button onClick={exportToExcel}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>Excel (.xlsx)</button>
                        <button onClick={exportToCsv}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>CSV (.csv)</button>
                        <button onClick={exportToPdf}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>PDF / Print</button>
                        <button onClick={copyToClipboard}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy to Clipboard</button>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
                <div className="filter-panel">
                    <div className="filter-header">
                        <h4>Filter Data</h4>
                        <button onClick={addFilter}>+ Tambah Filter</button>
                    </div>
                    {filters.map((filter, idx) => (
                        <div key={idx} className="filter-row">
                            <select value={filter.column} onChange={(e) => updateFilter(idx, { column: e.target.value })}>
                                {headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <select value={filter.operator} onChange={(e) => updateFilter(idx, { operator: e.target.value as FilterConfig['operator'] })}>
                                <option value="contains">Mengandung</option>
                                <option value="equals">Sama dengan</option>
                                <option value="startsWith">Dimulai dengan</option>
                                <option value="endsWith">Diakhiri dengan</option>
                                <option value="notContains">Tidak mengandung</option>
                            </select>
                            <input
                                type="text"
                                placeholder="Nilai..."
                                value={filter.value}
                                onChange={(e) => { updateFilter(idx, { value: e.target.value }); setCurrentPage(1); }}
                            />
                            <button className="remove-filter" onClick={() => removeFilter(idx)}>×</button>
                        </div>
                    ))}
                    {filters.length === 0 && <p className="no-filters">Belum ada filter. Klik &quot;Tambah Filter&quot; untuk memulai.</p>}
                </div>
            )}

            {/* Summary View */}
            {viewMode === 'summary' && (
                <div className="summary-view">
                    <div className="summary-grid">
                        <div className="summary-card main">
                            <div className="card-icon" style={{ background: `${sourceColor}20`, color: sourceColor }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            </div>
                            <div className="card-value">{filteredData.length}</div>
                            <div className="card-label">Total Data</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                            </div>
                            <div className="card-value">{headers.length}</div>
                            <div className="card-label">Kolom</div>
                        </div>
                        <div className="summary-card">
                            <div className="card-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                            </div>
                            <div className="card-value">{selectedRows.size}</div>
                            <div className="card-label">Dipilih</div>
                        </div>
                    </div>

                    {statusSummary && (
                        <div className="status-summary-section">
                            <h4>Ringkasan Status</h4>
                            <div className="status-bars">
                                {statusSummary.map((s, idx) => (
                                    <div key={idx} className="status-bar-item">
                                        <div className="status-info">
                                            <span className="status-name">{s.status}</span>
                                            <span className="status-count">{s.count} ({s.percentage}%)</span>
                                        </div>
                                        <div className="status-bar-track">
                                            <div className="status-bar-fill" style={{ width: `${s.percentage}%`, background: [`#10b981`, `#0ea5e9`, `#f59e0b`, `#ef4444`, `#8b5cf6`][idx % 5] }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="column-summary">
                        <h4>Ringkasan Kolom</h4>
                        <div className="column-cards">
                            {columnStats.slice(0, 6).map((col, idx) => (
                                <div key={idx} className="column-stat-card">
                                    <div className="col-name">{col.name}</div>
                                    <div className="col-unique">{col.uniqueCount} nilai unik</div>
                                    <div className="col-top">
                                        {col.topValues.slice(0, 3).map((tv, tvIdx) => (
                                            <div key={tvIdx} className="top-value">
                                                <span className="tv-text">{tv.value.length > 15 ? tv.value.slice(0, 15) + '...' : tv.value}</span>
                                                <span className="tv-count">{tv.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
                <>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th className="checkbox-col">
                                        <input type="checkbox" checked={selectedRows.size === paginatedData.length && paginatedData.length > 0} onChange={toggleSelectAll} />
                                    </th>
                                    <th className="row-num-col">#</th>
                                    {headers.map(header => (
                                        <th key={header} onClick={() => handleSort(header)} className="sortable">
                                            {header}
                                            {sortConfig?.column === header && (
                                                <span className="sort-indicator">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, rowIdx) => (
                                    <tr key={rowIdx} className={selectedRows.has(rowIdx) ? 'selected' : ''}>
                                        <td className="checkbox-col">
                                            <input type="checkbox" checked={selectedRows.has(rowIdx)} onChange={() => toggleRowSelection(rowIdx)} />
                                        </td>
                                        <td className="row-num-col">{(currentPage - 1) * rowsPerPage + rowIdx + 1}</td>
                                        {headers.map((header, colIdx) => (
                                            <td key={colIdx}>{String(row[header] ?? '-')}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <div className="pagination-info">
                            Menampilkan {(currentPage - 1) * rowsPerPage + 1} - {Math.min(currentPage * rowsPerPage, filteredData.length)} dari {filteredData.length}
                        </div>
                        <div className="pagination-controls">
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                <option value={10}>10 / halaman</option>
                                <option value={25}>25 / halaman</option>
                                <option value={50}>50 / halaman</option>
                                <option value={100}>100 / halaman</option>
                            </select>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>«</button>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                            <span>Hal {currentPage} / {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>»</button>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .workspace-container { padding: 1.5rem; min-height: calc(100vh - 80px); }
                
                .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .toolbar-left { display: flex; align-items: center; gap: 1rem; }
                .toolbar-left h2 { font-size: 1.25rem; font-weight: 600; margin: 0; }
                .data-count { font-size: 0.875rem; color: #64748b; background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 20px; }
                .toolbar-right { display: flex; align-items: center; gap: 0.5rem; }
                .tool-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s; }
                .tool-btn:hover { background: #f8fafc; }
                .tool-btn[data-active="true"] { background: ${sourceColor}; border-color: ${sourceColor}; color: white; }
                .tool-btn svg { width: 18px; height: 18px; }
                .toolbar-divider { width: 1px; height: 24px; background: #e2e8f0; margin: 0 0.5rem; }

                .search-bar { display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: center; flex-wrap: wrap; }
                .search-input-wrapper { position: relative; flex: 1; min-width: 250px; }
                .search-input-wrapper svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #94a3b8; }
                .search-input-wrapper input { width: 100%; padding: 0.75rem 2.5rem 0.75rem 2.75rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.9rem; transition: all 0.2s; }
                .search-input-wrapper input:focus { outline: none; border-color: ${sourceColor}; box-shadow: 0 0 0 3px ${sourceColor}20; }
                .clear-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: #e2e8f0; border: none; width: 20px; height: 20px; border-radius: 50%; cursor: pointer; font-size: 14px; line-height: 1; }
                .filter-toggle { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; border-radius: 10px; background: white; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; }
                .filter-toggle:hover { background: #f8fafc; }
                .filter-toggle[data-active="true"] { background: ${sourceColor}10; border-color: ${sourceColor}; color: ${sourceColor}; }
                .filter-toggle svg { width: 16px; height: 16px; }
                
                .export-dropdown { position: relative; }
                .export-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: ${sourceColor}; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 0.9rem; font-weight: 500; }
                .export-btn svg { width: 16px; height: 16px; }
                .export-menu { position: absolute; top: 100%; right: 0; margin-top: 0.5rem; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); padding: 0.5rem; min-width: 180px; z-index: 100; display: none; }
                .export-dropdown:hover .export-menu { display: block; }
                .export-menu button { display: flex; align-items: center; gap: 0.75rem; width: 100%; padding: 0.625rem 0.875rem; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: #374151; text-align: left; }
                .export-menu button:hover { background: #f1f5f9; }
                .export-menu button svg { width: 16px; height: 16px; color: #64748b; }

                .filter-panel { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
                .filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
                .filter-header h4 { margin: 0; font-size: 0.9rem; color: #374151; }
                .filter-header button { padding: 0.375rem 0.75rem; background: ${sourceColor}; color: white; border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer; }
                .filter-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center; }
                .filter-row select, .filter-row input { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; }
                .filter-row select { min-width: 150px; }
                .filter-row input { flex: 1; }
                .remove-filter { width: 28px; height: 28px; border: none; background: #fee2e2; color: #dc2626; border-radius: 6px; cursor: pointer; font-size: 16px; }
                .no-filters { color: #94a3b8; font-size: 0.85rem; margin: 0; }

                .summary-view { }
                .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
                .summary-card { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .summary-card.main { background: ${sourceColor}; color: white; }
                .summary-card.main .card-icon { background: rgba(255,255,255,0.2) !important; color: white !important; }
                .card-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem; }
                .card-icon svg { width: 22px; height: 22px; }
                .card-value { font-size: 1.75rem; font-weight: 700; }
                .card-label { font-size: 0.8rem; opacity: 0.8; }

                .status-summary-section { background: white; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .status-summary-section h4 { margin: 0 0 1rem; font-size: 0.95rem; color: #374151; }
                .status-bars { display: flex; flex-direction: column; gap: 0.75rem; }
                .status-bar-item { }
                .status-info { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
                .status-name { font-size: 0.85rem; color: #374151; }
                .status-count { font-size: 0.8rem; color: #64748b; }
                .status-bar-track { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
                .status-bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }

                .column-summary { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .column-summary h4 { margin: 0 0 1rem; font-size: 0.95rem; color: #374151; }
                .column-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
                .column-stat-card { background: #f8fafc; border-radius: 10px; padding: 1rem; }
                .col-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; margin-bottom: 0.25rem; }
                .col-unique { font-size: 0.75rem; color: #64748b; margin-bottom: 0.75rem; }
                .top-value { display: flex; justify-content: space-between; font-size: 0.8rem; padding: 0.25rem 0; border-bottom: 1px solid #e2e8f0; }
                .top-value:last-child { border-bottom: none; }
                .tv-text { color: #475569; }
                .tv-count { color: ${sourceColor}; font-weight: 600; }

                .table-container { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 1rem; overflow-x: auto; }
                table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
                th { background: #f8fafc; font-weight: 600; color: #475569; position: sticky; top: 0; }
                th.sortable { cursor: pointer; user-select: none; }
                th.sortable:hover { background: #f1f5f9; }
                .sort-indicator { margin-left: 0.5rem; color: ${sourceColor}; }
                .checkbox-col { width: 40px; text-align: center; }
                .row-num-col { width: 50px; color: #94a3b8; font-size: 0.8rem; }
                tr:hover td { background: #f8fafc; }
                tr.selected td { background: ${sourceColor}10; }
                td { max-width: 250px; overflow: hidden; text-overflow: ellipsis; }

                .pagination { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
                .pagination-info { font-size: 0.85rem; color: #64748b; }
                .pagination-controls { display: flex; align-items: center; gap: 0.5rem; }
                .pagination-controls select { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; }
                .pagination-controls button { padding: 0.5rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer; font-size: 0.85rem; }
                .pagination-controls button:hover:not(:disabled) { background: #f8fafc; }
                .pagination-controls button:disabled { opacity: 0.5; cursor: not-allowed; }
                .pagination-controls span { font-size: 0.85rem; color: #64748b; padding: 0 0.5rem; }

                @media (max-width: 768px) {
                    .toolbar { flex-direction: column; align-items: flex-start; gap: 1rem; }
                    .search-bar { flex-direction: column; }
                    .search-input-wrapper { width: 100%; }
                }
            `}</style>
        </div>
    );
}
