'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/spp-api';
import type { ScraperStatus, DetectTableResponse } from '@/lib/spp-api';
import ScraperStyles from './ScraperStyles';
import {
    ExclamationTriangleIcon,
    LightBulbIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    SignalIcon,
} from '@heroicons/react/24/outline';

export default function SppScraperTab() {
    // Status state
    const [status, setStatus] = useState<ScraperStatus | null>(null);
    const [tableInfo, setTableInfo] = useState<DetectTableResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Scraping options
    const [maxPages, setMaxPages] = useState(0);

    // Data state
    const [data, setData] = useState<Record<string, string>[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Current step
    const [step, setStep] = useState<'initial' | 'browser-open' | 'ready' | 'scraping' | 'done'>('initial');

    // Polling for status
    const pollStatus = useCallback(async () => {
        try {
            const result = await api.getStatus();
            if (result.success) {
                setStatus(result.data);

                if (!result.data.browserOpen) {
                    setStep('initial');
                } else if (result.data.isRunning) {
                    setStep('scraping');
                } else if (result.data.dataCount > 0) {
                    setStep('done');
                } else if (result.data.browserOpen && tableInfo) {
                    setStep('ready');
                } else if (result.data.browserOpen) {
                    setStep('browser-open');
                }
            }
        } catch (err) {
            console.error('Status poll error:', err);
        }
    }, [tableInfo]);

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
            const result = await api.openBrowser();
            if (result.success) {
                setStep('browser-open');
            } else {
                setError(result.message || 'Failed to open browser');
            }
        } catch (err) {
            setError('Failed to connect to server. Pastikan backend SPDP berjalan di port 5001.');
        } finally {
            setIsLoading(false);
        }
    };

    // Detect table
    const handleDetectTable = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Clear data lama sebelum deteksi ulang
            await api.clearData();
            setData([]);

            const result = await api.detectTable();
            if (result.success) {
                setTableInfo(result);
                setStep('ready');
            } else {
                setError(result.message || 'No table found on current page');
            }
        } catch (err) {
            setError('Failed to detect table');
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh - Deteksi ulang tabel
    const handleRefreshTable = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.clearData();
            setData([]);
            setTableInfo(null);

            const result = await api.detectTable();
            if (result.success) {
                setTableInfo(result);
                setStep('ready');
            } else {
                setError(result.message || 'No table found. Pastikan Anda berada di halaman data.');
            }
        } catch (err) {
            setError('Failed to refresh table');
        } finally {
            setIsLoading(false);
        }
    };

    // Kembali ke pilih data
    const handleChangeData = async () => {
        setIsLoading(true);
        try {
            await api.clearData();
            setData([]);
            setTableInfo(null);
            setStep('browser-open');
        } catch (err) {
            console.error('Error clearing data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Start scraping
    const handleStartScraping = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.startScraping(maxPages);
            if (result.success) {
                setStep('scraping');
            }
        } catch (err) {
            setError('Failed to start scraping');
        } finally {
            setIsLoading(false);
        }
    };

    // Close browser
    const handleCloseBrowser = async () => {
        await api.closeBrowser();
        setStatus(null);
        setTableInfo(null);
        setData([]);
        setStep('initial');
    };

    // Clear all scraped data
    const handleClearData = async () => {
        if (!confirm('Hapus semua data yang sudah di-scrape?')) return;
        setIsLoading(true);
        try {
            await api.clearData();
            setData([]);
            setStatus(prev => prev ? { ...prev, dataCount: 0, pagesScraped: 0, itemsScraped: 0 } : null);
            setStep('ready');
        } catch (err) {
            setError('Gagal menghapus data');
        } finally {
            setIsLoading(false);
        }
    };

    // Start new scraping session
    const handleNewScraping = async () => {
        setData([]);
        setTableInfo(null);
        setError('');
        
        // Re-detect table untuk memulai scraping baru
        setIsLoading(true);
        try {
            const result = await api.detectTable();
            if (result.success) {
                setTableInfo(result);
            }
            setStep('ready');
        } catch (err) {
            setError('Gagal mempersiapkan scraping baru');
        } finally {
            setIsLoading(false);
        }
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

    // Auto-fetch data when scraping is done
    useEffect(() => {
        if (step === 'done' && status && status.dataCount > 0) {
            fetchData(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, status?.dataCount]);

    return (
        <div className="scraper-tab spp-theme">
            <div className="tab-header">
                <h2>SPDP Scraper</h2>
                <p>Scraping data dari sistem SPDP (Surat Pemberitahuan Dimulainya Penyidikan)</p>
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
                    <div className={`step ${step === 'browser-open' ? 'active' : ['ready', 'scraping', 'done'].includes(step) ? 'done' : ''}`}>
                        <span className="step-num">2</span>
                        <span className="step-text">Login & Pilih Data</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'ready' ? 'active' : ['scraping', 'done'].includes(step) ? 'done' : ''}`}>
                        <span className="step-num">3</span>
                        <span className="step-text">Deteksi Tabel</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'scraping' ? 'active' : step === 'done' ? 'done' : ''}`}>
                        <span className="step-num">4</span>
                        <span className="step-text">Scraping</span>
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
                        <div className="card-icon spp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                        </div>
                        <h2>Mulai Scraping SPDP</h2>
                        <p>Klik tombol di bawah untuk membuka browser SPDP</p>
                        <div className="info-box">
                            <strong><SignalIcon className="w-4 h-4 inline-block mr-1" /> Catatan:</strong> Pastikan Anda terhubung ke jaringan LAN untuk mengakses SPDP
                        </div>
                        <button onClick={handleOpenBrowser} className="primary-btn spp" disabled={isLoading}>
                            {isLoading ? (
                                <><span className="spinner" /> Membuka browser...</>
                            ) : (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg> Buka Browser SPDP</>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 2: Browser Open */}
                {step === 'browser-open' && (
                    <div className="card main-card">
                        <div className="card-icon pulse spp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h2>Login & Pilih Data</h2>
                        <p>Di browser SPDP yang terbuka:</p>
                        <ol className="instruction-list">
                            <li>Login dengan username dan password Anda</li>
                            <li>Navigasi ke menu <strong>Surat Terkirim</strong> atau data yang diinginkan</li>
                            <li>URL: <code>http://10.35.0.101:4111/pidum/spdp/index</code></li>
                            <li>Pastikan TABEL DATA sudah muncul di halaman</li>
                            <li>Klik tombol di bawah setelah berada di halaman data</li>
                        </ol>

                        <div className="url-display">
                            <span className="url-label">URL saat ini:</span>
                            <span className="url-value">{status?.currentUrl || '-'}</span>
                        </div>

                        <button onClick={handleDetectTable} className="primary-btn spp" disabled={isLoading}>
                            {isLoading ? (
                                <><span className="spinner" /> Mendeteksi...</>
                            ) : (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Saya Sudah di Halaman Data</>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 3: Table Detected */}
                {step === 'ready' && tableInfo && (
                    <div className="card main-card">
                        <div className="card-icon success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2>Tabel Terdeteksi!</h2>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <span className="stat-value">{tableInfo.pagination?.totalEntries || 0}</span>
                                <span className="stat-label">Total Data</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{tableInfo.pagination?.totalPages || 1}</span>
                                <span className="stat-label">Total Halaman</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-value">{tableInfo.headers?.length || 0}</span>
                                <span className="stat-label">Kolom</span>
                            </div>
                        </div>

                        <div className="headers-preview">
                            <span className="preview-label">Kolom yang akan diambil:</span>
                            <div className="headers-list">
                                {tableInfo.headers?.map((h, i) => (
                                    <span key={i} className="header-tag">{h || `Col ${i + 1}`}</span>
                                ))}
                            </div>
                        </div>

                        <div className="max-pages-input">
                            <label>Maksimum halaman (0 = semua):</label>
                            <input
                                type="number"
                                min="0"
                                value={maxPages}
                                onChange={(e) => setMaxPages(parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div className="action-row">
                            <button onClick={handleChangeData} className="secondary-btn" disabled={isLoading}>
                                <ArrowPathIcon className="w-4 h-4 inline-block mr-1" /> Pilih Data Lain
                            </button>
                            <button onClick={handleRefreshTable} className="secondary-btn" disabled={isLoading}>
                                {isLoading ? <span className="spinner" /> : <ArrowPathIcon className="w-4 h-4 inline-block" />} Refresh Data
                            </button>
                            <button onClick={handleStartScraping} className="primary-btn success" disabled={isLoading}>
                                {isLoading ? (
                                    <><span className="spinner" /> Memulai...</>
                                ) : (
                                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg> Mulai Scraping</>
                                )}
                            </button>
                        </div>

                        <div className="info-box">
                            <LightBulbIcon className="w-5 h-5 inline-block mr-1" /> <strong>Tip:</strong> Jika Anda mengubah filter di website SPDP, klik "Refresh Data" untuk memperbarui informasi.
                        </div>
                    </div>
                )}

                {/* Step 4: Scraping */}
                {step === 'scraping' && (
                    <div className="card main-card">
                        <div className="card-icon pulse spp">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h2>Sedang Scraping...</h2>
                        <p>Jangan tutup browser. Scraper sedang mengambil data dari SPDP.</p>

                        {/* Progress Percentage */}
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
                                <span className="stat-value">{status?.pagesScraped || 0}</span>
                                <span className="stat-label">Halaman</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value highlight spp">{status?.itemsScraped || 0}</span>
                                <span className="stat-label">Data</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{status?.elapsedTime || 0}s</span>
                                <span className="stat-label">Waktu</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Done */}
                {step === 'done' && (
                    <div className="data-section">
                        <div className="summary-card spp">
                            <h3><CheckCircleIcon className="w-6 h-6 inline-block mr-1 text-green-500" /> Scraping SPDP Selesai!</h3>
                            <div className="summary-stats">
                                <div className="stat">
                                    <span className="stat-value">{status?.pagesScraped || 0}</span>
                                    <span className="stat-label">Halaman</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value highlight spp">{status?.dataCount || 0}</span>
                                    <span className="stat-label">Total Data</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{status?.elapsedTime || 0}s</span>
                                    <span className="stat-label">Waktu</span>
                                </div>
                            </div>
                            <button onClick={handleNewScraping} className="new-scrape-btn spp" disabled={isLoading}>
                                <ArrowPathIcon className="w-5 h-5" />
                                {isLoading ? 'Mempersiapkan...' : 'Scraping Data Baru'}
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
                                <button type="submit"><MagnifyingGlassIcon className="w-5 h-5" /></button>
                            </form>
                            <div className="export-buttons">
                                <a href={api.getExportExcelUrl()} download className="export-btn excel">Excel</a>
                                <a href={api.getExportCsvUrl()} download className="export-btn csv">CSV</a>
                                <a href={api.getExportJsonUrl()} download className="export-btn json">JSON</a>
                                <button onClick={handleClearData} className="export-btn clear" disabled={isLoading}>
                                    {isLoading ? 'Menghapus...' : 'Hapus Data'}
                                </button>
                            </div>
                        </div>

                        <div className="table-container">
                            {isLoadingData ? (
                                <div className="loading-state"><span className="spinner large" /></div>
                            ) : data.length === 0 ? (
                                <div className="empty-state"><p>Tidak ada data</p></div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            {Object.keys(data[0]).map((key, i) => (
                                                <th key={i}>{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Object.values(row).map((val, colIndex) => (
                                                    <td key={colIndex}>{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button onClick={() => fetchData(currentPage - 1)} disabled={currentPage <= 1} className="page-btn">← Prev</button>
                                <span className="page-info">Halaman {currentPage} dari {totalPages}</span>
                                <button onClick={() => fetchData(currentPage + 1)} disabled={currentPage >= totalPages} className="page-btn">Next →</button>
                            </div>
                        )}

                        <div className="action-buttons">
                            <button onClick={handleChangeData} className="secondary-btn" disabled={isLoading}>
                                <ArrowPathIcon className="w-4 h-4 inline-block mr-1" /> Scrape Data Lain
                            </button>
                            <button onClick={handleCloseBrowser} className="danger-btn">Selesai & Tutup Browser</button>
                        </div>
                    </div>
                )}
            </div>

            <ScraperStyles />
        </div>
    );
}
