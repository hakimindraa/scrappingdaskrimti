const scraperService = require('../services/scraperService');
const { addLogInternal } = require('./activityController');
const dataController = require('./dataController');
const XLSX = require('xlsx');

// Store for scraped data and status (also loaded from database on startup)
let scrapedData = [];

// Load persisted data on module load
try {
    const loaded = dataController.loadData('SIPEDE');
    if (loaded.success && loaded.data.length > 0) {
        scrapedData = loaded.data;
        console.log(`[Controller] Loaded ${loaded.rowCount} persisted SIPEDE records from database`);
    }
} catch (error) {
    console.error('[Controller] Failed to load persisted data:', error);
}

let scrapeStatus = {
    browserOpen: false,
    isLoggedIn: false,
    isRunning: false,
    currentPage: 0,
    pagesScraped: 0,
    itemsScraped: 0,
    startTime: null,
    error: null,
    currentUrl: null,
    tableInfo: null,
    availableYears: [],
    selectedYear: null,
    // Detailed scraping status: 'idle' | 'scraping' | 'navigating' | 'waiting'
    scrapingPhase: 'idle',
    scrapingMessage: ''
};

// Export function to update scraping status (for service/scraper to use)
const updateScrapingStatus = (phase, message, currentPage = null) => {
    scrapeStatus.scrapingPhase = phase;
    scrapeStatus.scrapingMessage = message;
    if (currentPage !== null) {
        scrapeStatus.currentPage = currentPage;
    }
    console.log(`[STATUS] ${phase}: ${message}`);
};
exports.updateScrapingStatus = updateScrapingStatus;

/**
 * Open browser and go to SIPEDE login page
 */
