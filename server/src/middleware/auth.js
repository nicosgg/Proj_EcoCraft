// Autentikasi berbasis JWT. Klien mengirim header:  Authorization: Bearer <token>
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/userModel');
const { HttpError } = require('../utils/http');

const readToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
};

const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const loadUser = async (token) => {
  const payload = jwt.verify(token, env.JWT_SECRET);
  return userModel.findById(payload.sub);
};

/** Wajib login. Mengisi req.user. */
const requireAuth = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Silakan login terlebih dahulu (token tidak ditemukan).'));
  try {
    const user = await loadUser(token);
    if (!user) return next(new HttpError(401, 'Akun tidak ditemukan. Silakan login ulang.'));
    req.user = user;
    return next();
  } catch (err) {
    return next(new HttpError(401, 'Token tidak valid atau sudah kedaluwarsa. Silakan login ulang.'));
  }
};

/** Login opsional: bila token valid, req.user diisi (dipakai untuk field likedByMe). */
const optionalAuth = async (req, res, next) => {
  const token = readToken(req);
  if (!token) return next();
  try { req.user = (await loadUser(token)) || undefined; } catch (err) { /* abaikan token rusak */ }
  return next();
};

/** Hanya admin. Dipasang setelah requireAuth. */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return next(new HttpError(403, 'Hanya admin yang dapat melakukan aksi ini.'));
  return next();
};

module.exports = { requireAuth, optionalAuth, requireAdmin, signToken };
