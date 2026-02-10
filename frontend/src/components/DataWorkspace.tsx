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
    
    // Toast notification
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const sourceTitle = source === 'sipede' ? 'SIPEDE' : 'SPDP';
    const sourceColor = source === 'sipede' ? '#0ea5e9' : '#8b5cf6';
    
    // Dynamic API URL - use current hostname for external IP access
    const getApiUrl = useCallback(() => {
        if (typeof window === 'undefined') return source === 'spdp' ? 'http://localhost:5001' : 'http://localhost:5000';
        const hostname = window.location.hostname;
        const port = source === 'spdp' ? '5001' : '5000';
        return `http://${hostname}:${port}`;
    }, [source]);
    
    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // Load data from API
    const loadFromApi = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const apiUrl = getApiUrl();
            const infoRes = await fetch(`${apiUrl}/api/scraper/data-info`);
            
            if (!infoRes.ok) {
                throw new Error(`Server error: ${infoRes.status}`);
            }
            
            const info = await infoRes.json();
            
            if (!info.exists || info.row_count === 0) {
                setError('Tidak ada data tersedia. Silakan scrape data terlebih dahulu.');
                return;
            }

            const dataRes = await fetch(`${apiUrl}/api/scraper/data?page=1&limit=${info.row_count + 100}`);
            
            if (!dataRes.ok) {
                throw new Error(`Server error: ${dataRes.status}`);
            }
            
            const result = await dataRes.json();
            
            if (result.success && result.data && result.data.length > 0) {
                setData(result.data);
                setHeaders(Object.keys(result.data[0]));
                setFileName(`Data ${sourceTitle} (${result.data.length} records)`);
                showToast(`Berhasil memuat ${result.data.length} data`, 'success');
            } else {
                setError('Gagal memuat data dari server');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(`Tidak dapat terhubung ke server: ${message}`);
        } finally {
            setIsLoading(false);
        }
    }, [getApiUrl, sourceTitle, showToast]);

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

    const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));

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
        if (filteredData.length === 0) {
            showToast('Tidak ada data untuk di-export', 'error');
            return;
        }
        try {
            const exportData = filteredData.map(row => {
                const newRow: Record<string, unknown> = {};
                headers.forEach(h => {
                    newRow[h] = row[h] ?? '';
                });
                return newRow;
            });
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, `${sourceTitle}_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast(`Berhasil export ${filteredData.length} data ke Excel`, 'success');
        } catch (err) {
            console.error('Export Excel error:', err);
            showToast('Gagal export ke Excel', 'error');
        }
    };

    const exportToCsv = () => {
        if (filteredData.length === 0) {
            showToast('Tidak ada data untuk di-export', 'error');
            return;
        }
        try {
            const exportData = filteredData.map(row => {
                const newRow: Record<string, unknown> = {};
                headers.forEach(h => {
                    newRow[h] = row[h] ?? '';
                });
                return newRow;
            });
            const ws = XLSX.utils.json_to_sheet(exportData);
            const csv = XLSX.utils.sheet_to_csv(ws);
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel compatibility
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${sourceTitle}_Export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showToast(`Berhasil export ${filteredData.length} data ke CSV`, 'success');
        } catch (err) {
            console.error('Export CSV error:', err);
            showToast('Gagal export ke CSV', 'error');
        }
    };

    const exportToPdf = () => {
        if (filteredData.length === 0) {
            showToast('Tidak ada data untuk di-export', 'error');
            return;
        }
        try {
            // Escape HTML entities untuk keamanan
            const escapeHtml = (str: unknown) => {
                const s = String(str ?? '-');
                return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            };
            
            const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Laporan ${sourceTitle}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #1e293b; border-bottom: 2px solid ${sourceColor}; padding-bottom: 10px; }
                    .summary { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
                    .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; min-width: 120px; }
                    .summary-card .value { font-size: 24px; font-weight: bold; color: ${sourceColor}; }
                    .summary-card .label { font-size: 12px; color: #64748b; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; word-wrap: break-word; }
                    th { background: ${sourceColor}; color: white; }
                    tr:nth-child(even) { background: #f8fafc; }
                    .status-summary { margin: 20px 0; }
                    .status-item { display: inline-block; margin-right: 15px; margin-bottom: 5px; padding: 5px 10px; background: #f1f5f9; border-radius: 4px; }
                    .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
                    @media print { body { padding: 0; } }
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
                    ${statusSummary.map(s => `<span class="status-item">${escapeHtml(s.status)}: ${s.count} (${s.percentage}%)</span>`).join('')}
                </div>
                ` : ''}
                <table>
                    <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
                    <tbody>${filteredData.slice(0, 500).map(row => 
                        `<tr>${headers.map(h => `<td>${escapeHtml(row[h])}</td>`).join('')}</tr>`
                    ).join('')}</tbody>
                </table>
                ${filteredData.length > 500 ? `<p><em>Menampilkan 500 dari ${filteredData.length} data</em></p>` : ''}
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
            showToast('Dokumen PDF siap diprint', 'success');
        } else {
            showToast('Popup diblokir. Izinkan popup untuk export PDF.', 'error');
        }
        } catch (err) {
            console.error('Export PDF error:', err);
            showToast('Gagal membuat PDF', 'error');
        }
    };

    const copyToClipboard = async () => {
        if (filteredData.length === 0) {
            showToast('Tidak ada data untuk disalin', 'error');
            return;
        }
        try {
            const text = filteredData.map(row => headers.map(h => String(row[h] ?? '')).join('\t')).join('\n');
            const fullText = headers.join('\t') + '\n' + text;
            await navigator.clipboard.writeText(fullText);
            showToast(`${filteredData.length} data berhasil disalin ke clipboard!`, 'success');
        } catch (err) {
            console.error('Copy clipboard error:', err);
            // Fallback untuk browser yang tidak support clipboard API
            try {
                const textArea = document.createElement('textarea');
                textArea.value = headers.join('\t') + '\n' + filteredData.map(row => headers.map(h => String(row[h] ?? '')).join('\t')).join('\n');
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast(`${filteredData.length} data berhasil disalin ke clipboard!`, 'success');
            } catch {
                showToast('Gagal menyalin ke clipboard', 'error');
            }
        }
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

    // Row selection - use actual data index (global), not page index
    const toggleRowSelection = (globalIndex: number) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(globalIndex)) {
            newSelected.delete(globalIndex);
        } else {
            newSelected.add(globalIndex);
        }
        setSelectedRows(newSelected);
    };

    const toggleSelectAll = () => {
        const startIdx = (currentPage - 1) * rowsPerPage;
        const pageIndices = paginatedData.map((_, i) => startIdx + i);
        const allSelected = pageIndices.every(idx => selectedRows.has(idx));
        
        const newSelected = new Set(selectedRows);
        if (allSelected) {
            pageIndices.forEach(idx => newSelected.delete(idx));
        } else {
            pageIndices.forEach(idx => newSelected.add(idx));
        }
        setSelectedRows(newSelected);
    };
    
    // Check if all current page rows are selected
    const isAllPageSelected = useMemo(() => {
        if (paginatedData.length === 0) return false;
        const startIdx = (currentPage - 1) * rowsPerPage;
        return paginatedData.every((_, i) => selectedRows.has(startIdx + i));
    }, [paginatedData, currentPage, rowsPerPage, selectedRows]);

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
                {/* Toast Notification */}
                {toast && (
                    <div className={`toast ${toast.type}`}>
                        {toast.type === 'success' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                        )}
                        <span>{toast.message}</span>
                    </div>
                )}
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
                    .workspace-container { padding: 2rem; min-height: calc(100vh - 80px); position: relative; }
                    .toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.25rem; border-radius: 10px; font-size: 0.9rem; font-weight: 500; z-index: 1000; animation: toastSlide 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
                    .toast.success { background: #dcfce7; color: #166534; }
                    .toast.error { background: #fef2f2; color: #dc2626; }
                    .toast svg { width: 18px; height: 18px; }
                    @keyframes toastSlide { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
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
            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.type === 'success' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                    )}
                    <span>{toast.message}</span>
                </div>
            )}
            
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
            </div>

            {/* Export Buttons Row */}
            <div className="export-row">
                <span className="export-label">Export:</span>
                <button className="export-btn-item excel" onClick={exportToExcel} title="Export ke Excel">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M8 13h2l2 3 2-6 2 3h2" />
                    </svg>
                    <span>Excel</span>
                </button>
                <button className="export-btn-item csv" onClick={exportToCsv} title="Export ke CSV">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="8" y1="13" x2="16" y2="13" />
                        <line x1="8" y1="17" x2="16" y2="17" />
                    </svg>
                    <span>CSV</span>
                </button>
                <button className="export-btn-item pdf" onClick={exportToPdf} title="Export ke PDF / Print">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M9 15h6" />
                        <path d="M9 11h6" />
                    </svg>
                    <span>PDF</span>
                </button>
                <button className="export-btn-item copy" onClick={copyToClipboard} title="Salin ke Clipboard">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy</span>
                </button>
            </div>

            {/* Summary Stats Row */}
            <div className="stats-row">
                <div className="stat-item primary">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{filteredData.length}</div>
                        <div className="stat-label">Total Data</div>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{headers.length}</div>
                        <div className="stat-label">Kolom</div>
                    </div>
                </div>
                <div className="stat-item">
                    <div className="stat-icon green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{selectedRows.size}</div>
                        <div className="stat-label">Dipilih</div>
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
                                        <input type="checkbox" checked={isAllPageSelected} onChange={toggleSelectAll} />
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
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={headers.length + 2} className="empty-state">
                                            <div className="empty-content">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                                <span>Tidak ada data yang cocok dengan filter</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                paginatedData.map((row, rowIdx) => {
                                    const globalIdx = (currentPage - 1) * rowsPerPage + rowIdx;
                                    return (
                                    <tr key={rowIdx} className={selectedRows.has(globalIdx) ? 'selected' : ''}>
                                        <td className="checkbox-col">
                                            <input type="checkbox" checked={selectedRows.has(globalIdx)} onChange={() => toggleRowSelection(globalIdx)} />
                                        </td>
                                        <td className="row-num-col">{globalIdx + 1}</td>
                                        {headers.map((header, colIdx) => (
                                            <td key={colIdx}>{String(row[header] ?? '-')}</td>
                                        ))}
                                    </tr>
                                    );
                                })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <div className="pagination-info">
                            {filteredData.length > 0 
                                ? `Menampilkan ${(currentPage - 1) * rowsPerPage + 1} - ${Math.min(currentPage * rowsPerPage, filteredData.length)} dari ${filteredData.length}`
                                : 'Tidak ada data yang cocok'}
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
                            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
                            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}>»</button>
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .workspace-container { padding: 1.5rem; min-height: calc(100vh - 80px); position: relative; }
                
                .toast { position: fixed; top: 20px; right: 20px; display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem 1.25rem; border-radius: 10px; font-size: 0.9rem; font-weight: 500; z-index: 1000; animation: slideIn 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
                .toast.success { background: #dcfce7; color: #166534; }
                .toast.error { background: #fef2f2; color: #dc2626; }
                .toast svg { width: 18px; height: 18px; }
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                
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
                
                .export-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
                .export-label { font-size: 0.875rem; color: #64748b; font-weight: 600; margin-right: 0.5rem; }
                .export-btn-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; border: none; border-radius: 8px; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: white; transition: all 0.2s; }
                .export-btn-item svg { width: 16px; height: 16px; }
                .export-btn-item:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .export-btn-item.excel { background: #16a34a; }
                .export-btn-item.excel:hover { background: #15803d; }
                .export-btn-item.csv { background: #2563eb; }
                .export-btn-item.csv:hover { background: #1d4ed8; }
                .export-btn-item.pdf { background: #dc2626; }
                .export-btn-item.pdf:hover { background: #b91c1c; }
                .export-btn-item.copy { background: #7c3aed; }
                .export-btn-item.copy:hover { background: #6d28d9; }

                .stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
                .stat-item { display: flex; align-items: flex-start; gap: 0.875rem; background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); flex: 1; min-width: 200px; }
                .stat-item.primary { background: ${sourceColor}; color: white; }
                .stat-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 10px; flex-shrink: 0; }
                .stat-item.primary .stat-icon { background: rgba(255,255,255,0.2); }
                .stat-item.primary .stat-icon svg { color: white; }
                .stat-icon.blue { background: #dbeafe; }
                .stat-icon.blue svg { color: #2563eb; }
                .stat-icon.green { background: #dcfce7; }
                .stat-icon.green svg { color: #16a34a; }
                .stat-icon svg { width: 24px; height: 24px; }
                .stat-content { display: flex; flex-direction: column; justify-content: center; }
                .stat-item.primary .stat-value { color: white; }
                .stat-item.primary .stat-label { color: rgba(255,255,255,0.9); }
                .stat-value { font-size: 1.75rem; font-weight: 700; color: #1e293b; line-height: 1.2; margin-bottom: 0.125rem; }
                .stat-label { font-size: 0.8rem; color: #64748b; }

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
                .empty-state { text-align: center; padding: 3rem 1rem !important; }
                .empty-content { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; color: #94a3b8; }
                .empty-content svg { width: 48px; height: 48px; opacity: 0.5; }
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
