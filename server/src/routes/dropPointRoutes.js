// Titik setor: /api/drop-points
const express = require('express');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const dropPoints = require('../controllers/dropPointController');
const { asyncHandler: h } = require('../utils/http');

const router = express.Router();
const admin = [requireAuth, requireAdmin];

router.get('/', h(dropPoints.list));
router.get('/:id', h(dropPoints.getById));
router.post('/', admin, h(dropPoints.create));
router.put('/:id', admin, h(dropPoints.update));
router.delete('/:id', admin, h(dropPoints.remove));

module.exports = router;
