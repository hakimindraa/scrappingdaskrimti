'use client';

import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface InsightTabProps {
    source: 'sipede' | 'spdp';
}

interface ColumnStats {
    name: string;
    type: 'number' | 'text' | 'date' | 'mixed';
    uniqueCount: number;
    nullCount: number;
    fillRate: number;
    min?: number;
    max?: number;
    avg?: number;
    sum?: number;
    median?: number;
    topValues?: { value: string; count: number; percentage: number }[];
    distribution?: { range: string; count: number }[];
}

interface TimeSeriesData {
    period: string;
    count: number;
}

interface DataInsight {
    headers: string[];
    data: Record<string, unknown>[];
    rowCount: number;
    columnStats: ColumnStats[];
    fileName: string;
    dateColumn?: string;
    timeSeriesData?: TimeSeriesData[];
    categoryDistribution?: { category: string; count: number; percentage: number }[];
    categoryColumn?: string;
}

export default function InsightTab({ source }: InsightTabProps) {
    const [insight, setInsight] = useState<DataInsight | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [activeView, setActiveView] = useState<'overview' | 'columns' | 'data'>('overview');

    const detectDateColumn = (data: Record<string, unknown>[], headers: string[]): string | undefined => {
        const dateKeywords = ['tanggal', 'date', 'tgl', 'waktu', 'time', 'created', 'updated', 'tahun', 'bulan'];
        
        for (const header of headers) {
            const lowerHeader = header.toLowerCase();
            if (dateKeywords.some(kw => lowerHeader.includes(kw))) {
                return header;
            }
        }
        
        for (const header of headers) {
            const sampleValues = data.slice(0, 10).map(row => row[header]);
            const datePattern = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|^\d{1,2}\s+\w+\s+\d{4}/;
            if (sampleValues.some(v => v && datePattern.test(String(v)))) {
                return header;
            }
        }
        
        return undefined;
    };

    const detectCategoryColumn = (data: Record<string, unknown>[], headers: string[]): string | undefined => {
        const categoryKeywords = ['status', 'jenis', 'tipe', 'type', 'kategori', 'category', 'keterangan', 'satker', 'unit', 'wilayah', 'daerah'];
        
        for (const header of headers) {
            const lowerHeader = header.toLowerCase();
            if (categoryKeywords.some(kw => lowerHeader.includes(kw))) {
                const uniqueCount = new Set(data.map(row => row[header])).size;
                if (uniqueCount > 1 && uniqueCount <= 20) {
                    return header;
                }
            }
        }
        
        for (const header of headers) {
            const uniqueCount = new Set(data.map(row => row[header])).size;
            if (uniqueCount >= 2 && uniqueCount <= 15) {
                const nonNumeric = data.every(row => isNaN(Number(row[header])));
                if (nonNumeric) {
                    return header;
                }
            }
        }
        
        return undefined;
    };

    const generateTimeSeries = (data: Record<string, unknown>[], dateColumn: string): TimeSeriesData[] => {
        const monthCounts: Record<string, number> = {};
        
        data.forEach(row => {
            const dateValue = row[dateColumn];
            if (dateValue) {
                try {
                    const date = new Date(String(dateValue));
                    if (!isNaN(date.getTime())) {
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
                    }
                } catch {
                    const str = String(dateValue);
                    const match = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
                    if (match) {
                        const months: Record<string, string> = {
                            'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
                            'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
                            'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
                        };
                        const month = months[match[2].toLowerCase()];
                        if (month) {
                            const monthKey = `${match[3]}-${month}`;
                            monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
                        }
                    }
                }
            }
        });
        
        return Object.entries(monthCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([period, count]) => ({ period, count }));
    };

    const generateCategoryDistribution = (data: Record<string, unknown>[], column: string): { category: string; count: number; percentage: number }[] => {
        const counts: Record<string, number> = {};
        
        data.forEach(row => {
            const value = String(row[column] || 'Tidak Ada');
            counts[value] = (counts[value] || 0) + 1;
        });
        
        const total = data.length;
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([category, count]) => ({
                category,
                count,
                percentage: Math.round((count / total) * 100)
            }));
    };

    const analyzeColumn = (data: Record<string, unknown>[], key: string): ColumnStats => {
        const values = data.map(row => row[key]);
        const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
        const nullCount = values.length - nonNullValues.length;
        const fillRate = Math.round((nonNullValues.length / values.length) * 100);

        let type: 'number' | 'text' | 'date' | 'mixed' = 'text';
        const numericValues = nonNullValues.filter(v => !isNaN(Number(v)) && v !== '');
        const datePattern = /^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}|^\d{1,2}\s+\w+\s+\d{4}/;
        
        if (numericValues.length === nonNullValues.length && numericValues.length > 0) {
            type = 'number';
        } else if (nonNullValues.filter(v => datePattern.test(String(v))).length > nonNullValues.length * 0.5) {
            type = 'date';
        }

        const uniqueValues = new Set(nonNullValues.map(v => String(v)));
        
        const valueCounts: Record<string, number> = {};
        nonNullValues.forEach(v => {
            const str = String(v);
            valueCounts[str] = (valueCounts[str] || 0) + 1;
        });
        const topValues = Object.entries(valueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([value, count]) => ({ 
                value, 
                count,
                percentage: Math.round((count / nonNullValues.length) * 100)
            }));

        const stats: ColumnStats = {
            name: key,
            type,
            uniqueCount: uniqueValues.size,
            nullCount,
            fillRate,
            topValues
        };

        if (type === 'number') {
            const nums = numericValues.map(v => Number(v)).sort((a, b) => a - b);
            stats.min = nums[0];
            stats.max = nums[nums.length - 1];
            stats.sum = nums.reduce((a, b) => a + b, 0);
            stats.avg = stats.sum / nums.length;
            stats.median = nums.length % 2 === 0 
                ? (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2 
                : nums[Math.floor(nums.length / 2)];

            const range = stats.max - stats.min;
            const bucketSize = range / 5;
            const distribution: { range: string; count: number }[] = [];
            
            for (let i = 0; i < 5; i++) {
                const from = stats.min + (bucketSize * i);
                const to = stats.min + (bucketSize * (i + 1));
                const count = nums.filter(n => n >= from && (i === 4 ? n <= to : n < to)).length;
                distribution.push({
                    range: `${Math.round(from).toLocaleString()} - ${Math.round(to).toLocaleString()}`,
                    count
                });
            }
            stats.distribution = distribution;
        }

        return stats;
    };

    const processFile = useCallback(async (file: File) => {
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

            const headers = Object.keys(jsonData[0]);
            const columnStats = headers.map(header => analyzeColumn(jsonData, header));
            
            const dateColumn = detectDateColumn(jsonData, headers);
            const categoryColumn = detectCategoryColumn(jsonData, headers);
            
            const insightData: DataInsight = {
                headers,
                data: jsonData,
                rowCount: jsonData.length,
                columnStats,
                fileName: file.name,
                dateColumn,
                categoryColumn
            };
            
            if (dateColumn) {
                insightData.timeSeriesData = generateTimeSeries(jsonData, dateColumn);
            }
            
            if (categoryColumn) {
                insightData.categoryDistribution = generateCategoryDistribution(jsonData, categoryColumn);
            }

            setInsight(insightData);
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
            processFile(file);
        } else {
            setError('Harap upload file Excel (.xlsx atau .xls)');
        }
    }, [processFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }, [processFile]);

    const metrics = useMemo(() => {
        if (!insight) return null;

        const numericColumns = insight.columnStats.filter(c => c.type === 'number');
        const textColumns = insight.columnStats.filter(c => c.type === 'text');
        const dateColumns = insight.columnStats.filter(c => c.type === 'date');
        const totalCells = insight.rowCount * insight.headers.length;
        const totalNulls = insight.columnStats.reduce((sum, c) => sum + c.nullCount, 0);
        const avgFillRate = Math.round(insight.columnStats.reduce((sum, c) => sum + c.fillRate, 0) / insight.columnStats.length);
        const avgUniqueRatio = Math.round(
            insight.columnStats.reduce((sum, c) => sum + (c.uniqueCount / insight.rowCount * 100), 0) / insight.columnStats.length
        );

        return {
            numericColumns: numericColumns.length,
            textColumns: textColumns.length,
            dateColumns: dateColumns.length,
            totalCells,
            totalNulls,
            avgFillRate,
            avgUniqueRatio,
            dataQuality: avgFillRate >= 90 ? 'Sangat Baik' : avgFillRate >= 70 ? 'Baik' : avgFillRate >= 50 ? 'Cukup' : 'Perlu Perbaikan'
        };
    }, [insight]);

    const sourceTitle = source === 'sipede' ? 'SIPEDE' : 'SPDP';
    const sourceColor = source === 'sipede' ? '#0ea5e9' : '#8b5cf6';
    const sourceGradient = source === 'sipede' 
        ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' 
        : 'linear-gradient(135deg, #8b5cf6, #7c3aed)';

    const chartColors = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#ec4899'];

    return (
        <div className="insight-container">
            {!insight ? (
                <div className="upload-section">
                    <div className="upload-header">
                        <div className="upload-icon" style={{ background: `${sourceColor}20`, color: sourceColor }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <h2>Upload Data {sourceTitle}</h2>
                        <p>Import file Excel untuk menganalisis dan mendapatkan insight mendalam dari data {sourceTitle}</p>
                    </div>

                    <div
                        className={`upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
                        style={{ borderColor: isDragOver ? sourceColor : undefined }}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                    >
                        <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="file-input" id="file-upload" />
                        <label htmlFor="file-upload" className="upload-label">
                            <div className="upload-icon-large" style={{ color: sourceColor }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <path d="M12 18v-6M9 15l3-3 3 3" />
                                </svg>
                            </div>
                            <span className="upload-text"><strong style={{ color: sourceColor }}>Klik untuk upload</strong> atau drag & drop</span>
                            <span className="upload-hint">Format: .xlsx, .xls (Max 10MB)</span>
                        </label>
                    </div>

                    {isLoading && (
                        <div className="loading-state">
                            <div className="spinner" style={{ borderTopColor: sourceColor }}></div>
                            <span>Menganalisis data...</span>
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
            ) : (
                <div className="dashboard-section">
                    {/* Header */}
                    <div className="dashboard-header" style={{ background: sourceGradient }}>
                        <div className="header-left">
                            <div className="header-badge">Dashboard Insight {sourceTitle}</div>
                            <h1>{insight.fileName}</h1>
                            <p>{insight.rowCount.toLocaleString()} baris • {insight.headers.length} kolom • Kualitas: {metrics?.dataQuality}</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-secondary" onClick={() => setInsight(null)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                Upload Baru
                            </button>
                        </div>
                    </div>

                    {/* View Tabs */}
                    <div className="view-tabs">
                        <button className={`view-tab ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            Overview
                        </button>
                        <button className={`view-tab ${activeView === 'columns' ? 'active' : ''}`} onClick={() => setActiveView('columns')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                            Analisis Kolom
                        </button>
                        <button className={`view-tab ${activeView === 'data' ? 'active' : ''}`} onClick={() => setActiveView('data')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                            Data Preview
                        </button>
                    </div>

                    {/* Overview View */}
                    {activeView === 'overview' && (
                        <div className="overview-content">
                            {/* KPI Cards */}
                            <div className="kpi-grid">
                                <div className="kpi-card">
                                    <div className="kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                    </div>
                                    <div className="kpi-content">
                                        <span className="kpi-value">{insight.rowCount.toLocaleString()}</span>
                                        <span className="kpi-label">Total Data</span>
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                                    </div>
                                    <div className="kpi-content">
                                        <span className="kpi-value">{insight.headers.length}</span>
                                        <span className="kpi-label">Total Kolom</span>
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                    </div>
                                    <div className="kpi-content">
                                        <span className="kpi-value">{metrics?.numericColumns}</span>
                                        <span className="kpi-label">Kolom Numerik</span>
                                    </div>
                                </div>

                                <div className="kpi-card">
                                    <div className="kpi-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                    </div>
                                    <div className="kpi-content">
                                        <span className="kpi-value">{metrics?.avgFillRate}%</span>
                                        <span className="kpi-label">Kelengkapan Data</span>
                                    </div>
                                    <div className={`kpi-badge ${(metrics?.avgFillRate || 0) >= 80 ? 'good' : 'warning'}`}>
                                        {(metrics?.avgFillRate || 0) >= 80 ? 'Baik' : 'Perlu Cek'}
                                    </div>
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="charts-row">
                                {/* Data Quality Gauge */}
                                <div className="chart-card quality-card">
                                    <h3>Kualitas Data</h3>
                                    <div className="quality-gauge">
                                        <div className="gauge-ring">
                                            <svg viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                                <circle 
                                                    cx="50" cy="50" r="40" fill="none" 
                                                    stroke={sourceColor} strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${(metrics?.avgFillRate || 0) * 2.51} 251`}
                                                    transform="rotate(-90 50 50)"
                                                />
                                            </svg>
                                            <div className="gauge-value">{metrics?.avgFillRate}%</div>
                                        </div>
                                        <div className="quality-label">{metrics?.dataQuality}</div>
                                    </div>
                                    <div className="quality-stats">
                                        <div className="quality-stat">
                                            <span className="stat-label">Total Sel</span>
                                            <span className="stat-value">{metrics?.totalCells.toLocaleString()}</span>
                                        </div>
                                        <div className="quality-stat">
                                            <span className="stat-label">Sel Kosong</span>
                                            <span className="stat-value">{metrics?.totalNulls.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Column Type Distribution */}
                                <div className="chart-card">
                                    <h3>Tipe Kolom</h3>
                                    <div className="donut-chart">
                                        <svg viewBox="0 0 100 100">
                                            {(() => {
                                                const types = [
                                                    { label: 'Teks', count: metrics?.textColumns || 0, color: '#10b981' },
                                                    { label: 'Numerik', count: metrics?.numericColumns || 0, color: '#0ea5e9' },
                                                    { label: 'Tanggal', count: metrics?.dateColumns || 0, color: '#f59e0b' }
                                                ].filter(t => t.count > 0);
                                                const total = types.reduce((a, b) => a + b.count, 0);
                                                let offset = 0;
                                                return types.map((t, i) => {
                                                    const dash = (t.count / total) * 251;
                                                    const el = (
                                                        <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={t.color} strokeWidth="16"
                                                            strokeDasharray={`${dash} 251`}
                                                            strokeDashoffset={-offset}
                                                            transform="rotate(-90 50 50)" />
                                                    );
                                                    offset += dash;
                                                    return el;
                                                });
                                            })()}
                                        </svg>
                                        <div className="donut-center">
                                            <span className="donut-value">{insight.headers.length}</span>
                                            <span className="donut-label">Kolom</span>
                                        </div>
                                    </div>
                                    <div className="legend">
                                        <div className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }}></span>Teks ({metrics?.textColumns})</div>
                                        <div className="legend-item"><span className="legend-dot" style={{ background: '#0ea5e9' }}></span>Numerik ({metrics?.numericColumns})</div>
                                        <div className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }}></span>Tanggal ({metrics?.dateColumns})</div>
                                    </div>
                                </div>

                                {/* Category Distribution */}
                                {insight.categoryDistribution && insight.categoryDistribution.length > 0 && (
                                    <div className="chart-card wide">
                                        <h3>Distribusi {insight.categoryColumn}</h3>
                                        <div className="horizontal-bars">
                                            {insight.categoryDistribution.map((cat, idx) => (
                                                <div key={idx} className="h-bar-item">
                                                    <div className="h-bar-header">
                                                        <span className="h-bar-label" title={cat.category}>
                                                            {cat.category.length > 25 ? cat.category.slice(0, 25) + '...' : cat.category}
                                                        </span>
                                                        <span className="h-bar-value">{cat.count.toLocaleString()} ({cat.percentage}%)</span>
                                                    </div>
                                                    <div className="h-bar-track">
                                                        <div className="h-bar-fill" style={{ width: `${cat.percentage}%`, background: chartColors[idx % chartColors.length] }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Time Series */}
                            {insight.timeSeriesData && insight.timeSeriesData.length > 1 && (
                                <div className="chart-card full-width">
                                    <h3>Tren Waktu {insight.dateColumn && `(${insight.dateColumn})`}</h3>
                                    <div className="time-series-chart">
                                        <div className="ts-bars">
                                            {insight.timeSeriesData.map((ts, idx) => {
                                                const maxCount = Math.max(...insight.timeSeriesData!.map(t => t.count));
                                                const height = (ts.count / maxCount) * 100;
                                                return (
                                                    <div key={idx} className="ts-bar-wrapper">
                                                        <div className="ts-bar-value">{ts.count}</div>
                                                        <div className="ts-bar" style={{ height: `${height}%`, background: sourceColor }}></div>
                                                        <div className="ts-bar-label">{ts.period}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Values Summary */}
                            <div className="top-values-grid">
                                {insight.columnStats.slice(0, 4).map((col, idx) => (
                                    col.topValues && col.topValues.length > 0 && (
                                        <div key={idx} className="chart-card compact">
                                            <h4>{col.name}</h4>
                                            <div className="top-values-list">
                                                {col.topValues.slice(0, 3).map((tv, tvIdx) => (
                                                    <div key={tvIdx} className="top-value-item">
                                                        <span className="tv-rank">{tvIdx + 1}</span>
                                                        <span className="tv-value" title={tv.value}>{tv.value.length > 20 ? tv.value.slice(0, 20) + '...' : tv.value}</span>
                                                        <span className="tv-count">{tv.count}</span>
                                                        <span className="tv-pct">{tv.percentage}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Columns View */}
                    {activeView === 'columns' && (
                        <div className="columns-content">
                            <div className="columns-grid">
                                {insight.columnStats.map((col, idx) => (
                                    <div key={idx} className="column-detail-card">
                                        <div className="col-header">
                                            <div className="col-title">
                                                <span className="col-name">{col.name}</span>
                                                <span className={`col-type type-${col.type}`}>{col.type}</span>
                                            </div>
                                            <div className="col-fill-badge" style={{ 
                                                background: col.fillRate >= 90 ? '#dcfce7' : col.fillRate >= 70 ? '#fef3c7' : '#fee2e2',
                                                color: col.fillRate >= 90 ? '#16a34a' : col.fillRate >= 70 ? '#d97706' : '#dc2626'
                                            }}>
                                                {col.fillRate}% terisi
                                            </div>
                                        </div>
                                        
                                        <div className="col-stats-grid">
                                            <div className="col-stat">
                                                <span className="cs-label">Nilai Unik</span>
                                                <span className="cs-value">{col.uniqueCount.toLocaleString()}</span>
                                            </div>
                                            <div className="col-stat">
                                                <span className="cs-label">Nilai Kosong</span>
                                                <span className="cs-value">{col.nullCount.toLocaleString()}</span>
                                            </div>
                                            {col.type === 'number' && (
                                                <>
                                                    <div className="col-stat">
                                                        <span className="cs-label">Minimum</span>
                                                        <span className="cs-value">{col.min?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="col-stat">
                                                        <span className="cs-label">Maximum</span>
                                                        <span className="cs-value">{col.max?.toLocaleString()}</span>
                                                    </div>
                                                    <div className="col-stat">
                                                        <span className="cs-label">Rata-rata</span>
                                                        <span className="cs-value">{col.avg?.toFixed(2)}</span>
                                                    </div>
                                                    <div className="col-stat">
                                                        <span className="cs-label">Median</span>
                                                        <span className="cs-value">{col.median?.toLocaleString()}</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {col.topValues && col.topValues.length > 0 && (
                                            <div className="col-top-values">
                                                <span className="ctv-title">Top Values</span>
                                                {col.topValues.map((tv, tvIdx) => (
                                                    <div key={tvIdx} className="ctv-item">
                                                        <span className="ctv-value" title={tv.value}>{tv.value.length > 30 ? tv.value.slice(0, 30) + '...' : tv.value}</span>
                                                        <div className="ctv-bar-track">
                                                            <div className="ctv-bar" style={{ width: `${tv.percentage}%`, background: chartColors[tvIdx] }}></div>
                                                        </div>
                                                        <span className="ctv-pct">{tv.percentage}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {col.distribution && (
                                            <div className="col-distribution">
                                                <span className="cd-title">Distribusi Nilai</span>
                                                <div className="cd-mini-bars">
                                                    {col.distribution.map((d, dIdx) => {
                                                        const maxCount = Math.max(...col.distribution!.map(x => x.count));
                                                        return (
                                                            <div key={dIdx} className="cd-mini-bar" title={`${d.range}: ${d.count}`}>
                                                                <div className="cd-bar-fill" style={{ height: `${(d.count / maxCount) * 100}%`, background: sourceColor }}></div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data Preview View */}
                    {activeView === 'data' && (
                        <div className="data-content">
                            <div className="data-info">
                                Menampilkan {Math.min(50, insight.rowCount)} dari {insight.rowCount.toLocaleString()} baris
                            </div>
                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            {insight.headers.map((h, idx) => (
                                                <th key={idx}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {insight.data.slice(0, 50).map((row, rowIdx) => (
                                            <tr key={rowIdx}>
                                                <td className="row-num">{rowIdx + 1}</td>
                                                {insight.headers.map((h, colIdx) => (
                                                    <td key={colIdx}>{String(row[h] ?? '-')}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .insight-container { padding: 1.5rem; min-height: calc(100vh - 80px); }
                
                /* Upload Section */
                .upload-section { max-width: 550px; margin: 3rem auto; text-align: center; }
                .upload-header { margin-bottom: 2rem; }
                .upload-icon { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
                .upload-icon svg { width: 28px; height: 28px; }
                .upload-header h2 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
                .upload-header p { color: #64748b; font-size: 0.95rem; }
                .upload-dropzone { border: 2px dashed #cbd5e1; border-radius: 16px; padding: 2.5rem 2rem; background: white; transition: all 0.3s ease; cursor: pointer; }
                .upload-dropzone:hover, .upload-dropzone.drag-over { border-color: ${sourceColor}; background: ${sourceColor}08; }
                .file-input { display: none; }
                .upload-label { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; cursor: pointer; }
                .upload-icon-large { width: 64px; height: 64px; }
                .upload-icon-large svg { width: 100%; height: 100%; }
                .upload-text { font-size: 0.95rem; color: #475569; }
                .upload-hint { font-size: 0.8rem; color: #94a3b8; }
                .loading-state { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1.5rem; color: #64748b; }
                .spinner { width: 22px; height: 22px; border: 3px solid #e2e8f0; border-top-color: ${sourceColor}; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .error-message { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1rem; padding: 0.875rem; background: #fef2f2; color: #dc2626; border-radius: 8px; font-size: 0.875rem; }
                .error-message svg { width: 18px; height: 18px; }

                /* Dashboard Section */
                .dashboard-section { animation: fadeIn 0.4s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

                .dashboard-header { border-radius: 16px; padding: 1.5rem 2rem; color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
                .header-badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 0.3rem 0.75rem; border-radius: 16px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.375rem; }
                .header-left h1 { font-size: 1.4rem; font-weight: 700; margin-bottom: 0.25rem; }
                .header-left p { opacity: 0.9; font-size: 0.85rem; }
                .btn-secondary { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; color: white; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
                .btn-secondary:hover { background: rgba(255,255,255,0.3); }
                .btn-secondary svg { width: 16px; height: 16px; }

                /* View Tabs */
                .view-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; background: white; padding: 0.375rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); width: fit-content; }
                .view-tab { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: transparent; border: none; border-radius: 8px; color: #64748b; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
                .view-tab:hover { color: #1e293b; background: #f1f5f9; }
                .view-tab.active { background: ${sourceColor}; color: white; }
                .view-tab svg { width: 16px; height: 16px; }

                /* KPI Cards */
                .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
                .kpi-card { background: white; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); position: relative; overflow: hidden; }
                .kpi-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .kpi-icon svg { width: 24px; height: 24px; }
                .kpi-content { display: flex; flex-direction: column; }
                .kpi-value { font-size: 1.75rem; font-weight: 700; color: #1e293b; line-height: 1.2; }
                .kpi-label { font-size: 0.8rem; color: #64748b; margin-top: 0.125rem; }
                .kpi-badge { position: absolute; top: 0.75rem; right: 0.75rem; font-size: 0.65rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 4px; }
                .kpi-badge.good { background: #dcfce7; color: #16a34a; }
                .kpi-badge.warning { background: #fef3c7; color: #d97706; }

                /* Charts */
                .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
                .chart-card { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .chart-card.wide { grid-column: span 2; }
                .chart-card.full-width { grid-column: 1 / -1; }
                .chart-card.compact { padding: 1rem; }
                .chart-card h3, .chart-card h4 { font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 1rem; }
                .chart-card h4 { font-size: 0.8rem; margin-bottom: 0.75rem; }

                /* Quality Gauge */
                .quality-card { text-align: center; }
                .quality-gauge { margin-bottom: 1rem; }
                .gauge-ring { position: relative; width: 130px; height: 130px; margin: 0 auto; }
                .gauge-ring svg { width: 100%; height: 100%; }
                .gauge-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.75rem; font-weight: 700; color: #1e293b; }
                .quality-label { font-size: 1rem; font-weight: 600; color: ${sourceColor}; margin-top: 0.5rem; }
                .quality-stats { display: flex; justify-content: center; gap: 2rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
                .quality-stat { text-align: center; }
                .stat-label { display: block; font-size: 0.75rem; color: #64748b; }
                .stat-value { font-size: 0.95rem; font-weight: 600; color: #1e293b; }

                /* Donut Chart */
                .donut-chart { position: relative; width: 150px; height: 150px; margin: 0 auto 1rem; }
                .donut-chart svg { width: 100%; height: 100%; }
                .donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
                .donut-value { display: block; font-size: 1.75rem; font-weight: 700; color: #1e293b; }
                .donut-label { font-size: 0.75rem; color: #64748b; }
                .legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; }
                .legend-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8rem; color: #475569; }
                .legend-dot { width: 10px; height: 10px; border-radius: 50%; }

                /* Horizontal Bars */
                .horizontal-bars { display: flex; flex-direction: column; gap: 0.875rem; }
                .h-bar-item { }
                .h-bar-header { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
                .h-bar-label { font-size: 0.85rem; color: #374151; font-weight: 500; }
                .h-bar-value { font-size: 0.8rem; color: #64748b; }
                .h-bar-track { height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; }
                .h-bar-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease; }

                /* Time Series */
                .time-series-chart { overflow-x: auto; padding: 1rem 0; }
                .ts-bars { display: flex; align-items: flex-end; gap: 0.75rem; height: 200px; min-width: fit-content; }
                .ts-bar-wrapper { display: flex; flex-direction: column; align-items: center; min-width: 55px; }
                .ts-bar-value { font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 0.375rem; }
                .ts-bar { width: 36px; border-radius: 6px 6px 0 0; transition: height 0.5s ease; min-height: 4px; }
                .ts-bar-label { font-size: 0.7rem; color: #64748b; margin-top: 0.5rem; writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg); height: 65px; }

                /* Top Values Grid */
                .top-values-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
                .top-values-list { display: flex; flex-direction: column; gap: 0.5rem; }
                .top-value-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem; background: #f8fafc; border-radius: 8px; }
                .tv-rank { width: 24px; height: 24px; background: ${sourceColor}20; color: ${sourceColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
                .tv-value { flex: 1; font-size: 0.85rem; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .tv-count { font-size: 0.8rem; font-weight: 600; color: #1e293b; }
                .tv-pct { font-size: 0.75rem; color: #64748b; }

                /* Columns Grid */
                .columns-content { }
                .columns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }
                .column-detail-card { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .col-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; padding-bottom: 0.875rem; border-bottom: 1px solid #f1f5f9; }
                .col-title { display: flex; flex-direction: column; gap: 0.375rem; }
                .col-name { font-weight: 600; color: #1e293b; font-size: 1rem; }
                .col-type { font-size: 0.7rem; font-weight: 600; padding: 0.25rem 0.625rem; border-radius: 4px; text-transform: uppercase; width: fit-content; }
                .type-number { background: #dbeafe; color: #2563eb; }
                .type-text { background: #dcfce7; color: #16a34a; }
                .type-date { background: #fef3c7; color: #d97706; }
                .type-mixed { background: #f3e8ff; color: #9333ea; }
                .col-fill-badge { font-size: 0.75rem; font-weight: 600; padding: 0.3rem 0.625rem; border-radius: 6px; }
                .col-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.875rem; margin-bottom: 1rem; }
                .col-stat { }
                .cs-label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.125rem; }
                .cs-value { font-size: 1rem; font-weight: 600; color: #1e293b; }
                .col-top-values { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
                .ctv-title, .cd-title { display: block; font-size: 0.8rem; font-weight: 600; color: #64748b; margin-bottom: 0.625rem; }
                .ctv-item { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.5rem; }
                .ctv-value { flex: 0 0 130px; font-size: 0.8rem; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .ctv-bar-track { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
                .ctv-bar { height: 100%; border-radius: 4px; }
                .ctv-pct { flex: 0 0 36px; font-size: 0.75rem; color: #64748b; text-align: right; }
                .col-distribution { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
                .cd-mini-bars { display: flex; align-items: flex-end; gap: 4px; height: 50px; }
                .cd-mini-bar { flex: 1; background: #f1f5f9; border-radius: 3px; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
                .cd-bar-fill { width: 100%; border-radius: 3px 3px 0 0; min-height: 3px; }

                /* Data Table */
                .data-content { background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .data-info { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
                .data-table-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
                .data-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                .data-table th, .data-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e2e8f0; white-space: nowrap; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
                .data-table th { background: #f8fafc; font-weight: 600; color: #475569; position: sticky; top: 0; }
                .data-table tr:hover td { background: #f8fafc; }
                .data-table tr:last-child td { border-bottom: none; }
                .row-num { color: #94a3b8; font-size: 0.8rem; }

                @media (max-width: 768px) {
                    .insight-container { padding: 1rem; }
                    .dashboard-header { flex-direction: column; align-items: flex-start; }
                    .charts-row { grid-template-columns: 1fr; }
                    .chart-card.wide { grid-column: span 1; }
                    .columns-grid { grid-template-columns: 1fr; }
                    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </div>
    );
}
