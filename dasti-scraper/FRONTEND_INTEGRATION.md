# Frontend Integration Guide - DASTI Scraper

## Overview
Panduan integrasi DASTI Scraper API dengan frontend (React/Next.js).

## API Client Setup

### 1. Create API Client

```typescript
// lib/dasti-api.ts
const DASTI_API_BASE = 'http://localhost:5002/api/scraper';

export const dastiApi = {
  // Browser Management
  openBrowser: async (url?: string) => {
    const response = await fetch(`${DASTI_API_BASE}/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return response.json();
  },

  closeBrowser: async () => {
    const response = await fetch(`${DASTI_API_BASE}/close`, {
      method: 'POST'
    });
    return response.json();
  },

  navigate: async (url: string) => {
    const response = await fetch(`${DASTI_API_BASE}/navigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return response.json();
  },

  getCurrentUrl: async () => {
    const response = await fetch(`${DASTI_API_BASE}/current-url`);
    return response.json();
  },

  // Login & Session
  checkLogin: async () => {
    const response = await fetch(`${DASTI_API_BASE}/check-login`);
    return response.json();
  },

  saveSession: async () => {
    const response = await fetch(`${DASTI_API_BASE}/save-session`, {
      method: 'POST'
    });
    return response.json();
  },

  loadSession: async () => {
    const response = await fetch(`${DASTI_API_BASE}/load-session`, {
      method: 'POST'
    });
    return response.json();
  },

  detectCaptcha: async () => {
    const response = await fetch(`${DASTI_API_BASE}/detect-captcha`);
    return response.json();
  },

  // Navigation
  getNavigationState: async () => {
    const response = await fetch(`${DASTI_API_BASE}/navigation-state`);
    return response.json();
  },

  setDataUrl: async (url: string) => {
    const response = await fetch(`${DASTI_API_BASE}/set-data-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return response.json();
  },

  navigateToData: async () => {
    const response = await fetch(`${DASTI_API_BASE}/navigate-to-data`, {
      method: 'POST'
    });
    return response.json();
  },

  // Table & Scraping
  detectTable: async () => {
    const response = await fetch(`${DASTI_API_BASE}/detect-table`);
    return response.json();
  },

  startScraping: async (startPage: number = 1, endPage: number = 0) => {
    const response = await fetch(`${DASTI_API_BASE}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startPage, endPage })
    });
    return response.json();
  },

  stopScraping: async () => {
    const response = await fetch(`${DASTI_API_BASE}/stop`, {
      method: 'POST'
    });
    return response.json();
  },

  getStatus: async () => {
    const response = await fetch(`${DASTI_API_BASE}/status`);
    return response.json();
  },

  // Data Management
  getData: async (page: number = 1, limit: number = 10, search: string = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search
    });
    const response = await fetch(`${DASTI_API_BASE}/data?${params}`);
    return response.json();
  },

  getAllData: async () => {
    const response = await fetch(`${DASTI_API_BASE}/data/all`);
    return response.json();
  },

  clearData: async () => {
    const response = await fetch(`${DASTI_API_BASE}/data/clear`, {
      method: 'POST'
    });
    return response.json();
  },

  // Export
  exportCsv: () => {
    window.open(`${DASTI_API_BASE}/export/csv`, '_blank');
  },

  exportJson: () => {
    window.open(`${DASTI_API_BASE}/export/json`, '_blank');
  },

  exportExcel: () => {
    window.open(`${DASTI_API_BASE}/export/excel`, '_blank');
  },

  // Logs
  getLogs: async (limit: number = 100) => {
    const response = await fetch(`${DASTI_API_BASE}/logs?limit=${limit}`);
    return response.json();
  },

  clearLogs: async () => {
    const response = await fetch(`${DASTI_API_BASE}/logs/clear`, {
      method: 'POST'
    });
    return response.json();
  }
};
```

## React Component Example

### 2. DASTI Scraper Tab Component

```typescript
// components/DastiScraperTab.tsx
import { useState, useEffect } from 'react';
import { dastiApi } from '@/lib/dasti-api';

interface ScraperStatus {
  browserOpen: boolean;
  isLoggedIn: boolean;
  isRunning: boolean;
  navigationLevel: number;
  currentPage: number;
  pagesScraped: number;
  itemsScraped: number;
  dataCount: number;
  elapsedTime: number;
  error: string | null;
  captchaDetected: boolean;
  sessionSaved: boolean;
}

export default function DastiScraperTab() {
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [loginUrl, setLoginUrl] = useState('');
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);

  // Poll status every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await dastiApi.getStatus();
      if (result.success) {
        setStatus(result.status);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Fetch logs
  const fetchLogs = async () => {
    const result = await dastiApi.getLogs(50);
    if (result.success) {
      setLogs(result.logs);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleOpenBrowser = async () => {
    const result = await dastiApi.openBrowser(loginUrl);
    if (result.success) {
      alert('Browser dibuka! Silakan login manual.');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleCloseBrowser = async () => {
    await dastiApi.closeBrowser();
  };

  const handleCheckLogin = async () => {
    const result = await dastiApi.checkLogin();
    if (result.success && result.isLoggedIn) {
      alert('Login berhasil terdeteksi!');
    } else {
      alert('Belum login atau login gagal.');
    }
  };

  const handleSaveSession = async () => {
    const result = await dastiApi.saveSession();
    if (result.success) {
      alert('Session berhasil disimpan!');
    }
  };

  const handleLoadSession = async () => {
    const result = await dastiApi.loadSession();
    if (result.success) {
      alert('Session berhasil dimuat!');
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDetectTable = async () => {
    const result = await dastiApi.detectTable();
    if (result.success) {
      setTableInfo(result.tableInfo);
      alert(`Tabel terdeteksi: ${result.tableInfo.headers.length} kolom, ${result.tableInfo.row_count} baris`);
    } else {
      alert('Tabel tidak terdeteksi!');
    }
  };

  const handleStartScraping = async () => {
    const result = await dastiApi.startScraping(startPage, endPage);
    if (result.success) {
      alert('Scraping dimulai!');
    }
  };

  const handleStopScraping = async () => {
    await dastiApi.stopScraping();
  };

  const handleExportCsv = () => {
    dastiApi.exportCsv();
  };

  const handleExportExcel = () => {
    dastiApi.exportExcel();
  };

  const handleClearData = async () => {
    if (confirm('Hapus semua data?')) {
      await dastiApi.clearData();
      alert('Data berhasil dihapus!');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Status</h2>
        {status && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Browser</p>
              <p className="font-semibold">{status.browserOpen ? '🟢 Open' : '🔴 Closed'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Login</p>
              <p className="font-semibold">{status.isLoggedIn ? '✅ Logged In' : '❌ Not Logged In'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Scraping</p>
              <p className="font-semibold">{status.isRunning ? '🔄 Running' : '⏸️ Stopped'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data Count</p>
              <p className="font-semibold">{status.dataCount} items</p>
            </div>
            {status.isRunning && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Current Page</p>
                  <p className="font-semibold">{status.currentPage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Elapsed Time</p>
                  <p className="font-semibold">{status.elapsedTime}s</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Browser Control */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Browser Control</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Login URL</label>
            <input
              type="text"
              value={loginUrl}
              onChange={(e) => setLoginUrl(e.target.value)}
              placeholder="https://dasti.example.com/login"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenBrowser}
              disabled={status?.browserOpen}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Buka Browser
            </button>
            <button
              onClick={handleCloseBrowser}
              disabled={!status?.browserOpen}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
            >
              Tutup Browser
            </button>
          </div>
        </div>
      </div>

      {/* Login & Session */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Login & Session</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCheckLogin}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Cek Login
          </button>
          <button
            onClick={handleSaveSession}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Simpan Session
          </button>
          <button
            onClick={handleLoadSession}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Load Session
          </button>
        </div>
      </div>

      {/* Scraping Control */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Scraping Control</h2>
        <div className="space-y-4">
          <button
            onClick={handleDetectTable}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Deteksi Tabel
          </button>

          {tableInfo && (
            <div className="p-4 bg-gray-50 rounded">
              <p className="font-semibold">Table Info:</p>
              <p>Headers: {tableInfo.headers.join(', ')}</p>
              <p>Rows: {tableInfo.row_count}</p>
              <p>Pagination: {tableInfo.pagination.type}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Page</label>
              <input
                type="number"
                value={startPage}
                onChange={(e) => setStartPage(parseInt(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Page (0 = all)</label>
              <input
                type="number"
                value={endPage}
                onChange={(e) => setEndPage(parseInt(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStartScraping}
              disabled={status?.isRunning}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              Mulai Scraping
            </button>
            <button
              onClick={handleStopScraping}
              disabled={!status?.isRunning}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
            >
              Stop Scraping
            </button>
          </div>
        </div>
      </div>

      {/* Export & Data */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Export & Data</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Excel
          </button>
          <button
            onClick={handleClearData}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Data
          </button>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Activity Logs</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm">
              <span className={`font-semibold ${
                log.level === 'error' ? 'text-red-600' :
                log.level === 'success' ? 'text-green-600' :
                log.level === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                [{log.level.toUpperCase()}]
              </span>
              <span className="ml-2">{log.message}</span>
              <span className="ml-2 text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Integration with Existing Frontend

### 3. Add to Main Page

```typescript
// src/app/page.tsx
import DastiScraperTab from '@/components/DastiScraperTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('home')}>Home</button>
        <button onClick={() => setActiveTab('sipede')}>SIPEDE</button>
        <button onClick={() => setActiveTab('spp')}>SPP</button>
        <button onClick={() => setActiveTab('dasti')}>DASTI</button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dasti' && <DastiScraperTab />}
    </div>
  );
}
```

## TypeScript Types

### 4. Type Definitions

```typescript
// types/dasti.ts
export interface ScraperStatus {
  browserOpen: boolean;
  isLoggedIn: boolean;
  isRunning: boolean;
  navigationLevel: number;
  currentPage: number;
  pagesScraped: number;
  itemsScraped: number;
  startTime: string | null;
  elapsedTime: number;
  error: string | null;
  currentUrl: string | null;
  tableInfo: TableInfo | null;
  dataCount: number;
  shouldStop: boolean;
  captchaDetected: boolean;
  sessionSaved: boolean;
}

export interface TableInfo {
  headers: string[];
  row_count: number;
  pagination: PaginationInfo;
  current_url: string;
}

export interface PaginationInfo {
  type: 'numbered' | 'next-prev' | 'infinite' | 'none';
  totalPages: number;
  currentPage: number;
  totalEntries: number;
  entriesPerPage: number;
  isDynamic?: boolean;
}

export interface NavigationState {
  loginUrl: string;
  afterLoginUrl: string;
  intermediateUrl: string;
  dataPageUrl: string;
  currentLevel: number;
}

export interface ActivityLog {
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}
```

## Best Practices

### 5. Error Handling

```typescript
const handleApiCall = async (apiFunction: () => Promise<any>, errorMessage: string) => {
  try {
    const result = await apiFunction();
    if (!result.success) {
      throw new Error(result.error || errorMessage);
    }
    return result;
  } catch (error) {
    console.error(error);
    alert(`Error: ${error.message}`);
    return null;
  }
};

// Usage
await handleApiCall(
  () => dastiApi.openBrowser(loginUrl),
  'Gagal membuka browser'
);
```

### 6. Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await dastiApi.someAction();
  } finally {
    setIsLoading(false);
  }
};
```

### 7. Toast Notifications

```typescript
import { toast } from 'react-hot-toast';

const handleSuccess = async () => {
  const result = await dastiApi.startScraping(1, 0);
  if (result.success) {
    toast.success('Scraping dimulai!');
  } else {
    toast.error(result.error);
  }
};
```

## Testing

### 8. Component Testing

```typescript
// __tests__/DastiScraperTab.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import DastiScraperTab from '@/components/DastiScraperTab';

test('renders DASTI scraper tab', () => {
  render(<DastiScraperTab />);
  expect(screen.getByText('Browser Control')).toBeInTheDocument();
});

test('opens browser on button click', async () => {
  render(<DastiScraperTab />);
  const button = screen.getByText('Buka Browser');
  fireEvent.click(button);
  // Assert API call
});
```

## Deployment Notes

- Pastikan backend running di `http://localhost:5002`
- Untuk production, update `DASTI_API_BASE` ke production URL
- Enable CORS di backend untuk production domain
- Consider using environment variables untuk API URL
