// Migration script: JSON to SQLite
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'sipede_data.db');
const activityLogsPath = path.join(dataDir, 'activity_logs.json');
const scrapedDataPath = path.join(dataDir, 'scraped_data.json');

console.log('===========================================');
console.log('  SIPEDE: JSON to SQLite Migration Tool');
console.log('===========================================\n');

// Check if JSON files exist
const hasActivityLogs = fs.existsSync(activityLogsPath);
const hasScrapedData = fs.existsSync(scrapedDataPath);

if (!hasActivityLogs && !hasScrapedData) {
    console.log('✓ No JSON files found. Starting fresh with SQLite.');
    console.log('✓ Migration not needed.\n');
    process.exit(0);
}

async function migrate() {
    // Initialize SQLite
    const SQL = await initSqlJs();
    const db = new SQL.Database();

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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)
    `);

    db.run(`CREATE INDEX IF NOT EXISTS idx_scraped_data_source ON scraped_data(source)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC)`);

    let migratedCount = 0;

    // Migrate activity logs
    if (hasActivityLogs) {
        try {
            console.log('[1/2] Migrating activity logs...');
            const activityData = JSON.parse(fs.readFileSync(activityLogsPath, 'utf-8'));
            
            if (activityData.logs && activityData.logs.length > 0) {
                const stmt = db.prepare(`
                    INSERT INTO activity_logs (type, message, source, created_at)
                    VALUES (?, ?, ?, ?)
                `);

                for (const log of activityData.logs) {
                    stmt.run([log.type, log.message, log.source, log.created_at]);
                }

                console.log(`  ✓ Migrated ${activityData.logs.length} activity logs`);
                migratedCount += activityData.logs.length;

                // Backup old file
                const backupPath = activityLogsPath + '.backup';
                fs.renameSync(activityLogsPath, backupPath);
                console.log(`  ✓ Backed up to: ${path.basename(backupPath)}`);
            } else {
                console.log('  ✓ No activity logs to migrate');
            }
        } catch (error) {
            console.error('  ✗ Error migrating activity logs:', error.message);
        }
    }

    // Migrate scraped data
    if (hasScrapedData) {
        try {
            console.log('\n[2/2] Migrating scraped data...');
            const scrapedData = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf-8'));
            
            if (scrapedData.data && scrapedData.data.length > 0) {
                const stmt = db.prepare(`
                    INSERT INTO scraped_data (source, headers, data, row_count, pages_scraped, scraped_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);

                for (const item of scrapedData.data) {
                    stmt.run([
                        item.source,
                        item.headers,
                        item.data,
                        item.row_count || 0,
                        item.pages_scraped || 0,
                        item.scraped_at,
                        item.updated_at
                    ]);
                }

                console.log(`  ✓ Migrated ${scrapedData.data.length} scraped data records`);
                migratedCount += scrapedData.data.length;

                // Backup old file
                const backupPath = scrapedDataPath + '.backup';
                fs.renameSync(scrapedDataPath, backupPath);
                console.log(`  ✓ Backed up to: ${path.basename(backupPath)}`);
            } else {
                console.log('  ✓ No scraped data to migrate');
            }
        } catch (error) {
            console.error('  ✗ Error migrating scraped data:', error.message);
        }
    }

    // Save database to disk
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    db.close();

    console.log('\n===========================================');
    console.log(`✓ Migration completed! (${migratedCount} records)`);
    console.log('✓ SQLite database ready at:', dbPath);
    console.log('✓ Old JSON files backed up with .backup extension');
    console.log('===========================================\n');
}

migrate().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
});
