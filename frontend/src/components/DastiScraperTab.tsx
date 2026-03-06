'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/dasti-api';
import type { ScraperStatus, DetectTableResponse } from '@/lib/dasti-api';
import ScraperStyles from './ScraperStyles';
import {
    ExclamationTriangleIcon,
    LightBulbIcon,
    ArrowPathIcon,
    ClockIcon,
    InboxArrowDownIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function DastiScraperTab() {
    // DASTI Login URL constant
    const DASTI_LOGIN_URL = 'https://dasti.kejaksaan.go.id';

    // Status state
    const [status, setStatus] = useState<ScraperStatus | null>(null);
    const [tableInfo, setTableInfo] = useState<DetectTableResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Scraping options
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(0);
    const [dataPageUrl, setDataPageUrl] = useState('');

    // Data state
    const [data, setData] = useState<Record<string, string>[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Current step
    const [step, setStep] = useState<'initial' | 'waiting-login' | 'navigating' | 'ready' | 'scraping' | 'done'>('initial');

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Show notification when scraping completes
    const showScrapingCompleteNotification = useCallback((dataCount: number, elapsedTime: number) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('✅ Scraping DASTI Selesai!', {
                body: `${dataCount.toLocaleString()} data berhasil di-scrape\nWaktu: ${elapsedTime} detik`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'dasti-scraping-complete',
                requireInteraction: false,
                silent: false
            });

            setTimeout(() => notification.close(), 10000);
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }, []);

    // Polling for status
    const pollStatus = useCallback(async () => {
        try {
            const result = await api.getStatus();
            if (result.success) {
                const prevStatus = status;
                setStatus(result.status);

                // Detect scraping completion
                if (prevStatus?.isRunning && !result.status.isRunning && result.status.dataCount > 0) {
                    showScrapingCompleteNotification(result.status.dataCount, result.status.elapsedTime || 0);
                }

                // Update step based on status
                if (!result.status.browserOpen) {
                    setStep('initial');
                } else if (result.status.isRunning) {
                    setStep('scraping');
                } else if (result.status.dataCount > 0) {
                    setStep('done');
                } else if (result.status.navigationLevel === 4 && tableInfo) {
                    setStep('ready');
                } else if (result.status.navigationLevel >= 2) {
                    setStep('navigating');
                } else if (result.status.browserOpen && !result.status.isLoggedIn) {
                    setStep('waiting-login');
                }
            }
        } catch (err) {
            console.error('Status poll error:', err);
        }
    }, [tableInfo, status, showScrapingCompleteNotification]);

    useEffect(() => {
        pollStatus();
        const interval = setInterval(pollStatus, 2000);
        return () => clearInterval(interval);
    }, [pollStatus]);

    // Open browser
    const handleOpenBrowser = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.openBrowser(DASTI_LOGIN_URL);
            if (result.success) {
                setStep('waiting-login');
            } else {
                setError(result.error || 'Failed to open browser');
            }
        } catch (err) {
            setError('Failed to connect to server. Pastikan backend DASTI berjalan di port 5002.');
        } finally {
            setIsLoading(false);
        }
    };

    // Check login
    const handleCheckLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.checkLogin();
            if (result.success && result.isLoggedIn) {
                setStep('navigating');
            } else {
                setError(result.error || 'Silakan login terlebih dahulu di browser DASTI');
            }
        } catch (err) {
            setError('Gagal memeriksa status login');
        } finally {
            setIsLoading(false);
        }
    };

    // Save session
    const handleSaveSession = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.saveSession();
            if (result.success) {
                alert('Session berhasil disimpan!');
            } else {
                setError(result.error || 'Gagal menyimpan session');
            }
        } catch (err) {
            setError('Gagal menyimpan session');
        } finally {
            setIsLoading(false);
        }
    };

    // Load session
    const handleLoadSession = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.loadSession();
            if (result.success) {
                alert('Session berhasil dimuat!');
                setStep('navigating');
            } else {
                setError(result.error || 'Gagal memuat session');
            }
        } catch (err) {
            setError('Gagal memuat session');
        } finally {
            setIsLoading(false);
        }
    };

    // Navigate to data URL
    const handleNavigateToDataUrl = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Set data URL first
            const setResult = await api.setDataUrl(dataPageUrl);
            if (!setResult.success) {
                setError(setResult.error || 'Gagal menyimpan URL');
                setIsLoading(false);
                return;
            }

            // Navigate to the URL
            const navResult = await api.navigateToData();
            if (!navResult.success) {
                setError(navResult.error || 'Gagal navigasi ke URL');
                setIsLoading(false);
                return;
            }

            // Wait a bit for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Auto-detect table
            const tableResult = await api.detectTable();
            if (tableResult.success && tableResult.tableInfo) {
                setTableInfo(tableResult);
                setStep('ready');
            } else {
                setError(tableResult.error || 'Tidak dapat mendeteksi tabel di URL tersebut');
            }
        } catch (err) {
            setError('Gagal navigasi ke URL data');
        } finally {
            setIsLoading(false);
        }
    };

    // Detect table
    const handleDetectTable = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.detectTable();
            if (result.success && result.tableInfo) {
                setTableInfo(result);
                setStep('ready');
            } else {
                setError(result.error || 'Tidak dapat mendeteksi tabel');
            }
        } catch (err) {
            setError('Gagal mendeteksi tabel');
        } finally {
            setIsLoading(false);
        }
    };

    // Start scraping
    const handleStartScraping = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.startScraping(startPage, endPage);
            if (result.success) {
                setStep('scraping');
            }
        } catch (err) {
            setError('Gagal memulai scraping');
        } finally {
            setIsLoading(false);
        }
    };

    // Stop scraping
    const handleStopScraping = async () => {
        await api.stopScraping();
    };

    // Close browser
    const handleCloseBrowser = async () => {
        await api.closeBrowser();
        await api.clearData();
        setStatus(null);
        setTableInfo(null);
        setData([]);
        setStep('initial');
    };

    // New scraping
    const handleNewScraping = async () => {
        setData([]);
        setTableInfo(null);
        setError('');
        setStep('navigating');
    };

    // Fetch data
    const fetchData = async (page: number = 1) => {
        setIsLoadingData(true);
        try {
            const result = await api.getData(page, 10, searchQuery);
            if (result.success) {
                setData(result.data);
                setCurrentPage(result.pagination.page);
                setTotalPages(result.pagination.totalPages);
            }
        } catch (err) {
            console.error('Fetch data error:', err);
        } finally {
            setIsLoadingData(false);
        }
    };

    // Search handler
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(1);
    };

    // Auto-fetch data when done
    useEffect(() => {
        if (step === 'done' && status && status.dataCount > 0) {
            fetchData(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, status?.dataCount]);

    return (
        <div className="scraper-tab">
            <div className="tab-header">
                <h2>DASTI Scraper</h2>
                <p>Scraping data dari sistem DASTI dengan login dan captcha handling</p>
                {status?.browserOpen && (
                    <button onClick={handleCloseBrowser} className="close-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        Tutup Browser
                    </button>
                )}
            </div>

            <div className="main-content">
                {/* Step Indicator */}
                <div className="step-indicator">
                    <div className={`step ${step === 'initial' ? 'active' : 'done'}`}>
                        <span className="step-num">1</span>
                        <span className="step-text">Buka Browser</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'waiting-login' ? 'active' : ['navigating', 'ready', 'scraping', 'done'].includes(step) ? 'done' : ''}`}>
                        <span className="step-num">2</span>
                        <span className="step-text">Login DASTI</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'navigating' ? 'active' : ['ready', 'scraping', 'done'].includes(step) ? 'done' : ''}`}>
                        <span className="step-num">3</span>
                        <span className="step-text">Navigasi ke Data</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'ready' ? 'active' : ['scraping', 'done'].includes(step) ? 'done' : ''}`}>
                        <span className="step-num">4</span>
                        <span className="step-text">Scraping</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'scraping' ? 'active' : step === 'done' ? 'done' : ''}`}>
                        <span className="step-num">5</span>
                        <span className="step-text">Selesai</span>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="error-box">
                        <ExclamationTriangleIcon className="w-5 h-5" /> {error}
                        <button onClick={() => setError('')}>×</button>
                    </div>
                )}

                {/* Step 1: Initial */}
                {step === 'initial' && (
                    <div className="card main-card">
                        <div className="card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                        </div>
                        <h2>Mulai Scraping DASTI</h2>
                        <p>Klik tombol untuk membuka browser dan login ke DASTI</p>

                        <button onClick={handleOpenBrowser} className="primary-btn" disabled={isLoading}>
                            {isLoading ? (
                                <><span className="spinner" /> Membuka browser...</>
                            ) : (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg> Open DASTI Login</>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 2: Waiting for Login */}
                {step === 'waiting-login' && (
                    <div className="card main-card">
                        <div className="card-icon pulse">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h2>Login ke DASTI</h2>
                        <p>Silakan login di browser yang terbuka:</p>
                        <ol className="instruction-list">
                            <li>Masukkan username dan password Anda</li>
                            <li>Selesaikan CAPTCHA jika ada</li>
                            <li>Klik tombol login</li>
                            <li>Klik tombol di bawah setelah berhasil login</li>
                        </ol>

                        {status?.captchaDetected && (
                            <div className="info-box">
                                <ShieldCheckIcon className="w-5 h-5 inline-block mr-1" /> Captcha terdeteksi! Selesaikan captcha secara manual.
                            </div>
                        )}

                        <div className="action-row">
                            <button onClick={handleCheckLogin} className="primary-btn" disabled={isLoading}>
                                {isLoading ? (
                                    <><span className="spinner" /> Memeriksa login...</>
                                ) : (
                                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Saya Sudah Login</>
                                )}
                            </button>
                            <button onClick={handleLoadSession} className="secondary-btn" disabled={isLoading}>
                                Load Session Lama
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Navigating */}
                {step === 'navigating' && (
                    <div className="card main-card">
                        <div className="card-icon success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2>Login Berhasil!</h2>
                        <p>Pilih salah satu cara untuk menuju halaman data tabel:</p>

                        <div className="navigation-options">
                            <div className="option-card">
                                <h3>📋 Opsi 1: Paste Link Langsung</h3>
                                <p>Paste URL halaman data tabel yang sudah Anda buka di browser</p>
                                <div className="max-pages-input">
                                    <label>URL Halaman Data Tabel:</label>
                                    <input
                                        type="text"
                                        value={dataPageUrl}
                                        onChange={(e) => setDataPageUrl(e.target.value)}
                                        placeholder="https://dasti.example.com/data/table"
                                    />
                                </div>
                                <button 
                                    onClick={handleNavigateToDataUrl} 
                                    className="primary-btn"
                                    disabled={isLoading || !dataPageUrl}
                                >
                                    {isLoading ? (
                                        <><span className="spinner" /> Navigasi...</>
                                    ) : (
                                        <>🔗 Navigasi ke URL</>
                                    )}
                                </button>
                            </div>

                            <div className="option-divider">ATAU</div>

                            <div className="option-card">
                                <h3>🖱️ Opsi 2: Navigasi Manual</h3>
                                <p>Navigasi manual di browser hingga halaman tabel data</p>
                                <div className="info-box">
                                    <LightBulbIcon className="w-5 h-5 inline-block mr-1" /> 
                                    Buka halaman tabel di browser, lalu klik "Deteksi Tabel"
                                </div>
                                <button onClick={handleDetectTable} className="secondary-btn" disabled={isLoading}>
                                    {isLoading ? (
                                        <><span className="spinner" /> Mendeteksi...</>
                                    ) : (
                                        <><MagnifyingGlassIcon className="w-5 h-5 inline-block" /> Deteksi Tabel</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="action-row" style={{ marginTop: '1rem' }}>
                            <button onClick={handleSaveSession} className="secondary-btn" disabled={isLoading}>
                                💾 Simpan Session
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Ready */}
                {step === 'ready' && (
                    <div className="card main-card">
                        <div className="card-icon success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2>Siap Scraping!</h2>

                        {tableInfo?.tableInfo && (
                            <>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <span className="stat-value">{tableInfo.tableInfo.pagination?.totalEntries || 0}</span>
                                        <span className="stat-label">Total Data</span>
                                    </div>
                                    <div className="stat-card">
                                        <span className="stat-value">{tableInfo.tableInfo.pagination?.totalPages || 1}</span>
                                        <span className="stat-label">Total Halaman</span>
                                    </div>
                                    <div className="stat-card">
                                        <span className="stat-value">{tableInfo.tableInfo.headers?.length || 0}</span>
                                        <span className="stat-label">Kolom</span>
                                    </div>
                                </div>

                                <div className="headers-preview">
                                    <span className="preview-label">Kolom yang akan diambil:</span>
                                    <div className="headers-list">
                                        {tableInfo.tableInfo.headers?.map((h, i) => (
                                            <span key={i} className="header-tag">{h || `Col ${i + 1}`}</span>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="max-pages-input">
                            <label>Halaman awal:</label>
                            <input
                                type="number"
                                min="1"
                                value={startPage}
                                onChange={(e) => setStartPage(parseInt(e.target.value) || 1)}
                            />
                        </div>

                        <div className="max-pages-input">
                            <label>Halaman akhir (0 = semua):</label>
                            <input
                                type="number"
                                min="0"
                                value={endPage}
                                onChange={(e) => setEndPage(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div className="action-row">
                            <button onClick={handleDetectTable} className="secondary-btn" disabled={isLoading}>
                                {isLoading ? <span className="spinner" /> : <ArrowPathIcon className="w-4 h-4 inline-block" />} Refresh Tabel
                            </button>
                            <button onClick={handleStartScraping} className="primary-btn success" disabled={isLoading || !tableInfo}>
                                {isLoading ? (
                                    <><span className="spinner" /> Memulai...</>
                                ) : (
                                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg> Mulai Scraping</>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Scraping */}
                {step === 'scraping' && (
                    <div className="card main-card">
                        <div className="card-icon pulse">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h2>Sedang Scraping...</h2>
                        <p>Jangan tutup browser. Scraper sedang mengambil data.</p>

                        {/* Progress */}
                        <div className="scraping-progress-section">
                            <div className="progress-header-row">
                                <span className="progress-label">Progress Scraping</span>
                                <span className="progress-percentage">
                                    {status?.tableInfo?.pagination?.totalPages && status.tableInfo.pagination.totalPages > 0
                                        ? Math.round((status.pagesScraped / status.tableInfo.pagination.totalPages) * 100)
                                        : 0}%
                                </span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${status?.tableInfo?.pagination?.totalPages && status.tableInfo.pagination.totalPages > 0
                                            ? (status.pagesScraped / status.tableInfo.pagination.totalPages) * 100
                                            : 0}%`
                                    }}
                                >
                                    <div className="progress-shine"></div>
                                </div>
                            </div>
                            <div className="progress-footer-row">
                                <span>Page {status?.pagesScraped || 0} / {status?.tableInfo?.pagination?.totalPages || '?'}</span>
                                <span>{status?.elapsedTime || 0}s elapsed</span>
                            </div>
                        </div>

                        <div className="progress-stats">
                            <div className="stat">
                                <span className="stat-value">{status?.currentPage || 0}</span>
                                <span className="stat-label">Halaman Saat Ini</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{status?.pagesScraped || 0}</span>
                                <span className="stat-label">Halaman Selesai</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value highlight">{status?.itemsScraped || 0}</span>
                                <span className="stat-label">Data</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{status?.elapsedTime || 0}s</span>
                                <span className="stat-label">Waktu</span>
                            </div>
                        </div>

                        <button onClick={handleStopScraping} className="secondary-btn">
                            Stop Scraping
                        </button>
                    </div>
                )}

                {/* Step 6: Done */}
                {step === 'done' && (
                    <div className="data-section">
                        <div className="summary-card">
                            <h3><CheckCircleIcon className="w-6 h-6 inline-block mr-1 text-green-500" /> Scraping Selesai!</h3>
                            <div className="summary-stats">
                                <div className="stat">
                                    <span className="stat-value">{status?.pagesScraped || 0}</span>
                                    <span className="stat-label">Halaman</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value highlight">{status?.dataCount || 0}</span>
                                    <span className="stat-label">Total Data</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{status?.elapsedTime || 0}s</span>
                                    <span className="stat-label">Waktu</span>
                                </div>
                            </div>
                            <button onClick={handleNewScraping} className="new-scrape-btn" disabled={isLoading}>
                                <ArrowPathIcon className="w-5 h-5" />
                                {isLoading ? 'Mempersiapkan...' : 'Scraping Baru'}
                            </button>
                        </div>

                        <div className="data-toolbar">
                            <form onSubmit={handleSearch} className="search-form">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari data..."
                                />
                                <button type="submit">
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </button>
                            </form>

                            <div className="export-buttons">
                                <a href={api.getExportCsvUrl()} download className="export-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    CSV
                                </a>
                                <a href={api.getExportExcelUrl()} download className="export-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Excel
                                </a>
                                <a href={api.getExportJsonUrl()} download className="export-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    JSON
                                </a>
                            </div>
                        </div>

                        {/* Data Table */}
                        {isLoadingData ? (
                            <div className="loading-state">
                                <span className="spinner" />
                                <p>Loading data...</p>
                            </div>
                        ) : data.length > 0 ? (
                            <>
                                <div className="data-table-container">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                {Object.keys(data[0]).map((key) => (
                                                    <th key={key}>{key}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((val, j) => (
                                                        <td key={j}>{val}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        <button
                                            onClick={() => fetchData(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Previous
                                        </button>
                                        <span>Page {currentPage} of {totalPages}</span>
                                        <button
                                            onClick={() => fetchData(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <p>Tidak ada data</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ScraperStyles />
            
            <style jsx>{`
                .navigation-options {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin: 1.5rem 0;
                }

                .option-card {
                    background: #f8faf9;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 1.5rem;
                }

                .option-card h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #064e3b;
                    margin-bottom: 0.5rem;
                }

                .option-card p {
                    font-size: 0.9rem;
                    color: #6b7280;
                    margin-bottom: 1rem;
                }

                .option-divider {
                    text-align: center;
                    font-weight: 600;
                    color: #9ca3af;
                    padding: 0.5rem 0;
                    position: relative;
                }

                .option-divider::before,
                .option-divider::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    width: 40%;
                    height: 1px;
                    background: #e5e7eb;
                }

                .option-divider::before {
                    left: 0;
                }

                .option-divider::after {
                    right: 0;
                }

                @media (max-width: 640px) {
                    .option-card {
                        padding: 1rem;
                    }

                    .option-card h3 {
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
}
