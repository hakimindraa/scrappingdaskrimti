// SPDP Scraper API Types & Functions

export interface PaginationInfo {
    totalEntries: number;
    totalPages: number;
    currentPage: number;
    entriesPerPage: number;
}

export interface TableInfo {
    headers: string[];
    rowCount: number;
    pagination: PaginationInfo;
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

export interface DetectTableResponse {
    success: boolean;
    headers?: string[];
    rowCount?: number;
    pagination?: PaginationInfo;
    currentUrl?: string;
    message?: string;
}

// API Configuration - prioritize environment variable for network access
function getApiBaseUrl(): string {
    // Priority 1: Environment variable (for network access from other devices)
    if (process.env.NEXT_PUBLIC_SPP_API_URL) {
        return process.env.NEXT_PUBLIC_SPP_API_URL;
    }
    
    // Priority 2: Dynamic hostname (fallback for local development)
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        return `http://${hostname}:5001`;
    }
    
    // Priority 3: Default localhost
    return 'http://localhost:5001';
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

export async function startScraping(startPage: number = 1, endPage: number = 0, filterYear: number = 0): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_page: startPage, end_page: endPage, filter_year: filterYear }),
    });
    return response.json();
}

export async function stopScraping(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/stop`, {
        method: 'POST',
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
        search: search,
    });
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/data?${params}`);
    return response.json();
}

export async function clearData(): Promise<ApiResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/clear`, {
        method: 'POST',
    });
    return response.json();
}

export function getExportCsvUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/csv`;
}

export function getExportJsonUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/json`;
}

export function getExportExcelUrl(): string {
    return `${getApiBaseUrl()}/api/scraper/export/excel`;
}

// ============================================
// Data Info Types & Functions
// ============================================

export interface DataInfo {
    success: boolean;
    exists: boolean;
    row_count: number;
    pages_scraped: number;
    scraped_at?: string;
    updated_at?: string;
}

export async function getDataInfo(): Promise<DataInfo> {
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/data-info`);
    return response.json();
}

// Get all data for insights (no pagination limit)
export async function getAllDataForInsights(): Promise<{ success: boolean; data: Record<string, string>[]; headers?: string[] }> {
    // First get data info to know total count
    const info = await getDataInfo();
    if (!info.exists || info.row_count === 0) {
        return { success: false, data: [] };
    }

    // Fetch all data with high limit
    const response = await fetch(`${getApiBaseUrl()}/api/scraper/data?page=1&limit=${info.row_count + 100}`);
    const result = await response.json();
    
    // Extract headers from first data item
    const headers = result.data && result.data.length > 0 ? Object.keys(result.data[0]) : [];
    
    return {
        success: result.success,
        data: result.data || [],
        headers
    };
}
