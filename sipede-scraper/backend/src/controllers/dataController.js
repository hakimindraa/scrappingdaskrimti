// Data Controller for persistent scraped data storage
const db = require('../database');

/**
 * Save scraped data to database
 * @param {string} source - Data source name (e.g., 'SIPEDE', 'SPDP')
 * @param {string[]} headers - Column headers
 * @param {Object[]} data - Array of data rows
 * @param {number} pagesScraped - Number of pages scraped
 */
exports.saveData = (source, headers, data, pagesScraped = 0) => {
    try {
        // Check if data for this source already exists
        const existing = db.prepare('SELECT id FROM scraped_data WHERE source = ?').get(source);

        const headersJson = JSON.stringify(headers);
        const dataJson = JSON.stringify(data);

        if (existing) {
            // Update existing record
            db.prepare(`
                UPDATE scraped_data 
                SET headers = ?, data = ?, row_count = ?, pages_scraped = ?, updated_at = CURRENT_TIMESTAMP
                WHERE source = ?
            `).run(headersJson, dataJson, data.length, pagesScraped, source);
            console.log(`[DataStore] Updated ${data.length} rows for ${source}`);
        } else {
            // Insert new record
            db.prepare(`
                INSERT INTO scraped_data (source, headers, data, row_count, pages_scraped)
                VALUES (?, ?, ?, ?, ?)
            `).run(source, headersJson, dataJson, data.length, pagesScraped);
            console.log(`[DataStore] Saved ${data.length} rows for ${source}`);
        }

        return { success: true, rowCount: data.length };
    } catch (error) {
        console.error('[DataStore] Save error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Load scraped data from database
 * @param {string} source - Data source name
 * @returns {Object} - { headers, data, rowCount, pagesScraped, scrapedAt }
 */
exports.loadData = (source) => {
    try {
        const row = db.prepare(`
            SELECT headers, data, row_count, pages_scraped, scraped_at, updated_at
            FROM scraped_data WHERE source = ?
        `).get(source);

        if (row) {
            return {
                success: true,
                headers: JSON.parse(row.headers),
                data: JSON.parse(row.data),
                rowCount: row.row_count,
                pagesScraped: row.pages_scraped,
                scrapedAt: row.scraped_at,
                updatedAt: row.updated_at
            };
        }

        return { success: true, headers: [], data: [], rowCount: 0, pagesScraped: 0 };
    } catch (error) {
        console.error('[DataStore] Load error:', error);
        return { success: false, headers: [], data: [], rowCount: 0, error: error.message };
    }
};

/**
 * Clear scraped data for a source
 * @param {string} source - Data source name
 */
exports.clearData = (source) => {
    try {
        db.prepare('DELETE FROM scraped_data WHERE source = ?').run(source);
        console.log(`[DataStore] Cleared data for ${source}`);
        return { success: true };
    } catch (error) {
        console.error('[DataStore] Clear error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get data info without loading full data
 * @param {string} source - Data source name
 */
exports.getDataInfo = (source) => {
    try {
        const row = db.prepare(`
            SELECT row_count, pages_scraped, scraped_at, updated_at
            FROM scraped_data WHERE source = ?
        `).get(source);

        if (row) {
            return {
                exists: true,
                rowCount: row.row_count,
                pagesScraped: row.pages_scraped,
                scrapedAt: row.scraped_at,
                updatedAt: row.updated_at
            };
        }

        return { exists: false, rowCount: 0, pagesScraped: 0 };
    } catch (error) {
        console.error('[DataStore] GetInfo error:', error);
        return { exists: false, rowCount: 0, error: error.message };
    }
};
