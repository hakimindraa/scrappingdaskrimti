require('dotenv').config();
const app = require('./app');
const db = require('./database');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Wait for database to be ready before starting server
db.ready().then(() => {
    app.listen(PORT, HOST, () => {
        console.log(`🚀 SIPEDE Scraper API running on ${HOST}:${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`📡 API base URL: http://localhost:${PORT}/api/scraper`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    db.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    db.close();
    process.exit(0);
});
