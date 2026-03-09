const express = require('express');
const router = express.Router();
const overrideController = require('../controllers/overrideController');

// Jenis Kategori Overrides
router.get('/jenis', overrideController.getJenisOverrides);
router.post('/jenis', overrideController.saveJenisOverrides);

// Asal Kelompok Overrides
router.get('/asal', overrideController.getAsalOverrides);
router.post('/asal', overrideController.saveAsalOverrides);

module.exports = router;
