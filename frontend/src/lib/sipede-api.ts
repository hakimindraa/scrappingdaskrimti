// SIPEDE Scraper API Types
export interface YearFilter {
    name: string;
    selectedYear: string;
    availableYears: string[];
}

export interface PaginationInfo {
    totalEntries: number;
    totalPages: number;
    currentPage: number;
    entriesPerPage: number;
}

export interface TableInfo {
    headers: string[];
    rowCount: number;
    yearFilter: YearFilter | null;
    pagination: PaginationInfo;
    currentUrl: string;
}

export interface ScraperStatus {
    browserOpen: boolean;
    isLoggedIn: boolean;
    isRunning: boolean;
    currentPage: number;
    pagesScraped: number;
    itemsScraped: number;
    startTime: string | null;
    error: string | null;
    currentUrl: string | null;
    tableInfo: TableInfo | null;
    dataCount: number;
    elapsedTime: number;
    availableYears: string[];
    selectedYear: string | null;
    // Detailed scraping status
    scrapingPhase: 'idle' | 'scraping' | 'navigating' | 'waiting';
    scrapingMessage: string;
}

export interface DataPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface StatusResponse {
    success: boolean;
    data: ScraperStatus;
}

export interface DataResponse {
    success: boolean;
    data: Record<string, string>[];
    pagination: DataPagination;
}

export interface ApiResponse {
    success: boolean;
    message?: string;
    url?: string;
}

export interface CheckLoginResponse {
    success: boolean;
    message?: string;
    isLoggedIn: boolean;
    url?: string;
    availableYears: string[];
    selectedYear: string | null;
}

export interface YearsResponse {
    success: boolean;
    years: string[];
    selectedYear: string | null;
}

export interface DetectTableResponse {
    success: boolean;
    headers?: string[];
    rowCount?: number;
    yearFilter?: YearFilter | null;
    pagination?: PaginationInfo;
    currentUrl?: string;
    message?: string;
}

// API Configuration - prioritize environment variable for network access
function getApiBaseUrl(): string {
    // Priority 1: Environment variable (for network access from other devices)
    if (process.env.NEXT_PUBLIC_SIPEDE_API_URL) {
        return process.env.NEXT_PUBLIC_SIPEDE_API_URL;
    }
    
    // Priority 2: Dynamic hostname (fallback for local development)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:5000`;
    }
    
    // Priority 3: Default localhost
    return 'http://localhost:5000';
}

// API Functions

export async function openBrowser(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/open`, {
        method: 'POST',
    });
    return response.json();
}

export async function getStatus(): Promise<StatusResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/status`);
    return response.json();
}

export async function checkLoginAndNavigate(): Promise<CheckLoginResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/check-login`, {
        method: 'POST',
    });
    return response.json();
}

export async function getAvailableYears(): Promise<YearsResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/years`);
    return response.json();
}

export async function changeYear(year: string): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/change-year`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
    });
    return response.json();
}

export async function setEntriesPerPage(entries: number): Promise<ApiResponse & { entriesPerPage?: number }> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/set-entries-per-page`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
    });
    return response.json();
}

export async function navigateTo(url: string): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    return response.json();
}

export async function detectTable(): Promise<DetectTableResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/detect-table`);
    return response.json();
}

export async function startScraping(maxPages: number = 0): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPages }),
    });
    return response.json();
}

export async function closeBrowser(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/close`, {
        method: 'POST',
    });
    return response.json();
}

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

export function getExportJsonUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/json`;
}

export function getExportCsvUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/csv`;
}

export function getExportExcelUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/excel`;
}

export async function clearData(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/clear`, {
        method: 'POST',
    });
    return response.json();
}

// ============================================
// Data Info Types & Functions
// ============================================

export interface DataInfo {
    success: boolean;
    exists: boolean;
    rowCount: number;
    pagesScraped: number;
    scrapedAt?: string;
    updatedAt?: string;
}

export async function getDataInfo(): Promise<DataInfo> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/data-info`);
    return response.json();
}

// ============================================
// Activity Log Types & Functions
// ============================================

export interface ActivityLog {
    id: number;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    source: string;
    createdAt: string;
}

export interface ActivityLogsResponse {
    success: boolean;
    data: ActivityLog[];
    total: number;
}

export async function getActivityLogs(limit: number = 50): Promise<ActivityLogsResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/activity?limit=${limit}`);
    return response.json();
}

export async function addActivityLog(type: ActivityLog['type'], message: string, source: string): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, source }),
    });
    return response.json();
}

export async function clearActivityLogs(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/activity`, {
        method: 'DELETE',
    });
    return response.json();
}
