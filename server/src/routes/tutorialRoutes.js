// Tutorial: /api/tutorials
const express = require('express');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const tutorials = require('../controllers/tutorialController');
const { asyncHandler: h } = require('../utils/http');

const router = express.Router();
const admin = [requireAuth, requireAdmin];

router.get('/', h(tutorials.list));
router.get('/:id', h(tutorials.getById));
router.post('/', admin, h(tutorials.create));
router.put('/:id', admin, h(tutorials.update));
router.delete('/:id', admin, h(tutorials.remove));

module.exports = router;
