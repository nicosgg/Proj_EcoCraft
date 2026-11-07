const { get, run } = require('../config/database');
const { levelOf, RULES } = require('../config/constants');
const { isoDate } = require('../utils/http');

/** Baris tabel users -> objek JSON (tanpa password). */
const toUser = (row) => row && {
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  coins: row.coins,
  xp: row.xp,
  level: levelOf(row.xp),
  xpPerLevel: RULES.xpPerLevel,
  createdAt: isoDate(row.created_at),
};

const findById = async (id) => toUser(await get('SELECT * FROM users WHERE id = ?', [id]));

/** Dipakai saat login: mengembalikan baris lengkap termasuk password_hash. */
const findByEmailWithPassword = (email) => get('SELECT * FROM users WHERE email = ?', [email]);

const emailExists = async (email) => !!(await get('SELECT 1 FROM users WHERE email = ?', [email]));

const create = async ({ name, email, passwordHash, role = 'member' }) => {
  const { lastID } = await run(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role],
  );
  return findById(lastID);
};

/** Menambah (atau mengurangi bila negatif) Eco-Coins dan XP. Tidak pernah di bawah nol. */
const addCoinsXp = (userId, coins, xp) => run(
  'UPDATE users SET coins = MAX(0, coins + ?), xp = MAX(0, xp + ?) WHERE id = ?',
  [coins, xp, userId],
);

/** Memotong saldo hanya bila cukup. Hasil true bila berhasil. */
const spendCoins = async (userId, amount) => {
  const { changes } = await run('UPDATE users SET coins = coins - ? WHERE id = ? AND coins >= ?', [amount, userId, amount]);
  return changes === 1;
};

/** Ringkasan aktivitas pengguna untuk halaman profil. */
const getStats = async (userId) => {
  const row = await get(`
    SELECT
      COUNT(*)                                                     AS actions,
      COALESCE(SUM(status = 'verified'), 0)                         AS verified_actions,
      COALESCE(SUM(status = 'pending'), 0)                          AS pending_actions,
      COALESCE(SUM(CASE WHEN status = 'pending'  THEN coins END), 0)     AS pending_coins,
      COALESCE(SUM(CASE WHEN status = 'verified' THEN weight_kg END), 0) AS total_weight,
      COALESCE(SUM(CASE WHEN status = 'verified' THEN co2_kg END), 0)    AS total_co2
    FROM actions WHERE user_id = ?`, [userId]);
  return {
    actions: row.actions,
    verifiedActions: row.verified_actions,
    pendingActions: row.pending_actions,
    pendingCoins: row.pending_coins,
    totalWeightKg: Math.round(row.total_weight * 10) / 10,
    totalCo2Kg: Math.round(row.total_co2 * 10) / 10,
  };
};

module.exports = { toUser, findById, findByEmailWithPassword, emailExists, create, addCoinsXp, spendCoins, getStats };
