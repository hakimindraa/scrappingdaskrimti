// Database implementation using JSON file storage (no native dependencies)
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// File paths for JSON storage
const activityLogsPath = path.join(dataDir, 'activity_logs.json');
const scrapedDataPath = path.join(dataDir, 'scraped_data.json');

// Initialize JSON files if they don't exist
const initializeFile = (filePath, defaultData) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
};

initializeFile(activityLogsPath, { logs: [], lastId: 0 });
initializeFile(scrapedDataPath, { data: [], lastId: 0 });

// Read JSON file
const readJsonFile = (filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
};

// Write JSON file
const writeJsonFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
};

// Database-like interface for activity logs
const db = {
    // Activity logs methods
    prepare: (sql) => {
        // Parse SQL-like commands and return appropriate methods
        if (sql.includes('INSERT INTO activity_logs')) {
            return {
                run: (type, message, source) => {
                    const data = readJsonFile(activityLogsPath);
                    const newId = data.lastId + 1;
                    const newLog = {
                        id: newId,
                        type,
                        message,
                        source,
                        created_at: new Date().toISOString()
                    };
                    data.logs.unshift(newLog); // Add to beginning
                    data.lastId = newId;
                    // Keep only last 1000 logs
                    if (data.logs.length > 1000) {
                        data.logs = data.logs.slice(0, 1000);
                    }
                    writeJsonFile(activityLogsPath, data);
                    return { lastInsertRowid: newId };
                }
            };
        }
        
        if (sql.includes('SELECT') && sql.includes('FROM activity_logs')) {
            // Handle COUNT query
            if (sql.includes('COUNT(*)')) {
                return {
                    get: () => {
                        const data = readJsonFile(activityLogsPath);
                        return { count: data.logs.length };
                    }
                };
            }
            // Handle regular SELECT query
            return {
                all: (limit = 50, offset = 0) => {
                    const data = readJsonFile(activityLogsPath);
                    return data.logs.slice(offset, offset + limit).map(log => ({
                        ...log,
                        createdAt: log.created_at
                    }));
                }
            };
        }
        
        if (sql.includes('DELETE FROM activity_logs')) {
            return {
                run: () => {
                    writeJsonFile(activityLogsPath, { logs: [], lastId: 0 });
                    return { changes: 1 };
                }
            };
        }

        // Scraped data methods
        if (sql.includes('INSERT OR REPLACE INTO scraped_data') || sql.includes('INSERT INTO scraped_data')) {
            return {
                run: (source, headers, dataStr, rowCount, pagesScraped) => {
                    const fileData = readJsonFile(scrapedDataPath);
                    const existingIndex = fileData.data.findIndex(d => d.source === source);
                    const now = new Date().toISOString();
                    
                    if (existingIndex >= 0) {
                        fileData.data[existingIndex] = {
                            ...fileData.data[existingIndex],
                            headers,
                            data: dataStr,
                            row_count: rowCount,
                            pages_scraped: pagesScraped,
                            updated_at: now
                        };
                    } else {
                        const newId = fileData.lastId + 1;
                        fileData.data.push({
                            id: newId,
                            source,
                            headers,
                            data: dataStr,
                            row_count: rowCount,
                            pages_scraped: pagesScraped,
                            scraped_at: now,
                            updated_at: now
                        });
                        fileData.lastId = newId;
                    }
                    writeJsonFile(scrapedDataPath, fileData);
                    return { changes: 1 };
                }
            };
        }

        if (sql.includes('SELECT') && sql.includes('FROM scraped_data')) {
            return {
                get: (source) => {
                    const fileData = readJsonFile(scrapedDataPath);
                    const found = fileData.data.find(d => d.source === source);
                    if (found) {
                        return {
                            ...found,
                            rowCount: found.row_count,
                            pagesScraped: found.pages_scraped,
                            scrapedAt: found.scraped_at
                        };
                    }
                    return undefined;
                }
            };
        }

        if (sql.includes('DELETE FROM scraped_data')) {
            return {
                run: (source) => {
                    const fileData = readJsonFile(scrapedDataPath);
                    fileData.data = fileData.data.filter(d => d.source !== source);
                    writeJsonFile(scrapedDataPath, fileData);
                    return { changes: 1 };
                }
            };
        }

        // Default: return empty methods
        return {
            run: () => ({ changes: 0 }),
            all: () => [],
            get: () => undefined
        };
    },

    exec: (sql) => {
        // No-op for table creation in JSON storage
        return true;
    }
};

console.log('[Database] JSON file storage initialized at:', dataDir);

module.exports = db;
