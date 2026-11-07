const { get } = require('../config/database');
const { MATERIALS, DIFFICULTIES, RULES } = require('../config/constants');
const { send, HttpError } = require('../utils/http');
const ENDPOINTS = require('../docs/endpoints');

// GET /
const root = (req, res) => send(res, 200, 'EcoCraft API berjalan 🚀', {
  name: 'EcoCraft API', version: '1.0.0', docs: `${req.protocol}://${req.get('host')}/api`,
});

// GET /api  (daftar seluruh endpoint)
const index = (req, res) => send(res, 200, 'Daftar endpoint EcoCraft API', {
  baseUrl: `${req.protocol}://${req.get('host')}`,
  responseFormat: { success: '{ message, data }', error: '{ message, errors? }' },
  auth: 'Header Authorization: Bearer <token> (token dari POST /api/auth/login)',
  endpoints: ENDPOINTS,
});

// GET /api/materials
const materials = (req, res) => send(res, 200, 'Daftar bahan berhasil diambil', {
  materials: Object.entries(MATERIALS).map(([key, m]) => ({ key, label: m.label, color: m.color, co2FactorKgPerKg: m.co2Factor })),
  difficulties: DIFFICULTIES,
  rules: RULES,
});

// GET /api/stats  (ringkasan untuk dashboard)
const stats = async (req, res) => {
  const row = await get(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'member')            AS members,
      (SELECT COUNT(*) FROM tutorials)                               AS tutorials,
      (SELECT COUNT(*) FROM drop_points)                             AS drop_points,
      (SELECT COUNT(*) FROM actions)                                 AS actions_total,
      (SELECT COUNT(*) FROM actions WHERE status = 'pending')        AS actions_pending,
      (SELECT COUNT(*) FROM actions WHERE status = 'verified')       AS actions_verified,
      (SELECT COUNT(*) FROM actions WHERE status = 'rejected')       AS actions_rejected,
      (SELECT COALESCE(SUM(weight_kg), 0) FROM actions WHERE status = 'verified') AS weight,
      (SELECT COALESCE(SUM(co2_kg), 0)    FROM actions WHERE status = 'verified') AS co2,
      (SELECT COUNT(*) FROM redemptions)                             AS redemptions`);
  send(res, 200, 'Statistik berhasil diambil', {
    members: row.members,
    tutorials: row.tutorials,
    dropPoints: row.drop_points,
    actions: { total: row.actions_total, pending: row.actions_pending, verified: row.actions_verified, rejected: row.actions_rejected },
    totalWeightKg: Math.round(row.weight * 10) / 10,
    totalCo2Kg: Math.round(row.co2 * 10) / 10,
    redemptions: row.redemptions,
  });
};

// POST /api/uploads
const uploadImage = (req, res) => {
  if (!req.file) throw new HttpError(400, 'Tidak ada file. Kirim form-data dengan field "image".');
  const path = `/uploads/${req.file.filename}`;
  send(res, 201, 'Foto berhasil diunggah', {
    url: `${req.protocol}://${req.get('host')}${path}`, path, size: req.file.size, mimeType: req.file.mimetype,
  });
};

module.exports = { root, index, materials, stats, uploadImage };