exports.openBrowser = async (req, res) => {
    try {
        const result = await scraperService.openBrowser();

        if (result.success) {
            scrapeStatus.browserOpen = true;
            scrapeStatus.currentUrl = result.url;
        }

        res.json(result);
    } catch (error) {
        console.error('Open browser error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Check login status and navigate to data page
 */
exports.checkLoginAndNavigate = async (req, res) => {
    try {
        const result = await scraperService.waitForLoginAndNavigate();

        if (result.success) {
            scrapeStatus.isLoggedIn = true;
            scrapeStatus.currentUrl = result.url;
            scrapeStatus.availableYears = result.availableYears || [];
            scrapeStatus.selectedYear = result.selectedYear;
        }

        res.json({
            success: result.success,
            message: result.message,
            isLoggedIn: result.isLoggedIn || false,
            url: result.url,
            availableYears: result.availableYears || [],
            selectedYear: result.selectedYear
        });
    } catch (error) {
        console.error('Check login error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get available years
 */
exports.getAvailableYears = async (req, res) => {
    try {
        const result = await scraperService.getAvailableYears();

        scrapeStatus.availableYears = result.years || [];
        scrapeStatus.selectedYear = result.selectedYear;

        res.json({
            success: result.success,
            years: result.years || [],
            selectedYear: result.selectedYear
        });
    } catch (error) {
        console.error('Get years error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Change year filter
 */
exports.changeYear = async (req, res) => {
    try {
        const { year } = req.body;

        if (!year) {
            return res.status(400).json({
                success: false,
                message: 'Year is required'
            });
        }

        const result = await scraperService.changeYear(year);

        if (result.success) {
            scrapeStatus.selectedYear = year;
            // Clear previous data when changing year
            scrapedData = [];
            scrapeStatus.pagesScraped = 0;
            scrapeStatus.itemsScraped = 0;
            scrapeStatus.tableInfo = null;
        }

        res.json(result);
    } catch (error) {
        console.error('Change year error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Set entries per page
 */
exports.setEntriesPerPage = async (req, res) => {
    try {
        const { entries } = req.body;

        if (!entries || ![10, 25, 50, 100].includes(parseInt(entries))) {
            return res.status(400).json({
                success: false,
                message: 'Valid entries value required (10, 25, 50, or 100)'
            });
        }

        const result = await scraperService.setEntriesPerPage(parseInt(entries));

        if (result.success) {
            // Clear previous data when changing entries per page
            scrapedData = [];
            scrapeStatus.pagesScraped = 0;
            scrapeStatus.itemsScraped = 0;
            scrapeStatus.tableInfo = null;
        }

        res.json(result);
    } catch (error) {
        console.error('Set entries per page error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get browser status
 */
exports.getBrowserStatus = async (req, res) => {
    try {
        const browserStatus = await scraperService.getBrowserStatus();

        scrapeStatus.browserOpen = browserStatus.isOpen;
        scrapeStatus.isLoggedIn = browserStatus.isLoggedIn;
        scrapeStatus.currentUrl = browserStatus.url;

        res.json({
            success: true,
            data: {
                ...scrapeStatus,
                dataCount: scrapedData.length,
                elapsedTime: scrapeStatus.startTime
                    ? Math.round((Date.now() - scrapeStatus.startTime) / 1000)
                    : 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Detect table structure on current page
 */
exports.detectTable = async (req, res) => {
    try {
        const result = await scraperService.detectTableStructure();

        if (result.success) {
            scrapeStatus.tableInfo = result;
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Start scraping from current page
 */
exports.startScraping = async (req, res) => {
    try {
        if (scrapeStatus.isRunning) {
            return res.status(400).json({
                success: false,
                message: 'Scraping is already in progress'
            });
        }

        const { maxPages = 0 } = req.body;

        // Reset status
        scrapeStatus.isRunning = true;
        scrapeStatus.currentPage = 0;
        scrapeStatus.pagesScraped = 0;
        scrapeStatus.itemsScraped = 0;
        scrapeStatus.startTime = Date.now();
        scrapeStatus.error = null;
        scrapeStatus.scrapingPhase = 'scraping';
        scrapeStatus.scrapingMessage = 'Memulai scraping...';
        scrapedData = [];

        // Clear old data from database before starting new scrape
        dataController.clearData('SIPEDE');

        // Log activity: scraping started
        addLogInternal('info', `Scraping dimulai${scrapeStatus.selectedYear ? ` (tahun ${scrapeStatus.selectedYear})` : ''}`, 'SIPEDE');

        // Set up status callback for real-time updates
        scraperService.setStatusCallback((phase, message, currentPage) => {
            scrapeStatus.scrapingPhase = phase;
            scrapeStatus.scrapingMessage = message;
            if (currentPage !== null) {
                scrapeStatus.currentPage = currentPage;
            }
        });

        // Send immediate response
        res.json({
            success: true,
            message: 'Scraping started',
            status: scrapeStatus
        });

        // Progress callback - update status and items count
        const onProgress = (pageNum, pageData, totalItems) => {
            scrapeStatus.currentPage = pageNum;
            scrapeStatus.pagesScraped = pageNum;
            scrapeStatus.itemsScraped = totalItems; // Update items count in real-time
            console.log(`[Controller] Progress: page ${pageNum}, ${pageData.length} items on page, ${totalItems} total`);
        };

        // Start scraping in background
        const result = await scraperService.scrapeAllPages(onProgress, maxPages);

        // Use the deduplicated data from result
        if (result.success && result.data) {
            scrapedData = result.data;
            scrapeStatus.itemsScraped = result.data.length;
            console.log(`[Controller] Scraping complete: ${result.data.length} items from ${result.pagesScraped} pages`);
        }

        scrapeStatus.isRunning = false;
        scrapeStatus.scrapingPhase = 'idle';
        scrapeStatus.scrapingMessage = '';
        if (!result.success) {
            scrapeStatus.error = result.message;
            // Log activity: scraping error
            addLogInternal('error', `Scraping gagal${scrapeStatus.selectedYear ? ` (tahun ${scrapeStatus.selectedYear})` : ''}: ${result.message}`, 'SIPEDE');
        } else {
            // Save data to database for persistence
            const headers = scrapedData.length > 0 ? Object.keys(scrapedData[0]) : [];
            dataController.saveData('SIPEDE', headers, scrapedData, scrapeStatus.pagesScraped);
            // Log activity: scraping completed
            addLogInternal('success', `Scraping selesai${scrapeStatus.selectedYear ? ` tahun ${scrapeStatus.selectedYear}` : ''} - ${scrapedData.length} data dari ${scrapeStatus.pagesScraped} halaman`, 'SIPEDE');
        }
    } catch (error) {
        console.error('Scraping controller error:', error);
        scrapeStatus.isRunning = false;
        scrapeStatus.error = error.message;
    }
};

/**
 * Close browser
 */
exports.closeBrowser = async (req, res) => {
    try {
        await scraperService.close();

        scrapeStatus = {
            browserOpen: false,
            isLoggedIn: false,
            isRunning: false,
            currentPage: 0,
            pagesScraped: 0,
            itemsScraped: 0,
            startTime: null,
            error: null,
            currentUrl: null,
            tableInfo: null
        };

        res.json({ success: true, message: 'Browser closed' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Get all scraped data
 */
exports.getData = (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    let filteredData = scrapedData;

    // Apply search filter
    if (search) {
        const searchLower = search.toLowerCase();
        filteredData = scrapedData.filter(item =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchLower)
            )
        );
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    res.json({
        success: true,
        data: paginatedData,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredData.length,
            totalPages: Math.ceil(filteredData.length / limit)
        }
    });
};

/**
 * Export data to JSON
 */
exports.exportJson = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=sipede_data.json');
    res.json({
        exportedAt: new Date().toISOString(),
        totalItems: scrapedData.length,
        data: scrapedData
    });
};

/**
 * Export data to CSV
 */
exports.exportCsv = (req, res) => {
    if (scrapedData.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No data to export'
        });
    }

    // Get headers from first row
    const headers = Object.keys(scrapedData[0]);

    const csvRows = [headers.join(',')];

    scrapedData.forEach(item => {
        const row = headers.map(header => {
            const value = String(item[header] || '').replace(/"/g, '""');
            return `"${value}"`;
        });
        csvRows.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=sipede_data.csv');
    res.send('\uFEFF' + csvRows.join('\n'));
};

/**
 * Export data to Excel (.xlsx)
 */
exports.exportExcel = (req, res) => {
    if (scrapedData.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No data to export'
        });
    }

    try {
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(scrapedData);

        // Get headers for styling
        const headers = Object.keys(scrapedData[0]);

        // Set column widths based on content
        const colWidths = headers.map(header => {
            const maxLength = Math.max(
                header.length,
                ...scrapedData.map(row => String(row[header] || '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) }; // Max width 50
        });
        worksheet['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'SIPEDE Data');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Send response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sipede_data.xlsx');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to export Excel: ' + error.message
        });
    }
};

/**
 * Navigate to specific URL
 */
exports.navigateTo = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'URL is required'
            });
        }

        const result = await scraperService.navigateTo(url);

        if (result.success) {
            scrapeStatus.currentUrl = result.url;
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Clear all scraped data
 */
exports.clearData = (req, res) => {
    try {
        // Clear scraped data array
        scrapedData.length = 0;

        // Clear from database
        dataController.clearData('SIPEDE');

        // Reset status
        scrapeStatus.pagesScraped = 0;
        scrapeStatus.itemsScraped = 0;
        scrapeStatus.tableInfo = null;
        scrapeStatus.error = null;

        res.json({
            success: true,
            message: 'Data cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
