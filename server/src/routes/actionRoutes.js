// Aksi (bukti upcycling) dan Eco-Kudos: /api/actions
const express = require('express');
const { optionalAuth, requireAdmin, requireAuth } = require('../middleware/auth');
const actions = require('../controllers/actionController');
const { asyncHandler: h } = require('../utils/http');

const router = express.Router();
const admin = [requireAuth, requireAdmin];

router.get('/', optionalAuth, h(actions.list));
router.get('/:id', optionalAuth, h(actions.getById));
router.post('/', requireAuth, h(actions.create));
router.patch('/:id', requireAuth, h(actions.update));
router.delete('/:id', requireAuth, h(actions.remove));
router.post('/:id/kudos', requireAuth, h(actions.giveKudos));
router.delete('/:id/kudos', requireAuth, h(actions.removeKudos));
router.patch('/:id/status', admin, h(actions.setStatus));

module.exports = router;
