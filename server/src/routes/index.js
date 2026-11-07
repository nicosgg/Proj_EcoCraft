// Menggabungkan semua route di bawah prefix /api (lihat app.js).
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const meta = require('../controllers/metaController');
const { asyncHandler: h } = require('../utils/http');

const router = express.Router();

// Umum
router.get('/', meta.index);
router.get('/materials', meta.materials);
router.get('/stats', h(meta.stats));

// Unggah foto (form-data, field "image")
router.post('/uploads', requireAuth, upload.single('image'), h(meta.uploadImage));

// Resource
router.use('/auth', require('./authRoutes'));
router.use('/me', require('./meRoutes'));
router.use('/tutorials', require('./tutorialRoutes'));
router.use('/actions', require('./actionRoutes'));
router.use('/drop-points', require('./dropPointRoutes'));
router.use('/rewards', require('./rewardRoutes'));

module.exports = router;
