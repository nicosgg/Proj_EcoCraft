// Penyimpanan foto bukti aksi di folder server/uploads menggunakan multer.
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const { HttpError } = require('../utils/http');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ALLOWED[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    return cb(new HttpError(415, 'Format foto harus JPG, PNG, atau WEBP.'));
  },
});

module.exports = { upload, UPLOAD_DIR };
