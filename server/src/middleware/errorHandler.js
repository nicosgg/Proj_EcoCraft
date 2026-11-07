const multer = require('multer');
const env = require('../config/env');
const { HttpError } = require('../utils/http');

/** 404 untuk endpoint yang tidak terdaftar. */
const notFound = (req, res) => {
  res.status(404).json({ message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}. Lihat daftar endpoint di GET /api.` });
};

/** Semua error berakhir di sini dan dikirim dengan format { message, errors? }. */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, ...(err.errors ? { errors: err.errors } : {}) });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `Ukuran foto maksimal ${env.UPLOAD_MAX_MB} MB.`
      : `Unggahan gagal: ${err.message}. Gunakan field form-data bernama "image".`;
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Body request bukan JSON yang valid.' });
  }
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({ message: 'Data bertentangan dengan data yang sudah ada.' });
  }
  console.error('💥 Error tak terduga:', err);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
};

module.exports = { notFound, errorHandler };
