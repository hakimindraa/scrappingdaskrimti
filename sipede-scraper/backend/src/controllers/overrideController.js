// Override Controller - Persist jenis kategori & asal kelompok overrides
const db = require('../database');

// GET all jenis kategori overrides
exports.getJenisOverrides = (req, res) => {
    try {
        const rows = db.prepare('SELECT jenis_surat, kategori FROM jenis_kategori_overrides').all();
        const overrides = {};
        rows.forEach(r => { overrides[r.jenis_surat] = r.kategori; });
        res.json({ success: true, overrides });
    } catch (error) {
        console.error('[Override] Get jenis error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST save/update jenis kategori overrides (bulk upsert)
exports.saveJenisOverrides = (req, res) => {
    try {
        const { overrides } = req.body;
        if (!overrides || typeof overrides !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid overrides data' });
        }

        Object.entries(overrides).forEach(([jenisSurat, kategori]) => {
            if (typeof jenisSurat !== 'string' || typeof kategori !== 'string') return;
            const existing = db.prepare('SELECT id FROM jenis_kategori_overrides WHERE jenis_surat = ?').get(jenisSurat);
            if (existing) {
                db.prepare('UPDATE jenis_kategori_overrides SET kategori = ?, updated_at = CURRENT_TIMESTAMP WHERE jenis_surat = ?')
                    .run(kategori, jenisSurat);
            } else {
                db.prepare('INSERT INTO jenis_kategori_overrides (jenis_surat, kategori) VALUES (?, ?)')
                    .run(jenisSurat, kategori);
            }
        });

        res.json({ success: true, count: Object.keys(overrides).length });
    } catch (error) {
        console.error('[Override] Save jenis error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET all asal kelompok overrides
exports.getAsalOverrides = (req, res) => {
    try {
        const rows = db.prepare('SELECT asal, kelompok FROM asal_kelompok_overrides').all();
        const overrides = {};
        rows.forEach(r => { overrides[r.asal] = r.kelompok; });
        res.json({ success: true, overrides });
    } catch (error) {
        console.error('[Override] Get asal error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// POST save/update asal kelompok overrides (bulk upsert)
exports.saveAsalOverrides = (req, res) => {
    try {
        const { overrides } = req.body;
        if (!overrides || typeof overrides !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid overrides data' });
        }

        Object.entries(overrides).forEach(([asal, kelompok]) => {
            if (typeof asal !== 'string' || typeof kelompok !== 'string') return;
            const existing = db.prepare('SELECT id FROM asal_kelompok_overrides WHERE asal = ?').get(asal);
            if (existing) {
                db.prepare('UPDATE asal_kelompok_overrides SET kelompok = ?, updated_at = CURRENT_TIMESTAMP WHERE asal = ?')
                    .run(kelompok, asal);
            } else {
                db.prepare('INSERT INTO asal_kelompok_overrides (asal, kelompok) VALUES (?, ?)')
                    .run(asal, kelompok);
            }
        });

        res.json({ success: true, count: Object.keys(overrides).length });
    } catch (error) {
        console.error('[Override] Save asal error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
