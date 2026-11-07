const dropPointModel = require('../models/dropPointModel');
const { MATERIAL_KEYS } = require('../config/constants');
const { HttpError, send } = require('../utils/http');
const { validator, parseId } = require('../utils/validate');

const readBody = (b) => {
  const v = validator();
  const data = {
    name: v.string('name', b.name, { min: 3, max: 120, label: 'Nama' }),
    type: v.string('type', b.type, { min: 3, max: 60, label: 'Jenis mitra' }),
    address: v.string('address', b.address, { required: false, max: 200, label: 'Alamat' }),
    latitude: v.number('latitude', b.latitude, { min: -90, max: 90, label: 'Latitude' }),
    longitude: v.number('longitude', b.longitude, { min: -180, max: 180, label: 'Longitude' }),
    openingHours: v.string('openingHours', b.openingHours, { required: false, max: 80, label: 'Jam buka' }),
  };
  const mats = Array.isArray(b.materials) ? [...new Set(b.materials)] : [];
  if (!mats.length) v.errors.materials = 'Pilih minimal satu bahan yang diterima.';
  else if (mats.some((m) => !MATERIAL_KEYS.includes(m))) v.errors.materials = `Bahan harus dari: ${MATERIAL_KEYS.join(', ')}.`;
  data.materials = mats;
  v.check();
  return data;
};

// GET /api/drop-points?material=
const list = async (req, res) => {
  const { material } = req.query;
  if (material && !MATERIAL_KEYS.includes(material)) throw new HttpError(400, `Bahan tidak dikenal. Pilihan: ${MATERIAL_KEYS.join(', ')}.`);
  send(res, 200, 'Data titik setor berhasil diambil', await dropPointModel.findAll({ material }));
};

// GET /api/drop-points/:id
const getById = async (req, res) => {
  const item = await dropPointModel.findById(parseId(req.params.id, 'ID titik setor'));
  if (!item) throw new HttpError(404, 'Titik setor tidak ditemukan.');
  send(res, 200, 'Detail titik setor berhasil diambil', item);
};

// POST /api/drop-points (admin)
const create = async (req, res) => {
  send(res, 201, 'Titik setor berhasil ditambahkan', await dropPointModel.create(readBody(req.body)));
};

// PUT /api/drop-points/:id (admin)
const update = async (req, res) => {
  const id = parseId(req.params.id, 'ID titik setor');
  if (!(await dropPointModel.findById(id))) throw new HttpError(404, 'Titik setor tidak ditemukan.');
  send(res, 200, 'Titik setor berhasil diperbarui', await dropPointModel.update(id, readBody(req.body)));
};

// DELETE /api/drop-points/:id (admin)
const remove = async (req, res) => {
  const id = parseId(req.params.id, 'ID titik setor');
  if (!(await dropPointModel.remove(id))) throw new HttpError(404, 'Titik setor tidak ditemukan.');
  send(res, 200, 'Titik setor berhasil dihapus', { id });
};

module.exports = { list, getById, create, update, remove };
