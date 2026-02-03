// Activity Log Controller
const db = require('../database');

/**
 * Get activity logs with optional pagination
 */
exports.getLogs = (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const logs = db.prepare(`
            SELECT id, type, message, source, created_at as createdAt
            FROM activity_logs 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `).all(parseInt(limit), parseInt(offset));

        const total = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get();

        res.json({
            success: true,
            data: logs,
            total: total.count
        });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Add a new activity log
 */
exports.addLog = (req, res) => {
    try {
        const { type, message, source } = req.body;

        if (!type || !message || !source) {
            return res.status(400).json({
                success: false,
                message: 'type, message, and source are required'
            });
        }

        const validTypes = ['info', 'success', 'warning', 'error'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'type must be one of: info, success, warning, error'
            });
        }

        const result = db.prepare(`
            INSERT INTO activity_logs (type, message, source) 
            VALUES (?, ?, ?)
        `).run(type, message, source);

        res.json({
            success: true,
            id: result.lastInsertRowid,
            message: 'Log added successfully'
        });
    } catch (error) {
        console.error('Add log error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Clear all activity logs
 */
exports.clearLogs = (req, res) => {
    try {
        db.prepare('DELETE FROM activity_logs').run();

        res.json({
            success: true,
            message: 'All logs cleared'
        });
    } catch (error) {
        console.error('Clear logs error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Helper function to add log from other controllers (internal use)
 */
exports.addLogInternal = (type, message, source) => {
    try {
        db.prepare(`
            INSERT INTO activity_logs (type, message, source) 
            VALUES (?, ?, ?)
        `).run(type, message, source);
        console.log(`[Activity] ${type}: ${message} (${source})`);
    } catch (error) {
        console.error('Add log internal error:', error);
    }
};
