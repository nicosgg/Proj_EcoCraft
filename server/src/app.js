// Konfigurasi aplikasi Express (dipisah dari server.js agar mudah diuji).
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const meta = require('./controllers/metaController');
const { UPLOAD_DIR } = require('./middleware/upload');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors()); // izinkan Web (Vite), Mobile, dan Desktop mengakses API
app.use(express.json({ limit: '1mb' })); // membaca body JSON
app.use(express.urlencoded({ extended: true })); // membaca body form (Postman x-www-form-urlencoded)

// Log sederhana: METHOD /path -> status (waktu)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`));
    next();
  });
}

// File statis: ilustrasi bawaan dan foto unggahan
app.use('/static', express.static(path.resolve(__dirname, '../public')));
app.use('/uploads', express.static(UPLOAD_DIR));

// Route
app.get('/', meta.root);
app.use('/api', routes);

// 404 dan penanganan error
app.use(notFound);
app.use(errorHandler);

module.exports = app;
