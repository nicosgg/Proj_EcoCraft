const userModel = require('../models/userModel');
const actionModel = require('../models/actionModel');
const rewardModel = require('../models/rewardModel');
const { send } = require('../utils/http');
const { presentAction } = require('./presenters');

// GET /api/me
const getMe = async (req, res) => {
  const stats = await userModel.getStats(req.user.id);
  send(res, 200, 'Profil berhasil diambil', { ...req.user, stats });
};

// GET /api/me/actions
const getMyActions = async (req, res) => {
  const actions = await actionModel.findAll({ userId: req.user.id, viewerId: req.user.id, status: req.query.status });
  send(res, 200, 'Aksi milikmu berhasil diambil', actions.map((a) => presentAction(req, a)));
};

// GET /api/me/redemptions
const getMyRedemptions = async (req, res) => {
  send(res, 200, 'Riwayat penukaran berhasil diambil', await rewardModel.findRedemptionsByUser(req.user.id));
};

module.exports = { getMe, getMyActions, getMyRedemptions };
