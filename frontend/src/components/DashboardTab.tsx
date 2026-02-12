'use client';

import { useState, useEffect, useCallback } from 'react';
import * as sipedeApi from '@/lib/sipede-api';
import * as sppApi from '@/lib/spp-api';
import {
    ClipboardDocumentListIcon,
    ChartBarIcon,
    ExclamationTriangleIcon,
    BoltIcon,
    CheckIcon,
    ClockIcon,
    InboxArrowDownIcon,
    KeyIcon,
    LightBulbIcon,
    PlayCircleIcon,
    PauseCircleIcon,
    XMarkIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface SourceStats {
    name: string;
    icon: React.ReactNode;
    dataCount: number;
    pagesScraped: number;
    totalPages: number;
    browserOpen: boolean;
    isRunning: boolean;
    isLoggedIn: boolean;
    elapsedTime: number;
    error: string | null;
    exportCsvUrl: string;
    exportJsonUrl: string;
    exportExcelUrl: string;
    lastScrapedAt: string | null;
}

interface ServerStatus {
    name: string;
    url: string;
    isOnline: boolean;
    responseTime: number | null;
}

interface DashboardData {
    sources: SourceStats[];
    totalData: number;
    activeScrapers: number;
    servers: ServerStatus[];
}

interface ActivityLog {
    id: number;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    source: string;
    createdAt: string;
}

export default function DashboardTab() {
    const [data, setData] = useState<DashboardData>({
        sources: [],
        totalData: 0,
        activeScrapers: 0,
        servers: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    // Add activity log (now calls backend API)
    const addLog = useCallback(async (type: ActivityLog['type'], message: string, source: string) => {
        try {
            await sipedeApi.addActivityLog(type, message, source);
            // Refresh logs after adding
            fetchActivityLogs();
        } catch (error) {
            console.error('Failed to add log:', error);
        }
    }, []);

    // Fetch activity logs from backend
    const fetchActivityLogs = useCallback(async () => {
        try {
            const response = await sipedeApi.getActivityLogs(30);
            if (response.success) {
                setActivityLogs(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        }
    }, []);

    // Clear activity logs (calls backend API)
    const clearActivityLogs = useCallback(async () => {
        try {
            await sipedeApi.clearActivityLogs();
            setActivityLogs([]);
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    }, []);

    // Show notification
    const notify = useCallback((message: string) => {
        setNotificationMessage(message);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    }, []);

    const checkServerStatus = async (name: string, url: string): Promise<ServerStatus> => {
        const startTime = Date.now();
        try {
            const response = await fetch(`${url}/api/scraper/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            return {
                name,
                url,
                isOnline: response.ok,
                responseTime: Date.now() - startTime
            };
        } catch {
            return { name, url, isOnline: false, responseTime: null };
        }
    };

    const formatTime = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const formatTimeAgo = (dateString: string): string => {
        // Parse the date string - handle both ISO format and SQLite format
        let date: Date;
        
        // If the date string doesn't have timezone info, assume it's UTC
        if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
            // SQLite CURRENT_TIMESTAMP format: "YYYY-MM-DD HH:MM:SS"
            // Add 'Z' to indicate UTC
            date = new Date(dateString + 'Z');
        } else {
            date = new Date(dateString);
        }
        
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        
        if (seconds < 60) return 'Baru saja';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
        return `${Math.floor(seconds / 86400)} hari lalu`;
    };

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const sources: SourceStats[] = [];
            const [sipedeServer, sppServer] = await Promise.all([
                checkServerStatus('SIPEDE', process.env.NEXT_PUBLIC_SIPEDE_API_URL || 'http://localhost:5000'),
                checkServerStatus('SPDP', process.env.NEXT_PUBLIC_SPP_API_URL || 'http://localhost:5001')
            ]);

            // SIPEDE
            let sipedeLastScraped: string | null = null;
            try {
                if (sipedeServer.isOnline) {
                    const [status, dataInfo] = await Promise.all([
                        sipedeApi.getStatus(),
                        sipedeApi.getDataInfo()
                    ]);
                    if (dataInfo.success && dataInfo.scrapedAt) {
                        sipedeLastScraped = dataInfo.scrapedAt;
                    }
                    if (status.success) {
                        const prevSource = data.sources.find(s => s.name === 'SIPEDE');

                        // Log activity if status changed
                        if (prevSource) {
                            if (!prevSource.isRunning && status.data.isRunning) {
                                addLog('info', 'Scraping dimulai', 'SIPEDE');
                            } else if (prevSource.isRunning && !status.data.isRunning && status.data.dataCount > 0) {
                                addLog('success', `Scraping selesai - ${status.data.dataCount} data`, 'SIPEDE');
                            }
                        }

                        sources.push({
                            name: 'SIPEDE',
                            icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
                            dataCount: status.data.dataCount || 0,
                            pagesScraped: status.data.pagesScraped || 0,
                            totalPages: status.data.tableInfo?.pagination?.totalPages || 0,
                            browserOpen: status.data.browserOpen || false,
                            isRunning: status.data.isRunning || false,
                            isLoggedIn: status.data.isLoggedIn || false,
                            elapsedTime: status.data.elapsedTime || 0,
                            error: status.data.error || null,
                            exportCsvUrl: sipedeApi.getExportCsvUrl(),
                            exportJsonUrl: sipedeApi.getExportJsonUrl(),
                            exportExcelUrl: sipedeApi.getExportExcelUrl(),
                            lastScrapedAt: sipedeLastScraped
                        });
                    }
                } else {
                    sources.push({
                        name: 'SIPEDE', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, dataCount: 0, pagesScraped: 0, totalPages: 0,
                        browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0,
                        error: 'Server offline', exportCsvUrl: sipedeApi.getExportCsvUrl(),
                        exportJsonUrl: sipedeApi.getExportJsonUrl(), exportExcelUrl: sipedeApi.getExportExcelUrl(),
                        lastScrapedAt: null
                    });
                }
            } catch {
                sources.push({
                    name: 'SIPEDE', icon: <ClipboardDocumentListIcon className="w-5 h-5" />, dataCount: 0, pagesScraped: 0, totalPages: 0,
                    browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0,
                    error: 'Connection failed', exportCsvUrl: sipedeApi.getExportCsvUrl(),
                    exportJsonUrl: sipedeApi.getExportJsonUrl(), exportExcelUrl: sipedeApi.getExportExcelUrl(),
                    lastScrapedAt: null
                });
            }

            // SPDP
            let spdpLastScraped: string | null = null;
            try {
                if (sppServer.isOnline) {
                    const [status, dataInfo] = await Promise.all([
                        sppApi.getStatus(),
                        sppApi.getDataInfo()
                    ]);
                    if (dataInfo.success && dataInfo.scraped_at) {
                        spdpLastScraped = dataInfo.scraped_at;
                    }
                    if (status.success) {
                        const prevSource = data.sources.find(s => s.name === 'SPDP');

                        if (prevSource) {
                            if (!prevSource.isRunning && status.data.isRunning) {
                                addLog('info', 'Scraping dimulai', 'SPDP');
                            } else if (prevSource.isRunning && !status.data.isRunning && status.data.dataCount > 0) {
                                addLog('success', `Scraping selesai - ${status.data.dataCount} data`, 'SPDP');
                            }
                        }

                        sources.push({
                            name: 'SPDP',
                            icon: <ChartBarIcon className="w-5 h-5" />,
                            dataCount: status.data.dataCount || 0,
                            pagesScraped: status.data.pagesScraped || 0,
                            totalPages: status.data.tableInfo?.pagination?.totalPages || 0,
                            browserOpen: status.data.browserOpen || false,
                            isRunning: status.data.isRunning || false,
                            isLoggedIn: status.data.isLoggedIn || false,
                            elapsedTime: status.data.elapsedTime || 0,
                            error: null,
                            exportCsvUrl: sppApi.getExportCsvUrl(),
                            exportJsonUrl: sppApi.getExportJsonUrl(),
                            exportExcelUrl: sppApi.getExportExcelUrl(),
                            lastScrapedAt: spdpLastScraped
                        });
                    }
                } else {
                    sources.push({
                        name: 'SPDP', icon: <ChartBarIcon className="w-5 h-5" />, dataCount: 0, pagesScraped: 0, totalPages: 0,
                        browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0,
                        error: 'Server offline', exportCsvUrl: sppApi.getExportCsvUrl(),
                        exportJsonUrl: sppApi.getExportJsonUrl(), exportExcelUrl: sppApi.getExportExcelUrl(),
                        lastScrapedAt: null
                    });
                }
            } catch {
                sources.push({
                    name: 'SPDP', icon: <ChartBarIcon className="w-5 h-5" />, dataCount: 0, pagesScraped: 0, totalPages: 0,
                    browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0,
                    error: 'Connection failed', exportCsvUrl: sppApi.getExportCsvUrl(),
                    exportJsonUrl: sppApi.getExportJsonUrl(), exportExcelUrl: sppApi.getExportExcelUrl(),
                    lastScrapedAt: null
                });
            }

            setData({
                sources,
                totalData: sources.reduce((sum, s) => sum + s.dataCount, 0),
                activeScrapers: sources.filter(s => s.isRunning).length,
                servers: [sipedeServer, sppServer]
            });
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [data.sources, addLog]);

    useEffect(() => {
        fetchDashboardData();
        fetchActivityLogs(); // Fetch activity logs on mount
        let interval: NodeJS.Timeout | null = null;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchDashboardData();
                fetchActivityLogs();
            }, 3000);
        }
        return () => { if (interval) clearInterval(interval); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRefresh]);

    const handleExport = async (source: SourceStats, type: 'excel' | 'csv' | 'json') => {
        let url = source.exportJsonUrl;
        if (type === 'excel') url = source.exportExcelUrl;
        else if (type === 'csv') url = source.exportCsvUrl;

        window.open(url, '_blank');
        await addLog('success', `Data di-export ke ${type.toUpperCase()} (${source.dataCount.toLocaleString()} records)`, source.name);
        notify(`${source.name} berhasil di-export ke ${type.toUpperCase()}`);
    };

    const getStatus = (source: SourceStats): { text: string; class: string; icon: React.ReactNode } => {
        if (source.error) return { text: 'Error', class: 'error', icon: <ExclamationTriangleIcon className="w-4 h-4" /> };
        if (source.isRunning) return { text: 'Scraping', class: 'running', icon: <BoltIcon className="w-4 h-4" /> };
        if (source.browserOpen && source.isLoggedIn) return { text: 'Ready', class: 'ready', icon: <CheckIcon className="w-4 h-4" /> };
        if (source.browserOpen) return { text: 'Waiting Login', class: 'waiting', icon: <ClockIcon className="w-4 h-4" /> };
        if (source.dataCount > 0) return { text: 'Completed', class: 'completed', icon: <CheckIcon className="w-4 h-4" /> };
        return { text: 'Offline', class: 'offline', icon: <XMarkIcon className="w-4 h-4" /> };
    };

    const getLogIcon = (type: ActivityLog['type']): React.ReactNode => {
        switch (type) {
            case 'success': return <CheckIcon className="w-4 h-4" />;
            case 'error': return <XMarkIcon className="w-4 h-4" />;
            case 'warning': return <ExclamationTriangleIcon className="w-4 h-4" />;
            default: return <InformationCircleIcon className="w-4 h-4" />;
        }
    };

    // Generate dynamic tips based on current state
    const getDynamicTips = useCallback(() => {
        const tips: { icon: React.ReactNode; text: React.ReactNode; priority: number }[] = [];

        // Check for offline servers
        const offlineServers = data.servers.filter(s => !s.isOnline);
        if (offlineServers.length > 0) {
            tips.push({
                icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />,
                text: <>Server <strong>{offlineServers.map(s => s.name).join(', ')}</strong> offline. Pastikan backend berjalan.</>,
                priority: 1
            });
        }

        // Check for active scraping
        const activeSources = data.sources.filter(s => s.isRunning);
        if (activeSources.length > 0) {
            tips.push({
                icon: <BoltIcon className="w-5 h-5 text-blue-500" />,
                text: <>Scraping <strong>{activeSources.map(s => s.name).join(', ')}</strong> sedang berjalan. Jangan tutup browser.</>,
                priority: 2
            });
        }

        // Check for data ready to export
        const readyToExport = data.sources.filter(s => s.dataCount > 0 && !s.isRunning);
        if (readyToExport.length > 0) {
            const totalData = readyToExport.reduce((sum, s) => sum + s.dataCount, 0);
            tips.push({
                icon: <InboxArrowDownIcon className="w-5 h-5 text-green-500" />,
                text: <><strong>{totalData.toLocaleString()}</strong> data siap di-export ke Excel atau JSON</>,
                priority: 3
            });
        }

        // Check for waiting login
        const waitingLogin = data.sources.filter(s => s.browserOpen && !s.isLoggedIn && !s.isRunning);
        if (waitingLogin.length > 0) {
            tips.push({
                icon: <KeyIcon className="w-5 h-5 text-orange-500" />,
                text: <>Silakan login di browser <strong>{waitingLogin.map(s => s.name).join(', ')}</strong> yang terbuka</>,
                priority: 2
            });
        }

        // Default tips when no special conditions
        if (tips.length === 0) {
            tips.push({
                icon: <LightBulbIcon className="w-5 h-5 text-yellow-400" />,
                text: <>Klik tab <strong>SIPEDE</strong> atau <strong>SPDP</strong> untuk memulai scraping</>,
                priority: 10
            });
        }

        // Always show auto-refresh status tip
        tips.push({
            icon: autoRefresh ? <PlayCircleIcon className="w-5 h-5 text-green-500" /> : <PauseCircleIcon className="w-5 h-5 text-gray-400" />,
            text: autoRefresh
                ? <>Auto-refresh <strong>aktif</strong>. Data ter-update setiap 3 detik</>
                : <>Auto-refresh <strong>paused</strong>. Klik Resume untuk mengaktifkan</>,
            priority: 20
        });

        // Sort by priority and return top 3
        return tips.sort((a, b) => a.priority - b.priority).slice(0, 3);
    }, [data.servers, data.sources, autoRefresh]);

    return (
        <div className="dashboard">
            {/* Notification Toast */}
            {showNotification && (
                <div className="notification">
                    <CheckIcon className="w-5 h-5 notification-icon" />
                    {notificationMessage}
                </div>
            )}

            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>Dashboard</h1>
                    <p>Monitoring & kontrol web scraping</p>
                </div>
                <div className="header-right">
                    <div className="live-indicator">
                        <span className={`live-dot ${autoRefresh ? 'active' : ''}`}></span>
                        <span className="live-text">{autoRefresh ? 'LIVE' : 'PAUSED'}</span>
                    </div>
                    <button
                        className={`toggle-btn ${autoRefresh ? 'active' : ''}`}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? 'Pause' : 'Resume'}
                    </button>
                    <button
                        className="refresh-btn"
                        onClick={fetchDashboardData}
                        disabled={isLoading}
                    >
                        <svg className={isLoading ? 'spinning' : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="stats-row">
                <div className="stat-card primary">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.totalData.toLocaleString()}</span>
                        <span className="stat-label">Total Data</span>
                    </div>
                </div>
                <div className="stat-card accent">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.activeScrapers}</span>
                        <span className="stat-label">Aktif</span>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{data.servers.filter(s => s.isOnline).length}/{data.servers.length}</span>
                        <span className="stat-label">Server</span>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="stat-label">Update</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Scraping History Section - Full Width */}
                <div className="section scraping-history-section">
                    <div className="section-header">
                        <h2>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                            </svg>
                            Riwayat Scraping
                        </h2>
                        {activityLogs.length > 0 && (
                            <button className="clear-btn" onClick={clearActivityLogs}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Hapus Semua
                            </button>
                        )}
                    </div>
                    <div className="scraping-history-list">
                        {activityLogs.length > 0 ? (
                            activityLogs.map((log) => (
                                <div key={log.id} className={`history-item ${log.type}`}>
                                    <div className="history-icon">{getLogIcon(log.type)}</div>
                                    <div className="history-content">
                                        <div className="history-message">{log.message}</div>
                                        <div className="history-meta">
                                            <span className="history-source">{log.source}</span>
                                            <span className="history-time">{formatTimeAgo(log.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-history">
                                <span>Belum ada riwayat</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="right-column">
                    {/* Server Status */}
                    <div className="section server-section">
                        <div className="section-header">
                            <h2>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                                    <line x1="6" y1="6" x2="6.01" y2="6" />
                                    <line x1="6" y1="18" x2="6.01" y2="18" />
                                </svg>
                                Server Status
                            </h2>
                        </div>
                        <div className="server-list">
                            {data.servers.map((server) => (
                                <div key={server.name} className={`server-item ${server.isOnline ? 'online' : 'offline'}`}>
                                    <div className="server-info">
                                        <span className="server-dot"></span>
                                        <div>
                                            <span className="server-name">{server.name}</span>
                                            <span className="server-url">{server.url.replace('http://', '')}</span>
                                        </div>
                                    </div>
                                    <div className="server-status">
                                        {server.isOnline ? (
                                            <span className="response-time">{server.responseTime}ms</span>
                                        ) : (
                                            <span className="offline-text">Offline</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="section activity-section">
                        <div className="section-header">
                            <h2>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                Aktivitas
                            </h2>
                            {activityLogs.length > 0 && (
                                <button className="clear-btn" onClick={clearActivityLogs}>Clear</button>
                            )}
                        </div>
                        <div className="activity-list">
                            {activityLogs.length > 0 ? (
                                activityLogs.map((log) => (
                                    <div key={log.id} className={`activity-item ${log.type}`}>
                                        <span className="activity-icon">{getLogIcon(log.type)}</span>
                                        <div className="activity-content">
                                            <span className="activity-msg">{log.message}</span>
                                            <span className="activity-meta">{log.source} • {formatTimeAgo(log.createdAt)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-activity">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>Belum ada aktivitas</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Tips - Dynamic */}
            <div className="tips-section">
                {getDynamicTips().map((tip, index) => (
                    <div key={index} className="tip">
                        <span className="tip-icon">{tip.icon}</span>
                        <span>{tip.text}</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .dashboard {
                    padding: 1.5rem 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    position: relative;
                }

                /* Notification */
                .notification {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: linear-gradient(135deg, #064e3b, #065f46);
                    color: white;
                    padding: 0.875rem 1.25rem;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 10px 40px rgba(6, 78, 59, 0.3);
                    animation: slideIn 0.3s ease;
                    z-index: 1000;
                }

                .notification-icon {
                    width: 20px;
                    height: 20px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                /* Header */
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .header-left h1 {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #064e3b;
                    margin: 0;
                }

                .header-left p {
                    color: #64748b;
                    font-size: 0.875rem;
                    margin: 0;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .live-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.875rem;
                    background: #f0fdf4;
                    border-radius: 20px;
                }

                .live-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #cbd5e1;
                }

                .live-dot.active {
                    background: #10b981;
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                }

                .live-text {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #064e3b;
                    letter-spacing: 0.5px;
                }

                .toggle-btn {
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .toggle-btn:hover {
                    border-color: #10b981;
                    color: #064e3b;
                }

                .toggle-btn.active {
                    background: #f0fdf4;
                    border-color: #a7f3d0;
                    color: #064e3b;
                }

                .refresh-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .refresh-btn:hover {
                    background: #f0fdf4;
                    border-color: #10b981;
                }

                .refresh-btn:disabled { opacity: 0.5; }

                .refresh-btn svg {
                    width: 18px;
                    height: 18px;
                    color: #064e3b;
                }

                .refresh-btn svg.spinning {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin { to { transform: rotate(360deg); } }

                /* Stats Row */
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .stat-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 1.25rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    transition: all 0.2s;
                }

                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
                }

                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .stat-icon svg {
                    width: 24px;
                    height: 24px;
                    color: white;
                }

                .stat-card.primary .stat-icon { background: linear-gradient(135deg, #064e3b, #065f46); }
                .stat-card.accent .stat-icon { background: linear-gradient(135deg, #7c3aed, #a855f7); }
                .stat-card.success .stat-icon { background: linear-gradient(135deg, #059669, #10b981); }
                .stat-card.info .stat-icon { background: linear-gradient(135deg, #0284c7, #38bdf8); }

                .stat-content {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #1e293b;
                    line-height: 1;
                }

                .stat-label {
                    font-size: 0.75rem;
                    color: #64748b;
                    margin-top: 0.25rem;
                }

                /* Content Grid */
                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 360px;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }

                /* Sections */
                .section {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    overflow: hidden;
                }

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid #f1f5f9;
                }

                .section-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0;
                }

                .section-header h2 svg {
                    width: 18px;
                    height: 18px;
                    color: #064e3b;
                }

                .clear-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    font-size: 0.75rem;
                    font-weight: 500;
                    cursor: pointer;
                }

                /* Sources Grid */
                .sources-section {
                    min-height: 300px;
                }

                .sources-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1rem;
                    padding: 1.25rem;
                }

                .source-card {
                    background: #f8faf9;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 1.25rem;
                    transition: all 0.2s;
                }

                .source-card:hover {
                    border-color: #a7f3d0;
                }

                .source-card.running {
                    background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
                    border-color: #86efac;
                }

                .source-card.error {
                    background: #fef2f2;
                    border-color: #fecaca;
                }

                .source-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.75rem;
                }

                .source-identity {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .source-icon {
                    width: 42px;
                    height: 42px;
                    background: linear-gradient(135deg, #064e3b, #065f46);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                }

                .source-meta h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0 0 0.25rem 0;
                }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.2rem 0.625rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }

                .status-pill.offline { background: #f1f5f9; color: #64748b; }
                .status-pill.offline .status-dot { background: #94a3b8; }
                .status-pill.waiting { background: #fef3c7; color: #b45309; }
                .status-pill.waiting .status-dot { background: #f59e0b; }
                .status-pill.ready { background: #dbeafe; color: #1d4ed8; }
                .status-pill.ready .status-dot { background: #3b82f6; }
                .status-pill.running { background: #d1fae5; color: #047857; }
                .status-pill.running .status-dot { background: #10b981; animation: pulse 1s infinite; }
                .status-pill.completed { background: #d1fae5; color: #047857; }
                .status-pill.completed .status-dot { background: #10b981; }
                .status-pill.error { background: #fee2e2; color: #b91c1c; }
                .status-pill.error .status-dot { background: #ef4444; }

                /* Progress Ring */
                .progress-ring {
                    width: 36px;
                    height: 36px;
                }

                .progress-ring svg {
                    transform: rotate(-90deg);
                }

                .ring-bg {
                    fill: none;
                    stroke: #e2e8f0;
                    stroke-width: 3;
                }

                .ring-progress {
                    fill: none;
                    stroke: #10b981;
                    stroke-width: 3;
                    stroke-linecap: round;
                    animation: progress 1s ease-out;
                }

                @keyframes progress {
                    from { stroke-dasharray: 0, 100; }
                }

                /* Source Stats */
                .source-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.5rem;
                    padding: 0.75rem;
                    background: white;
                    border-radius: 10px;
                    margin-bottom: 0.75rem;
                    text-align: center;
                }

                .source-stat .stat-num {
                    display: block;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #064e3b;
                }

                .source-stat .stat-lbl {
                    font-size: 0.65rem;
                    color: #64748b;
                }

                /* Scraping Progress - Big Progress Bar */
                .scraping-progress {
                    background: white;
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 0.75rem;
                    border: 1px solid #a7f3d0;
                }

                .scraping-progress .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.75rem;
                }

                .scraping-progress .progress-info {
                    display: flex;
                    flex-direction: column;
                }

                .scraping-progress .progress-title {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #064e3b;
                    margin-bottom: 0.125rem;
                }

                .scraping-progress .progress-detail {
                    font-size: 0.7rem;
                    color: #64748b;
                }

                .scraping-progress .progress-percentage {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #064e3b;
                    line-height: 1;
                    font-family: 'SF Mono', 'Consolas', monospace;
                }

                .scraping-progress .progress-track {
                    height: 12px;
                    background: #e2e8f0;
                    border-radius: 6px;
                    overflow: hidden;
                    position: relative;
                    margin-bottom: 0.75rem;
                }

                .scraping-progress .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #064e3b, #059669, #10b981);
                    border-radius: 6px;
                    transition: width 0.5s ease-out;
                    position: relative;
                    overflow: hidden;
                    min-width: 0;
                }

                .scraping-progress .progress-shine {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        90deg,
                        transparent 0%,
                        rgba(255, 255, 255, 0.4) 50%,
                        transparent 100%
                    );
                    animation: shine 1.5s infinite;
                }

                @keyframes shine {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .scraping-progress .progress-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .scraping-progress .elapsed-time {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.7rem;
                    color: #64748b;
                }

                .scraping-progress .elapsed-time svg {
                    width: 12px;
                    height: 12px;
                }

                .scraping-progress .progress-status {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    font-size: 0.7rem;
                    color: #059669;
                    font-weight: 500;
                }

                .scraping-progress .pulse-dot {
                    width: 6px;
                    height: 6px;
                    background: #10b981;
                    border-radius: 50%;
                    animation: pulse-glow 1.5s infinite;
                }

                @keyframes pulse-glow {
                    0%, 100% { 
                        opacity: 1;
                        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6);
                    }
                    50% { 
                        opacity: 0.7;
                        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
                    }
                }

                /* Running Info */
                .running-info {
                    margin-bottom: 0.75rem;
                }

                .progress-bar-container {
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 0.375rem;
                }

                .progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #064e3b, #10b981);
                    border-radius: 3px;
                    transition: width 0.5s ease;
                }

                .progress-text {
                    font-size: 0.7rem;
                    color: #64748b;
                }

                /* Error Message */
                .error-msg {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: white;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    color: #dc2626;
                    margin-bottom: 0.75rem;
                }

                .error-msg svg {
                    width: 14px;
                    height: 14px;
                    flex-shrink: 0;
                }

                /* Source Actions */
                .source-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-btn {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.375rem;
                    padding: 0.5rem;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s;
                }

                .action-btn svg {
                    width: 14px;
                    height: 14px;
                }

                .action-btn.primary {
                    background: linear-gradient(135deg, #064e3b, #065f46);
                    color: white;
                }

                .action-btn.primary:hover {
                    box-shadow: 0 4px 12px rgba(6, 78, 59, 0.3);
                }

                .action-btn.secondary {
                    background: white;
                    color: #064e3b;
                    border: 1px solid #e2e8f0;
                }

                .action-btn.secondary:hover {
                    border-color: #10b981;
                }

                /* Right Column */
                .right-column {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                /* Server List */
                .server-list {
                    padding: 0.5rem;
                }

                .server-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    border-radius: 10px;
                    transition: background 0.2s;
                }

                .server-item:hover {
                    background: #f8faf9;
                }

                .server-info {
                    display: flex;
                    align-items: center;
                    gap: 0.625rem;
                }

                .server-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }

                .server-item.online .server-dot { 
                    background: #10b981;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
                }
                .server-item.offline .server-dot { background: #ef4444; }

                .server-name {
                    display: block;
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: #1e293b;
                }

                .server-url {
                    display: block;
                    font-size: 0.7rem;
                    color: #94a3b8;
                }

                .response-time {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #10b981;
                    background: #d1fae5;
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                }

                .offline-text {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #ef4444;
                }

                /* Activity List */
                .activity-list {
                    max-height: 240px;
                    overflow-y: auto;
                    padding: 0.5rem;
                }

                .activity-item {
                    display: flex;
                    gap: 0.625rem;
                    padding: 0.625rem;
                    border-radius: 8px;
                    margin-bottom: 0.25rem;
                    transition: background 0.2s;
                }

                .activity-item:hover {
                    background: #f8faf9;
                }

                .activity-icon {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.65rem;
                    flex-shrink: 0;
                }

                .activity-item.success .activity-icon { background: #d1fae5; color: #059669; }
                .activity-item.error .activity-icon { background: #fee2e2; color: #dc2626; }
                .activity-item.warning .activity-icon { background: #fef3c7; color: #d97706; }
                .activity-item.info .activity-icon { background: #dbeafe; color: #2563eb; }

                .activity-content {
                    flex: 1;
                    min-width: 0;
                }

                .activity-msg {
                    display: block;
                    font-size: 0.8rem;
                    color: #1e293b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .activity-meta {
                    font-size: 0.65rem;
                    color: #94a3b8;
                }

                .empty-activity {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    color: #94a3b8;
                    text-align: center;
                }

                .empty-activity svg {
                    width: 32px;
                    height: 32px;
                    margin-bottom: 0.5rem;
                    opacity: 0.4;
                }

                .empty-activity span {
                    font-size: 0.8rem;
                }

                /* Scraping History Section */
                .scraping-history-section {
                    background: linear-gradient(135deg, #ffffff 0%, #f8faf9 100%);
                }

                .scraping-history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 0.25rem;
                }

                .scraping-history-list::-webkit-scrollbar {
                    width: 6px;
                }

                .scraping-history-list::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 3px;
                }

                .scraping-history-list::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                }

                .history-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.875rem;
                    padding: 0.875rem 1rem;
                    background: linear-gradient(135deg, #ffffff 0%, #f8faf9 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
                }

                .history-item:hover {
                    background: linear-gradient(135deg, #f8faf9 0%, #f1f5f9 100%);
                    border-color: #cbd5e1;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                    transform: translateY(-1px);
                }

                .history-item.success {
                    border-left: 4px solid #10b981;
                    background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
                }

                .history-item.error {
                    border-left: 4px solid #ef4444;
                    background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
                }

                .history-item.warning {
                    border-left: 4px solid #f59e0b;
                    background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
                }

                .history-item.info {
                    border-left: 4px solid #3b82f6;
                    background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
                }

                .history-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    flex-shrink: 0;
                }

                .history-item.success .history-icon {
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    color: #059669;
                }

                .history-item.error .history-icon {
                    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                    color: #dc2626;
                }

                .history-item.warning .history-icon {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    color: #d97706;
                }

                .history-item.info .history-icon {
                    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                    color: #2563eb;
                }

                .history-content {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }

                .history-message {
                    font-size: 0.875rem;
                    color: #1e293b;
                    font-weight: 600;
                    line-height: 1.4;
                }

                .history-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.75rem;
                    color: #64748b;
                }

                .history-source {
                    font-weight: 600;
                    color: #047857;
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    padding: 0.125rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.7rem;
                }

                .history-time {
                    color: #94a3b8;
                    font-size: 0.75rem;
                }

                .history-time::before {
                    content: '•';
                    margin-right: 0.5rem;
                    color: #cbd5e1;
                }

                .empty-history {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2.5rem 2rem;
                    text-align: center;
                    color: #94a3b8;
                    background: linear-gradient(135deg, #f8faf9 0%, #f1f5f9 100%);
                    border-radius: 12px;
                    border: 2px dashed #e2e8f0;
                }

                .empty-history span {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #64748b;
                }

                .clear-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.75rem;
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    border-radius: 6px;
                    color: #dc2626;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .clear-btn:hover {
                    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                    border-color: rgba(239, 68, 68, 0.3);
                    transform: translateY(-1px);
                }

                .clear-btn svg {
                    width: 14px;
                    height: 14px;
                }

                /* Tips Section */
                .tips-section {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }

                .tip {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1rem;
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                }

                .tip-icon {
                    font-size: 1.25rem;
                }

                .tip span {
                    font-size: 0.8rem;
                    color: #64748b;
                    line-height: 1.5;
                }

                .tip strong {
                    color: #064e3b;
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .content-grid {
                        grid-template-columns: 1fr;
                    }

                    .right-column {
                        flex-direction: row;
                    }

                    .right-column > * {
                        flex: 1;
                    }
                }

                @media (max-width: 768px) {
                    .dashboard {
                        padding: 1rem;
                    }

                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }

                    .header-right {
                        width: 100%;
                        justify-content: space-between;
                    }

                    .stats-row {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .right-column {
                        flex-direction: column;
                    }

                    .tips-section {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
