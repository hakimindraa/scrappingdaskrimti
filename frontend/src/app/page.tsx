'use client';

import { useState } from 'react';
import SipedeScraperTab from '@/components/SipedeScraperTab';
import SppScraperTab from '@/components/SppScraperTab';

type TabType = 'sipede' | 'spp';

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<TabType>('sipede');

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
                            SPP
                        </button>
                    </div>
                </div>
            </header>

            {/* Tab Content */}
            <main className="tab-content">
                {activeTab === 'sipede' && <SipedeScraperTab />}
                {activeTab === 'spp' && <SppScraperTab />}
            </main>

            <style jsx>{`
                .app-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #f8fdf8 0%, #e8f5e8 50%, #f0faf0 100%);
                    color: #1a3a1a;
                }

                .app-header {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid #d4e7d4;
                    padding: 1rem 2rem;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: 0 2px 8px rgba(22, 163, 74, 0.08);
                }

                .header-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .logo-icon {
                    width: 32px;
                    height: 32px;
                    color: #16a34a;
                }

                .logo-section h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    background: linear-gradient(90deg, #16a34a, #059669);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .tab-switcher {
                    display: flex;
                    gap: 0.5rem;
                    background: #f0f9f0;
                    padding: 0.25rem;
                    border-radius: 12px;
                    border: 1px solid #d4e7d4;
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.625rem 1.25rem;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    color: #6b8e6b;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .tab-btn:hover {
                    color: #16a34a;
                    background: rgba(22, 163, 74, 0.05);
                }

                .tab-btn.active {
                    background: linear-gradient(135deg, rgba(22, 163, 74, 0.15), rgba(5, 150, 105, 0.15));
                    color: #16a34a;
                    border: 1px solid rgba(22, 163, 74, 0.3);
                }

                .tab-btn svg {
                    width: 18px;
                    height: 18px;
                }

                .tab-content {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                @media (max-width: 640px) {
                    .header-content {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .tab-switcher {
                        width: 100%;
                    }

                    .tab-btn {
                        flex: 1;
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
