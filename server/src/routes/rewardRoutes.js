// Reward dan penukaran: /api/rewards
const express = require('express');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const rewards = require('../controllers/rewardController');
const { asyncHandler: h } = require('../utils/http');

const router = express.Router();
const admin = [requireAuth, requireAdmin];

router.get('/', h(rewards.list));
router.get('/:id', h(rewards.getById));
router.post('/', admin, h(rewards.create));
router.put('/:id', admin, h(rewards.update));
router.delete('/:id', admin, h(rewards.remove));
router.post('/:id/redeem', requireAuth, h(rewards.redeem));

module.exports = router;
