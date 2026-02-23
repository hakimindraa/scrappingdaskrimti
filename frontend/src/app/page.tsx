'use client';

import { useState, useRef, useEffect } from 'react';
import DashboardTab from '@/components/DashboardTab';
import SipedeScraperTab from '@/components/SipedeScraperTab';
import SppScraperTab from '@/components/SppScraperTab';
import InsightTab from '@/components/InsightTab';
import DataWorkspace from '@/components/DataWorkspace';

type TabType = 'dashboard' | 'sipede' | 'spp' | 'insight' | 'workspace-sipede' | 'workspace-spdp';

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [scrappingMenuOpen, setScrappingMenuOpen] = useState(false);
    const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
    const scrappingDropdownRef = useRef<HTMLDivElement>(null);
    const workspaceDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (scrappingDropdownRef.current && !scrappingDropdownRef.current.contains(event.target as Node)) {
                setScrappingMenuOpen(false);
            }

            if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
                setWorkspaceMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleScrappingSelect = (tab: 'sipede' | 'spp') => {
        setActiveTab(tab);
        setScrappingMenuOpen(false);
    };



    const handleWorkspaceSelect = (tab: 'workspace-sipede' | 'workspace-spdp') => {
        setActiveTab(tab);
        setWorkspaceMenuOpen(false);
    };

    return (
        <div className="app-container">
            {/* Header with Tabs */}
            <header className="app-header">
                <div className="header-content">
                    <div className="logo-section">
                        <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3h18v18H3V3z" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                            <rect x="12" y="12" width="6" height="6" />
                        </svg>
                        <h1>Dasta</h1>
                        <span className="logo-subtitle">Deskripsi Data</span>
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

                        {/* Scrapping Dropdown Menu */}
                        <div className="dropdown-container" ref={scrappingDropdownRef}>
                            <button
                                className={`tab-btn ${(activeTab === 'sipede' || activeTab === 'spp') ? 'active' : ''}`}
                                onClick={() => setScrappingMenuOpen(!scrappingMenuOpen)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                                Scrapping
                                <svg className={`dropdown-arrow ${scrappingMenuOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {scrappingMenuOpen && (
                                <div className="dropdown-menu">
                                    <button
                                        className={`dropdown-item ${activeTab === 'sipede' ? 'active' : ''}`}
                                        onClick={() => handleScrappingSelect('sipede')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4M12 8h.01" />
                                        </svg>
                                        SIPEDE
                                    </button>
                                    <button
                                        className={`dropdown-item ${activeTab === 'spp' ? 'active' : ''}`}
                                        onClick={() => handleScrappingSelect('spp')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <line x1="3" y1="9" x2="21" y2="9" />
                                            <line x1="9" y1="21" x2="9" y2="9" />
                                        </svg>
                                        SPDP
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Workspace Dropdown Menu */}
                        <div className="dropdown-container" ref={workspaceDropdownRef}>
                            <button
                                className={`tab-btn ${(activeTab === 'workspace-sipede' || activeTab === 'workspace-spdp') ? 'active' : ''}`}
                                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="9" y1="21" x2="9" y2="9" />
                                </svg>
                                Workspace
                                <svg className={`dropdown-arrow ${workspaceMenuOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            {workspaceMenuOpen && (
                                <div className="dropdown-menu">
                                    <button
                                        className={`dropdown-item ${activeTab === 'workspace-sipede' ? 'active' : ''}`}
                                        onClick={() => handleWorkspaceSelect('workspace-sipede')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4M12 8h.01" />
                                        </svg>
                                        SIPEDE
                                    </button>
                                    <button
                                        className={`dropdown-item ${activeTab === 'workspace-spdp' ? 'active' : ''}`}
                                        onClick={() => handleWorkspaceSelect('workspace-spdp')}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <line x1="3" y1="9" x2="21" y2="9" />
                                            <line x1="9" y1="21" x2="9" y2="9" />
                                        </svg>
                                        SPDP
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Insight Tab */}
                        <button
                            className={`tab-btn ${activeTab === 'insight' ? 'active' : ''}`}
                            onClick={() => setActiveTab('insight')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                                <polyline points="7.5 19.79 7.5 14.6 3 12" />
                                <polyline points="21 12 16.5 14.6 16.5 19.79" />
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                <line x1="12" y1="22.08" x2="12" y2="12" />
                            </svg>
                            Insight
                        </button>
                    </div>
                </div>
            </header>

            {/* Tab Content */}
            <main className="tab-content">
                {activeTab === 'dashboard' && <DashboardTab />}
                {activeTab === 'sipede' && <SipedeScraperTab />}
                {activeTab === 'spp' && <SppScraperTab />}
                {activeTab === 'insight' && <InsightTab />}
                {activeTab === 'workspace-sipede' && <DataWorkspace source="sipede" />}
                {activeTab === 'workspace-spdp' && <DataWorkspace source="spdp" />}
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

                .logo-subtitle {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                    font-weight: 400;
                    margin-left: -0.5rem;
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

                .dropdown-arrow {
                    width: 14px;
                    height: 14px;
                    transition: transform 0.2s ease;
                }

                .dropdown-arrow.open {
                    transform: rotate(180deg);
                }

                .dropdown-container {
                    position: relative;
                }

                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0;
                    min-width: 160px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    padding: 0.5rem;
                    z-index: 200;
                    animation: dropdownFade 0.2s ease;
                }

                @keyframes dropdownFade {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                    color: #374151;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }

                .dropdown-item:hover {
                    background: #f0fdf4;
                    color: #064e3b;
                }

                .dropdown-item.active {
                    background: #ecfdf5;
                    color: #064e3b;
                }

                .dropdown-item svg {
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
