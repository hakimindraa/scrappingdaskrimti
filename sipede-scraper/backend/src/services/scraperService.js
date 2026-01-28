const SipedeScraper = require('../scrapers/sipedeScraper');

// Singleton instance
let scraperInstance = null;

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
