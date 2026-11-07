// Titik setor: bank sampah / mitra daur ulang untuk limbah yang belum bisa diolah sendiri.
const { get, all, run } = require('../config/database');

const toDropPoint = (row) => row && {
  id: row.id,
  name: row.name,
  type: row.type,
  address: row.address,
  latitude: row.latitude,
  longitude: row.longitude,
  materials: row.materials ? row.materials.split(',') : [],
  openingHours: row.opening_hours,
  mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${row.latitude},${row.longitude}`,
};

const findAll = async ({ material } = {}) => {
  const rows = material
    ? await all("SELECT * FROM drop_points WHERE (',' || materials || ',') LIKE ? ORDER BY id", [`%,${material},%`])
    : await all('SELECT * FROM drop_points ORDER BY id');
  return rows.map(toDropPoint);
};

const findById = async (id) => toDropPoint(await get('SELECT * FROM drop_points WHERE id = ?', [id]));

const create = async (d) => {
  const { lastID } = await run(`
    INSERT INTO drop_points (name, type, address, latitude, longitude, materials, opening_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [d.name, d.type, d.address ?? null, d.latitude, d.longitude, d.materials.join(','), d.openingHours ?? null]);
  return findById(lastID);
};

const update = async (id, d) => {
  await run(`
    UPDATE drop_points SET name = ?, type = ?, address = ?, latitude = ?, longitude = ?, materials = ?, opening_hours = ?
    WHERE id = ?`,
  [d.name, d.type, d.address ?? null, d.latitude, d.longitude, d.materials.join(','), d.openingHours ?? null, id]);
  return findById(id);
};

const remove = async (id) => (await run('DELETE FROM drop_points WHERE id = ?', [id])).changes;

module.exports = { findAll, findById, create, update, remove };
