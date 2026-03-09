const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const scraperRoutes = require('./routes/scraperRoutes');
const overrideRoutes = require('./routes/overrideRoutes');

const app = express();

// Middleware
app.use(helmet());
// Allow all origins for local network access
app.use(cors({
    origin: true, // Allow all origins
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/scraper', scraperRoutes);
app.use('/api/overrides', overrideRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message
    });
});

module.exports = app;
