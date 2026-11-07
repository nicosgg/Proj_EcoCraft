// Membaca variabel lingkungan dari file .env (lihat .env.example)
require('dotenv').config();

const DEFAULT_SECRET = 'ecocraft-dev-secret-ganti-di-file-env';

const env = {
  PORT: Number(process.env.PORT) || 3000,
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  UPLOAD_MAX_MB: Number(process.env.UPLOAD_MAX_MB) || 3,
  DB_PATH: process.env.DB_PATH || '',
};

if (env.JWT_SECRET === DEFAULT_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  JWT_SECRET belum diatur di .env, memakai nilai bawaan (hanya untuk pengembangan).');
}

module.exports = env;
