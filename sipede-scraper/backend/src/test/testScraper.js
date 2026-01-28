/**
 * Test script for SIPEDE Scraper
 * Usage: node src/test/testScraper.js
 */

const SipedeScraper = require('../scrapers/sipedeScraper');

async function runTest() {
    const scraper = new SipedeScraper();

    console.log('🔧 Initializing scraper...');
    await scraper.init();

    try {
        // Test 1: Login (if credentials provided)
        const username = process.env.SIPEDE_USERNAME;
        const password = process.env.SIPEDE_PASSWORD;

        if (username && password) {
            console.log('\n📝 Testing login...');
            const loginResult = await scraper.login(username, password);
            console.log('Login result:', loginResult);

            if (!loginResult.success) {
                console.log('⚠️ Login failed, some features may not work');
            }
        } else {
            console.log('\n⚠️ No credentials provided, skipping login test');
            console.log('   Set SIPEDE_USERNAME and SIPEDE_PASSWORD env vars to test login');
        }

        // Test 2: Navigate to Surat Masuk
        console.log('\n📂 Testing navigation to Surat Masuk...');
        const navigated = await scraper.navigateToSuratMasuk();
        console.log('Navigation result:', navigated ? '✅ Success' : '❌ Failed');

        if (navigated) {
            // Test 3: Get total pages
            console.log('\n📊 Getting total pages...');
            const totalPages = await scraper.getTotalPages();
            console.log('Total pages:', totalPages);

            // Test 4: Scrape first page
            console.log('\n📄 Scraping first page...');
            const pageData = await scraper.scrapeCurrentPage();
            console.log(`Found ${pageData.length} items on first page`);

            if (pageData.length > 0) {
                console.log('\nSample data (first item):');
                console.log(JSON.stringify(pageData[0], null, 2));
            }

            // Test 5: Scrape first 3 pages (limited test)
            console.log('\n🔄 Testing pagination (first 3 pages)...');
            const result = await scraper.scrapeAllData(
                (current, total, data) => {
                    console.log(`  Page ${current}/${total}: ${data.length} items`);
                },
                { startPage: 1, endPage: 3 }
            );

            console.log('\nScraping result:');
            console.log(`- Success: ${result.success}`);
            console.log(`- Total items: ${result.data.length}`);
            console.log(`- Message: ${result.message}`);

            // Take screenshot
            console.log('\n📸 Taking screenshot...');
            await scraper.screenshot('test_screenshot.png');
            console.log('Screenshot saved to test_screenshot.png');
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await scraper.close();
        console.log('✅ Test completed');
    }
}

// Load environment variables
require('dotenv').config();

runTest().catch(console.error);
