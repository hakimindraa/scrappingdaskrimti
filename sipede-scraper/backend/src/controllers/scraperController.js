const scraperService = require('../services/scraperService');

// Store for scraped data and status
let scrapedData = [];
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
    tableInfo: null
};

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
        scrapedData = [];

        // Send immediate response
        res.json({
            success: true,
            message: 'Scraping started',
            status: scrapeStatus
        });

        // Progress callback
        const onProgress = (pageNum, pageData) => {
            scrapeStatus.currentPage = pageNum;
            scrapeStatus.pagesScraped = pageNum;
            scrapeStatus.itemsScraped += pageData.length;
            scrapedData.push(...pageData);
        };

        // Start scraping in background
        const result = await scraperService.scrapeAllPages(onProgress, maxPages);

        scrapeStatus.isRunning = false;
        if (!result.success) {
            scrapeStatus.error = result.message;
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
