// Simple script to check if database exists and has data
const fs = require('fs');
const path = require('path');

console.log('===========================================');
console.log('  SIPEDE Database Check');
console.log('===========================================\n');

// Check SIPEDE database
const sipedeDbPath = path.join(__dirname, 'sipede-scraper', 'backend', 'data', 'sipede_data.db');
const sipedeJsonPath = path.join(__dirname, 'sipede-scraper', 'backend', 'data', 'scraped_data.json');

console.log('📁 SIPEDE Backend:\n');

if (fs.existsSync(sipedeDbPath)) {
    const stats = fs.statSync(sipedeDbPath);
    console.log('✅ SQLite Database: FOUND');
    console.log(`   Location: ${sipedeDbPath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Last Modified: ${stats.mtime.toLocaleString('id-ID')}`);
    
    if (stats.size > 25000) {
        console.log('   Status: ✅ Has data (size > 24KB)');
    } else {
        console.log('   Status: ⚠️  Empty or minimal data (size = 24KB default)');
    }
} else {
    console.log('❌ SQLite Database: NOT FOUND');
    console.log('   Expected: ' + sipedeDbPath);
}

console.log('');

if (fs.existsSync(sipedeJsonPath)) {
    const stats = fs.statSync(sipedeJsonPath);
    console.log('📄 Old JSON File: FOUND (should be migrated)');
    console.log(`   Location: ${sipedeJsonPath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
} else {
    console.log('✅ Old JSON File: Not found (good, using SQLite)');
}

console.log('\n-------------------------------------------\n');

// Check SPDP database
const spdpDbPath = path.join(__dirname, 'spp-scraper', 'data', 'spdp_data.db');

console.log('📁 SPDP Backend:\n');

if (fs.existsSync(spdpDbPath)) {
    const stats = fs.statSync(spdpDbPath);
    console.log('✅ SQLite Database: FOUND');
    console.log(`   Location: ${spdpDbPath}`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Last Modified: ${stats.mtime.toLocaleString('id-ID')}`);
    
    if (stats.size > 25000) {
        console.log('   Status: ✅ Has data (size > 24KB)');
    } else {
        console.log('   Status: ⚠️  Empty or minimal data');
    }
} else {
    console.log('❌ SQLite Database: NOT FOUND');
    console.log('   Expected: ' + spdpDbPath);
}

console.log('\n===========================================');
console.log('  Summary');
console.log('===========================================\n');

const sipedeOk = fs.existsSync(sipedeDbPath);
const spdpOk = fs.existsSync(spdpDbPath);

if (sipedeOk && spdpOk) {
    console.log('✅ Both databases are ready!');
    console.log('');
    console.log('To view data:');
    console.log('1. Use DB Browser for SQLite');
    console.log('2. Or run scraping to add data');
    console.log('3. Or check via API: http://localhost:5000/api/scraper/data');
} else {
    console.log('⚠️  Some databases are missing.');
    console.log('Run Start-WebScraper.bat to initialize.');
}

console.log('\n===========================================\n');
