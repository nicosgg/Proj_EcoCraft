// Katalog reward dan riwayat penukaran Eco-Coins.
const { get, all, run } = require('../config/database');
const { isoDate } = require('../utils/http');

const toReward = (row) => row && {
  id: row.id,
  name: row.name,
  partner: row.partner,
  description: row.description,
  costCoins: row.cost_coins,
  stock: row.stock,
};

const toRedemption = (row) => row && {
  id: row.id,
  reward: { id: row.reward_id, name: row.reward_name },
  costCoins: row.cost_coins,
  voucherCode: row.voucher_code,
  createdAt: isoDate(row.created_at),
};

const findAll = async () => (await all('SELECT * FROM rewards ORDER BY cost_coins ASC, id ASC')).map(toReward);
const findById = async (id) => toReward(await get('SELECT * FROM rewards WHERE id = ?', [id]));

const create = async (d) => {
  const { lastID } = await run('INSERT INTO rewards (name, partner, description, cost_coins, stock) VALUES (?, ?, ?, ?, ?)',
    [d.name, d.partner ?? null, d.description ?? null, d.costCoins, d.stock]);
  return findById(lastID);
};

const update = async (id, d) => {
  await run('UPDATE rewards SET name = ?, partner = ?, description = ?, cost_coins = ?, stock = ? WHERE id = ?',
    [d.name, d.partner ?? null, d.description ?? null, d.costCoins, d.stock, id]);
  return findById(id);
};

const remove = async (id) => (await run('DELETE FROM rewards WHERE id = ?', [id])).changes;

/** Mengurangi stok hanya bila masih ada. Hasil true bila berhasil. */
const takeStock = async (id) => (await run('UPDATE rewards SET stock = stock - 1 WHERE id = ? AND stock > 0', [id])).changes === 1;
const returnStock = (id) => run('UPDATE rewards SET stock = stock + 1 WHERE id = ?', [id]);

const createRedemption = async (d) => {
  const { lastID } = await run(
    'INSERT INTO redemptions (user_id, reward_id, reward_name, cost_coins, voucher_code) VALUES (?, ?, ?, ?, ?)',
    [d.userId, d.rewardId, d.rewardName, d.costCoins, d.voucherCode],
  );
  return toRedemption(await get('SELECT * FROM redemptions WHERE id = ?', [lastID]));
};

const findRedemptionsByUser = async (userId) => (await all(
  'SELECT * FROM redemptions WHERE user_id = ? ORDER BY created_at DESC, id DESC', [userId],
)).map(toRedemption);

module.exports = { findAll, findById, create, update, remove, takeStock, returnStock, createRedemption, findRedemptionsByUser };
