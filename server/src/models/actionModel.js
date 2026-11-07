// Aksi = unggahan bukti hasil upcycling (proof-of-action) dari anggota.
const { get, all, run } = require('../config/database');
const { RULES } = require('../config/constants');
const { isoDate } = require('../utils/http');

/** SELECT dasar. viewerId dipakai untuk menghitung likedByMe. */
const selectSql = (viewerId) => ({
  sql: `
    SELECT a.*, u.name AS user_name, t.title AS tutorial_title,
           (SELECT COUNT(*) FROM kudos k WHERE k.action_id = a.id) AS kudos_count,
           ${viewerId ? 'EXISTS (SELECT 1 FROM kudos k2 WHERE k2.action_id = a.id AND k2.user_id = ?)' : '0'} AS liked_by_me
    FROM actions a
    JOIN users u ON u.id = a.user_id
    LEFT JOIN tutorials t ON t.id = a.tutorial_id`,
  params: viewerId ? [viewerId] : [],
});

const toAction = (row) => row && {
  id: row.id,
  title: row.title,
  material: row.material,
  weightKg: row.weight_kg,
  co2Kg: row.co2_kg,
  coins: row.coins,
  xp: row.xp,
  imageUrl: row.image_url,
  status: row.status,
  kudosCount: row.kudos_count,
  kudosNeeded: RULES.kudosToVerify,
  likedByMe: !!row.liked_by_me,
  user: { id: row.user_id, name: row.user_name },
  tutorial: row.tutorial_id ? { id: row.tutorial_id, title: row.tutorial_title } : null,
  createdAt: isoDate(row.created_at),
  verifiedAt: isoDate(row.verified_at),
};

/**
 * Daftar aksi. Tanpa filter status, aksi yang ditolak (rejected) tidak ditampilkan.
 */
const findAll = async ({ status, material, userId, tutorialId, viewerId } = {}) => {
  const base = selectSql(viewerId);
  const where = [];
  const params = [...base.params];
  if (status) { where.push('a.status = ?'); params.push(status); } else if (!userId) { where.push("a.status != 'rejected'"); }
  if (material) { where.push('a.material = ?'); params.push(material); }
  if (userId) { where.push('a.user_id = ?'); params.push(userId); }
  if (tutorialId) { where.push('a.tutorial_id = ?'); params.push(tutorialId); }
  const sql = `${base.sql} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY a.created_at DESC, a.id DESC`;
  return (await all(sql, params)).map(toAction);
};

const findById = async (id, viewerId) => {
  const base = selectSql(viewerId);
  return toAction(await get(`${base.sql} WHERE a.id = ?`, [...base.params, id]));
};

/** Baris mentah (dipakai controller untuk cek pemilik/status). */
const findRaw = (id) => get('SELECT * FROM actions WHERE id = ?', [id]);

const create = async (data) => {
  const { lastID } = await run(`
    INSERT INTO actions (user_id, tutorial_id, title, material, weight_kg, co2_kg, coins, xp, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [data.userId, data.tutorialId ?? null, data.title, data.material, data.weightKg, data.co2Kg, data.coins, data.xp, data.imageUrl]);
  return lastID;
};

/** PATCH: hanya kolom yang dikirim yang diubah. */
const update = async (id, fields) => {
  const map = {
    title: 'title', material: 'material', weightKg: 'weight_kg', co2Kg: 'co2_kg',
    coins: 'coins', xp: 'xp', imageUrl: 'image_url', tutorialId: 'tutorial_id',
  };
  const sets = [];
  const params = [];
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && map[key]) { sets.push(`${map[key]} = ?`); params.push(value); }
  });
  if (!sets.length) return;
  await run(`UPDATE actions SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
};

/**
 * Mengubah status secara atomik: hanya berhasil bila status saat ini = fromStatus.
 * Mencegah koin cair dua kali bila dua kudos datang bersamaan.
 */
const changeStatus = async (id, fromStatus, toStatus) => {
  const { changes } = await run(`
    UPDATE actions
    SET status = ?, verified_at = CASE WHEN ? = 'verified' THEN CURRENT_TIMESTAMP ELSE NULL END
    WHERE id = ? AND status = ?`, [toStatus, toStatus, id, fromStatus]);
  return changes === 1;
};

const remove = async (id) => (await run('DELETE FROM actions WHERE id = ?', [id])).changes;

/** Hasil: true bila kudos baru tercatat, false bila sudah pernah memberi. */
const addKudos = async (actionId, userId) => {
  const { changes } = await run('INSERT OR IGNORE INTO kudos (action_id, user_id) VALUES (?, ?)', [actionId, userId]);
  return changes === 1;
};

const removeKudos = async (actionId, userId) => (await run('DELETE FROM kudos WHERE action_id = ? AND user_id = ?', [actionId, userId])).changes === 1;

const countKudos = async (actionId) => (await get('SELECT COUNT(*) AS n FROM kudos WHERE action_id = ?', [actionId])).n;

module.exports = { findAll, findById, findRaw, create, update, changeStatus, remove, addKudos, removeKudos, countKudos };
