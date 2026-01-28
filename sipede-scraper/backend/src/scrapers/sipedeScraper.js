// SIPEDE Scraper Service using Playwright
// Semi-automated: User logs in manually, then scraper takes over

const { chromium } = require('playwright');

class SipedeScraper {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.baseUrl = 'https://sipede.kejaksaan.go.id';
        this.isReady = false;
        this.currentUrl = null;
        this.detectedHeaders = [];
    }

    /**
     * Open browser with SIPEDE login page (visible mode for manual login)
     */
    async openBrowser() {
        try {
            // Check if running in production (Railway) - use headless mode
            const isProduction = process.env.NODE_ENV === 'production';
            
            // Launch browser (headless in production, visible in development)
            this.browser = await chromium.launch({
                headless: isProduction,
                args: isProduction 
                    ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                    : ['--start-maximized']
            });

            this.context = await this.browser.newContext({
                viewport: isProduction ? { width: 1920, height: 1080 } : null,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            });

            this.page = await this.context.newPage();
            this.page.setDefaultTimeout(60000);

            // Navigate to login page
            await this.page.goto(`${this.baseUrl}/login`, {
                waitUntil: 'networkidle'
            });

            this.currentUrl = this.page.url();

            return {
                success: true,
                message: 'Browser opened. Please login manually and navigate to the data page.',
                url: this.currentUrl
            };
        } catch (error) {
            console.error('Open browser error:', error);
            return {
                success: false,
                message: `Failed to open browser: ${error.message}`
            };
        }
    }

    /**
     * Get current browser status and URL
     */
    async getBrowserStatus() {
        try {
            if (!this.page) {
                return {
                    isOpen: false,
                    url: null,
                    isReady: false
                };
            }

            this.currentUrl = this.page.url();
            const isLoggedIn = !this.currentUrl.includes('/login');

            return {
                isOpen: true,
                url: this.currentUrl,
                isLoggedIn: isLoggedIn,
                isReady: this.isReady
            };
        } catch (error) {
            return {
                isOpen: false,
                url: null,
                isReady: false,
                error: error.message
            };
        }
    }

    /**
     * Navigate to a specific URL in the browser
     */
    async navigateTo(url) {
        try {
            if (!this.page) {
                return { success: false, message: 'Browser not open' };
            }

            await this.page.goto(url, { waitUntil: 'networkidle' });
            this.currentUrl = this.page.url();

            return {
                success: true,
                url: this.currentUrl
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Clean text content
     */
    cleanText(text) {
        if (!text) return '';
        return text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
    }

    /**
     * Detect filters (year dropdown, etc.) on current page
     */
    async detectFilters() {
        try {
            if (!this.page) {
                return { success: false, filters: [] };
            }

            const filters = await this.page.evaluate(() => {
                const result = [];

                // Find all select elements that might be filters
                const selects = document.querySelectorAll('select');

                selects.forEach((select, index) => {
                    const name = select.name || select.id || `filter_${index}`;
                    const label = select.previousElementSibling?.textContent?.trim() ||
                        select.closest('label')?.textContent?.trim() ||
                        select.getAttribute('aria-label') ||
                        name;

                    const selectedOption = select.options[select.selectedIndex];
                    const selectedValue = selectedOption?.value || '';
                    const selectedText = selectedOption?.textContent?.trim() || '';

                    // Get all options
                    const options = Array.from(select.options).map(opt => ({
                        value: opt.value,
                        text: opt.textContent?.trim() || ''
                    }));

                    // Check if this looks like a year filter
                    const isYearFilter = label.toLowerCase().includes('tahun') ||
                        name.toLowerCase().includes('tahun') ||
                        name.toLowerCase().includes('year') ||
                        /^\d{4}$/.test(selectedValue);

                    result.push({
                        name: name,
                        label: label,
                        selectedValue: selectedValue,
                        selectedText: selectedText,
                        options: options,
                        isYearFilter: isYearFilter
                    });
                });

                return result;
            });

            // Find the year filter specifically
            const yearFilter = filters.find(f => f.isYearFilter);

            return {
                success: true,
                filters: filters,
                yearFilter: yearFilter ? {
                    name: yearFilter.label || yearFilter.name,
                    selectedYear: yearFilter.selectedText || yearFilter.selectedValue,
                    availableYears: yearFilter.options.map(o => o.text || o.value).filter(y => y)
                } : null
            };
        } catch (error) {
            return {
                success: false,
                filters: [],
                error: error.message
            };
        }
    }

    /**
     * Detect pagination info
     */
    async detectPagination() {
        try {
            if (!this.page) {
                return { success: false };
            }

            const paginationInfo = await this.page.evaluate(() => {
                let totalEntries = 0;
                let currentPage = 1;
                let totalPages = 1;
                let entriesPerPage = 10;

                // Try to find "Showing X to Y of Z entries" text
                const infoSelectors = [
                    '.dataTables_info',
                    '.pagination-info',
                    '[class*="info"]',
                    '.showing-info',
                    'div:has-text("Showing")',
                    'div:has-text("entries")'
                ];

                for (const selector of infoSelectors) {
                    try {
                        const el = document.querySelector(selector);
                        if (el) {
                            const text = el.textContent || '';

                            // Match "Showing X to Y of Z entries" pattern
                            const match = text.match(/showing\s+(\d+)\s+to\s+(\d+)\s+of\s+(\d+)/i) ||
                                text.match(/(\d+)\s*-\s*(\d+)\s+dari\s+(\d+)/i) ||
                                text.match(/(\d+)\s+to\s+(\d+)\s+of\s+(\d+)/i);

                            if (match) {
                                const from = parseInt(match[1]);
                                const to = parseInt(match[2]);
                                totalEntries = parseInt(match[3]);
                                entriesPerPage = to - from + 1;
                                currentPage = Math.floor(from / entriesPerPage) + 1;
                                totalPages = Math.ceil(totalEntries / entriesPerPage);
                                break;
                            }

                            // Try simpler pattern "Total: X"
                            const totalMatch = text.match(/total[:\s]+(\d+)/i);
                            if (totalMatch) {
                                totalEntries = parseInt(totalMatch[1]);
                                break;
                            }
                        }
                    } catch (e) {
                        // Continue to next selector
                    }
                }

                // If not found, try counting pagination buttons
                if (totalPages === 1) {
                    const paginationLinks = document.querySelectorAll('.pagination a, .pagination li, .paginate_button');
                    let maxPage = 1;
                    paginationLinks.forEach(link => {
                        const num = parseInt(link.textContent);
                        if (!isNaN(num) && num > maxPage) {
                            maxPage = num;
                        }
                    });
                    if (maxPage > 1) {
                        totalPages = maxPage;
                    }
                }

                // Find active page
                const activePage = document.querySelector('.pagination .active a, .paginate_button.current');
                if (activePage) {
                    const num = parseInt(activePage.textContent);
                    if (!isNaN(num)) {
                        currentPage = num;
                    }
                }

                // Count rows on current page if we couldn't get entriesPerPage
                if (entriesPerPage === 10) {
                    const rows = document.querySelectorAll('table tbody tr');
                    if (rows.length > 0) {
                        entriesPerPage = rows.length;
                    }
                }

                // Estimate total entries if we only have page count
                if (totalEntries === 0 && totalPages > 1) {
                    totalEntries = totalPages * entriesPerPage;
                }

                return {
                    totalEntries,
                    currentPage,
                    totalPages,
                    entriesPerPage
                };
            });

            return {
                success: true,
                ...paginationInfo
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Detect table structure on current page - ENHANCED
     */
    async detectTableStructure() {
        try {
            if (!this.page) {
                return { success: false, message: 'Browser not open' };
            }

            // Wait for table
            await this.page.waitForSelector('table', { timeout: 10000 });

            // Get table headers
            let headers = await this.page.evaluate(() => {
                const table = document.querySelector('table');
                if (!table) return [];

                const thead = table.querySelector('thead');
                if (thead) {
                    const headerCells = thead.querySelectorAll('th, td');
                    return Array.from(headerCells)
                        .map(cell => cell.textContent?.replace(/\s+/g, ' ').trim() || '')
                        .filter(h => h.length > 0);
                }

                const firstRow = table.querySelector('tr');
                if (firstRow) {
                    const cells = firstRow.querySelectorAll('th, td');
                    return Array.from(cells)
                        .map(cell => cell.textContent?.replace(/\s+/g, ' ').trim() || '')
                        .filter(h => h.length > 0);
                }

                return [];
            });

            headers = headers.map(h => this.cleanText(h)).filter(h => h.length > 0);
            this.detectedHeaders = headers;

            // Get row count
            const rowCount = await this.page.$$eval('table tbody tr', rows => rows.length);

            // Get filters
            const filtersResult = await this.detectFilters();

            // Get pagination
            const paginationResult = await this.detectPagination();

            return {
                success: true,
                headers: headers,
                rowCount: rowCount,
                // Filter info
                yearFilter: filtersResult.yearFilter,
                filters: filtersResult.filters,
                // Pagination info
                pagination: {
                    totalEntries: paginationResult.totalEntries || 0,
                    totalPages: paginationResult.totalPages || 1,
                    currentPage: paginationResult.currentPage || 1,
                    entriesPerPage: paginationResult.entriesPerPage || rowCount
                },
                currentUrl: this.page.url()
            };
        } catch (error) {
            return {
                success: false,
                message: `Could not detect table: ${error.message}`
            };
        }
    }

    /**
     * Scrape data from current page
     */
    async scrapeCurrentPage() {
        try {
            if (!this.page) {
                return [];
            }

            await this.page.waitForSelector('table tbody tr', { timeout: 10000 });

            const data = await this.page.evaluate(() => {
                const table = document.querySelector('table');
                if (!table) return [];

                // Get headers
                let headers = [];
                const thead = table.querySelector('thead');
                if (thead) {
                    const headerCells = thead.querySelectorAll('th, td');
                    headers = Array.from(headerCells).map((cell, index) => {
                        const text = cell.textContent?.replace(/\s+/g, ' ').trim() || '';
                        return text || `kolom_${index + 1}`;
                    });
                } else {
                    const firstRow = table.querySelector('tr');
                    if (firstRow) {
                        const cells = firstRow.querySelectorAll('th, td');
                        headers = Array.from(cells).map((cell, index) => {
                            const text = cell.textContent?.replace(/\s+/g, ' ').trim() || '';
                            return text || `kolom_${index + 1}`;
                        });
                    }
                }

                const tbody = table.querySelector('tbody') || table;
                const rows = tbody.querySelectorAll('tr');
                const result = [];

                rows.forEach((row, rowIndex) => {
                    if (!thead && rowIndex === 0) return;

                    const cells = row.querySelectorAll('td');
                    if (cells.length === 0) return;

                    const rowData = {};
                    let hasContent = false;

                    cells.forEach((cell, cellIndex) => {
                        const headerName = headers[cellIndex] || `kolom_${cellIndex + 1}`;
                        if (!headerName || headerName.trim() === '') return;

                        let cellText = '';
                        const input = cell.querySelector('input, select');
                        if (input) {
                            cellText = input.value || '';
                        } else {
                            cellText = cell.textContent?.replace(/\s+/g, ' ').trim() || '';
                        }

                        if (cellText) {
                            hasContent = true;
                        }

                        rowData[headerName] = cellText;
                    });

                    if (hasContent) {
                        result.push(rowData);
                    }
                });

                return result;
            });

            // Remove empty columns
            if (data.length > 0) {
                const allKeys = Object.keys(data[0]);
                const emptyColumns = allKeys.filter(key =>
                    data.every(row => !row[key] || row[key].trim() === '')
                );
                data.forEach(row => {
                    emptyColumns.forEach(col => delete row[col]);
                });
            }

            return data;
        } catch (error) {
            console.error('Error scraping page:', error);
            return [];
        }
    }

    /**
     * Click next page button
     */
    async goToNextPage() {
        try {
            if (!this.page) return false;

            const nextSelectors = [
                '.pagination .next:not(.disabled) a',
                '.paginate_button.next:not(.disabled)',
                'a.page-link[aria-label="Next"]',
                'li.next:not(.disabled) a',
                'a:has-text("Next")',
                'a:has-text("»")',
                'a:has-text(">")',
                'button:has-text("Next")',
                '.pagination a:has-text("›")',
                'ul.pagination li:last-child:not(.disabled) a'
            ];

            for (const selector of nextSelectors) {
                try {
                    const nextBtn = await this.page.$(selector);
                    if (nextBtn) {
                        const isVisible = await nextBtn.isVisible();
                        if (!isVisible) continue;

                        const isDisabled = await nextBtn.evaluate(el =>
                            el.classList.contains('disabled') ||
                            el.parentElement?.classList.contains('disabled') ||
                            el.getAttribute('aria-disabled') === 'true' ||
                            el.hasAttribute('disabled')
                        );

                        if (!isDisabled) {
                            await nextBtn.click();
                            await this.page.waitForLoadState('networkidle');
                            await this.page.waitForTimeout(1000);
                            return true;
                        }
                    }
                } catch (e) {
                    // Try next selector
                }
            }

            return false;
        } catch (error) {
            console.error('Error going to next page:', error);
            return false;
        }
    }

    /**
     * Scrape all pages from current position
     */
    async scrapeAllPages(onProgress = null, maxPages = 0) {
        const allData = [];
        let pageNum = 1;
        let hasMore = true;
        let consecutiveEmptyPages = 0;

        try {
            while (hasMore) {
                const pageData = await this.scrapeCurrentPage();

                if (pageData.length === 0) {
                    consecutiveEmptyPages++;
                    if (consecutiveEmptyPages >= 3) {
                        console.log('3 consecutive empty pages, stopping...');
                        break;
                    }
                } else {
                    consecutiveEmptyPages = 0;
                    allData.push(...pageData);
                }

                if (onProgress) {
                    onProgress(pageNum, pageData);
                }

                console.log(`Scraped page ${pageNum}: ${pageData.length} items (total: ${allData.length})`);

                if (maxPages > 0 && pageNum >= maxPages) {
                    break;
                }

                hasMore = await this.goToNextPage();
                if (hasMore) {
                    pageNum++;
                    await this.page.waitForTimeout(500);
                }
            }

            return {
                success: true,
                data: allData,
                pagesScraped: pageNum,
                message: `Successfully scraped ${allData.length} items from ${pageNum} pages`
            };
        } catch (error) {
            return {
                success: false,
                data: allData,
                pagesScraped: pageNum,
                message: `Error after ${pageNum} pages: ${error.message}`
            };
        }
    }

    /**
     * Take screenshot
     */
    async screenshot(filename = 'screenshot.png') {
        if (!this.page) return null;
        return await this.page.screenshot({ path: filename, fullPage: true });
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
            this.isReady = false;
            this.detectedHeaders = [];
        }
    }
}

module.exports = SipedeScraper;
