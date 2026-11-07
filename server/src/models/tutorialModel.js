const { get, all, run } = require('../config/database');
const { isoDate } = require('../utils/http');

const BASE_SELECT = `
  SELECT t.*, u.name AS author_name,
         (SELECT COUNT(*) FROM tutorial_steps s WHERE s.tutorial_id = t.id) AS step_count
  FROM tutorials t
  LEFT JOIN users u ON u.id = t.author_id`;

const toTutorial = (row) => row && {
  id: row.id,
  title: row.title,
  description: row.description,
  material: row.material,
  difficulty: row.difficulty,
  durationMinutes: row.duration_minutes,
  co2SavedKg: row.co2_saved_kg,
  xpReward: row.xp_reward,
  imageUrl: row.image_url,
  author: row.author_id ? { id: row.author_id, name: row.author_name } : null,
  stepCount: row.step_count,
  createdAt: isoDate(row.created_at),
  updatedAt: isoDate(row.updated_at),
};

const toStep = (row) => ({ id: row.id, stepOrder: row.step_order, description: row.description, imageUrl: row.image_url });

/** Daftar tutorial dengan filter opsional: bahan, kata kunci, durasi maksimum. */
const findAll = async ({ material, q, maxDuration } = {}) => {
  const where = [];
  const params = [];
  if (material) { where.push('t.material = ?'); params.push(material); }
  if (maxDuration) { where.push('t.duration_minutes <= ?'); params.push(maxDuration); }
  if (q) {
    where.push('(t.title LIKE ? OR t.description LIKE ? OR u.name LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const sql = `${BASE_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY t.id ASC`;
  return (await all(sql, params)).map(toTutorial);
};

const findById = async (id) => {
  const row = await get(`${BASE_SELECT} WHERE t.id = ?`, [id]);
  if (!row) return null;
  const steps = await all('SELECT * FROM tutorial_steps WHERE tutorial_id = ? ORDER BY step_order ASC', [id]);
  return { ...toTutorial(row), steps: steps.map(toStep) };
};

const exists = async (id) => !!(await get('SELECT 1 FROM tutorials WHERE id = ?', [id]));

const getXpReward = async (id) => {
  const row = await get('SELECT xp_reward FROM tutorials WHERE id = ?', [id]);
  return row ? row.xp_reward : null;
};

const insertSteps = async (tutorialId, steps) => {
  for (let i = 0; i < steps.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await run('INSERT INTO tutorial_steps (tutorial_id, step_order, description, image_url) VALUES (?, ?, ?, ?)',
      [tutorialId, i + 1, steps[i].description, steps[i].imageUrl ?? null]);
  }
};

const create = async (data, authorId) => {
  const { lastID } = await run(`
    INSERT INTO tutorials (title, description, material, difficulty, duration_minutes, co2_saved_kg, xp_reward, image_url, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [data.title, data.description ?? null, data.material, data.difficulty, data.durationMinutes,
    data.co2SavedKg, data.xpReward, data.imageUrl ?? null, authorId ?? null]);
  await insertSteps(lastID, data.steps);
  return findById(lastID);
};

/** PUT: mengganti seluruh isi tutorial termasuk daftar langkah. */
const update = async (id, data) => {
  await run(`
    UPDATE tutorials SET title = ?, description = ?, material = ?, difficulty = ?, duration_minutes = ?,
           co2_saved_kg = ?, xp_reward = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`,
  [data.title, data.description ?? null, data.material, data.difficulty, data.durationMinutes,
    data.co2SavedKg, data.xpReward, data.imageUrl ?? null, id]);
  await run('DELETE FROM tutorial_steps WHERE tutorial_id = ?', [id]);
  await insertSteps(id, data.steps);
  return findById(id);
};

const remove = async (id) => (await run('DELETE FROM tutorials WHERE id = ?', [id])).changes;

module.exports = { findAll, findById, exists, getXpReward, create, update, remove };
