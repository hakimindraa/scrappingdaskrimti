// Database implementation using sql.js (pure JavaScript SQLite)
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, 'sipede_data.db');

let db = null;

// Initialize database
async function initDatabase() {
    const SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
        console.log('[Database] SQLite loaded from:', dbPath);
    } else {
        db = new SQL.Database();
        console.log('[Database] SQLite created at:', dbPath);
    }

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS scraped_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            headers TEXT NOT NULL,
            data TEXT NOT NULL,
            row_count INTEGER DEFAULT 0,
            pages_scraped INTEGER DEFAULT 0,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            source TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_scraped_data_source ON scraped_data(source)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC)`);

    // Save to disk
    saveDatabase();
}

// Save database to disk
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// Wrapper for prepare statement (compatible with better-sqlite3 API)
function prepare(sql) {
    return {
        run: (...params) => {
            try {
                db.run(sql, params);
                saveDatabase();
                return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0]?.values[0]?.[0] || 0, changes: 1 };
            } catch (error) {
                console.error('SQL run error:', error);
                return { changes: 0 };
            }
        },
        get: (...params) => {
            try {
                const result = db.exec(sql, params);
                if (result.length > 0 && result[0].values.length > 0) {
                    const row = {};
                    result[0].columns.forEach((col, idx) => {
                        row[col] = result[0].values[0][idx];
                    });
                    return row;
                }
                return undefined;
            } catch (error) {
                console.error('SQL get error:', error);
                return undefined;
            }
        },
        all: (...params) => {
            try {
                const result = db.exec(sql, params);
                if (result.length > 0) {
                    return result[0].values.map(row => {
                        const obj = {};
                        result[0].columns.forEach((col, idx) => {
                            obj[col] = row[idx];
                        });
                        return obj;
                    });
                }
                return [];
            } catch (error) {
                console.error('SQL all error:', error);
                return [];
            }
        }
    };
}

// Initialize on import
let dbReady = false;
const dbPromise = initDatabase().then(() => {
    dbReady = true;
    console.log('[Database] SQLite ready');
}).catch(err => {
    console.error('[Database] Init error:', err);
});

// Export database wrapper
module.exports = {
    prepare: (sql) => {
        if (!dbReady) {
            throw new Error('Database not ready yet. Please wait for initialization.');
        }
        return prepare(sql);
    },
    exec: (sql) => {
        if (db) {
            db.run(sql);
            saveDatabase();
        }
        return true;
    },
    ready: () => dbPromise,
    close: () => {
        if (db) {
            saveDatabase();
            db.close();
        }
    }
};
