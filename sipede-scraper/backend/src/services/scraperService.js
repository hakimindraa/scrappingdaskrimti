const SipedeScraper = require('../scrapers/sipedeScraper');

// Singleton instance
let scraperInstance = null;

// Status callback - will be set by controller
let statusCallback = null;

/**
 * Get or create scraper instance
 */
const getScraper = () => {
    if (!scraperInstance) {
        scraperInstance = new SipedeScraper();
    }
    return scraperInstance;
};

/**
 * Set status callback for real-time updates
 */
exports.setStatusCallback = (callback) => {
    statusCallback = callback;
    const scraper = getScraper();
    scraper.setStatusCallback(callback);
};

/**
 * Open browser with SIPEDE login page
 */
exports.openBrowser = async () => {
    const scraper = getScraper();
    return await scraper.openBrowser();
};

/**
 * Get browser status
 */
exports.getBrowserStatus = async () => {
    const scraper = getScraper();
    return await scraper.getBrowserStatus();
};

/**
 * Navigate to URL
 */
exports.navigateTo = async (url) => {
    const scraper = getScraper();
    return await scraper.navigateTo(url);
};

/**
 * Wait for login and navigate to data page
 */
exports.waitForLoginAndNavigate = async () => {
    const scraper = getScraper();
    return await scraper.waitForLoginAndNavigate();
};

/**
 * Get available years
 */
exports.getAvailableYears = async () => {
    const scraper = getScraper();
    return await scraper.detectAvailableYears();
};

/**
 * Change year filter
 */
exports.changeYear = async (year) => {
    const scraper = getScraper();
    return await scraper.changeYear(year);
};

/**
 * Set entries per page
 */
exports.setEntriesPerPage = async (entries) => {
    const scraper = getScraper();
    return await scraper.setEntriesPerPage(entries);
};

/**
 * Detect table structure
 */
exports.detectTableStructure = async () => {
    const scraper = getScraper();
    return await scraper.detectTableStructure();
};

/**
 * Scrape all pages
 */
exports.scrapeAllPages = async (onProgress, maxPages) => {
    const scraper = getScraper();
    return await scraper.scrapeAllPages(onProgress, maxPages);
};

/**
 * Close browser
 */
exports.close = async () => {
    if (scraperInstance) {
        await scraperInstance.close();
        scraperInstance = null;
    }
};
