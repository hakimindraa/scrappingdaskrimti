'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '@/lib/sipede-api';
import type { ScraperStatus, DetectTableResponse } from '@/lib/sipede-api';
import ScraperStyles from './ScraperStyles';

export default function SipedeScraperTab() {
    // Status state
    const [status, setStatus] = useState<ScraperStatus | null>(null);
    const [tableInfo, setTableInfo] = useState<DetectTableResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Year filter state - default years from SIPEDE (2022-2026)
    const defaultYears = ['2026', '2025', '2024', '2023', '2022'];
    const [availableYears, setAvailableYears] = useState<string[]>(defaultYears);
    const [selectedYear, setSelectedYear] = useState<string>('2026');

    // Scraping options
    const [maxPages, setMaxPages] = useState(0);

    // Data state
    const [data, setData] = useState<Record<string, string>[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Current step: initial -> waiting-login -> ready -> scraping -> done
    const [step, setStep] = useState<'initial' | 'waiting-login' | 'ready' | 'scraping' | 'done'>('initial');

    // Polling for status
    const pollStatus = useCallback(async () => {
        try {
            const result = await api.getStatus();
            if (result.success) {
                setStatus(result.data);

                // Update years from status if available, otherwise keep defaults
                if (result.data.availableYears && result.data.availableYears.length > 0) {
                    setAvailableYears(result.data.availableYears);
                }
                if (result.data.selectedYear && !selectedYear) {
                    setSelectedYear(result.data.selectedYear);
                }

                if (!result.data.browserOpen) {
                    setStep('initial');
                } else if (result.data.isRunning) {
                    setStep('scraping');
                } else if (result.data.dataCount > 0) {
                    setStep('done');
                } else if (result.data.browserOpen && result.data.isLoggedIn && tableInfo) {
                    setStep('ready');
                } else if (result.data.browserOpen && !result.data.isLoggedIn) {
                    setStep('waiting-login');
                } else if (result.data.browserOpen && result.data.isLoggedIn) {
                    // Logged in but no table info yet, auto-detect
                    setStep('ready');
                }
            }
        } catch (err) {
            console.error('Status poll error:', err);
        }
    }, [tableInfo, selectedYear]);

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
                setStep('waiting-login');
            } else {
                setError(result.message || 'Failed to open browser');
            }
        } catch (err) {
            setError('Failed to connect to server. Pastikan backend SIPEDE berjalan di port 5000.');
        } finally {
            setIsLoading(false);
        }
    };

    // Check login and navigate to data page
    const handleCheckLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            const result = await api.checkLoginAndNavigate();
            if (result.success && result.isLoggedIn) {
                // Update years from API if available, otherwise keep defaults
                if (result.availableYears && result.availableYears.length > 0) {
                    setAvailableYears(result.availableYears);
                }
                if (result.selectedYear) {
                    setSelectedYear(result.selectedYear);
                }
                
                // Auto-detect table after navigation
                const tableResult = await api.detectTable();
                if (tableResult.success) {
                    setTableInfo(tableResult);
                }
                
                setStep('ready');
            } else {
                setError(result.message || 'Silakan login terlebih dahulu di browser SIPEDE');
            }
        } catch (err) {
            setError('Gagal memeriksa status login');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle year change
    const handleYearChange = async (year: string) => {
        if (!year || year === selectedYear) return;
        
        setIsLoading(true);
        setError('');
        try {
            const result = await api.changeYear(year);
            if (result.success) {
                setSelectedYear(year);
                setData([]);
                setTableInfo(null);
                
                // Re-detect table after year change
                await new Promise(resolve => setTimeout(resolve, 1500));
                const tableResult = await api.detectTable();
                if (tableResult.success) {
                    setTableInfo(tableResult);
                }
            } else {
                setError(result.message || 'Gagal mengubah tahun');
            }
        } catch (err) {
            setError('Gagal mengubah filter tahun');
        } finally {
            setIsLoading(false);
        }
    };

    // Refresh table detection
    const handleRefreshTable = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.clearData();
            setData([]);
            
            const result = await api.detectTable();
            if (result.success) {
                setTableInfo(result);
                setStep('ready');
            } else {
                setError(result.message || 'Tidak dapat mendeteksi tabel');
            }
        } catch (err) {
            setError('Gagal refresh tabel');
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
            setError('Gagal memulai scraping');
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
        setAvailableYears(defaultYears);
        setSelectedYear('2026');
        setStep('initial');
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
        <div className="scraper-tab">
            <div className="tab-header">
                <h2>SIPEDE Scraper</h2>
                <p>Scraping data Surat Terkirim dari sistem SIPEDE Kejaksaan</p>
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
                    <div className={`step ${step === 'waiting-login' ? 'active' : ['ready', 'scraping', 'done'].includes(step) ? 'done' : ''}`}>
                        <span className="step-num">2</span>
                        <span className="step-text">Login SIPEDE</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'ready' ? 'active' : ['scraping', 'done'].includes(step) ? 'done' : ''}`}>
                        <span className="step-num">3</span>
                        <span className="step-text">Pilih Tahun & Scrape</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'scraping' ? 'active' : step === 'done' ? 'done' : ''}`}>
                        <span className="step-num">4</span>
                        <span className="step-text">Selesai</span>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="error-box">
                        <span>⚠️</span> {error}
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
                        <h2>Mulai Scraping SIPEDE</h2>
                        <p>Klik tombol di bawah untuk membuka browser dan login ke SIPEDE</p>
                        <button onClick={handleOpenBrowser} className="primary-btn" disabled={isLoading}>
                            {isLoading ? (
                                <><span className="spinner" /> Membuka browser...</>
                            ) : (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg> Buka Browser SIPEDE</>
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
                        <h2>Login ke SIPEDE</h2>
                        <p>Silakan login di browser yang terbuka:</p>
                        <ol className="instruction-list">
                            <li>Masukkan username dan password Anda</li>
                            <li>Selesaikan CAPTCHA jika ada</li>
                            <li>Klik tombol di bawah setelah berhasil login</li>
                        </ol>

                        <div className="info-box">
                            💡 Setelah login, sistem akan otomatis mengarahkan ke halaman <strong>Surat Terkirim</strong>
                        </div>

                        <button onClick={handleCheckLogin} className="primary-btn" disabled={isLoading}>
                            {isLoading ? (
                                <><span className="spinner" /> Memeriksa login...</>
                            ) : (
                                <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg> Saya Sudah Login</>
                            )}
                        </button>
                    </div>
                )}

                {/* Step 3: Ready - Year Selection & Scraping */}
                {step === 'ready' && (
                    <div className="card main-card">
                        <div className="card-icon success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2>Siap Scraping!</h2>

                        {/* Year Filter Dropdown - Always show since we have default years */}
                        <div className="year-filter-section">
                            <label className="year-filter-label">📅 Pilih Tahun Data:</label>
                            <select 
                                className="year-select"
                                    value={selectedYear}
                                    onChange={(e) => handleYearChange(e.target.value)}
                                    disabled={isLoading}
                                >
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                        {tableInfo && (
                            <>
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
                            </>
                        )}

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
                            <button onClick={handleRefreshTable} className="secondary-btn" disabled={isLoading}>
                                {isLoading ? <span className="spinner" /> : '🔃'} Refresh Data
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

                {/* Step 4: Scraping */}
                {step === 'scraping' && (
                    <div className="card main-card">
                        <div className="card-icon pulse">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <h2>Sedang Scraping...</h2>
                        <p>Jangan tutup browser. Scraper sedang mengambil data {selectedYear ? `tahun ${selectedYear}` : ''}.</p>

                        <div className="progress-stats">
                            <div className="stat">
                                <span className="stat-value">{status?.pagesScraped || 0}</span>
                                <span className="stat-label">Halaman</span>
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

                        <div className="progress-bar-container">
                            <div className="progress-bar indeterminate" />
                        </div>
                    </div>
                )}

                {/* Step 5: Done */}
                {step === 'done' && (
                    <div className="data-section">
                        <div className="summary-card">
                            <h3>✅ Scraping Selesai!</h3>
                            {selectedYear && <p className="year-info">Data Tahun: {selectedYear}</p>}
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
                        </div>

                        <div className="data-toolbar">
                            <form onSubmit={handleSearch} className="search-form">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari data..."
                                />
                                <button type="submit">🔍</button>
                            </form>
                            <div className="export-buttons">
                                <a href={api.getExportCsvUrl()} download className="export-btn csv">CSV</a>
                                <a href={api.getExportJsonUrl()} download className="export-btn json">JSON</a>
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
                            {availableYears.length > 0 && (
                                <div className="year-filter-inline">
                                    <label>Scrape tahun lain:</label>
                                    <select 
                                        className="year-select-inline"
                                        value=""
                                        onChange={async (e) => {
                                            if (e.target.value) {
                                                await handleYearChange(e.target.value);
                                                setData([]);
                                                setTableInfo(null);
                                                setStep('ready');
                                            }
                                        }}
                                    >
                                        <option value="">Pilih tahun...</option>
                                        {availableYears.filter(y => y !== selectedYear).map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button onClick={handleCloseBrowser} className="danger-btn">Selesai & Tutup Browser</button>
                        </div>
                    </div>
                )}
            </div>

            <ScraperStyles />
        </div>
    );
}
