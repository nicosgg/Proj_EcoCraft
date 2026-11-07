// Satu-satunya database untuk seluruh platform (Web, Mobile, Desktop): file SQLite.
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const env = require('./env');

const dbPath = env.DB_PATH
  ? path.resolve(env.DB_PATH)
  : path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Gagal konek SQLite:', err.message);
  } else if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Terhubung ke SQLite:', dbPath);
  }
});

// Aktifkan foreign key (bawaan SQLite mati)
db.serialize(() => db.run('PRAGMA foreign_keys = ON'));

/** Menjalankan INSERT/UPDATE/DELETE. Hasil: { lastID, changes } */
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function onRun(err) {
    if (err) return reject(err);
    return resolve({ lastID: this.lastID, changes: this.changes });
  });
});

/** Mengambil satu baris (atau undefined). */
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

/** Mengambil banyak baris. */
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

/** Menjalankan beberapa perintah SQL sekaligus (dipakai untuk skema). */
const exec = (sql) => new Promise((resolve, reject) => {
  db.exec(sql, (err) => (err ? reject(err) : resolve()));
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  coins         INTEGER NOT NULL DEFAULT 0,
  xp            INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutorials (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT    NOT NULL,
  description      TEXT,
  material         TEXT    NOT NULL,
  difficulty       TEXT    NOT NULL DEFAULT 'Mudah',
  duration_minutes INTEGER NOT NULL,
  co2_saved_kg     REAL    NOT NULL DEFAULT 0,
  xp_reward        INTEGER NOT NULL DEFAULT 50,
  image_url        TEXT,
  author_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tutorial_steps (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tutorial_id INTEGER NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  step_order  INTEGER NOT NULL,
  description TEXT    NOT NULL,
  image_url   TEXT
);

CREATE TABLE IF NOT EXISTS actions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id INTEGER REFERENCES tutorials(id) ON DELETE SET NULL,
  title       TEXT    NOT NULL,
  material    TEXT    NOT NULL,
  weight_kg   REAL    NOT NULL,
  co2_kg      REAL    NOT NULL,
  coins       INTEGER NOT NULL,
  xp          INTEGER NOT NULL,
  image_url   TEXT,
  status      TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME
);

CREATE TABLE IF NOT EXISTS kudos (
  action_id  INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (action_id, user_id)
);

CREATE TABLE IF NOT EXISTS drop_points (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  address       TEXT,
  latitude      REAL NOT NULL,
  longitude     REAL NOT NULL,
  materials     TEXT NOT NULL, -- dipisah koma, contoh: "plastik,kardus"
  opening_hours TEXT
);

CREATE TABLE IF NOT EXISTS rewards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  partner     TEXT,
  description TEXT,
  cost_coins  INTEGER NOT NULL,
  stock       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS redemptions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id    INTEGER REFERENCES rewards(id) ON DELETE SET NULL,
  reward_name  TEXT    NOT NULL,
  cost_coins   INTEGER NOT NULL,
  voucher_code TEXT    NOT NULL UNIQUE,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const DROP_ALL = `
DROP TABLE IF EXISTS redemptions;
DROP TABLE IF EXISTS rewards;
DROP TABLE IF EXISTS kudos;
DROP TABLE IF EXISTS actions;
DROP TABLE IF EXISTS tutorial_steps;
DROP TABLE IF EXISTS tutorials;
DROP TABLE IF EXISTS drop_points;
DROP TABLE IF EXISTS users;
`;

const initSchema = () => exec(SCHEMA);
const resetSchema = async () => { await exec(DROP_ALL); await exec(SCHEMA); };
const close = () => new Promise((resolve) => db.close(() => resolve()));

module.exports = { db, dbPath, run, get, all, exec, initSchema, resetSchema, close };
