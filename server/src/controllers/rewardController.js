const crypto = require('crypto');
const rewardModel = require('../models/rewardModel');
const userModel = require('../models/userModel');
const { HttpError, send } = require('../utils/http');
const { validator, parseId } = require('../utils/validate');

const readBody = (b) => {
  const v = validator();
  const data = {
    name: v.string('name', b.name, { min: 3, max: 120, label: 'Nama reward' }),
    partner: v.string('partner', b.partner, { required: false, max: 80, label: 'Mitra' }),
    description: v.string('description', b.description, { required: false, max: 300, label: 'Deskripsi' }),
    costCoins: v.number('costCoins', b.costCoins, { min: 1, max: 100000, integer: true, label: 'Harga (koin)' }),
    stock: v.number('stock', b.stock, { min: 0, max: 100000, integer: true, label: 'Stok' }),
  };
  v.check();
  return data;
};

/** Kode voucher acak, contoh: ECO-7K2Q-M9XD */
const voucherCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = () => Array.from(crypto.randomBytes(4), (b) => chars[b % chars.length]).join('');
  return `ECO-${pick()}-${pick()}`;
};

// GET /api/rewards
const list = async (req, res) => send(res, 200, 'Katalog reward berhasil diambil', await rewardModel.findAll());

// GET /api/rewards/:id
const getById = async (req, res) => {
  const item = await rewardModel.findById(parseId(req.params.id, 'ID reward'));
  if (!item) throw new HttpError(404, 'Reward tidak ditemukan.');
  send(res, 200, 'Detail reward berhasil diambil', item);
};

// POST /api/rewards (admin)
const create = async (req, res) => send(res, 201, 'Reward berhasil ditambahkan', await rewardModel.create(readBody(req.body)));

// PUT /api/rewards/:id (admin)
const update = async (req, res) => {
  const id = parseId(req.params.id, 'ID reward');
  if (!(await rewardModel.findById(id))) throw new HttpError(404, 'Reward tidak ditemukan.');
  send(res, 200, 'Reward berhasil diperbarui', await rewardModel.update(id, readBody(req.body)));
};

// DELETE /api/rewards/:id (admin)
const remove = async (req, res) => {
  const id = parseId(req.params.id, 'ID reward');
  if (!(await rewardModel.remove(id))) throw new HttpError(404, 'Reward tidak ditemukan.');
  send(res, 200, 'Reward berhasil dihapus', { id });
};

// POST /api/rewards/:id/redeem
const redeem = async (req, res) => {
  const id = parseId(req.params.id, 'ID reward');
  const reward = await rewardModel.findById(id);
  if (!reward) throw new HttpError(404, 'Reward tidak ditemukan.');
  if (req.user.coins < reward.costCoins) {
    throw new HttpError(409, `Eco-Coins tidak cukup. Dibutuhkan ${reward.costCoins}, saldomu ${req.user.coins}.`);
  }
  if (!(await rewardModel.takeStock(id))) throw new HttpError(409, 'Stok reward ini sudah habis.');
  if (!(await userModel.spendCoins(req.user.id, reward.costCoins))) {
    await rewardModel.returnStock(id); // batalkan pengurangan stok
    throw new HttpError(409, 'Eco-Coins tidak cukup.');
  }
  const redemption = await rewardModel.createRedemption({
    userId: req.user.id, rewardId: id, rewardName: reward.name, costCoins: reward.costCoins, voucherCode: voucherCode(),
  });
  const user = await userModel.findById(req.user.id);
  send(res, 201, 'Penukaran berhasil. Simpan kode vouchermu.', { redemption, balance: user.coins });
};

module.exports = { list, getById, create, update, remove, redeem };
