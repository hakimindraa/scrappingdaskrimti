'use client';

import { useState, useEffect, useCallback } from 'react';
import * as sipedeApi from '@/lib/sipede-api';
import * as sppApi from '@/lib/spp-api';
import * as dastiApi from '@/lib/dasti-api';

interface SourceStats {
    name: string;
    dataCount: number;
    pagesScraped: number;
    totalPages: number;
    browserOpen: boolean;
    isRunning: boolean;
    isLoggedIn: boolean;
    elapsedTime: number;
    error: string | null;
    lastScrapedAt: string | null;
}

interface ServerStatus {
    name: string;
    url: string;
    isOnline: boolean;
    responseTime: number | null;
}

interface HomeTabProps {
    onNavigate?: (tab: string) => void;
}

export default function HomeTab({ onNavigate }: HomeTabProps) {
    const [sources, setSources] = useState<SourceStats[]>([]);
    const [servers, setServers] = useState<ServerStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const checkServerStatus = async (name: string, url: string): Promise<ServerStatus> => {
        const startTime = Date.now();
        try {
            const response = await fetch(`${url}/api/scraper/status`, { method: 'GET', signal: AbortSignal.timeout(5000) });
            return { name, url, isOnline: response.ok, responseTime: Date.now() - startTime };
        } catch {
            return { name, url, isOnline: false, responseTime: null };
        }
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const srcArray: SourceStats[] = [];
            const [sipedeServer, sppServer, dastiServer] = await Promise.all([
                checkServerStatus('SIPEDE', process.env.NEXT_PUBLIC_SIPEDE_API_URL || 'http://localhost:5000'),
                checkServerStatus('SPDP', process.env.NEXT_PUBLIC_SPP_API_URL || 'http://localhost:5001'),
                checkServerStatus('DASTI', process.env.NEXT_PUBLIC_DASTI_API_URL || 'http://localhost:5002')
            ]);

            // SIPEDE
            try {
                if (sipedeServer.isOnline) {
                    const [status, dataInfo] = await Promise.all([sipedeApi.getStatus(), sipedeApi.getDataInfo()]);
                    let lastScraped: string | null = null;
                    if (dataInfo.success && dataInfo.scrapedAt) lastScraped = dataInfo.scrapedAt;
                    if (status.success) {
                        srcArray.push({ name: 'SIPEDE', dataCount: status.data.dataCount || 0, pagesScraped: status.data.pagesScraped || 0, totalPages: status.data.tableInfo?.pagination?.totalPages || 0, browserOpen: status.data.browserOpen || false, isRunning: status.data.isRunning || false, isLoggedIn: status.data.isLoggedIn || false, elapsedTime: status.data.elapsedTime || 0, error: status.data.error || null, lastScrapedAt: lastScraped });
                    }
                } else {
                    srcArray.push({ name: 'SIPEDE', dataCount: 0, pagesScraped: 0, totalPages: 0, browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0, error: 'Server offline', lastScrapedAt: null });
                }
            } catch {
                srcArray.push({ name: 'SIPEDE', dataCount: 0, pagesScraped: 0, totalPages: 0, browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0, error: 'Connection failed', lastScrapedAt: null });
            }

            // SPDP
            try {
                if (sppServer.isOnline) {
                    const [status, dataInfo] = await Promise.all([sppApi.getStatus(), sppApi.getDataInfo()]);
                    let lastScraped: string | null = null;
                    if (dataInfo.success && dataInfo.scraped_at) lastScraped = dataInfo.scraped_at;
                    if (status.success) {
                        srcArray.push({ name: 'SPDP', dataCount: status.data.dataCount || 0, pagesScraped: status.data.pagesScraped || 0, totalPages: status.data.tableInfo?.pagination?.totalPages || 0, browserOpen: status.data.browserOpen || false, isRunning: status.data.isRunning || false, isLoggedIn: status.data.isLoggedIn || false, elapsedTime: status.data.elapsedTime || 0, error: null, lastScrapedAt: lastScraped });
                    }
                } else {
                    srcArray.push({ name: 'SPDP', dataCount: 0, pagesScraped: 0, totalPages: 0, browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0, error: 'Server offline', lastScrapedAt: null });
                }
            } catch {
                srcArray.push({ name: 'SPDP', dataCount: 0, pagesScraped: 0, totalPages: 0, browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0, error: 'Connection failed', lastScrapedAt: null });
            }

            // DASTI
            try {
                if (dastiServer.isOnline) {
                    const status = await dastiApi.getStatus();
                    if (status.success) {
                        srcArray.push({ name: 'DASTI', dataCount: status.status.dataCount || 0, pagesScraped: status.status.pagesScraped || 0, totalPages: status.status.tableInfo?.pagination?.totalPages || 0, browserOpen: status.status.browserOpen || false, isRunning: status.status.isRunning || false, isLoggedIn: status.status.isLoggedIn || false, elapsedTime: status.status.elapsedTime || 0, error: status.status.error || null, lastScrapedAt: null });
                    }
                } else {
                    srcArray.push({ name: 'DASTI', dataCount: 0, pagesScraped: 0, totalPages: 0, browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0, error: 'Server offline', lastScrapedAt: null });
                }
            } catch {
                srcArray.push({ name: 'DASTI', dataCount: 0, pagesScraped: 0, totalPages: 0, browserOpen: false, isRunning: false, isLoggedIn: false, elapsedTime: 0, error: 'Connection failed', lastScrapedAt: null });
            }

            setSources(srcArray);
            setServers([sipedeServer, sppServer, dastiServer]);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Home fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        let interval: NodeJS.Timeout | null = null;
        if (autoRefresh) { interval = setInterval(fetchData, 5000); }
        return () => { if (interval) clearInterval(interval); };
    }, [autoRefresh, fetchData]);

    const totalData = sources.reduce((sum, s) => sum + s.dataCount, 0);
    const activeScrapers = sources.filter(s => s.isRunning).length;
    const onlineServers = servers.filter(s => s.isOnline).length;

    const getSourceStatus = (s: SourceStats) => {
        if (s.error) return { text: 'Offline', icon: '⚠', color: '#ef4444' };
        if (s.isRunning) return { text: 'Scraping...', icon: '⚡', color: '#10b981' };
        if (s.browserOpen && s.isLoggedIn) return { text: 'Ready', icon: '✓', color: '#0ea5e9' };
        if (s.browserOpen) return { text: 'Login', icon: '🔑', color: '#f59e0b' };
        if (s.dataCount > 0) return { text: 'Done', icon: '✓', color: '#10b981' };
        return { text: 'Standby', icon: '●', color: '#94a3b8' };
    };

    return (
        <div className="home">
            {/* ─── Hero Banner ─── */}
            <section className="hero">
                <div className="hero-bg-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                </div>
                <div className="hero-inner">
                    <div className="hero-left">
                        <h1>Selamat Datang di <span>Dasta</span></h1>
                        <p>Pusat monitoring & kontrol web scraping</p>
                    </div>
                    <div className="hero-right">
                        <div className="clock">
                            <span className="clock-time">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            <span className="clock-date">{currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="hero-actions">
                            <button className={`pill ${autoRefresh ? 'live' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)}>
                                <span className="pill-dot"></span>
                                {autoRefresh ? 'LIVE' : 'PAUSED'}
                            </button>
                            <button className={`icon-btn ${isLoading ? 'spin' : ''}`} onClick={fetchData} disabled={isLoading} aria-label="Refresh">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Quick Stats ─── */}
            <section className="stats">
                <div className="stat green">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    </div>
                    <div className="stat-body">
                        <h2>{totalData.toLocaleString()}</h2>
                        <p>Total Data</p>
                    </div>
                </div>
                <div className="stat purple">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    </div>
                    <div className="stat-body">
                        <h2>{activeScrapers}</h2>
                        <p>Aktif</p>
                    </div>
                </div>
                <div className="stat teal">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><circle cx="6" cy="6" r="1" /><circle cx="6" cy="18" r="1" /></svg>
                    </div>
                    <div className="stat-body">
                        <h2>{onlineServers}<span className="stat-dim">/{servers.length}</span></h2>
                        <p>Server</p>
                    </div>
                </div>
                <div className="stat blue">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div className="stat-body">
                        <h2>{lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</h2>
                        <p>Update</p>
                    </div>
                </div>
            </section>

            {/* ─── Main Content ─── */}
            <section className="grid">
                {/* Scraper Cards */}
                <div className="col-main">
                    {sources.map(source => {
                        const st = getSourceStatus(source);
                        const isSipede = source.name === 'SIPEDE';
                        const isDasti = source.name === 'DASTI';
                        const avatarClass = isSipede ? 'av-green' : isDasti ? 'av-orange' : 'av-blue';
                        const navTarget = isSipede ? 'sipede' : isDasti ? 'dasti' : 'spp';
                        const workspaceTarget = isSipede ? 'workspace-sipede' : 'workspace-spdp';
                        
                        return (
                            <article key={source.name} className={`scraper-card ${source.isRunning ? 'active' : ''}`}>
                                <div className="sc-top">
                                    <div className={`sc-avatar ${avatarClass}`}>
                                        {isSipede ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                                        ) : isDasti ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                                        )}
                                    </div>
                                    <div className="sc-info">
                                        <h3>{source.name}</h3>
                                        <span className="sc-badge" style={{ color: st.color, background: `${st.color}18` }}>
                                            <span className="sc-badge-dot" style={{ background: st.color }}></span>
                                            {st.text}
                                        </span>
                                    </div>
                                    {source.isRunning && (
                                        <div className="sc-spinner">
                                            <svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="90 150" strokeLinecap="round" /></svg>
                                        </div>
                                    )}
                                </div>

                                <div className="sc-metrics">
                                    <div className="sc-m">
                                        <span className="sc-m-val">{source.dataCount.toLocaleString()}</span>
                                        <span className="sc-m-lbl">Data</span>
                                    </div>
                                    <div className="sc-m">
                                        <span className="sc-m-val">{source.pagesScraped}<span className="sc-m-dim">/{source.totalPages || '—'}</span></span>
                                        <span className="sc-m-lbl">Halaman</span>
                                    </div>
                                </div>

                                <div className="sc-btns">
                                    <button className="btn-primary" onClick={() => onNavigate?.(navTarget)}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                        Buka Scraper
                                    </button>
                                    {!isDasti && (
                                        <button className="btn-ghost" onClick={() => onNavigate?.(workspaceTarget)}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                                            Workspace
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Sidebar */}
                <aside className="col-side">
                    {/* Server Health */}
                    <div className="card">
                        <div className="card-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><circle cx="6" cy="6" r="1" /><circle cx="6" cy="18" r="1" /></svg>
                            Server
                        </div>
                        {servers.map(sv => (
                            <div key={sv.name} className="sv-row">
                                <div className="sv-left">
                                    <span className={`sv-dot ${sv.isOnline ? 'on' : 'off'}`}></span>
                                    <div>
                                        <span className="sv-name">{sv.name}</span>
                                        <span className="sv-url">{sv.url.replace('http://', '')}</span>
                                    </div>
                                </div>
                                {sv.isOnline ? (
                                    <span className="sv-ms">{sv.responseTime}ms</span>
                                ) : (
                                    <span className="sv-off">Offline</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick Navigate */}
                    <div className="card">
                        <div className="card-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            Navigasi
                        </div>
                        <div className="nav-grid">
                            <button className="nav-item" onClick={() => onNavigate?.('sipede')}>
                                <div className="ni-icon g">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                                </div>
                                SIPEDE
                            </button>
                            <button className="nav-item" onClick={() => onNavigate?.('spp')}>
                                <div className="ni-icon b">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                                </div>
                                SPDP
                            </button>
                            <button className="nav-item" onClick={() => onNavigate?.('dasti')}>
                                <div className="ni-icon or">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                                DASTI
                            </button>
                            <button className="nav-item" onClick={() => onNavigate?.('workspace-sipede')}>
                                <div className="ni-icon p">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                </div>
                                Workspace
                            </button>
                            <button className="nav-item" onClick={() => onNavigate?.('insight')}>
                                <div className="ni-icon o">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                                </div>
                                Insight
                            </button>
                        </div>
                    </div>
                </aside>
            </section>

            <style jsx>{`
                /* ═══ Base ═══ */
                .home { max-width: 1400px; margin: 0 auto; padding-bottom: 2rem; }

                /* ═══ Hero ═══ */
                .hero {
                    position: relative;
                    background: linear-gradient(140deg, #042f2e 0%, #064e3b 35%, #065f46 70%, #047857 100%);
                    border-radius: 0 0 28px 28px;
                    padding: 2.25rem 2.5rem 2rem;
                    overflow: hidden;
                }
                .hero-bg-shapes { position: absolute; inset: 0; pointer-events: none; }
                .shape {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.04);
                }
                .shape-1 { width: 340px; height: 340px; top: -120px; right: -60px; }
                .shape-2 { width: 200px; height: 200px; bottom: -80px; left: 10%; background: rgba(52,211,153,0.08); }
                .shape-3 { width: 120px; height: 120px; top: 20%; left: 40%; background: rgba(255,255,255,0.03); }

                .hero-inner {
                    position: relative; z-index: 1;
                    display: flex; justify-content: space-between; align-items: center;
                    flex-wrap: wrap; gap: 1rem;
                }
                .hero-left h1 {
                    font-size: 1.75rem; font-weight: 800; color: #fff;
                    margin: 0; line-height: 1.25; letter-spacing: -0.5px;
                }
                .hero-left h1 span {
                    background: linear-gradient(135deg, #6ee7b7, #34d399);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .hero-left p { color: rgba(255,255,255,0.55); font-size: 0.9rem; margin: 0.35rem 0 0; font-weight: 400; }
                .hero-right { display: flex; align-items: center; gap: 1.25rem; }

                .clock { text-align: right; }
                .clock-time {
                    display: block; font-size: 2rem; font-weight: 700; color: #fff;
                    font-variant-numeric: tabular-nums; letter-spacing: 1.5px; line-height: 1;
                }
                .clock-date { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-top: 0.2rem; }

                .hero-actions { display: flex; align-items: center; gap: 0.5rem; }

                .pill {
                    display: inline-flex; align-items: center; gap: 0.4rem;
                    padding: 0.45rem 1rem; border-radius: 100px;
                    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.5); font-size: 0.7rem; font-weight: 700;
                    letter-spacing: 1px; cursor: pointer; backdrop-filter: blur(8px);
                    transition: all 0.25s;
                }
                .pill:hover { background: rgba(255,255,255,0.14); }
                .pill-dot {
                    width: 7px; height: 7px; border-radius: 50%;
                    background: rgba(255,255,255,0.3); transition: background 0.3s;
                }
                .pill.live { color: #6ee7b7; border-color: rgba(110,231,183,0.25); }
                .pill.live .pill-dot {
                    background: #34d399;
                    box-shadow: 0 0 8px rgba(52,211,153,0.6);
                    animation: blink 1.6s infinite;
                }
                @keyframes blink {
                    0%,100% { opacity: 1; }
                    50% { opacity: 0.35; }
                }

                .icon-btn {
                    width: 36px; height: 36px; border-radius: 12px;
                    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
                    display: grid; place-items: center; cursor: pointer;
                    transition: all 0.25s; backdrop-filter: blur(8px);
                }
                .icon-btn:hover { background: rgba(255,255,255,0.16); }
                .icon-btn:disabled { opacity: 0.4; cursor: default; }
                .icon-btn svg { width: 16px; height: 16px; color: rgba(255,255,255,0.7); }
                .icon-btn.spin svg { animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* ═══ Stats Row ═══ */
                .stats {
                    display: grid; grid-template-columns: repeat(4, 1fr);
                    gap: 0.875rem; padding: 0 2rem; margin: -1.25rem 0 1.5rem;
                    position: relative; z-index: 2;
                }
                .stat {
                    background: #fff; border-radius: 18px;
                    padding: 1.15rem 1.25rem; display: flex; align-items: center; gap: 0.875rem;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04);
                    border: 1px solid rgba(0,0,0,0.04);
                    transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s;
                    cursor: default;
                }
                .stat:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 36px rgba(0,0,0,0.08);
                }
                .stat-icon {
                    width: 46px; height: 46px; border-radius: 14px;
                    display: grid; place-items: center; flex-shrink: 0;
                }
                .stat-icon svg { width: 22px; height: 22px; }
                .stat.green  .stat-icon { background: linear-gradient(135deg,#064e3b,#059669); color: #fff; }
                .stat.purple .stat-icon { background: linear-gradient(135deg,#6d28d9,#a855f7); color: #fff; }
                .stat.teal   .stat-icon { background: linear-gradient(135deg,#0d9488,#2dd4bf); color: #fff; }
                .stat.blue   .stat-icon { background: linear-gradient(135deg,#0369a1,#38bdf8); color: #fff; }
                .stat-icon svg { color: #fff; }

                .stat-body h2 {
                    font-size: 1.5rem; font-weight: 800; color: #0f172a;
                    margin: 0; line-height: 1;
                }
                .stat-body p { font-size: 0.72rem; color: #94a3b8; margin: 0.2rem 0 0; font-weight: 500; }
                .stat-dim { font-size: 0.9rem; font-weight: 500; color: #94a3b8; }

                /* ═══ Grid ═══ */
                .grid {
                    display: grid; grid-template-columns: 1fr 340px;
                    gap: 1.25rem; padding: 0 2rem;
                }
                .col-main { display: flex; flex-direction: column; gap: 1rem; }

                /* ═══ Scraper Card ═══ */
                .scraper-card {
                    background: #fff; border: 1px solid #e8ecef;
                    border-radius: 22px; padding: 1.5rem 1.75rem;
                    transition: all 0.35s cubic-bezier(.4,0,.2,1);
                    position: relative; overflow: hidden;
                }
                .scraper-card::after {
                    content: ''; position: absolute; top: 0; left: 0; right: 0;
                    height: 3px; background: linear-gradient(90deg,#064e3b,#10b981,#6ee7b7);
                    transform: scaleX(0); transform-origin: left;
                    transition: transform 0.4s cubic-bezier(.4,0,.2,1);
                }
                .scraper-card:hover { box-shadow: 0 16px 48px rgba(6,78,59,0.08); border-color: #d1fae5; }
                .scraper-card:hover::after { transform: scaleX(1); }
                .scraper-card.active {
                    background: linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%);
                    border-color: #86efac;
                }
                .scraper-card.active::after { transform: scaleX(1); }

                .sc-top { display: flex; align-items: center; gap: 0.875rem; margin-bottom: 1.25rem; }
                .sc-avatar {
                    width: 48px; height: 48px; border-radius: 14px;
                    display: grid; place-items: center; flex-shrink: 0;
                }
                .sc-avatar svg { width: 22px; height: 22px; color: #fff; }
                .av-green { background: linear-gradient(135deg,#064e3b,#059669); }
                .av-blue  { background: linear-gradient(135deg,#1e3a8a,#3b82f6); }

                .sc-info { flex: 1; }
                .sc-info h3 { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 0.35rem; }
                .sc-badge {
                    display: inline-flex; align-items: center; gap: 0.35rem;
                    font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.7rem;
                    border-radius: 100px; letter-spacing: 0.3px;
                }
                .sc-badge-dot { width: 6px; height: 6px; border-radius: 50%; }

                .sc-spinner {
                    width: 32px; height: 32px; flex-shrink: 0;
                    animation: spin 2s linear infinite;
                }
                .sc-spinner svg { width: 100%; height: 100%; }

                .sc-metrics {
                    display: flex; gap: 0;
                    background: #f8faf9; border-radius: 14px;
                    overflow: hidden; margin-bottom: 1.25rem;
                }
                .sc-m {
                    flex: 1; display: flex; flex-direction: column; align-items: center;
                    padding: 0.875rem 0; position: relative;
                }
                .sc-m + .sc-m::before {
                    content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
                    width: 1px; background: #e2e8f0;
                }
                .sc-m-val { font-size: 1.35rem; font-weight: 800; color: #064e3b; }
                .sc-m-dim { font-size: 0.85rem; font-weight: 500; color: #94a3b8; }
                .sc-m-lbl { font-size: 0.68rem; color: #94a3b8; margin-top: 0.15rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }

                .sc-btns { display: flex; gap: 0.625rem; }

                .btn-primary {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    padding: 0.7rem 1rem; border-radius: 14px; border: none;
                    background: linear-gradient(135deg,#064e3b,#065f46);
                    color: #fff; font-size: 0.82rem; font-weight: 600; cursor: pointer;
                    transition: all 0.25s; box-shadow: 0 2px 12px rgba(6,78,59,0.2);
                }
                .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(6,78,59,0.3); }
                .btn-primary svg { width: 16px; height: 16px; }

                .btn-ghost {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    padding: 0.7rem 1rem; border-radius: 14px;
                    border: 1.5px solid #d1fae5; background: transparent;
                    color: #064e3b; font-size: 0.82rem; font-weight: 600; cursor: pointer;
                    transition: all 0.25s;
                }
                .btn-ghost:hover { background: #f0fdf4; border-color: #6ee7b7; }
                .btn-ghost svg { width: 16px; height: 16px; }

                /* ═══ Sidebar ═══ */
                .col-side { display: flex; flex-direction: column; gap: 1rem; }
                .card {
                    background: #fff; border: 1px solid #e8ecef;
                    border-radius: 20px; padding: 1.25rem;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.03);
                    transition: box-shadow 0.3s;
                }
                .card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.06); }
                .card-title {
                    display: flex; align-items: center; gap: 0.5rem;
                    font-size: 0.88rem; font-weight: 700; color: #0f172a;
                    margin-bottom: 1rem; padding-bottom: 0.75rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .card-title svg { width: 18px; height: 18px; color: #064e3b; }

                /* Server rows */
                .sv-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 0.65rem 0.5rem; border-radius: 12px;
                    transition: background 0.2s;
                }
                .sv-row:hover { background: #f8faf9; }
                .sv-left { display: flex; align-items: center; gap: 0.65rem; }
                .sv-dot {
                    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
                }
                .sv-dot.on {
                    background: #10b981;
                    box-shadow: 0 0 0 3px rgba(16,185,129,0.15), 0 0 8px rgba(16,185,129,0.3);
                }
                .sv-dot.off { background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
                .sv-name { display: block; font-size: 0.85rem; font-weight: 600; color: #1e293b; }
                .sv-url { display: block; font-size: 0.68rem; color: #94a3b8; }
                .sv-ms {
                    font-size: 0.75rem; font-weight: 700; color: #059669;
                    background: #ecfdf5; padding: 0.2rem 0.6rem; border-radius: 8px;
                }
                .sv-off {
                    font-size: 0.75rem; font-weight: 700; color: #ef4444;
                    background: #fef2f2; padding: 0.2rem 0.6rem; border-radius: 8px;
                }

                /* Nav grid */
                .nav-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
                .nav-item {
                    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
                    padding: 1rem 0.5rem; border-radius: 16px;
                    border: 1.5px solid #f1f5f9; background: #fff;
                    cursor: pointer; transition: all 0.25s;
                    font-size: 0.72rem; font-weight: 600; color: #475569;
                }
                .nav-item:hover {
                    border-color: #d1fae5; background: #f0fdf4;
                    transform: translateY(-3px); box-shadow: 0 6px 20px rgba(6,78,59,0.06);
                }
                .ni-icon {
                    width: 42px; height: 42px; border-radius: 14px;
                    display: grid; place-items: center;
                }
                .ni-icon svg { width: 20px; height: 20px; color: #fff; }
                .ni-icon.g { background: linear-gradient(135deg,#064e3b,#059669); }
                .ni-icon.b { background: linear-gradient(135deg,#1e3a8a,#3b82f6); }
                .ni-icon.or { background: linear-gradient(135deg,#c2410c,#ea580c); }
                .ni-icon.p { background: linear-gradient(135deg,#6d28d9,#a855f7); }
                .ni-icon.o { background: linear-gradient(135deg,#c2410c,#f97316); }

                /* Avatar colors */
                .av-green { background: linear-gradient(135deg,#064e3b,#059669); }
                .av-blue  { background: linear-gradient(135deg,#1e3a8a,#3b82f6); }
                .av-orange { background: linear-gradient(135deg,#c2410c,#ea580c); }

                /* ═══ Responsive ═══ */
                @media (max-width: 1024px) {
                    .grid { grid-template-columns: 1fr; }
                    .stats { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 640px) {
                    .hero { padding: 1.5rem 1.25rem 1.25rem; border-radius: 0 0 20px 20px; }
                    .hero-inner { flex-direction: column; align-items: flex-start; }
                    .hero-left h1 { font-size: 1.35rem; }
                    .hero-right { width: 100%; justify-content: space-between; }
                    .clock-time { font-size: 1.5rem; }
                    .stats { padding: 0 1rem; margin-top: -1rem; }
                    .grid { padding: 0 1rem; }
                    .stat { padding: 0.875rem 1rem; }
                    .stat-body h2 { font-size: 1.2rem; }
                    .sc-btns { flex-direction: column; }
                }
            `}</style>
        </div>
    );
}
