// Profil pengguna yang login: /api/me
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const me = require('../controllers/meController');
const { asyncHandler: h } = require('../utils/http');

const router = express.Router();

router.get('/', requireAuth, h(me.getMe));
router.get('/actions', requireAuth, h(me.getMyActions));
router.get('/redemptions', requireAuth, h(me.getMyRedemptions));

module.exports = router;
