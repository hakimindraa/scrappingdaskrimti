'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { KELOMPOK_LIST, AsalEntry } from '../data/masterAsal';
import { ASAL_KELOMPOK_MAP } from '../data/asalMapping';
import { JENIS_KATEGORI_LIST, JENIS_KATEGORI_MAP, JenisEntry } from '../data/jenisMapping';
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

interface RawRow {
    jenis: string;
    asal: string;
    month: number;
    year: number;
}

interface RawRowKeluar {
    jenis: string;
    month: number;
    year: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LABELS_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function InsightTab() {
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // --- Raw Data & Filter State ---
    const [rawRows, setRawRows] = useState<RawRow[]>([]);
    const [availableRange, setAvailableRange] = useState<{ min: number; max: number } | null>(null);
    const [bulanDari, setBulanDari] = useState<number>(1);
    const [bulanSampai, setBulanSampai] = useState<number>(12);
    const [dataYear, setDataYear] = useState<{ min: number; max: number } | null>(null);
    const [jenisKategoriOverrides, setJenisKategoriOverrides] = useState<Record<string, string>>({});
    const [asalKelompokOverrides, setAsalKelompokOverrides] = useState<Record<string, string>>({});
    const [hasUploadedJenis, setHasUploadedJenis] = useState(false);
    const [hasUploadedAsal, setHasUploadedAsal] = useState(false);
    const [rawRowsKeluar, setRawRowsKeluar] = useState<RawRowKeluar[]>([]);
    const [hasUploadedKeluar, setHasUploadedKeluar] = useState(false);

    // --- SIPEDE Manual Stats State ---
    const [sipedeStats, setSipedeStats] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sipede_manual_stats');
            if (saved) {
                try { return JSON.parse(saved); } catch { /* ignore */ }
            }
        }
        return { statusAktif: 131, statusTidakAktif: 0, tercatatSipede: 131, tidakTercatatSipede: 8, terdaftarEsign: 56, tidakTerdaftarEsign: 83 };
    });
    const [sipedeSaved, setSipedeSaved] = useState(false);
    const [showSipedeForm, setShowSipedeForm] = useState(true);

    // --- Computed donut percentages ---
    const totalAktif = sipedeStats.statusAktif + sipedeStats.statusTidakAktif;
    const pctAktif = useMemo(() => {
        return totalAktif > 0 ? (sipedeStats.statusAktif / totalAktif) * 100 : 0;
    }, [sipedeStats.statusAktif, totalAktif]);

    const totalTercatat = sipedeStats.tercatatSipede + sipedeStats.tidakTercatatSipede;
    const pctTercatat = useMemo(() => {
        return totalTercatat > 0 ? (sipedeStats.tercatatSipede / totalTercatat) * 100 : 0;
    }, [sipedeStats.tercatatSipede, totalTercatat]);

    const totalEsign = sipedeStats.terdaftarEsign + sipedeStats.tidakTerdaftarEsign;
    const pctEsign = useMemo(() => {
        return totalEsign > 0 ? (sipedeStats.terdaftarEsign / totalEsign) * 100 : 0;
    }, [sipedeStats.terdaftarEsign, totalEsign]);

    const handleSaveSipedeStats = () => {
        localStorage.setItem('sipede_manual_stats', JSON.stringify(sipedeStats));
        setSipedeSaved(true);
        setTimeout(() => setSipedeSaved(false), 3000);
    };

    const updateSipedeStat = (key: string, value: string) => {
        const num = value === '' ? 0 : parseInt(value, 10);
        if (isNaN(num) || num < 0) return;
        setSipedeStats((prev: Record<string, number>) => ({ ...prev, [key]: num }));
    };

    // --- Pengelompokan State ---
    const [checkedGroups, setCheckedGroups] = useState<Set<string>>(new Set(KELOMPOK_LIST));
    const [customGroups, setCustomGroups] = useState<{ name: string; asalList: string[] }[]>([]);
    const [showUnmappedOnly, setShowUnmappedOnly] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [assignAsal, setAssignAsal] = useState<AsalEntry | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupSelected, setNewGroupSelected] = useState<Set<string>>(new Set());
    const [searchAsal, setSearchAsal] = useState('');

    // --- Tab & Filter Toggle State ---
    const [activeTab, setActiveTab] = useState<'jenis' | 'asal'>('jenis');
    const [showJenisFilter, setShowJenisFilter] = useState(false);
    const [showAsalFilter, setShowAsalFilter] = useState(false);

    // --- Jenis Surat Pengelompokan State ---
    const [checkedJenisGroups, setCheckedJenisGroups] = useState<Set<string>>(new Set(JENIS_KATEGORI_LIST));
    const [showJenisUnmappedOnly, setShowJenisUnmappedOnly] = useState(false);
    const [assignJenis, setAssignJenis] = useState<JenisEntry | null>(null);
    const [uploadInfo, setUploadInfo] = useState<{ totalRowsMasuk?: number, jenisCount?: number, jenisMatched?: number, jenisUnmatched?: number, asalCount?: number, asalMatched?: number, asalUnmatched?: number, totalRowsKeluar?: number, keluarJenisCount?: number, keluarJenisMatched?: number, keluarJenisUnmatched?: number } | null>(null);
    const jenisChartRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef2 = useRef<HTMLInputElement>(null);
    const fileInputRefKeluar = useRef<HTMLInputElement>(null);
    const asalChartRef = useRef<HTMLDivElement>(null);

    // --- Filtered Rows (reactive to month filter) ---
    const filteredRows = useMemo(() => {
        return rawRows.filter(r => r.month >= bulanDari && r.month <= bulanSampai);
    }, [rawRows, bulanDari, bulanSampai]);

    const filteredRowsKeluar = useMemo(() => {
        return rawRowsKeluar.filter(r => r.month >= bulanDari && r.month <= bulanSampai);
    }, [rawRowsKeluar, bulanDari, bulanSampai]);

    // --- Jenis Data (computed from filteredRows + filteredRowsKeluar) ---
    const jenisData = useMemo((): JenisEntry[] => {
        if (filteredRows.length === 0 && filteredRowsKeluar.length === 0 && !hasUploadedJenis && !hasUploadedKeluar) return [];
        const masukCounts: Record<string, number> = {};
        filteredRows.forEach(r => {
            if (!r.jenis) return;
            masukCounts[r.jenis] = (masukCounts[r.jenis] || 0) + 1;
        });
        const keluarCounts: Record<string, number> = {};
        filteredRowsKeluar.forEach(r => {
            if (!r.jenis) return;
            keluarCounts[r.jenis] = (keluarCounts[r.jenis] || 0) + 1;
        });
        const allJenis = new Set([...Object.keys(masukCounts), ...Object.keys(keluarCounts)]);
        return Array.from(allJenis).map(jenis => ({
            jenis,
            countMasuk: masukCounts[jenis] || 0,
            countKeluar: keluarCounts[jenis] || 0,
            kategori: jenisKategoriOverrides[jenis] || JENIS_KATEGORI_MAP[jenis] || '',
        }));
    }, [filteredRows, filteredRowsKeluar, hasUploadedJenis, hasUploadedKeluar, jenisKategoriOverrides]);

    // --- Asal Data (computed from filteredRows) ---
    const asalData = useMemo((): AsalEntry[] => {
        if (filteredRows.length === 0 && !hasUploadedAsal) return [];
        const counts: Record<string, number> = {};
        filteredRows.forEach(r => {
            if (!r.asal) return;
            counts[r.asal] = (counts[r.asal] || 0) + 1;
        });
        return Object.entries(counts).map(([asal, count]) => ({
            asal,
            count,
            kelompok: asalKelompokOverrides[asal] || ASAL_KELOMPOK_MAP[asal] || '',
        }));
    }, [filteredRows, hasUploadedAsal, asalKelompokOverrides]);

    // --- Jenis Surat Computed ---
    const allJenisKategori = useMemo(() => [...JENIS_KATEGORI_LIST], []);
    const jenisSudahCount = useMemo(() => jenisData.filter(d => d.kategori !== '').length, [jenisData]);
    const jenisBelumCount = useMemo(() => jenisData.filter(d => d.kategori === '').length, [jenisData]);
    const filteredJenis = useMemo(() => {
        let data = jenisData;
        if (showJenisUnmappedOnly) data = data.filter(d => d.kategori === '');
        else data = data.filter(d => d.kategori === '' || checkedJenisGroups.has(d.kategori));
        return data;
    }, [jenisData, checkedJenisGroups, showJenisUnmappedOnly]);

    const toggleJenisGroup = (g: string) => {
        setCheckedJenisGroups(prev => {
            const next = new Set(prev);
            next.has(g) ? next.delete(g) : next.add(g);
            return next;
        });
    };

    const jenisGroupCount = (g: string) => jenisData.filter(d => d.kategori === g).length;

    const handleAssignJenis = (kategori: string) => {
        if (!assignJenis) return;
        setJenisKategoriOverrides(prev => ({ ...prev, [assignJenis.jenis]: kategori }));
        setAssignJenis(null);
    };

    // --- Pengelompokan Asal Computed ---
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
        setAsalKelompokOverrides(prev => ({ ...prev, [assignAsal.asal]: kelompok }));
        if (!checkedGroups.has(kelompok)) toggleGroup(kelompok);
        setAssignAsal(null);
    };

    const handleCreateGroup = () => {
        if (!newGroupName.trim() || newGroupSelected.size === 0) return;
        const name = newGroupName.trim();
        setCustomGroups(prev => [...prev, { name, asalList: Array.from(newGroupSelected) }]);
        setAsalKelompokOverrides(prev => {
            const next = { ...prev };
            newGroupSelected.forEach(asal => { next[asal] = name; });
            return next;
        });
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
    // --- Parse Date Helper ---
    const parseDate = (raw: unknown): { month: number; year: number } | null => {
        if (!raw) return null;
        if (raw instanceof Date) return { month: raw.getMonth() + 1, year: raw.getFullYear() };
        const str = String(raw).trim();
        if (/^\d{5}$/.test(str)) {
            const date = new Date((Number(str) - 25569) * 86400000);
            return { month: date.getMonth() + 1, year: date.getFullYear() };
        }
        const ddmm = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
        if (ddmm) {
            let y = parseInt(ddmm[3], 10);
            if (y < 100) y += 2000;
            return { month: parseInt(ddmm[2], 10), year: y };
        }
        const iso = str.match(/^(\d{4})[-\/](\d{1,2})[-\/]\d{1,2}$/);
        if (iso) return { month: parseInt(iso[2], 10), year: parseInt(iso[1], 10) };
        return null;
    };

    // --- Excel Upload Handler ---
    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

            // Parse all rows into rawRows
            const parsed: RawRow[] = [];
            let minMonth = 13, maxMonth = 0;
            const yearsFound = new Set<number>();

            rows.forEach(row => {
                const jenis = (row['Jenis Surat'] || '').toString().trim().toUpperCase();
                const asal = (row['Asal'] || '').toString().trim().toUpperCase();
                const d = parseDate(row['Tanggal']);
                if (!d || d.month < 1 || d.month > 12) return;
                parsed.push({ jenis, asal, month: d.month, year: d.year });
                if (d.month < minMonth) minMonth = d.month;
                if (d.month > maxMonth) maxMonth = d.month;
                yearsFound.add(d.year);
            });

            // Compute upload info from parsed rows
            const jenisCounts: Record<string, number> = {};
            const asalCounts: Record<string, number> = {};
            parsed.forEach(r => {
                if (r.jenis) jenisCounts[r.jenis] = (jenisCounts[r.jenis] || 0) + 1;
                if (r.asal) asalCounts[r.asal] = (asalCounts[r.asal] || 0) + 1;
            });

            let jenisMatched = 0, jenisUnmatched = 0;
            Object.entries(jenisCounts).forEach(([jenis, count]) => {
                if (JENIS_KATEGORI_MAP[jenis]) jenisMatched += count; else jenisUnmatched += count;
            });
            let asalMatched = 0, asalUnmatched = 0;
            Object.entries(asalCounts).forEach(([asal, count]) => {
                if (ASAL_KELOMPOK_MAP[asal]) asalMatched += count; else asalUnmatched += count;
            });

            // Store raw rows & set filter range
            setRawRows(parsed);
            if (minMonth <= maxMonth) {
                setAvailableRange(prev => prev
                    ? { min: Math.min(prev.min, minMonth), max: Math.max(prev.max, maxMonth) }
                    : { min: minMonth, max: maxMonth });
                setBulanDari(prev => rawRowsKeluar.length > 0 ? Math.min(prev, minMonth) : minMonth);
                setBulanSampai(prev => rawRowsKeluar.length > 0 ? Math.max(prev, maxMonth) : maxMonth);
            }
            if (yearsFound.size > 0) {
                const sorted = Array.from(yearsFound).sort();
                setDataYear({ min: sorted[0], max: sorted[sorted.length - 1] });
            }
            if (Object.keys(jenisCounts).length > 0) setHasUploadedJenis(true);
            if (Object.keys(asalCounts).length > 0) setHasUploadedAsal(true);

            // Reset overrides on new upload
            setJenisKategoriOverrides({});
            setAsalKelompokOverrides({});

            setUploadInfo(prev => ({
                ...prev,
                totalRowsMasuk: rows.length,
                jenisCount: Object.keys(jenisCounts).length,
                jenisMatched,
                jenisUnmatched,
                asalCount: Object.keys(asalCounts).length,
                asalMatched,
                asalUnmatched,
            }));
        };
        reader.readAsBinaryString(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (fileInputRef2.current) fileInputRef2.current.value = '';
    };

    // --- Excel Upload Handler (Surat Keluar) ---
    const handleExcelUploadKeluar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const workbook = XLSX.read(evt.target?.result, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

            const parsed: RawRowKeluar[] = [];
            let minM = 13, maxM = 0;
            const yearsFound = new Set<number>();

            rows.forEach(row => {
                const jenis = (row['Jenis Surat'] || '').toString().trim().toUpperCase();
                const d = parseDate(row['Tanggal']);
                if (!d || d.month < 1 || d.month > 12) return;
                parsed.push({ jenis, month: d.month, year: d.year });
                if (d.month < minM) minM = d.month;
                if (d.month > maxM) maxM = d.month;
                yearsFound.add(d.year);
            });

            setRawRowsKeluar(parsed);
            setHasUploadedKeluar(true);

            // Merge filter range
            if (minM <= maxM) {
                setBulanDari(prev => Math.min(prev, minM));
                setBulanSampai(prev => Math.max(prev, maxM));
                setAvailableRange(prev => prev
                    ? { min: Math.min(prev.min, minM), max: Math.max(prev.max, maxM) }
                    : { min: minM, max: maxM });
            }
            if (yearsFound.size > 0) {
                const sorted = Array.from(yearsFound).sort();
                setDataYear(prev => prev
                    ? { min: Math.min(prev.min, sorted[0]), max: Math.max(prev.max, sorted[sorted.length - 1]) }
                    : { min: sorted[0], max: sorted[sorted.length - 1] });
            }

            // Compute keluar jenis stats
            const keluarJenisCounts: Record<string, number> = {};
            parsed.forEach(r => {
                if (r.jenis) keluarJenisCounts[r.jenis] = (keluarJenisCounts[r.jenis] || 0) + 1;
            });
            let keluarJenisMatched = 0, keluarJenisUnmatched = 0;
            Object.entries(keluarJenisCounts).forEach(([jenis]) => {
                if (JENIS_KATEGORI_MAP[jenis] || jenisKategoriOverrides[jenis]) keluarJenisMatched++; else keluarJenisUnmatched++;
            });

            setUploadInfo(prev => ({
                ...prev,
                totalRowsKeluar: rows.length,
                keluarJenisCount: Object.keys(keluarJenisCounts).length,
                keluarJenisMatched,
                keluarJenisUnmatched,
            }));
        };
        reader.readAsBinaryString(file);
        if (fileInputRefKeluar.current) fileInputRefKeluar.current.value = '';
    };

    // --- Total Surat (reactive from filtered rows) ---
    const suratMasuk = useMemo(() => {
        return filteredRows.length;
    }, [filteredRows]);

    // --- Tren Surat Masuk (computed from filteredRows) ---
    const trendMasukData = useMemo(() => {
        if (rawRows.length === 0) return null;
        const months: string[] = [];
        const masuk: number[] = [];
        for (let m = bulanDari; m <= bulanSampai; m++) {
            months.push(MONTH_LABELS[m - 1]);
            masuk.push(filteredRows.filter(r => r.month === m).length);
        }
        return { months, masuk };
    }, [rawRows, filteredRows, bulanDari, bulanSampai]);

    const trendKeluar = useMemo(() => {
        if (rawRowsKeluar.length === 0) return [] as number[];
        const result: number[] = [];
        for (let m = bulanDari; m <= bulanSampai; m++) {
            result.push(filteredRowsKeluar.filter(r => r.month === m).length);
        }
        return result;
    }, [rawRowsKeluar, filteredRowsKeluar, bulanDari, bulanSampai]);

    const trendMonths = useMemo(() => {
        if (rawRows.length === 0 && rawRowsKeluar.length === 0) return [] as string[];
        const months: string[] = [];
        for (let m = bulanDari; m <= bulanSampai; m++) {
            months.push(MONTH_LABELS[m - 1]);
        }
        return months;
    }, [rawRows, rawRowsKeluar, bulanDari, bulanSampai]);

    const trendMasuk = useMemo(() => {
        return trendMasukData ? trendMasukData.masuk : [];
    }, [trendMasukData]);

    // Jenis Kategori: reactive from jenisData (masuk + keluar)
    const jenisKategori = useMemo(() => {
        if (!hasUploadedJenis && !hasUploadedKeluar) return [] as { label: string; masuk: number; keluar: number }[];
        const masukCounts: Record<string, number> = {};
        const keluarCounts: Record<string, number> = {};
        jenisData.forEach(d => {
            const key = d.kategori || 'Lainnya';
            masukCounts[key] = (masukCounts[key] || 0) + d.countMasuk;
            keluarCounts[key] = (keluarCounts[key] || 0) + d.countKeluar;
        });
        const allKat = new Set([...Object.keys(masukCounts), ...Object.keys(keluarCounts)]);
        return Array.from(allKat).map(label => ({
            label,
            masuk: masukCounts[label] || 0,
            keluar: keluarCounts[label] || 0,
        })).sort((a, b) => (b.masuk + b.keluar) - (a.masuk + a.keluar));
    }, [hasUploadedJenis, hasUploadedKeluar, jenisData]);

    const suratKeluar = useMemo(() => {
        return filteredRowsKeluar.length;
    }, [filteredRowsKeluar]);

    // Asal Surat: computed from asalData
    const asalSurat = useMemo(() => {
        if (!hasUploadedAsal) return [] as { label: string; value: number }[];
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

    // Get midpoint (x,y) of an arc segment for placing text
    const arcMid = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
        const midDeg = (startDeg + endDeg) / 2;
        const rad = (midDeg - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), deg: midDeg };
    };

    // --- Line Chart Helpers ---
    const trendMax = Math.max(...trendMasuk, ...trendKeluar, 1);
    const gridStep = trendMax <= 500 ? 100 : trendMax <= 1500 ? 200 : 500;
    const gridLines = Array.from({ length: Math.ceil(trendMax / gridStep) + 1 }, (_, i) => i * gridStep);
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
    const jenisMax = Math.max(...jenisKategori.flatMap(j => [j.masuk, j.keluar]), 1);
    const asalMax = Math.max(...asalSurat.map(a => a.value), 1);

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
                    <div className="pg-header-left">
                        <h2 className="pg-title">Pengelompokan Data Surat</h2>
                        <p className="pg-subtitle">Upload file Excel, lalu kelompokkan jenis dan asal surat</p>
                    </div>
                    <div className="pg-header-right">
                        <label className="pg-upload-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7-7 7 7" /></svg>
                            📥 Surat Masuk (.xlsx)
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUpload} />
                        </label>
                        <label className="pg-upload-btn pg-upload-btn-keluar">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7 7 7-7" /></svg>
                            📤 Surat Keluar (.xlsx)
                            <input ref={fileInputRefKeluar} type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUploadKeluar} />
                        </label>
                    </div>
                </div>

                {/* Step Guide for new users */}
                {!hasUploadedJenis && !hasUploadedAsal && !hasUploadedKeluar && (
                    <div className="pg-guide">
                        <div className="pg-guide-step"><span className="pg-step-num">1</span><span>Upload file Excel surat masuk dan/atau keluar</span></div>
                        <div className="pg-guide-step"><span className="pg-step-num">2</span><span>Kelompokkan jenis & asal surat di tab masing-masing</span></div>
                        <div className="pg-guide-step"><span className="pg-step-num">3</span><span>Lihat hasil grafik di Dashboard SIPEDE di bawah</span></div>
                    </div>
                )}

                {/* Upload Success Notification */}
                {uploadInfo && (
                    <div className="upload-notif">
                        <div className="upload-notif-content">
                            <span className="upload-notif-icon"><CheckCircleIcon className="hi-icon-lg" /></span>
                            <div className="upload-notif-text">
                                <strong>Upload berhasil!</strong>
                                {uploadInfo.totalRowsMasuk != null && (
                                    <span>📥 Surat Masuk: {uploadInfo.totalRowsMasuk.toLocaleString()} baris &bull; {uploadInfo.jenisCount} jenis ({uploadInfo.jenisMatched} cocok, {uploadInfo.jenisUnmatched} belum) &bull; {uploadInfo.asalCount} asal ({uploadInfo.asalMatched} cocok, {uploadInfo.asalUnmatched} belum)</span>
                                )}
                                {uploadInfo.totalRowsKeluar != null && (
                                    <span>📤 Surat Keluar: {uploadInfo.totalRowsKeluar.toLocaleString()} baris &bull; {uploadInfo.keluarJenisCount} jenis ({uploadInfo.keluarJenisMatched} cocok, {uploadInfo.keluarJenisUnmatched} belum)</span>
                                )}
                            </div>
                            <div className="upload-notif-actions">
                                <button className="upload-notif-btn" onClick={() => jenisChartRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                                    <ChartBarIcon className="hi-icon" /> Grafik Jenis <ArrowDownIcon className="hi-icon-sm" />
                                </button>
                                <button className="upload-notif-btn" onClick={() => asalChartRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                                    <ChartBarIcon className="hi-icon" /> Grafik Asal <ArrowDownIcon className="hi-icon-sm" />
                                </button>
                            </div>
                            <button className="upload-notif-close" onClick={() => setUploadInfo(null)}><XMarkIcon className="hi-icon" /></button>
                        </div>
                    </div>
                )}

                {/* Month Filter Dropdown */}
                {availableRange && (
                    <div className="pg-month-filter">
                        <span className="pg-month-label">Filter Bulan:</span>
                        <select
                            className="pg-month-select"
                            value={bulanDari}
                            onChange={e => {
                                const v = Number(e.target.value);
                                setBulanDari(v);
                                if (v > bulanSampai) setBulanSampai(v);
                            }}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{MONTH_LABELS_FULL[m - 1]}</option>
                            ))}
                        </select>
                        <span className="pg-month-dash">—</span>
                        <select
                            className="pg-month-select"
                            value={bulanSampai}
                            onChange={e => {
                                const v = Number(e.target.value);
                                setBulanSampai(v);
                                if (v < bulanDari) setBulanDari(v);
                            }}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{MONTH_LABELS_FULL[m - 1]}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* ===== TAB BAR ===== */}
                <div className="pg-tab-bar">
                    <button className={`pg-tab ${activeTab === 'jenis' ? 'pg-tab-active' : ''}`} onClick={() => setActiveTab('jenis')}>
                        JENIS SURAT PER KATEGORI
                        <span className="pg-badge-sm green"><CheckCircleIcon className="hi-icon" /> {jenisSudahCount}</span>
                        <span className="pg-badge-sm red"><XCircleIcon className="hi-icon" /> {jenisBelumCount}</span>
                    </button>
                    <button className={`pg-tab ${activeTab === 'asal' ? 'pg-tab-active' : ''}`} onClick={() => setActiveTab('asal')}>
                        ASAL SURAT MASUK
                        <span className="pg-badge-sm green"><CheckCircleIcon className="hi-icon" /> {sudahCount}</span>
                        <span className="pg-badge-sm red"><XCircleIcon className="hi-icon" /> {belumCount}</span>
                    </button>
                </div>

                {/* ===== TAB JENIS SURAT ===== */}
                {activeTab === 'jenis' && (
                    <div className="pg-tab-content">
                        {jenisData.length === 0 ? (
                            <div className="pg-empty-state">
                                <DocumentTextIcon className="pg-empty-state-icon" />
                                <h3>Belum ada data</h3>
                                <p>Upload Excel untuk memulai pengelompokan jenis surat.</p>
                                <label className="pg-upload-btn pg-upload-btn-lg pg-upload-btn-inline">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    Upload Excel
                                    <input ref={fileInputRef2} type="file" accept=".xlsx,.xls" hidden onChange={handleExcelUpload} />
                                </label>
                            </div>
                        ) : (
                            <>
                                {/* Toolbar */}
                                <div className="pg-toolbar">
                                    <span>Menampilkan {filteredJenis.length} dari {jenisData.length} jenis</span>
                                    <button className="pg-filter-toggle" onClick={() => setShowJenisFilter(!showJenisFilter)}>
                                        Filter Kategori {showJenisFilter ? '▲' : '▼'}
                                    </button>
                                </div>
                                {/* Filter Panel — JENIS KATEGORI */}
                                {showJenisFilter && (
                                    <div className="pg-filter-panel">
                                        <div className="pg-filter-grid">
                                            {allJenisKategori.map(g => (
                                                <label key={g} className="pg-filter-chip">
                                                    <input type="checkbox" checked={checkedJenisGroups.has(g)} onChange={() => toggleJenisGroup(g)} />
                                                    <span className="pg-check-label">{g}</span>
                                                    <span className="pg-check-count">({jenisGroupCount(g)})</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Tabel Jenis (full width, 4 kolom) */}
                                <div className="pg-table-scroll">
                                    <table className="pg-table">
                                        <thead><tr><th>Jenis Surat</th><th>Masuk</th><th>Keluar</th><th>Kategori</th></tr></thead>
                                        <tbody>
                                            {filteredJenis.map((d, i) => (
                                                <tr key={i} className={d.kategori === '' ? 'pg-row-unmapped' : ''}>
                                                    <td className="pg-td-asal">{d.jenis}</td>
                                                    <td className="pg-td-count">{d.countMasuk > 0 ? d.countMasuk.toLocaleString() : <span className="pg-td-dash">&mdash;</span>}</td>
                                                    <td className="pg-td-count">{d.countKeluar > 0 ? d.countKeluar.toLocaleString() : <span className="pg-td-dash">&mdash;</span>}</td>
                                                    <td className="pg-td-group">
                                                        {d.kategori ? (
                                                            <span className="pg-tag green">{d.kategori}</span>
                                                        ) : (
                                                            <button className="pg-tag red" onClick={() => setAssignJenis(d)}><ExclamationCircleIcon className="hi-icon" /> Belum — Assign</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Footer */}
                                <div className="pg-table-footer">
                                    <div className="pg-footer-stats">
                                        <span className="pg-footer-stat green"><CheckCircleIcon className="hi-icon" /> Sudah: <b>{jenisSudahCount}</b></span>
                                        <span className="pg-footer-stat red"><XCircleIcon className="hi-icon" /> Belum: <b>{jenisBelumCount}</b></span>
                                    </div>
                                    <label className="pg-footer-toggle">
                                        <input type="checkbox" checked={showJenisUnmappedOnly} onChange={() => setShowJenisUnmappedOnly(!showJenisUnmappedOnly)} />
                                        Hanya belum dikategori
                                    </label>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ===== TAB ASAL SURAT ===== */}
                {activeTab === 'asal' && (
                    <div className="pg-tab-content">
                        {asalData.length === 0 ? (
                            <div className="pg-empty-state">
                                <DocumentTextIcon className="pg-empty-state-icon" />
                                <h3>Belum ada data</h3>
                                <p>Upload Excel untuk memulai pengelompokan asal surat.</p>
                            </div>
                        ) : (
                            <>
                                {/* Toolbar */}
                                <div className="pg-toolbar">
                                    <span>Menampilkan {filteredAsal.length} dari {asalData.length} data</span>
                                    <button className="pg-filter-toggle" onClick={() => setShowAsalFilter(!showAsalFilter)}>
                                        Filter Kelompok {showAsalFilter ? '▲' : '▼'}
                                    </button>
                                </div>
                                {/* Filter Panel — KELOMPOK */}
                                {showAsalFilter && (
                                    <div className="pg-filter-panel">
                                        <div className="pg-filter-grid">
                                            {allKelompok.map(g => (
                                                <label key={g} className="pg-filter-chip">
                                                    <input type="checkbox" checked={checkedGroups.has(g)} onChange={() => toggleGroup(g)} />
                                                    <span className="pg-check-label">{g}</span>
                                                    <span className="pg-check-count">({groupCount(g)})</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Tabel Asal (full width) */}
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
                                                            <button className="pg-tag red" onClick={() => setAssignAsal(d)}><ExclamationCircleIcon className="hi-icon" /> Belum — Assign</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Footer */}
                                <div className="pg-table-footer">
                                    <div className="pg-footer-stats">
                                        <span className="pg-footer-stat green"><CheckCircleIcon className="hi-icon" /> Sudah: <b>{sudahCount}</b></span>
                                        <span className="pg-footer-stat red"><XCircleIcon className="hi-icon" /> Belum: <b>{belumCount}</b></span>
                                    </div>
                                    <label className="pg-footer-toggle">
                                        <input type="checkbox" checked={showUnmappedOnly} onChange={() => setShowUnmappedOnly(!showUnmappedOnly)} />
                                        Hanya belum dikelompok
                                    </label>
                                    <button className="pg-create-btn-sm" onClick={() => { setShowCreateModal(true); setSearchAsal(''); setNewGroupName(''); setNewGroupSelected(new Set()); }}>
                                        + Buat Kelompok Baru
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ===== ASSIGN JENIS MODAL ===== */}
            {assignJenis && (
                <div className="pg-overlay" onClick={() => setAssignJenis(null)}>
                    <div className="pg-modal" onClick={e => e.stopPropagation()}>
                        <div className="pg-modal-header">
                            <h3>Assign Kategori</h3>
                            <button className="pg-modal-close" onClick={() => setAssignJenis(null)}><XMarkIcon className="hi-icon" /></button>
                        </div>
                        <p className="pg-modal-sub">Assign <b>&quot;{assignJenis.jenis}&quot;</b> ke kategori:</p>
                        <div className="pg-modal-list">
                            {allJenisKategori.map(g => (
                                <button key={g} className="pg-modal-option" onClick={() => handleAssignJenis(g)}>{g}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== ASSIGN ASAL MODAL ===== */}
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

            {/* ===== SIPEDE MANUAL INPUT SECTION ===== */}
            <div className="sipede-input-section">
                <div className="sipede-input-header" onClick={() => setShowSipedeForm(!showSipedeForm)}>
                    <div className="sipede-input-header-left">
                        <h2 className="sipede-input-title">📊 Input Statistik SIPEDE</h2>
                        <p className="sipede-input-subtitle">Input manual data statistik user SIPEDE untuk grafik dashboard</p>
                    </div>
                    <span className="sipede-input-toggle">{showSipedeForm ? '▲' : '▼'}</span>
                </div>
                {showSipedeForm && (
                    <div className="sipede-input-body">
                        <div className="sipede-input-grid">
                            <div className="sipede-field">
                                <label className="sipede-field-label">Status Aktif</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="sipede-field-input"
                                    value={sipedeStats.statusAktif}
                                    onChange={e => updateSipedeStat('statusAktif', e.target.value)}
                                />
                            </div>
                            <div className="sipede-field">
                                <label className="sipede-field-label">Status Tidak Aktif</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="sipede-field-input"
                                    value={sipedeStats.statusTidakAktif}
                                    onChange={e => updateSipedeStat('statusTidakAktif', e.target.value)}
                                />
                            </div>
                            <div className="sipede-field">
                                <label className="sipede-field-label">Tercatat SIPEDE</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="sipede-field-input"
                                    value={sipedeStats.tercatatSipede}
                                    onChange={e => updateSipedeStat('tercatatSipede', e.target.value)}
                                />
                            </div>
                            <div className="sipede-field">
                                <label className="sipede-field-label">Tidak Tercatat SIPEDE</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="sipede-field-input"
                                    value={sipedeStats.tidakTercatatSipede}
                                    onChange={e => updateSipedeStat('tidakTercatatSipede', e.target.value)}
                                />
                            </div>
                            <div className="sipede-field">
                                <label className="sipede-field-label">Terdaftar E-sign</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="sipede-field-input"
                                    value={sipedeStats.terdaftarEsign}
                                    onChange={e => updateSipedeStat('terdaftarEsign', e.target.value)}
                                />
                            </div>
                            <div className="sipede-field">
                                <label className="sipede-field-label">Tidak Terdaftar E-sign</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="sipede-field-input"
                                    value={sipedeStats.tidakTerdaftarEsign}
                                    onChange={e => updateSipedeStat('tidakTerdaftarEsign', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="sipede-input-footer">
                            <button className="sipede-save-btn" onClick={handleSaveSipedeStats}>
                                💾 Simpan Data
                            </button>
                            {sipedeSaved && (
                                <span className="sipede-saved-notif">
                                    <CheckCircleIcon className="hi-icon" /> Data berhasil disimpan!
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

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
                        <span className="period-badge">{availableRange ? MONTH_LABELS[bulanDari - 1].toUpperCase() : 'JAN'}</span>
                        <span className="period-sep">—</span>
                        <span className="period-badge">{availableRange ? MONTH_LABELS[bulanSampai - 1].toUpperCase() : 'SEP'}</span>
                        <span className="period-year">
                            <span className="year-top">{dataYear ? String(dataYear.min).slice(0, 2) : '20'}</span>
                            <span className="year-bottom">{dataYear ? String(dataYear.min).slice(2) : '25'}</span>
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
                            <div className="persen-layout">
                                {/* Donut 1: Tercatat SIPEDE */}
                                {(() => {
                                    const pctP = Math.round(pctTercatat);
                                    const pctO = totalTercatat > 0 ? 100 - pctP : 0;
                                    const endP = Math.min(pctP * 3.6, 359.9);
                                    const midP = arcMid(60, 60, 40, 0, endP);
                                    const midO = arcMid(60, 60, 40, endP, 360);
                                    const lblP = arcMid(60, 60, 85, 0, endP);
                                    const lblO = arcMid(60, 60, 85, endP, 360);
                                    return (
                                        <div className="persen-donut-col">
                                            <div className="persen-chart-wrap">
                                                <svg viewBox="-30 -30 180 180" className="persen-svg">
                                                    <circle cx="60" cy="60" r="40" fill="none" stroke="#f3f0ff" strokeWidth="18" />
                                                    {totalTercatat > 0 && pctO > 0.1 && <path d={donutArc(60, 60, 40, endP, 360)} fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="butt" />}
                                                    {totalTercatat > 0 && pctP > 0 && <path d={donutArc(60, 60, 40, 0, endP)} fill="none" stroke="#c026d3" strokeWidth="18" strokeLinecap="butt" />}
                                                    {totalTercatat > 0 && pctP > 3 && <text x={midP.x} y={midP.y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="800" fill="#fff">{pctP}%</text>}
                                                    {totalTercatat > 0 && pctO > 3 && <text x={midO.x} y={midO.y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="800" fill="#fff">{pctO}%</text>}
                                                </svg>
                                                {totalTercatat > 0 && pctO > 0 && (
                                                    <div className="persen-lbl" style={{top: `${((lblO.y + 30) / 180) * 100}%`, left: `${((lblO.x + 30) / 180) * 100}%`}}>
                                                        <span className="persen-lbl-text">Tidak Tercatat<br/>SIPEDE</span>
                                                    </div>
                                                )}
                                                {totalTercatat > 0 && pctP > 0 && (
                                                    <div className="persen-lbl" style={{top: `${((lblP.y + 30) / 180) * 100}%`, left: `${((lblP.x + 30) / 180) * 100}%`}}>
                                                        <span className="persen-lbl-text">Tercatat<br/>SIPEDE</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Donut 2: Terdaftar E-sign */}
                                {(() => {
                                    const pctNotE = totalEsign > 0 ? Math.round(100 - pctEsign) : 0;
                                    const pctE = Math.round(pctEsign);
                                    const endNotE = Math.min(pctNotE * 3.6, 359.9);
                                    const midNotE = arcMid(60, 60, 40, 0, endNotE);
                                    const midE = arcMid(60, 60, 40, endNotE, 360);
                                    const lblNotE = arcMid(60, 60, 85, 0, endNotE);
                                    const lblE = arcMid(60, 60, 85, endNotE, 360);
                                    return (
                                        <div className="persen-donut-col">
                                            <div className="persen-chart-wrap">
                                                <svg viewBox="-30 -30 180 180" className="persen-svg">
                                                    <circle cx="60" cy="60" r="40" fill="none" stroke="#f3f0ff" strokeWidth="18" />
                                                    {totalEsign > 0 && pctE > 0 && <path d={donutArc(60, 60, 40, endNotE, 360)} fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="butt" />}
                                                    {totalEsign > 0 && pctNotE > 0 && <path d={donutArc(60, 60, 40, 0, endNotE)} fill="none" stroke="#c026d3" strokeWidth="18" strokeLinecap="butt" />}
                                                    {totalEsign > 0 && pctNotE > 3 && <text x={midNotE.x} y={midNotE.y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="800" fill="#fff">{pctNotE}%</text>}
                                                    {totalEsign > 0 && pctE > 3 && <text x={midE.x} y={midE.y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="800" fill="#fff">{pctE}%</text>}
                                                </svg>
                                                {totalEsign > 0 && pctNotE > 0 && (
                                                    <div className="persen-lbl" style={{top: `${((lblNotE.y + 30) / 180) * 100}%`, left: `${((lblNotE.x + 30) / 180) * 100}%`}}>
                                                        <span className="persen-lbl-text">Tidak Terdaftar<br/>E-sign</span>
                                                    </div>
                                                )}
                                                {totalEsign > 0 && pctE > 0 && (
                                                    <div className="persen-lbl" style={{top: `${((lblE.y + 30) / 180) * 100}%`, left: `${((lblE.x + 30) / 180) * 100}%`}}>
                                                        <span className="persen-lbl-text">Terdaftar<br/>E-sign</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Donut 3: Status Aktif */}
                                {(() => {
                                    const pctA = Math.round(pctAktif);
                                    const pctNA = totalAktif > 0 ? 100 - pctA : 0;
                                    const endA = Math.min(pctA * 3.6, 359.9);
                                    return (
                                        <div className="persen-donut-col">
                                            <div className="persen-chart-wrap">
                                                <svg viewBox="-30 -30 180 180" className="persen-svg">
                                                    <circle cx="60" cy="60" r="40" fill="none" stroke="#f3f0ff" strokeWidth="18" />
                                                    {totalAktif > 0 && pctA > 0 && <path d={donutArc(60, 60, 40, 0, endA)} fill="none" stroke="#c026d3" strokeWidth="18" strokeLinecap="butt" />}
                                                    {totalAktif > 0 && pctNA > 0.5 && <path d={donutArc(60, 60, 40, endA, 360)} fill="none" stroke="#f59e0b" strokeWidth="18" strokeLinecap="butt" />}
                                                    {/* Center text for Status Aktif */}
                                                    <text x="60" y="52" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="#1e1b4b">Status</text>
                                                    <text x="60" y="64" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="#1e1b4b">Aktif</text>
                                                    <text x="60" y="78" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="800" fill="#1e1b4b">{pctA}%</text>
                                                </svg>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Tren Frekuensi */}
                    <div className="card card-tren">
                        <div className="card-label purple-label">TREN FREKUENSI SURAT PER BULAN</div>
                        <div className="card-body tren-body">
                            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="line-chart">
                                {/* Grid lines */}
                                {gridLines.map(v => {
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
                            {jenisKategori.length === 0 ? (
                                <div className="chart-empty">Belum ada data — upload Excel untuk melihat grafik</div>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>

                    {/* Card 5: Asal Surat Masuk */}
                    <div className="card card-asal" ref={asalChartRef}>
                        <div className="card-label purple-label">ASAL SURAT MASUK</div>
                        <div className="card-body asal-body">
                            {asalSurat.length === 0 ? (
                                <div className="chart-empty">Belum ada data — upload Excel untuk melihat grafik</div>
                            ) : (
                                [...asalSurat].reverse().map((item, idx) => (
                                    <div className="asal-row" key={idx}>
                                        <div className="asal-label">{item.label}</div>
                                        <div className="asal-bar-wrap">
                                            <div className="asal-bar" style={{ width: `${(item.value / asalMax) * 100}%` }}>
                                            </div>
                                            <span className="asal-val">{item.value.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                /* ===== Heroicon Utility Classes ===== */
                :global(.hi-icon) { width: 1rem; height: 1rem; display: inline-block; vertical-align: -0.15em; flex-shrink: 0; }
                :global(.hi-icon-sm) { width: 0.8rem; height: 0.8rem; display: inline-block; vertical-align: -0.1em; flex-shrink: 0; }
                :global(.hi-icon-lg) { width: 1.4rem; height: 1.4rem; display: inline-block; vertical-align: -0.2em; flex-shrink: 0; }
                :global(.pg-empty-state-icon) { width: 3rem; height: 3rem; color: #6ee7b7; margin-bottom: 0.5rem; }
                :global(.pg-search-icon) { position: absolute; left: 0.65rem; width: 1rem; height: 1rem; color: #94a3b8; pointer-events: none; }

                .insight-wrapper { min-height: calc(100vh - 80px); background: linear-gradient(180deg, #f0fdf4 0%, #f8fafc 40%); font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 1.5rem; }
                .download-bar { display: flex; justify-content: flex-end; padding: 0 0 0.75rem; }
                .insight-page { padding: 1.5rem; }

                /* ===== Step Guide ===== */
                .pg-guide {
                    display: flex; gap: 1rem; padding: 1rem 1.5rem;
                    background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
                    border-bottom: 1px solid #d1fae5;
                }
                .pg-guide-step {
                    display: flex; align-items: center; gap: 0.6rem;
                    font-size: 0.82rem; color: #065f46; font-weight: 500; flex: 1;
                }
                .pg-step-num {
                    width: 26px; height: 26px; border-radius: 50%;
                    background: linear-gradient(135deg, #064e3b, #059669);
                    color: #fff; font-size: 0.72rem; font-weight: 800;
                    display: grid; place-items: center; flex-shrink: 0;
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
                    background: linear-gradient(135deg, #064e3b, #059669);
                    color: #fff;
                    border: none; border-radius: 10px;
                    font-size: 0.8rem; font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(5,150,105,0.25);
                }
                .download-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(5,150,105,0.35); }
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
                .top-row > .card-total { flex: 0.7; }
                .top-row > .card-persen { flex: 1.3; }
                .bottom-row > .card { flex: 1; min-width: 0; }
                .card {
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .card-persen {
                    overflow: visible;
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
                .persen-body {
                    align-items: stretch;
                    justify-content: center;
                    padding: 0.5rem 0.5rem 0.35rem;
                    overflow: visible;
                }
                .persen-layout {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: flex-start;
                    gap: 0.5rem;
                    width: 100%;
                    flex-wrap: nowrap;
                }
                .persen-donut-col {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                    min-width: 0;
                }
                .persen-chart-wrap {
                    position: relative;
                    width: 100%;
                    max-width: 200px;
                    aspect-ratio: 1 / 1;
                }
                .persen-svg {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
                .persen-lbl {
                    position: absolute;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    white-space: nowrap;
                    z-index: 2;
                }
                .persen-lbl-text {
                    font-size: 0.55rem;
                    font-weight: 600;
                    color: #374151;
                    line-height: 1.15;
                    text-align: center;
                    display: block;
                }

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
                .hbar-bars { flex: 1; display: flex; flex-direction: column; gap: 2px; padding-right: 2.5rem; }
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
                    left: 100%;
                    margin-left: 4px;
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
                    border-radius: 20px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03);
                    margin-bottom: 1.5rem;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                .pg-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.75rem;
                    background: linear-gradient(135deg, #042f2e 0%, #064e3b 50%, #065f46 100%);
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }
                .pg-header-left { display: flex; flex-direction: column; gap: 0.2rem; }
                .pg-title {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: 0.3px;
                }
                .pg-subtitle {
                    margin: 0;
                    font-size: 0.78rem;
                    color: rgba(255,255,255,0.5);
                    font-weight: 400;
                }
                .pg-header-right {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    flex-wrap: wrap;
                }
                .pg-month-filter {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.75rem;
                    background: #f0fdf4;
                    border-bottom: 1px solid #d1fae5;
                }
                .pg-month-label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #064e3b;
                }
                .pg-month-select {
                    padding: 0.45rem 0.75rem;
                    border: 1.5px solid #d1fae5;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #064e3b;
                    background: #fff;
                    cursor: pointer;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .pg-month-select:focus {
                    border-color: #059669;
                    box-shadow: 0 0 0 3px rgba(5,150,105,0.08);
                }
                .pg-month-dash {
                    font-size: 1rem;
                    color: #94a3b8;
                    font-weight: 600;
                }
                .pg-upload-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.55rem 1.1rem;
                    background: rgba(255,255,255,0.12);
                    backdrop-filter: blur(8px);
                    color: #fff;
                    border-radius: 12px;
                    font-size: 0.82rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s;
                    border: 1px solid rgba(255,255,255,0.18);
                }
                .pg-upload-btn:hover {
                    background: rgba(255,255,255,0.22);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }
                .pg-upload-btn svg { width: 16px; height: 16px; }
                .pg-upload-btn-keluar {
                    background: rgba(16,185,129,0.25);
                    border-color: rgba(16,185,129,0.35);
                }
                .pg-upload-btn-keluar:hover {
                    background: rgba(16,185,129,0.4);
                }
                .pg-td-dash {
                    color: #cbd5e1;
                    font-weight: 400;
                }
                .pg-badge {
                    padding: 0.45rem 0.9rem;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    letter-spacing: 0.2px;
                }
                .pg-badge.green { background: #dcfce7; color: #166534; }
                .pg-badge.red { background: #fee2e2; color: #991b1b; }

                /* Tab Bar */
                .pg-tab-bar {
                    display: flex;
                    background: #f8faf9;
                    border-bottom: 2px solid #e2e8f0;
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
                .pg-tab:hover { color: #059669; background: #f0fdf4; }
                .pg-tab-active { color: #064e3b; border-bottom-color: #059669; background: #fff; }
                .pg-tab-content {
                    display: flex;
                    flex-direction: column;
                }
                .pg-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 1.25rem;
                    font-size: 0.82rem;
                    color: #64748b;
                    border-bottom: 1px solid #f0f5f3;
                    background: #fafdfb;
                    font-weight: 600;
                }
                .pg-filter-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.45rem 0.9rem;
                    background: #ecfdf5;
                    border: 1px solid #d1fae5;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #059669;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .pg-filter-toggle:hover { background: #d1fae5; }
                .pg-filter-panel {
                    padding: 0.75rem 1.25rem;
                    background: #f0fdf4;
                    border-bottom: 1px solid #d1fae5;
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
                    border-radius: 8px;
                    font-size: 0.82rem;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .pg-filter-chip:hover { background: #d1fae5; }
                .pg-filter-chip input[type="checkbox"] {
                    accent-color: #059669;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                }
                .pg-table-footer {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 0.75rem 1.25rem;
                    background: #f8faf9;
                    border-top: 2px solid #e2e8f0;
                    flex-wrap: wrap;
                }
                .pg-footer-stats {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.82rem;
                    color: #64748b;
                    align-items: center;
                }
                .pg-footer-stat {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .pg-footer-stat.green { color: #166534; }
                .pg-footer-stat.red { color: #991b1b; }
                .pg-footer-stat b { margin-left: 0.15rem; }
                .pg-footer-toggle {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.82rem;
                    padding: 0.4rem 0.75rem;
                    background: #fef9e7;
                    border: 1px solid #fde68a;
                    border-radius: 10px;
                    cursor: pointer;
                }
                .pg-footer-toggle input[type="checkbox"] {
                    accent-color: #059669;
                    width: 15px;
                    height: 15px;
                    cursor: pointer;
                }
                .pg-create-btn-sm {
                    margin-left: auto;
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #064e3b, #059669);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.3px;
                }
                .pg-create-btn-sm:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 14px rgba(5,150,105,0.3);
                    background: linear-gradient(135deg, #042f2e, #047857);
                }
                .pg-badge-sm {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.2rem 0.55rem;
                    border-radius: 8px;
                    font-size: 0.7rem;
                    font-weight: 700;
                }
                .pg-badge-sm.green { background: #dcfce7; color: #166534; }
                .pg-badge-sm.red { background: #fee2e2; color: #991b1b; }

                .pg-upload-btn-inline {
                    background: linear-gradient(135deg, #064e3b, #059669);
                    border: none;
                    color: #fff;
                }
                .pg-upload-btn-inline:hover {
                    background: linear-gradient(135deg, #042f2e, #047857);
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
                .pg-check-row:hover { background: #f0fdf4; }
                .pg-check-row input[type="checkbox"] {
                    accent-color: #059669;
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
                    border-bottom: 1px solid #f0f5f3;
                    background: #fafdfb;
                }
                .pg-table-scroll {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 500px;
                }
                .pg-table-scroll::-webkit-scrollbar { width: 6px; }
                .pg-table-scroll::-webkit-scrollbar-track { background: transparent; }
                .pg-table-scroll::-webkit-scrollbar-thumb { background: #a7f3d0; border-radius: 3px; }
                .pg-table { width: 100%; border-collapse: collapse; }
                .pg-table thead { position: sticky; top: 0; z-index: 1; }
                .pg-table th {
                    background: #f0fdf4;
                    padding: 0.7rem 1rem;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #059669;
                    text-align: left;
                    border-bottom: 2px solid #d1fae5;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                }
                .pg-table tbody tr { transition: background 0.1s; }
                .pg-table tbody tr:hover { background: #f0fdf4; }
                .pg-table tbody tr:nth-child(even) { background: #fafdfb; }
                .pg-table tbody tr:nth-child(even):hover { background: #ecfdf5; }
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
                    color: #064e3b;
                }
                .pg-td-group { min-width: 200px; }
                .pg-tag {
                    display: inline-block;
                    padding: 0.25rem 0.65rem;
                    border-radius: 6px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 0.2px;
                    white-space: normal;
                    word-break: break-word;
                    line-height: 1.4;
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
                    background: #f8faf9;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #0f172a;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .pg-modal-option:hover {
                    background: linear-gradient(135deg, #064e3b, #059669);
                    color: #fff;
                    border-color: #059669;
                    transform: translateX(4px);
                    box-shadow: 0 3px 12px rgba(5,150,105,0.2);
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
                    border-color: #059669;
                    box-shadow: 0 0 0 4px rgba(5,150,105,0.08);
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
                    background: linear-gradient(135deg, #064e3b, #059669);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .pg-btn-save:hover { box-shadow: 0 4px 14px rgba(5,150,105,0.3); transform: translateY(-1px); }
                .pg-btn-save:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
                .pg-empty { text-align: center; color: #94a3b8; font-size: 0.9rem; padding: 1.5rem; }
                .chart-empty {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 120px;
                    color: #94a3b8;
                    font-size: 0.88rem;
                    font-style: italic;
                    text-align: center;
                    padding: 2rem;
                }

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
                    background: linear-gradient(135deg, #064e3b, #059669);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .upload-notif-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 14px rgba(5,150,105,0.3);
                }
                .upload-notif-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
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

                /* ===== SIPEDE Manual Input Section ===== */
                .sipede-input-section {
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03);
                    margin-bottom: 1.5rem;
                    overflow: hidden;
                    border: 1px solid #e2e8f0;
                }
                .sipede-input-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.75rem;
                    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
                    cursor: pointer;
                    transition: opacity 0.2s;
                }
                .sipede-input-header:hover { opacity: 0.95; }
                .sipede-input-header-left { display: flex; flex-direction: column; gap: 0.2rem; }
                .sipede-input-title {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: 0.3px;
                }
                .sipede-input-subtitle {
                    margin: 0;
                    font-size: 0.78rem;
                    color: rgba(255,255,255,0.5);
                    font-weight: 400;
                }
                .sipede-input-toggle {
                    color: rgba(255,255,255,0.6);
                    font-size: 1rem;
                    transition: transform 0.2s;
                }
                .sipede-input-body {
                    padding: 1.5rem 1.75rem;
                }
                .sipede-input-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .sipede-field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }
                .sipede-field-label {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #475569;
                    letter-spacing: 0.2px;
                }
                .sipede-field-input {
                    width: 100%;
                    padding: 0.65rem 0.9rem;
                    border: 1.5px solid #e8e5f0;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    outline: none;
                    box-sizing: border-box;
                    transition: all 0.2s;
                    background: #faf9fd;
                    color: #1e1b4b;
                }
                .sipede-field-input:focus {
                    border-color: #7c3aed;
                    box-shadow: 0 0 0 4px rgba(124,58,237,0.08);
                    background: #fff;
                }
                .sipede-field-input::-webkit-inner-spin-button,
                .sipede-field-input::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                .sipede-field-input { -moz-appearance: textfield; }
                .sipede-input-footer {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-top: 1.25rem;
                    padding-top: 1rem;
                    border-top: 1px solid #f1f0f6;
                }
                .sipede-save-btn {
                    padding: 0.6rem 1.3rem;
                    background: linear-gradient(135deg, #1e1b4b, #7c3aed);
                    color: #fff;
                    border: none;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                    letter-spacing: 0.3px;
                }
                .sipede-save-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 14px rgba(124,58,237,0.3);
                    background: linear-gradient(135deg, #312e81, #6d28d9);
                }
                .sipede-saved-notif {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #16a34a;
                    animation: pgFadeIn 0.3s ease;
                }
                .donut-detail {
                    font-size: 0.58rem;
                    color: #94a3b8;
                    font-weight: 600;
                    margin-top: 0.1rem;
                }

                /* ===== Responsive ===== */
                @media (max-width: 1100px) {
                    .top-row { flex-direction: column; }
                    .bottom-row { flex-direction: column; }
                    .pg-tab { font-size: 0.72rem; padding: 0.7rem 0.75rem; gap: 0.3rem; }
                    .pg-filter-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
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
