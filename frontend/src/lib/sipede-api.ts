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
    yearFilter?: YearFilter | null;
    pagination?: PaginationInfo;
    currentUrl?: string;
    message?: string;
}

// API Configuration
const SIPEDE_API_URL = process.env.NEXT_PUBLIC_SIPEDE_API_URL || 'http://localhost:5000';

// API Functions

export async function openBrowser(): Promise<ApiResponse> {
    const response = await fetch(`${SIPEDE_API_URL}/api/scraper/open`, {
        method: 'POST',
    });
    return response.json();
}

export async function getStatus(): Promise<StatusResponse> {
    const response = await fetch(`${SIPEDE_API_URL}/api/scraper/status`);
    return response.json();
}

export async function navigateTo(url: string): Promise<ApiResponse> {
    const response = await fetch(`${SIPEDE_API_URL}/api/scraper/navigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });
    return response.json();
}

export async function detectTable(): Promise<DetectTableResponse> {
    const response = await fetch(`${SIPEDE_API_URL}/api/scraper/detect-table`);
    return response.json();
}

export async function startScraping(maxPages: number = 0): Promise<ApiResponse> {
    const response = await fetch(`${SIPEDE_API_URL}/api/scraper/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPages }),
    });
    return response.json();
}

export async function closeBrowser(): Promise<ApiResponse> {
    const response = await fetch(`${SIPEDE_API_URL}/api/scraper/close`, {
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

    const response = await fetch(`${SIPEDE_API_URL}/api/scraper/data?${params}`);
    return response.json();
}

export function getExportJsonUrl(): string {
    return `${SIPEDE_API_URL}/api/scraper/export/json`;
}

export function getExportCsvUrl(): string {
    return `${SIPEDE_API_URL}/api/scraper/export/csv`;
}

export async function clearData(): Promise<ApiResponse> {
    const response = await fetch(`${SIPEDE_API_URL}/api/scraper/clear`, {
        method: 'POST',
    });
    return response.json();
}
