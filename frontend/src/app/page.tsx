'use client';

import { useState } from 'react';
import DashboardTab from '@/components/DashboardTab';
import SipedeScraperTab from '@/components/SipedeScraperTab';
import SppScraperTab from '@/components/SppScraperTab';

type TabType = 'dashboard' | 'sipede' | 'spp';

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');

    return (
        <div className="app-container">
            {/* Header with Tabs */}
            <header className="app-header">
                <div className="header-content">
                    <div className="logo-section">
                        <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <h1>Web Scraper</h1>
                    </div>

                    {/* Tab Switcher */}
                    <div className="tab-switcher">
                        <button
                            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            Dashboard
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'sipede' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sipede')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                            SIPEDE
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'spp' ? 'active' : ''}`}
                            onClick={() => setActiveTab('spp')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                            SPDP
                        </button>
                    </div>
                </div>
            </header>

            {/* Tab Content */}
            <main className="tab-content">
                {activeTab === 'dashboard' && <DashboardTab />}
                {activeTab === 'sipede' && <SipedeScraperTab />}
                {activeTab === 'spp' && <SppScraperTab />}
            </main>

            <style jsx>{`
                .app-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f8faf9 0%, #f0fdf4 50%, #ecfdf5 100%);
                    color: #1e293b;
                }

                .app-header {
                    background: linear-gradient(135deg, #064e3b, #065f46);
                    padding: 0;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: 0 4px 20px rgba(6, 78, 59, 0.25);
                }

                .header-content {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                    padding: 1rem 2rem;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 0.875rem;
                }

                .logo-icon {
                    width: 36px;
                    height: 36px;
                    color: #10b981;
                    background: rgba(255, 255, 255, 0.15);
                    padding: 6px;
                    border-radius: 10px;
                }

                .logo-section h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: white;
                    letter-spacing: -0.5px;
                }

                .tab-switcher {
                    display: flex;
                    gap: 0.375rem;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 0.375rem;
                    border-radius: 14px;
                    backdrop-filter: blur(10px);
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: transparent;
                    border: none;
                    border-radius: 10px;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }

                .tab-btn:hover {
                    color: white;
                    background: rgba(255, 255, 255, 0.1);
                }

                .tab-btn.active {
                    background: white;
                    color: #064e3b;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }

                .tab-btn svg {
                    width: 18px;
                    height: 18px;
                }

                .tab-content {
                    max-width: 1400px;
                    margin: 0 auto;
                }

                @media (max-width: 640px) {
                    .header-content {
                        flex-direction: column;
                        align-items: flex-start;
                        padding: 1rem;
                    }

                    .tab-switcher {
                        width: 100%;
                    }

                    .tab-btn {
                        flex: 1;
                        justify-content: center;
                        padding: 0.625rem 0.75rem;
                        font-size: 0.8rem;
                    }
                    
                    .tab-btn svg {
                        width: 16px;
                        height: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
