// Quick script to check database content
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function checkDatabase() {
    try {
        const dbPath = path.join(__dirname, 'sipede-scraper', 'backend', 'data', 'sipede_data.db');
        
        if (!fs.existsSync(dbPath)) {
            console.log('❌ Database file not found:', dbPath);
            return;
        }

        console.log('✅ Database file found:', dbPath);
        console.log('📊 File size:', (fs.statSync(dbPath).size / 1024).toFixed(2), 'KB');
        console.log('');

        // Load database
        const SQL = await initSqlJs();
        const buffer = fs.readFileSync(dbPath);
        const db = new SQL.Database(buffer);

        // Check tables
        console.log('📋 Tables:');
        const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
        if (tables.length > 0 && tables[0].values.length > 0) {
            tables[0].values.forEach(row => {
                console.log('  -', row[0]);
            });
        } else {
            console.log('  (no tables)');
        }
        console.log('');

        // Check scraped_data
        console.log('📦 Scraped Data:');
        const scrapedData = db.exec('SELECT source, row_count, pages_scraped, scraped_at FROM scraped_data');
        if (scrapedData.length > 0 && scrapedData[0].values.length > 0) {
            scrapedData[0].values.forEach(row => {
                console.log(`  Source: ${row[0]}`);
                console.log(`  Rows: ${row[1]}`);
                console.log(`  Pages: ${row[2]}`);
                console.log(`  Scraped at: ${row[3]}`);
                console.log('');
            });
        } else {
            console.log('  ⚠️  No data yet (belum ada scraping)');
        }

        // Check activity_logs
        console.log('📝 Activity Logs:');
        const logs = db.exec('SELECT COUNT(*) as count FROM activity_logs');
        if (logs.length > 0 && logs[0].values.length > 0) {
            const count = logs[0].values[0][0];
            console.log(`  Total logs: ${count}`);
            
            if (count > 0) {
                const recentLogs = db.exec('SELECT type, message, source, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 5');
                console.log('  Recent logs:');
                recentLogs[0].values.forEach(row => {
                    console.log(`    [${row[0]}] ${row[1]} (${row[2]}) - ${row[3]}`);
                });
            }
        } else {
            console.log('  ⚠️  No logs yet');
        }

        db.close();
        console.log('');
        console.log('✅ Database check completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkDatabase();
