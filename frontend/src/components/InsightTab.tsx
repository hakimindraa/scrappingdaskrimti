'use client';

import { useRef, useState, useMemo } from 'react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { KELOMPOK_LIST, AsalEntry } from '../data/masterAsal';
import { ASAL_KELOMPOK_MAP } from '../data/asalMapping';
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationCircleIcon,
    DocumentTextIcon,
    ChartBarIcon,
    XMarkIcon,
    SparklesIcon,
    MagnifyingGlassIcon,
    CheckBadgeIcon,
    ArrowDownIcon,
} from '@heroicons/react/24/outline';

export default function InsightTab() {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // --- Pengelompokan State ---
    const [checkedGroups, setCheckedGroups] = useState<Set<string>>(new Set(KELOMPOK_LIST));
    const [customGroups, setCustomGroups] = useState<{ name: string; asalList: string[] }[]>([]);
    const [asalData, setAsalData] = useState<AsalEntry[]>([]);
    const [showUnmappedOnly, setShowUnmappedOnly] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [assignAsal, setAssignAsal] = useState<AsalEntry | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupSelected, setNewGroupSelected] = useState<Set<string>>(new Set());
    const [searchAsal, setSearchAsal] = useState('');

    // --- Upload Excel Jenis Surat State ---
    const [uploadedJenis, setUploadedJenis] = useState<{label:string, masuk:number}[] | null>(null);
    const [uploadInfo, setUploadInfo] = useState<{totalRows:number, categories:number} | null>(null);
    const jenisChartRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Upload Excel Asal Surat State ---
    const [hasUploadedAsal, setHasUploadedAsal] = useState(false);
    const [uploadAsalInfo, setUploadAsalInfo] = useState<{totalRows:number, categories:number, matched:number, unmatched:number} | null>(null);
    const asalChartRef = useRef<HTMLDivElement>(null);

    // --- Pengelompokan Computed ---
    const allKelompok = useMemo(() => [...KELOMPOK_LIST, ...customGroups.map(g => g.name)], [customGroups]);
    const sudahCount = useMemo(() => asalData.filter(d => d.kelompok !== '').length, [asalData]);
    const belumCount = useMemo(() => asalData.filter(d => d.kelompok === '').length, [asalData]);
    const filteredAsal = useMemo(() => {
        let data = asalData;
        if (showUnmappedOnly) data = data.filter(d => d.kelompok === '');
        else data = data.filter(d => d.kelompok === '' || checkedGroups.has(d.kelompok));
        return data;
    }, [asalData, checkedGroups, showUnmappedOnly]);

    const toggleGroup = (g: string) => {
        setCheckedGroups(prev => {
            const next = new Set(prev);
            next.has(g) ? next.delete(g) : next.add(g);
            return next;
        });
    };

    const groupCount = (g: string) => asalData.filter(d => d.kelompok === g).length;

    const handleAssign = (kelompok: string) => {
        if (!assignAsal) return;
        setAsalData(prev => prev.map(d => d.asal === assignAsal.asal ? { ...d, kelompok } : d));
        if (!checkedGroups.has(kelompok)) toggleGroup(kelompok);
        setAssignAsal(null);
    };

    const handleCreateGroup = () => {
        if (!newGroupName.trim() || newGroupSelected.size === 0) return;
        const name = newGroupName.trim();
        setCustomGroups(prev => [...prev, { name, asalList: Array.from(newGroupSelected) }]);
        setAsalData(prev => prev.map(d => newGroupSelected.has(d.asal) ? { ...d, kelompok: name } : d));
        setCheckedGroups(prev => new Set([...prev, name]));
        setNewGroupName('');
        setNewGroupSelected(new Set());
        setShowCreateModal(false);
    };

    const unmappedList = useMemo(() => {
        const list = asalData.filter(d => d.kelompok === '');
        if (!searchAsal) return list;
        return list.filter(d => d.asal.toLowerCase().includes(searchAsal.toLowerCase()));
    }, [asalData, searchAsal]);
    // --- Excel Upload Handler ---
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

            // Cari kolom "Jenis Surat"
            const counts: Record<string, number> = {};
            rows.forEach(row => {
                const jenis = (row['Jenis Surat'] || '').toString().trim().toUpperCase();
                if (jenis) counts[jenis] = (counts[jenis] || 0) + 1;
            });

            const result = Object.entries(counts).map(([label, masuk]) => ({ label, masuk }));
            setUploadedJenis(result);
            setUploadInfo({ totalRows: rows.length, categories: result.length });

            // --- Asal Surat: mapping ke kelompok ---
            const kelompokCounts: Record<string, number> = {};
            const asalCounts: Record<string, number> = {};
            let matched = 0, unmatched = 0;

            rows.forEach(row => {
                const asal = (row['Asal'] || '').toString().trim().toUpperCase();
                if (!asal) return;

                // Count per individual asal (for pengelompokan table)
                asalCounts[asal] = (asalCounts[asal] || 0) + 1;

                const kelompok = ASAL_KELOMPOK_MAP[asal];
                if (kelompok) {
                    kelompokCounts[kelompok] = (kelompokCounts[kelompok] || 0) + 1;
                    matched++;
                } else {
                    kelompokCounts['Lainnya'] = (kelompokCounts['Lainnya'] || 0) + 1;
                    unmatched++;
                }
            });

            // Update pengelompokan table with individual asal entries
            if (Object.keys(asalCounts).length > 0) {
                const newAsalData: AsalEntry[] = Object.entries(asalCounts).map(([asal, count]) => ({
                    asal,
                    count,
                    kelompok: ASAL_KELOMPOK_MAP[asal] || '',
                }));
                setAsalData(newAsalData);
            }

            const asalResult = Object.entries(kelompokCounts)
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value);

            if (asalResult.length > 0) {
                setHasUploadedAsal(true);
                setUploadAsalInfo({ totalRows: rows.length, categories: asalResult.length, matched, unmatched });
            }
        };
        reader.readAsBinaryString(file);
        // Reset input so same file can be re-uploaded
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Hardcoded Data ---
    const suratMasuk = 5597;
    const suratKeluar = 8716;

    const trendMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    const trendMasuk = [607, 807, 665, 608, 675, 458, 878, 701, 621];
    const trendKeluar = [1104, 956, 1071, 1067, 1199, 955, 882, 691, 807];

    const jenisKategoriDefault = [
        { label: 'BIASA INTERNAL / EKSTERNAL', keluar: 4540, masuk: 4810 },
        { label: 'KEPUTUSAN / SURAT PERINTAH / SURAT TUGAS', keluar: 50, masuk: 1883 },
        { label: 'LAPORAN', keluar: 669, masuk: 11 },
        { label: 'NOTA DINAS', keluar: 103, masuk: 1015 },
        { label: 'SURAT EDARAN', keluar: 0, masuk: 19 },
        { label: 'SURAT PENGANTAR / LAMPIRAN', keluar: 552, masuk: 498 },
        { label: 'UNDANGAN INTERNAL / EKSTERNAL', keluar: 57, masuk: 106 },
    ];

    // Jenis Kategori: dynamic from upload or hardcoded default
    const jenisKategori = uploadedJenis
        ? uploadedJenis.map(d => ({ label: d.label, masuk: d.masuk, keluar: 0 }))
        : jenisKategoriDefault;

    const asalSuratDefault = [
        { label: 'Aliansi Kemasyarakatan / Pribadi / LSM', value: 146 },
        { label: 'Gubernur / Pemda', value: 150 },
        { label: 'Instansi Lainnya / BUMN', value: 179 },
        { label: 'Kejaksaan', value: 3257 },
        { label: 'Kemenkeu', value: 69 },
        { label: 'Kepolisian dan BNN', value: 1782 },
        { label: 'Pengadilan', value: 8 },
        { label: 'Perbankan', value: 6 },
    ];

    // Asal Surat: computed from asalData (reactive to assign kelompok) or hardcoded default
    const asalSurat = useMemo(() => {
        if (!hasUploadedAsal) return asalSuratDefault;
        const kelompokCounts: Record<string, number> = {};
        asalData.forEach(d => {
            const key = d.kelompok || 'Lainnya';
            kelompokCounts[key] = (kelompokCounts[key] || 0) + d.count;
        });
        return Object.entries(kelompokCounts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [hasUploadedAsal, asalData]);

    // --- Donut Chart Helper ---
    const donutArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
        const rad = (deg: number) => (deg - 90) * Math.PI / 180;
        const x1 = cx + r * Math.cos(rad(startAngle));
        const y1 = cy + r * Math.sin(rad(startAngle));
        const x2 = cx + r * Math.cos(rad(endAngle));
        const y2 = cy + r * Math.sin(rad(endAngle));
        const large = endAngle - startAngle > 180 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
    };

    // --- Line Chart Helpers ---
    const trendMax = Math.max(...trendMasuk, ...trendKeluar);
    const chartW = 400, chartH = 180, padL = 45, padR = 15, padT = 20, padB = 35;
    const plotW = chartW - padL - padR;
    const plotH = chartH - padT - padB;

    const linePoints = (data: number[]) =>
        data.map((v, i) => {
            const x = padL + (i / (data.length - 1)) * plotW;
            const y = padT + plotH - (v / trendMax) * plotH;
            return `${x},${y}`;
        }).join(' ');

    // --- Bar Chart Helper ---
    const jenisMax = Math.max(...jenisKategori.flatMap(j => [j.masuk, j.keluar]));
    const asalMax = Math.max(...asalSurat.map(a => a.value));

    const handleDownloadPNG = async () => {
        if (!dashboardRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2,
                backgroundColor: '#f1f0f6',
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = 'Dashboard_SIPEDE_Jan-Sep_2025.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Failed to download:', err);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="insight-wrapper">
            {/* ===== PENGELOMPOKAN SECTION ===== */}
            <div className="pg-section">
                <div className="pg-header">
                    <h2 className="pg-title">PENGELOMPOKAN DATA ASAL SURAT</h2>
                    <div className="pg-header-right">
                        <label className="pg-upload-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            Upload Excel
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUpload} />
                        </label>
                        <div className="pg-badge green"><CheckCircleIcon className="hi-icon" /> Sudah: {sudahCount}</div>
                        <div className="pg-badge red"><XCircleIcon className="hi-icon" /> Belum: {belumCount}</div>
                    </div>
                </div>
                <div className="pg-body">
                    <div className="pg-sidebar">
                        <div className="pg-sidebar-title">FILTER KELOMPOK</div>
                        {allKelompok.map(g => (
                            <label key={g} className="pg-check-row">
                                <input type="checkbox" checked={checkedGroups.has(g)} onChange={() => toggleGroup(g)} />
                                <span className="pg-check-label">{g}</span>
                                <span className="pg-check-count">({groupCount(g)})</span>
                            </label>
                        ))}
                        <div className="pg-sidebar-divider" />
                        <div className="pg-sidebar-summary">
                            <span><CheckCircleIcon className="hi-icon" /> Sudah dikelompok: <b>{sudahCount}</b></span>
                            <span><XCircleIcon className="hi-icon" /> Belum dikelompok: <b>{belumCount}</b></span>
                        </div>
                        <label className="pg-check-row pg-unmapped-toggle">
                            <input type="checkbox" checked={showUnmappedOnly} onChange={() => setShowUnmappedOnly(!showUnmappedOnly)} />
                            <span className="pg-check-label">Hanya belum dikelompok</span>
                        </label>
                        <button className="pg-create-btn" onClick={() => { setShowCreateModal(true); setSearchAsal(''); setNewGroupName(''); setNewGroupSelected(new Set()); }}>
                            + Buat Kelompok Baru
                        </button>
                    </div>
                    <div className="pg-table-wrap">
                        {asalData.length === 0 ? (
                            <div className="pg-empty-state">
                                <DocumentTextIcon className="pg-empty-state-icon" />
                                <h3>Belum ada data</h3>
                                <p>Upload file Excel untuk memulai pengelompokan data asal surat.</p>
                                <label className="pg-upload-btn pg-upload-btn-lg">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    Upload Excel
                                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUpload} />
                                </label>
                            </div>
                        ) : (
                            <>
                                <div className="pg-table-header">
                                    <span>Menampilkan {filteredAsal.length} dari {asalData.length} data</span>
                                </div>
                                <div className="pg-table-scroll">
                                    <table className="pg-table">
                                        <thead><tr><th>Asal</th><th>Jumlah</th><th>Kelompok</th></tr></thead>
                                        <tbody>
                                            {filteredAsal.map((d, i) => (
                                                <tr key={i} className={d.kelompok === '' ? 'pg-row-unmapped' : ''}>
                                                    <td className="pg-td-asal">{d.asal}</td>
                                                    <td className="pg-td-count">{d.count.toLocaleString()}</td>
                                                    <td className="pg-td-group">
                                                        {d.kelompok ? (
                                                            <span className="pg-tag green">{d.kelompok}</span>
                                                        ) : (
                                                            <button className="pg-tag red" onClick={() => setAssignAsal(d)}><ExclamationCircleIcon className="hi-icon" /> Belum — Klik assign</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Upload Success Notification */}
                {uploadInfo && (
                    <div className="upload-notif">
                        <div className="upload-notif-content">
                            <span className="upload-notif-icon"><CheckCircleIcon className="hi-icon-lg" /></span>
                            <div className="upload-notif-text">
                                <strong>Upload berhasil!</strong>
                                <span><DocumentTextIcon className="hi-icon" /> {uploadInfo.totalRows.toLocaleString()} baris dibaca • {uploadInfo.categories} jenis surat terdeteksi</span>
                            </div>
                            <button className="upload-notif-btn" onClick={() => jenisChartRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                                <ChartBarIcon className="hi-icon" /> Lihat Grafik Jenis Surat <ArrowDownIcon className="hi-icon-sm" />
                            </button>
                            <button className="upload-notif-close" onClick={() => setUploadInfo(null)}><XMarkIcon className="hi-icon" /></button>
                        </div>
                    </div>
                )}

                {/* Upload Asal Surat Notification */}
                {uploadAsalInfo && (
                    <div className="upload-notif">
                        <div className="upload-notif-content">
                            <span className="upload-notif-icon"><CheckCircleIcon className="hi-icon-lg" /></span>
                            <div className="upload-notif-text">
                                <strong>Data Asal Surat berhasil diproses!</strong>
                                <span><DocumentTextIcon className="hi-icon" /> {uploadAsalInfo.totalRows.toLocaleString()} baris • {uploadAsalInfo.categories} kelompok • ✓ {uploadAsalInfo.matched.toLocaleString()} cocok{uploadAsalInfo.unmatched > 0 ? ` • ✗ ${uploadAsalInfo.unmatched.toLocaleString()} tidak terpetakan` : ''}</span>
                            </div>
                            <button className="upload-notif-btn" onClick={() => asalChartRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                                <ChartBarIcon className="hi-icon" /> Lihat Grafik Asal Surat <ArrowDownIcon className="hi-icon-sm" />
                            </button>
                            <button className="upload-notif-close" onClick={() => setUploadAsalInfo(null)}><XMarkIcon className="hi-icon" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== ASSIGN MODAL ===== */}
            {assignAsal && (
                <div className="pg-overlay" onClick={() => setAssignAsal(null)}>
                    <div className="pg-modal" onClick={e => e.stopPropagation()}>
                        <div className="pg-modal-header">
                            <h3>Assign Kelompok</h3>
                            <button className="pg-modal-close" onClick={() => setAssignAsal(null)}><XMarkIcon className="hi-icon" /></button>
                        </div>
                        <p className="pg-modal-sub">Assign <b>&quot;{assignAsal.asal}&quot;</b> ke kelompok:</p>
                        <div className="pg-modal-list">
                            {allKelompok.map(g => (
                                <button key={g} className="pg-modal-option" onClick={() => handleAssign(g)}>{g}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== CREATE GROUP MODAL ===== */}
            {showCreateModal && (
                <div className="pg-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="pg-modal pg-modal-create" onClick={e => e.stopPropagation()}>
                        <div className="pg-modal-header">
                            <h3><SparklesIcon className="hi-icon" /> Buat Kelompok Baru</h3>
                            <button className="pg-modal-close" onClick={() => setShowCreateModal(false)}><XMarkIcon className="hi-icon" /></button>
                        </div>
                        <label className="pg-modal-label">Nama Kelompok</label>
                        <input className="pg-modal-input" placeholder="Contoh: Media & Pers" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                        <label className="pg-modal-label">Pilih Asal (belum dikelompok)</label>
                        <div className="pg-search-wrap">
                            <MagnifyingGlassIcon className="pg-search-icon" />
                            <input className="pg-modal-input pg-modal-input-search" placeholder="Cari asal..." value={searchAsal} onChange={e => setSearchAsal(e.target.value)} />
                        </div>
                        <div className="pg-modal-checklist">
                            {unmappedList.map((d, i) => (
                                <label key={i} className="pg-check-row">
                                    <input type="checkbox" checked={newGroupSelected.has(d.asal)} onChange={() => {
                                        setNewGroupSelected(prev => {
                                            const next = new Set(prev);
                                            next.has(d.asal) ? next.delete(d.asal) : next.add(d.asal);
                                            return next;
                                        });
                                    }} />
                                    <span className="pg-check-label">{d.asal}</span>
                                    <span className="pg-check-count">({d.count})</span>
                                </label>
                            ))}
                            {unmappedList.length === 0 && <p className="pg-empty">Semua asal sudah dikelompok! <CheckBadgeIcon className="hi-icon" /></p>}
                        </div>
                        <div className="pg-modal-footer">
                            <span>Dipilih: {newGroupSelected.size} asal</span>
                            <div className="pg-modal-actions">
                                <button className="pg-btn-cancel" onClick={() => setShowCreateModal(false)}>Batal</button>
                                <button className="pg-btn-save" onClick={handleCreateGroup} disabled={!newGroupName.trim() || newGroupSelected.size === 0}>Simpan Kelompok</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Download Button - Outside dashboard area */}
            <div className="download-bar">
                <button className="download-btn" onClick={handleDownloadPNG} disabled={isDownloading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {isDownloading ? 'Mengunduh...' : 'Download PNG'}
                </button>
            </div>

            {/* Dashboard Content - This is what gets captured */}
            <div className="insight-page" ref={dashboardRef}>
                {/* Header */}
                <div className="dash-header">
                    <div className="dash-title">
                        <h1>DASHBOARD SIPEDE</h1>
                    </div>
                    <div className="dash-period">
                        <span className="period-label">PERIODE</span>
                        <span className="period-badge">JAN</span>
                        <span className="period-sep">—</span>
                        <span className="period-badge">SEP</span>
                        <span className="period-year">
                            <span className="year-top">20</span>
                            <span className="year-bottom">25</span>
                        </span>
                    </div>
                </div>

                {/* Top Row: 3 Cards */}
                <div className="cards-row top-row">
                    {/* Card 1: Total Surat */}
                    <div className="card card-total">
                        <div className="card-label">TOTAL SURAT BERDASARKAN KATEGORI</div>
                        <div className="card-body total-body">
                            <div className="total-box masuk-box">
                                <div className="total-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                                </div>
                                <div className="total-label">SURAT MASUK</div>
                                <div className="total-value">{suratMasuk.toLocaleString()}</div>
                            </div>
                            <div className="total-box keluar-box">
                                <div className="total-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
                                </div>
                                <div className="total-label">SURAT KELUAR</div>
                                <div className="total-value">{suratKeluar.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Persentase User SIPEDE */}
                    <div className="card card-persen">
                        <div className="card-label purple-label">PERSENTASE USER SIPEDE</div>
                        <div className="card-body persen-body">
                            <div className="donut-group">
                                {/* Donut 1: Tercatat SIPEDE */}
                                <div className="donut-item">
                                    <svg viewBox="0 0 100 100" width="100" height="100">
                                        <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                        <path d={donutArc(50, 50, 38, 0, 338.4)} fill="none" stroke="#c026d3" strokeWidth="12" strokeLinecap="round" />
                                        <text x="50" y="46" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e1b4b">94%</text>
                                    </svg>
                                    <div className="donut-sub">Tercatat<br />SIPEDE</div>
                                </div>
                                {/* Donut 2: Terdaftar E-sign */}
                                <div className="donut-item">
                                    <svg viewBox="0 0 100 100" width="100" height="100">
                                        <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="12" />
                                        <path d={donutArc(50, 50, 38, 0, 223.2)} fill="none" stroke="#c026d3" strokeWidth="12" strokeLinecap="round" />
                                        <path d={donutArc(50, 50, 38, 223.2, 288)} fill="none" stroke="#f472b6" strokeWidth="12" strokeLinecap="round" />
                                        <text x="50" y="46" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e1b4b">62%</text>
                                    </svg>
                                    <div className="donut-sub">Terdaftar<br />E-sign</div>
                                </div>
                                {/* Donut 3: Status Aktif */}
                                <div className="donut-item">
                                    <svg viewBox="0 0 100 100" width="80" height="80">
                                        <circle cx="50" cy="50" r="38" fill="none" stroke="#c026d3" strokeWidth="12" />
                                        <text x="50" y="42" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e1b4b">Status</text>
                                        <text x="50" y="53" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e1b4b">Aktif</text>
                                        <text x="50" y="66" textAnchor="middle" fontSize="12" fontWeight="700" fill="#c026d3">100%</text>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Tren Frekuensi */}
                    <div className="card card-tren">
                        <div className="card-label purple-label">TREN FREKUENSI SURAT PER BULAN</div>
                        <div className="card-body tren-body">
                            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="line-chart">
                                {/* Grid lines */}
                                {[0, 200, 400, 600, 800, 1000, 1200, 1400].map(v => {
                                    const y = padT + plotH - (v / trendMax) * plotH;
                                    return (
                                        <g key={v}>
                                            <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
                                            <text x={padL - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#94a3b8">{v}</text>
                                        </g>
                                    );
                                })}
                                {/* Month labels */}
                                {trendMonths.map((m, i) => {
                                    const x = padL + (i / (trendMonths.length - 1)) * plotW;
                                    return <text key={m} x={x} y={chartH - 5} textAnchor="middle" fontSize="7" fill="#64748b">{m}</text>;
                                })}
                                {/* Keluar line (pink) */}
                                <polyline points={linePoints(trendKeluar)} fill="none" stroke="#c026d3" strokeWidth="2" strokeLinejoin="round" />
                                {trendKeluar.map((v, i) => {
                                    const x = padL + (i / (trendKeluar.length - 1)) * plotW;
                                    const y = padT + plotH - (v / trendMax) * plotH;
                                    return (
                                        <g key={`k${i}`}>
                                            <circle cx={x} cy={y} r="3" fill="#c026d3" />
                                            <text x={x} y={y - 7} textAnchor="middle" fontSize="6" fontWeight="600" fill="#c026d3">{v}</text>
                                        </g>
                                    );
                                })}
                                {/* Masuk line (orange) */}
                                <polyline points={linePoints(trendMasuk)} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
                                {trendMasuk.map((v, i) => {
                                    const x = padL + (i / (trendMasuk.length - 1)) * plotW;
                                    const y = padT + plotH - (v / trendMax) * plotH;
                                    return (
                                        <g key={`m${i}`}>
                                            <circle cx={x} cy={y} r="3" fill="#f59e0b" />
                                            <text x={x} y={y + 13} textAnchor="middle" fontSize="6" fontWeight="600" fill="#f59e0b">{v}</text>
                                        </g>
                                    );
                                })}
                            </svg>
                            <div className="tren-legend">
                                <span className="legend-item"><span className="legend-dot orange"></span> Surat Masuk</span>
                                <span className="legend-item"><span className="legend-dot pink"></span> Surat Keluar</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Row: 2 Cards */}
                <div className="cards-row bottom-row">
                    {/* Card 4: Jenis Surat Per Kategori */}
                    <div className="card card-jenis" ref={jenisChartRef}>
                        <div className="card-label purple-label">JENIS SURAT PER KATEGORI</div>
                        <div className="card-body jenis-body">
                            {[...jenisKategori].reverse().map((item, idx) => (
                                <div className="hbar-row" key={idx}>
                                    <div className="hbar-label">{item.label}</div>
                                    <div className="hbar-bars">
                                        <div className="hbar-track">
                                            <div className="hbar-fill keluar-fill" style={{ width: `${(item.keluar / jenisMax) * 100}%` }}>
                                                <span className="hbar-val">{item.keluar > 0 ? item.keluar.toLocaleString() : ''}</span>
                                            </div>
                                        </div>
                                        <div className="hbar-track">
                                            <div className="hbar-fill masuk-fill" style={{ width: `${(item.masuk / jenisMax) * 100}%` }}>
                                                <span className="hbar-val">{item.masuk > 0 ? item.masuk.toLocaleString() : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="jenis-legend">
                                <span className="legend-item"><span className="legend-dot pink"></span> Surat Keluar</span>
                                <span className="legend-item"><span className="legend-dot orange"></span> Surat Masuk</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 5: Asal Surat Masuk */}
                    <div className="card card-asal" ref={asalChartRef}>
                        <div className="card-label purple-label">ASAL SURAT MASUK</div>
                        <div className="card-body asal-body">
                            {[...asalSurat].reverse().map((item, idx) => (
                                <div className="asal-row" key={idx}>
                                    <div className="asal-label">{item.label}</div>
                                    <div className="asal-bar-wrap">
                                        <div className="asal-bar" style={{ width: `${(item.value / asalMax) * 100}%` }}>
                                        </div>
                                        <span className="asal-val">{item.value.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                /* ===== Heroicon Utility Classes ===== */
                :global(.hi-icon) { width: 1rem; height: 1rem; display: inline-block; vertical-align: -0.15em; flex-shrink: 0; }
                :global(.hi-icon-sm) { width: 0.8rem; height: 0.8rem; display: inline-block; vertical-align: -0.1em; flex-shrink: 0; }
                :global(.hi-icon-lg) { width: 1.4rem; height: 1.4rem; display: inline-block; vertical-align: -0.2em; flex-shrink: 0; }
                :global(.pg-empty-state-icon) { width: 3rem; height: 3rem; color: #c4b5fd; margin-bottom: 0.5rem; }
                :global(.pg-search-icon) { position: absolute; left: 0.65rem; width: 1rem; height: 1rem; color: #94a3b8; pointer-events: none; }

                .insight-wrapper { min-height: calc(100vh - 80px); background: #f1f0f6; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
                .download-bar { display: flex; justify-content: flex-end; padding: 0.75rem 1.5rem 0; }
                .insight-page {
                    padding: 1.5rem;
                }

                /* ===== Header ===== */
                .dash-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .download-btn {
                    display: flex; align-items: center; gap: 0.5rem;
                    padding: 0.5rem 1.1rem;
                    background: linear-gradient(135deg, #7c3aed, #c026d3);
                    color: #fff;
                    border: none; border-radius: 8px;
                    font-size: 0.8rem; font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(124,58,237,0.3);
                }
                .download-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(124,58,237,0.4); }
                .download-btn:active { transform: translateY(0); }
                .download-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                .download-btn svg { width: 16px; height: 16px; }
                .dash-title h1 {
                    margin: 0;
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #1e1b4b;
                    background: #1e1b4b;
                    color: #fff;
                    padding: 0.5rem 1.5rem;
                    display: inline-block;
                }
                .dash-period {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .period-label {
                    background: #7c3aed;
                    color: #fff;
                    padding: 0.35rem 0.9rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    letter-spacing: 0.5px;
                }
                .period-badge {
                    background: #c026d3;
                    color: #fff;
                    padding: 0.35rem 0.75rem;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    font-weight: 700;
                }
                .period-sep {
                    font-size: 1.1rem;
                    color: #1e1b4b;
                    font-weight: 700;
                }
                .period-year {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: #1e1b4b;
                    line-height: 1;
                }
                .year-top, .year-bottom { display: block; }

                /* ===== Cards ===== */
                .cards-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
                .top-row > .card { flex: 1; min-width: 0; }
                .bottom-row > .card { flex: 1; min-width: 0; }
                .card {
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .card-label {
                    padding: 0.6rem 1rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                    color: #1e1b4b;
                    border-bottom: 1px solid #f1f0f6;
                }
                .purple-label {
                    background: #1e1b4b;
                    color: #fff;
                    border-bottom: none;
                }
                .card-body { padding: 1rem; flex: 1; display: flex; flex-direction: column; }

                /* ===== Card 1: Total Surat ===== */
                .total-body { gap: 0.75rem; justify-content: center; }
                .total-box {
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 1rem 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .total-icon {
                    width: 36px; height: 36px;
                    background: #ede9fe;
                    border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                }
                .total-icon svg { width: 20px; height: 20px; }
                .total-label { font-size: 0.7rem; font-weight: 700; color: #7c3aed; letter-spacing: 0.5px; }
                .total-value { font-size: 1.75rem; font-weight: 800; color: #1e1b4b; margin-left: auto; }

                /* ===== Card 2: Persentase ===== */
                .persen-body { align-items: center; justify-content: center; }
                .donut-group { display: flex; align-items: center; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }
                .donut-item { text-align: center; }
                .donut-sub { font-size: 0.65rem; color: #64748b; margin-top: 0.25rem; font-weight: 600; line-height: 1.2; }

                /* ===== Card 3: Tren ===== */
                .tren-body { align-items: center; }
                .line-chart { width: 100%; max-width: 420px; height: auto; }
                .tren-legend { display: flex; gap: 1rem; margin-top: 0.5rem; }

                /* ===== Legend ===== */
                .legend-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; color: #64748b; font-weight: 600; }
                .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
                .legend-dot.orange { background: #f59e0b; }
                .legend-dot.pink { background: #c026d3; }

                /* ===== Card 4: Jenis Surat ===== */
                .jenis-body { gap: 0.35rem; }
                .hbar-row { display: flex; align-items: center; gap: 0.5rem; }
                .hbar-label {
                    width: 180px;
                    min-width: 180px;
                    font-size: 0.6rem;
                    color: #1e1b4b;
                    font-weight: 600;
                    text-align: right;
                    line-height: 1.2;
                }
                .hbar-bars { flex: 1; display: flex; flex-direction: column; gap: 2px; }
                .hbar-track { height: 14px; background: #f1f0f6; border-radius: 3px; overflow: visible; position: relative; }
                .hbar-fill {
                    height: 100%;
                    border-radius: 3px;
                    display: flex;
                    align-items: center;
                    min-width: 2px;
                    position: relative;
                }
                .keluar-fill { background: #c026d3; }
                .masuk-fill { background: #f59e0b; }
                .hbar-val {
                    font-size: 0.55rem;
                    font-weight: 700;
                    color: #1e1b4b;
                    white-space: nowrap;
                    position: absolute;
                    right: -4px;
                    transform: translateX(100%);
                }
                .jenis-legend { display: flex; gap: 1rem; margin-top: 0.75rem; justify-content: center; }

                /* ===== Card 5: Asal Surat ===== */
                .asal-body { gap: 0.4rem; justify-content: center; }
                .asal-row { display: flex; align-items: center; gap: 0.5rem; }
                .asal-label {
                    width: 180px;
                    min-width: 180px;
                    font-size: 0.62rem;
                    color: #1e1b4b;
                    font-weight: 600;
                    text-align: right;
                    line-height: 1.2;
                }
                .asal-bar-wrap { flex: 1; display: flex; align-items: center; gap: 6px; }
                .asal-bar {
                    height: 16px;
                    background: linear-gradient(90deg, #c026d3, #e879a8);
                    border-radius: 3px;
                    min-width: 2px;
                }
                .asal-val { font-size: 0.6rem; font-weight: 700; color: #1e1b4b; white-space: nowrap; }

                /* ===== Pengelompokan Section ===== */
                .pg-section {
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
                    margin-bottom: 1.5rem;
                    overflow: hidden;
                    border: 1px solid #e8e5f0;
                }
                .pg-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.75rem;
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }
                .pg-title {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: 0.5px;
                }
                .pg-header-right {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    flex-wrap: wrap;
                }
                .pg-upload-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.55rem 1.1rem;
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(8px);
                    color: #fff;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .pg-upload-btn:hover {
                    background: rgba(255,255,255,0.25);
                    transform: translateY(-1px);
                }
                .pg-upload-btn svg { width: 16px; height: 16px; }
                .pg-badge {
                    padding: 0.45rem 0.9rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    letter-spacing: 0.2px;
                }
                .pg-badge.green { background: #dcfce7; color: #166534; }
                .pg-badge.red { background: #fee2e2; color: #991b1b; }

                .pg-body {
                    display: flex;
                    min-height: 420px;
                }

                /* Sidebar */
                .pg-sidebar {
                    width: 280px;
                    min-width: 280px;
                    border-right: 1px solid #f0eef5;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.3rem;
                    background: #faf9fd;
                }
                .pg-sidebar-title {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #7c3aed;
                    letter-spacing: 1.5px;
                    margin-bottom: 0.5rem;
                    text-transform: uppercase;
                }
                .pg-check-row {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    font-size: 0.85rem;
                    cursor: pointer;
                    padding: 0.4rem 0.5rem;
                    border-radius: 6px;
                    transition: background 0.15s;
                }
                .pg-check-row:hover { background: #f0ecf9; }
                .pg-check-row input[type="checkbox"] {
                    accent-color: #7c3aed;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                .pg-check-label {
                    flex: 1;
                    color: #1e1b4b;
                    font-weight: 500;
                    line-height: 1.3;
                }
                .pg-check-count {
                    color: #a5a0c0;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .pg-sidebar-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #e0ddf0, transparent);
                    margin: 0.75rem 0;
                }
                .pg-sidebar-summary {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    font-size: 0.8rem;
                    color: #64748b;
                    padding: 0.5rem;
                    background: #fff;
                    border-radius: 8px;
                    border: 1px solid #e8e5f0;
                }
                .pg-sidebar-summary b { color: #1e1b4b; }
                .pg-unmapped-toggle {
                    margin-top: 0.4rem;
                    padding: 0.5rem 0.6rem;
                    background: #fef9e7;
                    border-radius: 8px;
                    border: 1px solid #fde68a;
                }
                .pg-create-btn {
                    margin-top: auto;
                    padding: 0.7rem 1rem;
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.25s;
                    letter-spacing: 0.3px;
                }
                .pg-create-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(124,58,237,0.35);
                    background: linear-gradient(135deg, #6d28d9, #9333ea);
                }

                /* Table */
                .pg-table-wrap {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }
                .pg-empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem 2rem;
                    text-align: center;
                    color: #64748b;
                    gap: 0.5rem;
                    flex: 1;
                }
                .pg-empty-state h3 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1e1b4b;
                    margin: 0;
                }
                .pg-empty-state p {
                    font-size: 0.88rem;
                    color: #94a3b8;
                    margin: 0 0 1rem;
                }
                .pg-upload-btn-lg {
                    font-size: 0.95rem;
                    padding: 0.65rem 1.5rem;
                }
                .pg-table-header {
                    padding: 0.75rem 1.25rem;
                    font-size: 0.8rem;
                    color: #64748b;
                    font-weight: 600;
                    border-bottom: 1px solid #f0eef5;
                    background: #fdfcff;
                }
                .pg-table-scroll {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 500px;
                }
                .pg-table-scroll::-webkit-scrollbar { width: 6px; }
                .pg-table-scroll::-webkit-scrollbar-track { background: transparent; }
                .pg-table-scroll::-webkit-scrollbar-thumb { background: #d4d0e8; border-radius: 3px; }
                .pg-table { width: 100%; border-collapse: collapse; }
                .pg-table thead { position: sticky; top: 0; z-index: 1; }
                .pg-table th {
                    background: #f8f7fc;
                    padding: 0.7rem 1rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #7c3aed;
                    text-align: left;
                    border-bottom: 2px solid #e8e5f0;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                }
                .pg-table tbody tr { transition: background 0.1s; }
                .pg-table tbody tr:hover { background: #f8f7fc; }
                .pg-table tbody tr:nth-child(even) { background: #fdfcff; }
                .pg-table tbody tr:nth-child(even):hover { background: #f5f3fb; }
                .pg-table td {
                    padding: 0.6rem 1rem;
                    font-size: 0.82rem;
                    border-bottom: 1px solid #f3f1f8;
                    color: #1e1b4b;
                }
                .pg-td-asal {
                    max-width: 400px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-weight: 500;
                }
                .pg-td-count {
                    text-align: center;
                    font-weight: 700;
                    width: 80px;
                    color: #4338ca;
                }
                .pg-td-group { width: 220px; }
                .pg-tag {
                    display: inline-block;
                    padding: 0.25rem 0.65rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 0.2px;
                }
                .pg-tag.green { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
                .pg-tag.red {
                    background: #fef2f2;
                    color: #991b1b;
                    border: 1px solid #fecaca;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.7rem;
                }
                .pg-tag.red:hover { background: #fee2e2; transform: scale(1.03); box-shadow: 0 2px 8px rgba(220,38,38,0.15); }
                .pg-row-unmapped { background: #fffef5 !important; }
                .pg-row-unmapped:hover { background: #fefce8 !important; }

                /* ===== Modals ===== */
                .pg-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15,10,40,0.5);
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(6px);
                    animation: pgFadeIn 0.2s ease;
                }
                @keyframes pgFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes pgSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .pg-modal {
                    background: #fff;
                    border-radius: 16px;
                    padding: 1.75rem;
                    width: 92%;
                    max-width: 460px;
                    box-shadow: 0 25px 80px rgba(0,0,0,0.2);
                    animation: pgSlideUp 0.25s ease;
                }
                .pg-modal-create { max-width: 540px; }
                .pg-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .pg-modal-header h3 {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #1e1b4b;
                }
                .pg-modal-close {
                    background: #f1f0f6;
                    border: none;
                    font-size: 1rem;
                    cursor: pointer;
                    color: #64748b;
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s;
                }
                .pg-modal-close:hover { background: #e2e1ec; color: #1e1b4b; }
                .pg-modal-sub {
                    font-size: 0.9rem;
                    color: #64748b;
                    margin: 0 0 1rem;
                    line-height: 1.5;
                }
                .pg-modal-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                    max-height: 320px;
                    overflow-y: auto;
                }
                .pg-modal-option {
                    display: block;
                    width: 100%;
                    text-align: left;
                    padding: 0.65rem 1rem;
                    background: #faf9fd;
                    border: 1px solid #e8e5f0;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #1e1b4b;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .pg-modal-option:hover {
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    color: #fff;
                    border-color: #7c3aed;
                    transform: translateX(4px);
                    box-shadow: 0 3px 12px rgba(124,58,237,0.2);
                }
                .pg-modal-label {
                    display: block;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #475569;
                    margin-bottom: 0.35rem;
                    margin-top: 0.75rem;
                }
                .pg-modal-input {
                    width: 100%;
                    padding: 0.65rem 0.9rem;
                    border: 1.5px solid #e8e5f0;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    outline: none;
                    box-sizing: border-box;
                    transition: all 0.2s;
                    background: #faf9fd;
                }
                .pg-modal-input:focus {
                    border-color: #7c3aed;
                    box-shadow: 0 0 0 4px rgba(124,58,237,0.08);
                    background: #fff;
                }
                .pg-modal-input-search {
                    padding-left: 2.2rem;
                }
                .pg-search-wrap {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .pg-modal-checklist {
                    max-height: 220px;
                    overflow-y: auto;
                    margin-top: 0.6rem;
                    border: 1.5px solid #e8e5f0;
                    border-radius: 10px;
                    padding: 0.6rem;
                    background: #faf9fd;
                }
                .pg-modal-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e8e5f0;
                    font-size: 0.8rem;
                    color: #64748b;
                    font-weight: 600;
                }
                .pg-modal-actions { display: flex; gap: 0.6rem; }
                .pg-btn-cancel {
                    padding: 0.55rem 1.1rem;
                    background: #f1f0f6;
                    color: #64748b;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .pg-btn-cancel:hover { background: #e2e1ec; }
                .pg-btn-save {
                    padding: 0.55rem 1.1rem;
                    background: linear-gradient(135deg, #7c3aed, #a855f7);
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .pg-btn-save:hover { box-shadow: 0 4px 14px rgba(124,58,237,0.3); transform: translateY(-1px); }
                .pg-btn-save:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
                .pg-empty { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 1.5rem; }

                /* ===== Upload Notification ===== */
                .upload-notif {
                    margin: 0.75rem 0 0;
                    padding: 0;
                }
                .upload-notif-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
                    border: 1px solid #86efac;
                    border-radius: 10px;
                    padding: 0.85rem 1.1rem;
                    flex-wrap: wrap;
                }
                .upload-notif-icon {
                    display: flex;
                    align-items: center;
                    color: #16a34a;
                }
                .upload-notif-text {
                    display: flex;
                    flex-direction: column;
                    gap: 0.15rem;
                    flex: 1;
                    min-width: 200px;
                }
                .upload-notif-text strong {
                    font-size: 0.9rem;
                    color: #166534;
                }
                .upload-notif-text span {
                    font-size: 0.8rem;
                    color: #15803d;
                }
                .upload-notif-btn {
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #7c3aed, #c026d3);
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .upload-notif-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 14px rgba(124,58,237,0.3);
                }
                .upload-notif-close {
                    background: none;
                    border: none;
                    font-size: 1.1rem;
                    color: #166534;
                    cursor: pointer;
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                .upload-notif-close:hover {
                    background: rgba(0,0,0,0.08);
                }

                /* ===== Responsive ===== */
                @media (max-width: 1100px) {
                    .top-row { flex-direction: column; }
                    .bottom-row { flex-direction: column; }
                    .pg-body { flex-direction: column; }
                    .pg-sidebar { width: 100%; min-width: 100%; border-right: none; border-bottom: 1px solid #f0eef5; }
                }
                @media (max-width: 640px) {
                    .insight-page { padding: 0.75rem; }
                    .dash-title h1 { font-size: 1.2rem; padding: 0.4rem 1rem; }
                    .hbar-label, .asal-label { width: 120px; min-width: 120px; font-size: 0.55rem; }
                    .pg-section { border-radius: 12px; }
                    .pg-header { padding: 1rem; }
                    .pg-sidebar { padding: 1rem; }
                }
            `}</style>
        </div >
    );
}
