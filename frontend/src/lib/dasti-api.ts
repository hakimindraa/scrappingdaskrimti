// DASTI Scraper API Types
export interface NavigationState {
    loginUrl: string;
    afterLoginUrl: string;
    intermediateUrl: string;
    dataPageUrl: string;
    currentLevel: number;
}

export interface PaginationInfo {
    type: 'numbered' | 'next-prev' | 'infinite' | 'none';
    totalEntries: number;
    totalPages: number;
    currentPage: number;
    entriesPerPage: number;
    isDynamic?: boolean;
}

export interface TableInfo {
    headers: string[];
    row_count: number;
    pagination: PaginationInfo;
    current_url: string;
}

export interface ScraperStatus {
    browserOpen: boolean;
    isLoggedIn: boolean;
    isRunning: boolean;
    navigationLevel: number;
    currentPage: number;
    pagesScraped: number;
    itemsScraped: number;
    startTime: string | null;
    error: string | null;
    currentUrl: string | null;
    tableInfo: TableInfo | null;
    dataCount: number;
    elapsedTime: number;
    shouldStop: boolean;
    captchaDetected: boolean;
    sessionSaved: boolean;
}

export interface DataPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface StatusResponse {
    success: boolean;
    status: ScraperStatus;
}

export interface DataResponse {
    success: boolean;
    data: Record<string, string>[];
    pagination: DataPagination;
}

export interface ApiResponse {
    success: boolean;
    message?: string;
    error?: string;
    currentUrl?: string;
    navigationLevel?: number;
}

export interface DetectTableResponse {
    success: boolean;
    tableInfo?: TableInfo;
    message?: string;
    error?: string;
}

export interface NavigationStateResponse {
    success: boolean;
    navigationState: NavigationState;
    currentLevel: number;
}

export interface ActivityLog {
    level: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: string;
}

export interface ActivityLogsResponse {
    success: boolean;
    logs: ActivityLog[];
    count: number;
}

// API Configuration - prioritize environment variable for network access
function getApiBaseUrl(): string {
    // Priority 1: Environment variable (for network access from other devices)
    if (process.env.NEXT_PUBLIC_DASTI_API_URL) {
        return process.env.NEXT_PUBLIC_DASTI_API_URL;
    }
    
    // Priority 2: Dynamic hostname (fallback for local development)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:5002`;
    }
    
    // Priority 3: Default localhost
    return 'http://localhost:5002';
}

// Browser Management
export async function openBrowser(url?: string): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    return response.json();
}

export async function closeBrowser(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/close`, {
        method: 'POST',
    });
    return response.json();
}

export async function navigate(url: string): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    return response.json();
}

export async function getCurrentUrl(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/current-url`);
    return response.json();
}

export async function takeScreenshot(filename?: string): Promise<ApiResponse> {
    const params = filename ? `?filename=${filename}` : '';
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/screenshot${params}`);
    return response.json();
}

// Login & Authentication
export async function detectCaptcha(): Promise<ApiResponse & { captchaDetected?: boolean; captchaType?: string }> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/detect-captcha`);
    return response.json();
}

export async function checkLogin(): Promise<ApiResponse & { isLoggedIn?: boolean }> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/check-login`);
    return response.json();
}

export async function saveSession(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/save-session`, {
        method: 'POST',
    });
    return response.json();
}

export async function loadSession(): Promise<ApiResponse & { navigationState?: NavigationState }> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/load-session`, {
        method: 'POST',
    });
    return response.json();
}

// Navigation
export async function getNavigationState(): Promise<NavigationStateResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/navigation-state`);
    return response.json();
}

export async function setDataUrl(url: string): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/set-data-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    return response.json();
}

export async function navigateToData(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/navigate-to-data`, {
        method: 'POST',
    });
    return response.json();
}

// Table & Scraping
export async function detectTable(): Promise<DetectTableResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/detect-table`);
    return response.json();
}

export async function startScraping(startPage: number = 1, endPage: number = 0): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startPage, endPage }),
    });
    return response.json();
}

export async function stopScraping(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/stop`, {
        method: 'POST',
    });
    return response.json();
}

export async function getStatus(): Promise<StatusResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/status`);
    return response.json();
}

// Data Management
export async function getData(page: number = 1, limit: number = 10, search: string = ''): Promise<DataResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (search) {
        params.append('search', search);
    }

    const response = await fetch(`${getApiBaseUrl()}/api/scraper/data?${params}`);
    return response.json();
}

export async function getAllData(): Promise<DataResponse & { count?: number }> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/data/all`);
    return response.json();
}

export async function clearData(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/data/clear`, {
        method: 'POST',
    });
    return response.json();
}

// Export
export function getExportCsvUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/csv`;
}

export function getExportJsonUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/json`;
}

export function getExportExcelUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/excel`;
}

// Activity Logs
export async function getLogs(limit: number = 100): Promise<ActivityLogsResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/logs?limit=${limit}`);
    return response.json();
}

export async function clearLogs(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/logs/clear`, {
        method: 'POST',
    });
    return response.json();
}

// Health Check
export async function healthCheck(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/health`);
    return response.json();
}
