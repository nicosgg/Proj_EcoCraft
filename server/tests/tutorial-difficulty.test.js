// Uji fitur filter tingkat kesulitan tutorial. Jalankan: node --test tests/tutorial-difficulty.test.js
// Pengujian otomatis seluruh endpoint. Jalankan: npm test
// Memakai database sementara, sehingga database.sqlite milikmu tidak tersentuh.
process.env.NODE_ENV = 'test';
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecocraft-test-'));
process.env.DB_PATH = path.join(tmpDir, 'test.sqlite');

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const db = require('../src/config/database');
const { seed, MEMBER_PASSWORD } = require('../src/db/seed');

let server;
let base;

before(async () => {
  await db.resetSchema();
  await seed();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const api = async (method, url, { token, body, form, raw } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (raw !== undefined) { headers['Content-Type'] = 'application/json'; payload = raw; }
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  const res = await fetch(base + url, { method, headers, body: payload });
  return { status: res.status, body: await res.json() };
};

const login = async (email, password = MEMBER_PASSWORD) => {
  const res = await api('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(res.status, 200, `login ${email}`);
  return res.body.data.token;
};

test('tutorial: filter tingkat kesulitan', async () => {
  const all = await api('GET', '/api/tutorials');
  const difficulty = all.body.data[0].difficulty;
  const expected = all.body.data.filter((t) => t.difficulty === difficulty).map((t) => t.id);
  const res = await api('GET', `/api/tutorials?difficulty=${encodeURIComponent(difficulty)}`);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.map((t) => t.id), expected);
  assert.equal((await api('GET', '/api/tutorials?difficulty=Mudah%20sekali')).status, 400);
});