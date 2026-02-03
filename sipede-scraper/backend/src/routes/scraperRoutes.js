const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');
const activityController = require('../controllers/activityController');
const dataController = require('../controllers/dataController');

// Open browser (starts SIPEDE login page)
router.post('/open', scraperController.openBrowser);

// Get browser/scraper status
router.get('/status', scraperController.getBrowserStatus);

// Check login status and navigate to data page
router.post('/check-login', scraperController.checkLoginAndNavigate);

// Get available years
router.get('/years', scraperController.getAvailableYears);

// Change year filter
router.post('/change-year', scraperController.changeYear);

// Set entries per page
router.post('/set-entries-per-page', scraperController.setEntriesPerPage);

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

// Get data info (last scraped time, row count without full data)
router.get('/data-info', (req, res) => {
    const info = dataController.getDataInfo('SIPEDE');
    res.json({ success: true, ...info });
});

// Export data to JSON
router.get('/export/json', scraperController.exportJson);

// Export data to CSV
router.get('/export/csv', scraperController.exportCsv);

// Export data to Excel
router.get('/export/excel', scraperController.exportExcel);

// Clear scraped data
router.post('/clear', scraperController.clearData);

// ============================================
// Activity Log Routes
// ============================================

// Get activity logs
router.get('/activity', activityController.getLogs);

// Add activity log
router.post('/activity', activityController.addLog);

// Clear activity logs
router.delete('/activity', activityController.clearLogs);

module.exports = router;

