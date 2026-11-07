const tutorialModel = require('../models/tutorialModel');
const { MATERIAL_KEYS, DIFFICULTIES } = require('../config/constants');
const { HttpError, send, toStoredUrl } = require('../utils/http');
const { validator, parseId } = require('../utils/validate');
const { presentTutorial } = require('./presenters');

/** Validasi body untuk POST dan PUT (semua field dikirim). */
const readTutorialBody = (req) => {
  const b = req.body;
  const v = validator();
  const data = {
    title: v.string('title', b.title, { min: 5, max: 120, label: 'Judul' }),
    description: v.string('description', b.description, { required: false, max: 1000, label: 'Deskripsi' }),
    material: v.oneOf('material', b.material, MATERIAL_KEYS, { label: 'Bahan' }),
    difficulty: v.oneOf('difficulty', b.difficulty, DIFFICULTIES, { label: 'Tingkat kesulitan' }),
    durationMinutes: v.number('durationMinutes', b.durationMinutes, { min: 1, max: 600, integer: true, label: 'Durasi (menit)' }),
    co2SavedKg: v.number('co2SavedKg', b.co2SavedKg ?? 0, { min: 0, max: 100, label: 'CO2e dicegah (kg)' }),
    xpReward: v.number('xpReward', b.xpReward ?? 50, { min: 0, max: 1000, integer: true, label: 'XP' }),
    imageUrl: toStoredUrl(req, b.imageUrl) ?? null,
  };
  if (!Array.isArray(b.steps) || b.steps.length === 0) {
    v.errors.steps = 'Minimal satu langkah pengerjaan.';
  } else if (b.steps.length > 20) {
    v.errors.steps = 'Maksimal 20 langkah.';
  } else {
    data.steps = b.steps.map((s, i) => ({
      description: v.string(`steps[${i}].description`, s && s.description, { min: 5, max: 500, label: `Langkah ${i + 1}` }),
      imageUrl: toStoredUrl(req, s && s.imageUrl) ?? null,
    }));
  }
  v.check();
  return data;
};

// GET /api/tutorials?material=&q=&maxDuration=
const list = async (req, res) => {
  const { material, q } = req.query;
  if (material && !MATERIAL_KEYS.includes(material)) throw new HttpError(400, `Bahan tidak dikenal. Pilihan: ${MATERIAL_KEYS.join(', ')}.`);
  const maxDuration = req.query.maxDuration ? Number(req.query.maxDuration) : undefined;
  if (maxDuration !== undefined && !(maxDuration > 0)) throw new HttpError(400, 'maxDuration harus angka lebih dari 0.');
  const items = await tutorialModel.findAll({ material, q: q && String(q).trim(), maxDuration });
  send(res, 200, 'Data tutorial berhasil diambil', items.map((t) => presentTutorial(req, t)));
};

// GET /api/tutorials/:id
const getById = async (req, res) => {
  const tutorial = await tutorialModel.findById(parseId(req.params.id, 'ID tutorial'));
  if (!tutorial) throw new HttpError(404, 'Tutorial tidak ditemukan.');
  send(res, 200, 'Detail tutorial berhasil diambil', presentTutorial(req, tutorial));
};

// POST /api/tutorials (admin)
const create = async (req, res) => {
  const tutorial = await tutorialModel.create(readTutorialBody(req), req.user.id);
  send(res, 201, 'Tutorial berhasil ditambahkan', presentTutorial(req, tutorial));
};

// PUT /api/tutorials/:id (admin)
const update = async (req, res) => {
  const id = parseId(req.params.id, 'ID tutorial');
  if (!(await tutorialModel.exists(id))) throw new HttpError(404, 'Tutorial tidak ditemukan.');
  const tutorial = await tutorialModel.update(id, readTutorialBody(req));
  send(res, 200, 'Tutorial berhasil diperbarui', presentTutorial(req, tutorial));
};

// DELETE /api/tutorials/:id (admin)
const remove = async (req, res) => {
  const id = parseId(req.params.id, 'ID tutorial');
  if (!(await tutorialModel.remove(id))) throw new HttpError(404, 'Tutorial tidak ditemukan.');
  send(res, 200, 'Tutorial berhasil dihapus', { id });
};

module.exports = { list, getById, create, update, remove };
