const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');

// Open browser (starts SIPEDE login page)
router.post('/open', scraperController.openBrowser);

// Get browser/scraper status
router.get('/status', scraperController.getBrowserStatus);

// Navigate to specific URL
router.post('/navigate', scraperController.navigateTo);

// Detect table structure on current page
router.get('/detect-table', scraperController.detectTable);

// Start scraping from current page
router.post('/scrape', scraperController.startScraping);

// Close browser
router.post('/close', scraperController.closeBrowser);

// Get scraped data
router.get('/data', scraperController.getData);

// Export data to JSON
router.get('/export/json', scraperController.exportJson);

// Export data to CSV
router.get('/export/csv', scraperController.exportCsv);

// Clear scraped data
router.post('/clear', scraperController.clearData);

module.exports = router;
