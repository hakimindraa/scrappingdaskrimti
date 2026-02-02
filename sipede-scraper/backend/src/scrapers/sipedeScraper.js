// SIPEDE Scraper Service using Playwright
// Semi-automated: User logs in manually, then scraper takes over

const { chromium } = require('playwright');

class SipedeScraper {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.baseUrl = 'https://sipede.kejaksaan.go.id';
        this.targetDataUrl = 'https://sipede.kejaksaan.go.id/suratterkirim?type=terkirim';
        this.isReady = false;
        this.currentUrl = null;
        this.detectedHeaders = [];
        this.availableYears = [];
        this.selectedYear = null;
        // Status callback for real-time updates to frontend
        this.statusCallback = null;
    }

    /**
     * Set status callback for real-time updates
     */
    setStatusCallback(callback) {
        this.statusCallback = callback;
    }

    /**
     * Update status (sends to frontend via callback)
     */
    updateStatus(phase, message, currentPage = null) {
        if (this.statusCallback) {
            this.statusCallback(phase, message, currentPage);
        }
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
                message: 'Browser opened. Please login manually.',
                url: this.currentUrl,
                targetUrl: this.targetDataUrl
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
     * Wait for user to login and then navigate to data page
     */
    async waitForLoginAndNavigate() {
        try {
            if (!this.page) {
                return { success: false, message: 'Browser not open' };
            }

            // Check if still on login page
            this.currentUrl = this.page.url();
            if (this.currentUrl.includes('/login')) {
                return { 
                    success: false, 
                    message: 'Please login first. Waiting for login...',
                    isLoggedIn: false 
                };
            }

            // User is logged in, navigate to data page
            console.log('User logged in, navigating to data page:', this.targetDataUrl);
            
            try {
                // Navigate to target data URL
                await this.page.goto(this.targetDataUrl, { 
                    waitUntil: 'domcontentloaded',
                    timeout: 60000 
                });
                
                // Wait for page to stabilize
                await this.page.waitForTimeout(3000);
                
                // Wait for network to be idle
                await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
                    console.log('Network idle timeout, continuing anyway...');
                });
                
            } catch (navError) {
                console.log('Navigation error, trying alternative approach:', navError.message);
                // Try clicking menu/link if direct navigation fails
                try {
                    // Look for menu link to "Surat Terkirim"
                    const menuSelectors = [
                        'a:has-text("Surat Terkirim")',
                        'a[href*="suratterkirim"]',
                        'a[href*="type=terkirim"]'
                    ];
                    for (const selector of menuSelectors) {
                        const menuLink = await this.page.$(selector);
                        if (menuLink) {
                            await menuLink.click();
                            await this.page.waitForLoadState('networkidle', { timeout: 30000 });
                            break;
                        }
                    }
                } catch (e) {
                    console.log('Alternative navigation also failed:', e.message);
                }
            }
            
            // Wait for table to appear (indicates data page loaded)
            try {
                await this.page.waitForSelector('table', { timeout: 15000 });
                console.log('Table found on page');
            } catch (e) {
                console.log('Table not found immediately, waiting more...');
                await this.page.waitForTimeout(3000);
            }
            
            this.currentUrl = this.page.url();
            console.log('Current URL after navigation:', this.currentUrl);

            // Detect available years after navigation
            const yearsResult = await this.detectAvailableYears();
            
            return {
                success: true,
                message: 'Navigated to data page successfully',
                url: this.currentUrl,
                isLoggedIn: true,
                availableYears: yearsResult.years || [],
                selectedYear: yearsResult.selectedYear || null
            };
        } catch (error) {
            console.error('Navigation error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Detect available years from the year dropdown on the page
     */
    async detectAvailableYears() {
        try {
            if (!this.page) {
                return { success: false, years: [], selectedYear: null };
            }

            const yearsInfo = await this.page.evaluate(() => {
                // Find year filter dropdown - look for select with year options
                const selects = document.querySelectorAll('select');
                
                for (const select of selects) {
                    const name = (select.name || select.id || '').toLowerCase();
                    const options = Array.from(select.options);
                    
                    // Check if this looks like a year filter
                    const hasYearOptions = options.some(opt => /^\d{4}$/.test(opt.value) || /^\d{4}$/.test(opt.text));
                    const isYearByName = name.includes('tahun') || name.includes('year');
                    
                    if (hasYearOptions || isYearByName) {
                        const years = options
                            .map(opt => opt.value || opt.text)
                            .filter(val => /^\d{4}$/.test(val));
                        
                        const selectedOption = select.options[select.selectedIndex];
                        const selectedYear = selectedOption ? (selectedOption.value || selectedOption.text) : null;
                        
                        return {
                            success: true,
                            years: years,
                            selectedYear: /^\d{4}$/.test(selectedYear) ? selectedYear : years[0] || null,
                            selectorInfo: { name: select.name, id: select.id }
                        };
                    }
                }
                
                return { success: false, years: [], selectedYear: null };
            });

            this.availableYears = yearsInfo.years || [];
            this.selectedYear = yearsInfo.selectedYear;
            
            return yearsInfo;
        } catch (error) {
            console.error('Error detecting years:', error);
            return { success: false, years: [], selectedYear: null, error: error.message };
        }
    }

    /**
     * Change the year filter on the page
     */
    async changeYear(year) {
        try {
            if (!this.page) {
                return { success: false, message: 'Browser not open' };
            }

            console.log(`Changing year filter to: ${year}`);
            
            // First make sure we're on the correct page
            this.currentUrl = this.page.url();
            if (!this.currentUrl.includes('suratterkirim') && !this.currentUrl.includes('type=terkirim')) {
                console.log('Not on data page, navigating first...');
                try {
                    await this.page.goto(this.targetDataUrl, { 
                        waitUntil: 'domcontentloaded',
                        timeout: 30000 
                    });
                    await this.page.waitForTimeout(2000);
                    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
                } catch (e) {
                    console.log('Navigation error:', e.message);
                }
            }

            // Wait for page to have the year dropdown
            await this.page.waitForTimeout(2000);

            const result = await this.page.evaluate((targetYear) => {
                const selects = document.querySelectorAll('select');
                
                for (const select of selects) {
                    const name = (select.name || select.id || '').toLowerCase();
                    const options = Array.from(select.options);
                    
                    const hasYearOptions = options.some(opt => /^\d{4}$/.test(opt.value) || /^\d{4}$/.test(opt.text));
                    const isYearByName = name.includes('tahun') || name.includes('year');
                    
                    if (hasYearOptions || isYearByName) {
                        // Find the option with matching year
                        for (let i = 0; i < select.options.length; i++) {
                            const opt = select.options[i];
                            if (opt.value === targetYear || opt.text === targetYear) {
                                select.selectedIndex = i;
                                // Trigger change event
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                return { success: true, selectedYear: targetYear };
                            }
                        }
                        return { success: false, message: `Year ${targetYear} not found in dropdown` };
                    }
                }
                
                return { success: false, message: 'Year filter dropdown not found' };
            }, year);

            if (result.success) {
                // Wait for page to reload/update after year change
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(2000);
                
                this.selectedYear = year;
                this.currentUrl = this.page.url();
            }

            return result;
        } catch (error) {
            console.error('Error changing year:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Set entries per page (10, 25, 50, 100) to speed up scraping
     */
    async setEntriesPerPage(entries = 100) {
        try {
            if (!this.page) {
                return { success: false, message: 'Browser not open' };
            }

            console.log(`[INFO] Setting entries per page to: ${entries}`);

            // Wait for page to be ready
            await this.page.waitForTimeout(1000);

            const result = await this.page.evaluate((targetEntries) => {
                // Find the entries per page dropdown (usually has options 10, 25, 50, 100)
                const selects = document.querySelectorAll('select');
                
                for (const select of selects) {
                    const options = Array.from(select.options);
                    
                    // Check if this looks like entries per page selector
                    const hasEntriesOptions = options.some(opt => 
                        ['10', '25', '50', '100'].includes(opt.value) || 
                        ['10', '25', '50', '100'].includes(opt.text.trim())
                    );
                    
                    // Also check by name/id
                    const name = (select.name || select.id || '').toLowerCase();
                    const isEntriesByName = name.includes('length') || name.includes('entries') || name.includes('pagesize') || name.includes('perpage');
                    
                    if (hasEntriesOptions || isEntriesByName) {
                        // Find the option with target value
                        for (let i = 0; i < select.options.length; i++) {
                            const opt = select.options[i];
                            if (opt.value === String(targetEntries) || opt.text.trim() === String(targetEntries)) {
                                select.selectedIndex = i;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                return { success: true, entriesPerPage: targetEntries };
                            }
                        }
                        
                        // If exact value not found, try the highest available
                        const availableValues = options.map(o => parseInt(o.value)).filter(v => !isNaN(v));
                        if (availableValues.length > 0) {
                            const maxValue = Math.max(...availableValues);
                            for (let i = 0; i < select.options.length; i++) {
                                if (parseInt(select.options[i].value) === maxValue) {
                                    select.selectedIndex = i;
                                    select.dispatchEvent(new Event('change', { bubbles: true }));
                                    return { success: true, entriesPerPage: maxValue, message: `Set to max available: ${maxValue}` };
                                }
                            }
                        }
                    }
                }
                
                return { success: false, message: 'Entries per page dropdown not found' };
            }, entries);

            if (result.success) {
                // Wait for page to reload/update
                await this.page.waitForLoadState('networkidle');
                await this.page.waitForTimeout(2000);
                console.log(`[INFO] Entries per page set to: ${result.entriesPerPage}`);
            }

            return result;
        } catch (error) {
            console.error('Error setting entries per page:', error);
            return { success: false, message: error.message };
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
                    const pageNumbers = [];
                    
                    paginationLinks.forEach(link => {
                        const text = link.textContent.trim();
                        const num = parseInt(text);
                        // Only consider numbers that are likely page numbers (not total entries like 790)
                        // Page numbers are typically small (< 200) and the text should be just the number
                        if (!isNaN(num) && num > 0 && num < 200 && text === String(num)) {
                            pageNumbers.push(num);
                        }
                    });
                    
                    if (pageNumbers.length > 0) {
                        maxPage = Math.max(...pageNumbers);
                        totalPages = maxPage;
                    }
                }

                // Find active page
                const activePage = document.querySelector('.pagination .active a, .paginate_button.current');
                if (activePage) {
                    const text = activePage.textContent.trim();
                    const num = parseInt(text);
                    // Only accept if it looks like a real page number (< 200)
                    if (!isNaN(num) && num > 0 && num < 200 && text === String(num)) {
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

            // First check current URL and navigate if needed
            this.currentUrl = this.page.url();
            console.log('[detectTableStructure] Current URL:', this.currentUrl);
            
            // If not on the target data page, navigate there
            if (!this.currentUrl.includes('suratterkirim') && !this.currentUrl.includes('type=terkirim')) {
                console.log('[detectTableStructure] Not on data page, navigating...');
                try {
                    await this.page.goto(this.targetDataUrl, { 
                        waitUntil: 'domcontentloaded',
                        timeout: 30000 
                    });
                    await this.page.waitForTimeout(3000);
                    await this.page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
                    this.currentUrl = this.page.url();
                    console.log('[detectTableStructure] Navigated to:', this.currentUrl);
                } catch (navErr) {
                    console.log('[detectTableStructure] Navigation failed:', navErr.message);
                }
            }

            // Wait for table with longer timeout
            try {
                await this.page.waitForSelector('table', { timeout: 30000 });
            } catch (e) {
                // Try to find any table-like structure
                console.log('[detectTableStructure] Table not found with selector, checking page content...');
                const hasTable = await this.page.evaluate(() => {
                    return document.querySelector('table') !== null;
                });
                if (!hasTable) {
                    // Take screenshot for debugging
                    console.log('[detectTableStructure] No table found on page');
                    return { 
                        success: false, 
                        message: 'No table found on page. Please make sure you are on the correct data page.',
                        currentUrl: this.currentUrl
                    };
                }
            }

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

            // Get current page number first
            const currentPageInfo = await this.detectPagination();
            const currentPage = currentPageInfo.currentPage || 1;
            const nextPageNum = currentPage + 1;
            
            console.log(`[DEBUG] Current page: ${currentPage}, trying to go to page ${nextPageNum}`);
            
            // Update status: navigating to next page
            this.updateStatus('navigating', `Pindah ke halaman ${nextPageNum}...`, currentPage);

            // Get current page content for verification
            const oldFirstRow = await this.page.evaluate(() => {
                const firstRow = document.querySelector('table tbody tr');
                return firstRow ? firstRow.textContent.substring(0, 100) : '';
            });

            // Helper function to wait for page change with longer timeout
            const waitForPageChange = async (maxWaitTime = 15000) => {
                const startTime = Date.now();
                let elapsed = 0;
                while (Date.now() - startTime < maxWaitTime) {
                    await this.page.waitForTimeout(1000);
                    elapsed = Math.round((Date.now() - startTime) / 1000);
                    
                    // Update status with elapsed time
                    this.updateStatus('waiting', `Menunggu halaman ${nextPageNum} dimuat... (${elapsed}s)`, currentPage);
                    
                    const newFirstRow = await this.page.evaluate(() => {
                        const firstRow = document.querySelector('table tbody tr');
                        return firstRow ? firstRow.textContent.substring(0, 100) : '';
                    });
                    if (newFirstRow !== oldFirstRow) {
                        console.log('[DEBUG] Page content changed after', Date.now() - startTime, 'ms');
                        return true;
                    }
                }
                return false;
            };

            // Strategy 1: Try clicking the specific next page number
            const clickedPageNumber = await this.page.evaluate((targetPage) => {
                const paginationLinks = document.querySelectorAll('.pagination a, .pagination li a, .paginate_button');
                for (const link of paginationLinks) {
                    const text = link.textContent.trim();
                    if (text === String(targetPage)) {
                        link.click();
                        return true;
                    }
                }
                return false;
            }, nextPageNum);

            if (clickedPageNumber) {
                console.log(`[DEBUG] Clicked page number ${nextPageNum} directly, waiting for load...`);
                
                // Wait for network with longer timeout
                await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
                    console.log('[DEBUG] Network idle timeout, checking if page changed anyway...');
                });
                
                // Wait for page content to change
                if (await waitForPageChange(15000)) {
                    console.log('[DEBUG] Navigation successful via page number click');
                    return true;
                }
            }

            // Strategy 2: Click the ">" button (single arrow, not double ">>" or "»")
            const nextSelectors = [
                '.pagination .next:not(.disabled) a',
                '.paginate_button.next:not(.disabled)',
                'a.page-link[aria-label="Next"]',
                'li.next:not(.disabled) a',
                'button:has-text("Next")',
                '.pagination a:has-text("›")'
            ];

            for (const selector of nextSelectors) {
                try {
                    const nextBtn = await this.page.$(selector);
                    if (nextBtn) {
                        const buttonText = await nextBtn.evaluate(el => el.textContent.trim());
                        
                        // Skip last page buttons
                        if (buttonText === '»' || buttonText === '>>' || buttonText === '»»') {
                            console.log(`[DEBUG] Skipping last page button: ${buttonText}`);
                            continue;
                        }
                        
                        const isVisible = await nextBtn.isVisible();
                        if (!isVisible) continue;

                        const isDisabled = await nextBtn.evaluate(el =>
                            el.classList.contains('disabled') ||
                            el.parentElement?.classList.contains('disabled') ||
                            el.getAttribute('aria-disabled') === 'true' ||
                            el.hasAttribute('disabled')
                        );

                        if (!isDisabled) {
                            console.log(`[DEBUG] Clicking next with selector: ${selector}, text: ${buttonText}`);
                            await nextBtn.click();
                            
                            // Wait for network with longer timeout
                            await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
                                console.log('[DEBUG] Network idle timeout, checking if page changed anyway...');
                            });
                            
                            // Wait for page content to change
                            if (await waitForPageChange(15000)) {
                                console.log('[DEBUG] Navigation successful via selector');
                                return true;
                            }
                        }
                    }
                } catch (e) {
                    // Try next selector
                }
            }

            // Strategy 3: Find and click the ">" button specifically by exact text match
            const clickedSingleArrow = await this.page.evaluate(() => {
                const allLinks = document.querySelectorAll('.pagination a, .pagination li a, a.page-link');
                for (const link of allLinks) {
                    const text = link.textContent.trim();
                    if (text === '>' || text === '›' || text.toLowerCase() === 'next') {
                        const parent = link.parentElement;
                        if (!link.classList.contains('disabled') && 
                            !parent?.classList.contains('disabled')) {
                            link.click();
                            return text;
                        }
                    }
                }
                return null;
            });

            if (clickedSingleArrow) {
                console.log(`[DEBUG] Clicked single arrow: ${clickedSingleArrow}, waiting for load...`);
                
                await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
                    console.log('[DEBUG] Network idle timeout, checking if page changed anyway...');
                });
                
                if (await waitForPageChange(15000)) {
                    console.log('[DEBUG] Navigation successful via arrow click');
                    return true;
                }
            }

            console.log('[DEBUG] Could not find next page button or page did not change');
            return false;
        } catch (error) {
            console.error('Error going to next page:', error);
            return false;
        }
    }

    /**
     * Go to a specific page number by clicking on it directly
     */
    async goToPageNumber(pageNumber) {
        try {
            if (!this.page) return false;

            console.log(`[DEBUG] Trying to go to page ${pageNumber} directly`);

            // Get current content for verification
            const oldFirstRow = await this.page.evaluate(() => {
                const firstRow = document.querySelector('table tbody tr');
                return firstRow ? firstRow.textContent.substring(0, 100) : '';
            });

            // Try to click the page number directly
            const clicked = await this.page.evaluate((targetPage) => {
                const pageStr = String(targetPage);
                
                const selectors = [
                    '.pagination a',
                    '.pagination li a',
                    '.paginate_button',
                    'a.page-link',
                    'ul.pagination li a'
                ];
                
                for (const selector of selectors) {
                    const links = document.querySelectorAll(selector);
                    for (const link of links) {
                        const text = link.textContent.trim();
                        if (text === pageStr) {
                            const parent = link.parentElement;
                            if (!link.classList.contains('disabled') && 
                                !parent?.classList.contains('disabled') &&
                                !link.classList.contains('active') &&
                                !parent?.classList.contains('active')) {
                                link.click();
                                return true;
                            }
                        }
                    }
                }
                return false;
            }, pageNumber);

            if (clicked) {
                console.log(`[DEBUG] Clicked page ${pageNumber}, waiting for load...`);
                
                // Wait for network with longer timeout
                await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
                    console.log('[DEBUG] Network idle timeout, checking if page changed anyway...');
                });
                
                // Wait for page content to change with polling
                const startTime = Date.now();
                const maxWaitTime = 15000;
                
                while (Date.now() - startTime < maxWaitTime) {
                    await this.page.waitForTimeout(1000);
                    const newFirstRow = await this.page.evaluate(() => {
                        const firstRow = document.querySelector('table tbody tr');
                        return firstRow ? firstRow.textContent.substring(0, 100) : '';
                    });
                    
                    if (newFirstRow !== oldFirstRow) {
                        console.log(`[DEBUG] Successfully navigated to page ${pageNumber} after ${Date.now() - startTime}ms`);
                        return true;
                    }
                }
                
                console.log(`[DEBUG] Page ${pageNumber} clicked but content did not change after ${maxWaitTime}ms`);
            }

            return false;
        } catch (error) {
            console.error(`Error going to page ${pageNumber}:`, error);
            return false;
        }
    }

    /**
     * Scrape all pages from current position
     */
    async scrapeAllPages(onProgress = null, maxPages = 0) {
        const allData = [];
        const seenRows = new Set(); // For deduplication
        let pageNum = 1;
        let hasMore = true;
        let consecutiveFailures = 0;
        let noProgressCount = 0; // Track if we're stuck

        try {
            // Note: entries per page should be set by user from frontend dropdown
            // Don't auto-set here anymore
            
            // Wait for table to be ready
            await this.page.waitForTimeout(1000);

            // Get pagination info first
            const paginationInfo = await this.detectPagination();
            let totalPages = paginationInfo.totalPages || 1;
            
            // Sanity check: total pages should be reasonable (< 1000)
            if (totalPages > 1000) {
                console.log(`[WARNING] Total pages (${totalPages}) seems too high, capping at 1000`);
                totalPages = 1000;
            }
            
            console.log(`[INFO] Starting scrape: estimated ${totalPages} pages, ${paginationInfo.totalEntries || 'unknown'} entries`);
            console.log(`[INFO] Entries per page: ${paginationInfo.entriesPerPage || 'unknown'}`);
            
            // Update status: starting
            this.updateStatus('scraping', `Memulai scraping ${totalPages} halaman...`, 0);

            if (maxPages > 0 && maxPages < totalPages) {
                totalPages = maxPages;
            }

            while (hasMore && consecutiveFailures < 3) {
                // Verify current page number from DOM
                const currentPaginationInfo = await this.detectPagination();
                const actualPage = currentPaginationInfo.currentPage || pageNum;
                
                console.log(`[INFO] Scraping page ${pageNum} (DOM says: ${actualPage}) of ${totalPages}...`);
                
                // Update status: scraping current page
                this.updateStatus('scraping', `Mengambil data halaman ${pageNum} dari ${totalPages}...`, pageNum);
                
                const pageData = await this.scrapeCurrentPage();

                if (pageData.length === 0) {
                    consecutiveFailures++;
                    console.log(`[WARNING] Page ${pageNum}: no data (failure ${consecutiveFailures}/3)`);
                    this.updateStatus('waiting', `Halaman ${pageNum} kosong, mencoba ulang... (${consecutiveFailures}/3)`, pageNum);
                } else {
                    // Deduplicate
                    let newRows = 0;
                    for (const row of pageData) {
                        const rowKey = JSON.stringify(Object.entries(row).sort());
                        if (!seenRows.has(rowKey)) {
                            seenRows.add(rowKey);
                            allData.push(row);
                            newRows++;
                        }
                    }
                    
                    console.log(`[INFO] Page ${pageNum}: ${pageData.length} rows, ${newRows} new (total: ${allData.length})`);
                    
                    // Update status with current data count
                    this.updateStatus('scraping', `Halaman ${pageNum}: ${newRows} data baru (total: ${allData.length})`, pageNum);
                    
                    if (newRows === 0) {
                        consecutiveFailures++;
                        console.log(`[WARNING] All rows were duplicates!`);
                    } else {
                        consecutiveFailures = 0;
                    }
                }

                if (onProgress) {
                    // Pass total count as third parameter
                    onProgress(pageNum, pageData, allData.length);
                }

                if (maxPages > 0 && pageNum >= maxPages) {
                    console.log(`[INFO] Reached max pages limit: ${maxPages}`);
                    break;
                }

                if (pageNum >= totalPages) {
                    console.log(`[INFO] Reached last page: ${totalPages}`);
                    break;
                }

                // Try to go to next page with extra wait time for slow SIPEDE server
                console.log(`[INFO] Attempting to navigate to page ${pageNum + 1}...`);
                
                // Wait a bit before trying to navigate (SIPEDE is slow)
                await this.page.waitForTimeout(2000);
                
                hasMore = await this.goToNextPage();
                
                if (hasMore) {
                    pageNum++;
                    noProgressCount = 0;
                    // Extra wait after successful navigation for SIPEDE slow loading
                    await this.page.waitForTimeout(3000);
                } else {
                    // First retry: wait longer and try again
                    console.log(`[INFO] First navigation attempt failed, waiting and retrying...`);
                    await this.page.waitForTimeout(5000);
                    
                    // Double check - maybe we can still go to next page by clicking page number directly
                    const retryResult = await this.goToPageNumber(pageNum + 1);
                    if (retryResult) {
                        pageNum++;
                        hasMore = true;
                        noProgressCount = 0;
                        await this.page.waitForTimeout(3000);
                    } else {
                        noProgressCount++;
                        if (noProgressCount >= 3) {
                            console.log(`[INFO] No more pages available after ${noProgressCount} retries`);
                            hasMore = false;
                        } else {
                            console.log(`[INFO] Retry ${noProgressCount}: Could not navigate, waiting longer and trying again...`);
                            // Wait even longer before next retry
                            await this.page.waitForTimeout(5000);
                            hasMore = true; // Try again
                        }
                    }
                }
            }

            console.log(`[INFO] Scraping complete: ${allData.length} items from ${pageNum} pages`);
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
