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

test('umum: root, daftar endpoint, bahan, statistik', async () => {
  const root = await api('GET', '/');
  assert.equal(root.status, 200);
  const index = await api('GET', '/api');
  assert.ok(index.body.data.endpoints.length >= 30);
  const mats = await api('GET', '/api/materials');
  assert.equal(mats.body.data.materials.length, 6);
  const stats = await api('GET', '/api/stats');
  assert.equal(stats.body.data.actions.verified, 2);
  const missing = await api('GET', '/api/tidak-ada');
  assert.equal(missing.status, 404);
  const badJson = await api('POST', '/api/auth/login', { raw: '{bukan json' });
  assert.equal(badJson.status, 400);
});

test('autentikasi: register, duplikat, validasi, login, /api/me', async () => {
  const reg = await api('POST', '/api/auth/register', { body: { name: 'Uji Coba', email: 'uji@ecocraft.id', password: 'rahasia1' } });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.data.token);
  assert.equal(reg.body.data.user.role, 'member');
  assert.equal(reg.body.data.user.password_hash, undefined);

  const dup = await api('POST', '/api/auth/register', { body: { name: 'Uji Coba', email: 'UJI@ecocraft.id', password: 'rahasia1' } });
  assert.equal(dup.status, 409);

  const invalid = await api('POST', '/api/auth/register', { body: { name: 'U', email: 'bukan-email', password: '1' } });
  assert.equal(invalid.status, 400);
  assert.deepEqual(Object.keys(invalid.body.errors).sort(), ['email', 'name', 'password']);

  const wrong = await api('POST', '/api/auth/login', { body: { email: 'sarah@ecocraft.id', password: 'salah' } });
  assert.equal(wrong.status, 401);

  assert.equal((await api('GET', '/api/me')).status, 401);
  assert.equal((await api('GET', '/api/me', { token: 'token-palsu' })).status, 401);
  const me = await api('GET', '/api/me', { token: await login('sarah@ecocraft.id') });
  assert.equal(me.status, 200);
  assert.equal(me.body.data.coins, 350);
  assert.equal(me.body.data.stats.pendingCoins, 60);
});

test('tutorial: filter, detail, dan CRUD khusus admin', async () => {
  const all = await api('GET', '/api/tutorials');
  assert.equal(all.body.data.length, 6);
  assert.match(all.body.data[0].imageUrl, /^http:\/\/127\.0\.0\.1:\d+\/static\/illustrations\/pot\.svg$/);
  assert.deepEqual((await api('GET', '/api/tutorials?material=kaca')).body.data.map((t) => t.id), [4]);
  assert.deepEqual((await api('GET', '/api/tutorials?maxDuration=5')).body.data.map((t) => t.id), [1, 2, 3, 5]);
  assert.deepEqual((await api('GET', '/api/tutorials?q=botol')).body.data.map((t) => t.id), [1, 4]);
  assert.equal((await api('GET', '/api/tutorials?material=kayu')).status, 400);

  const detail = await api('GET', '/api/tutorials/1');
  assert.equal(detail.body.data.steps.length, 3);
  assert.equal((await api('GET', '/api/tutorials/999')).status, 404);
  assert.equal((await api('GET', '/api/tutorials/abc')).status, 400);

  const body = {
    title: 'Celengan dari Kaleng Bekas', material: 'logam', difficulty: 'Mudah', durationMinutes: 7,
    co2SavedKg: 0.3, xpReward: 40, steps: [{ description: 'Bersihkan kaleng dan haluskan tepinya.' }, { description: 'Lubangi tutup kaleng lalu hias.' }],
  };
  const member = await login('sarah@ecocraft.id');
  assert.equal((await api('POST', '/api/tutorials', { token: member, body })).status, 403);
  assert.equal((await api('POST', '/api/tutorials', { body })).status, 401);

  const admin = await login('admin@ecocraft.id', 'admin123');
  const created = await api('POST', '/api/tutorials', { token: admin, body });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.steps.length, 2);
  const id = created.body.data.id;

  const noSteps = await api('POST', '/api/tutorials', { token: admin, body: { ...body, steps: [] } });
  assert.equal(noSteps.status, 400);
  assert.ok(noSteps.body.errors.steps);

  const updated = await api('PUT', `/api/tutorials/${id}`, { token: admin, body: { ...body, title: 'Celengan Kaleng Warna-warni', steps: [{ description: 'Satu langkah saja yang baru.' }] } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.title, 'Celengan Kaleng Warna-warni');
  assert.equal(updated.body.data.steps.length, 1);

  assert.equal((await api('DELETE', `/api/tutorials/${id}`, { token: admin })).status, 200);
  assert.equal((await api('GET', `/api/tutorials/${id}`)).status, 404);
  assert.equal((await api('DELETE', `/api/tutorials/${id}`, { token: admin })).status, 404);
});

test('aksi: unggah foto, kirim, ubah, 5 kudos memverifikasi dan mencairkan koin', async () => {
  const sarah = await login('sarah@ecocraft.id');

  // Unggah foto (PNG 1x1)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const form = new FormData();
  form.append('image', new Blob([png], { type: 'image/png' }), 'bukti.png');
  const up = await api('POST', '/api/uploads', { token: sarah, form });
  assert.equal(up.status, 201);
  assert.match(up.body.data.url, /\/uploads\/.+\.png$/);
  const img = await fetch(up.body.data.url);
  assert.equal(img.status, 200);
  fs.rmSync(path.resolve(__dirname, '..', up.body.data.path.slice(1)), { force: true });

  const badType = new FormData();
  badType.append('image', new Blob(['halo'], { type: 'text/plain' }), 'catatan.txt');
  assert.equal((await api('POST', '/api/uploads', { token: sarah, form: badType })).status, 415);
  assert.equal((await api('POST', '/api/uploads', { token: sarah, form: new FormData() })).status, 400);

  const noPhoto = await api('POST', '/api/actions', { token: sarah, body: { title: 'Tanpa foto', material: 'plastik', weightKg: 1 } });
  assert.equal(noPhoto.status, 400);
  assert.ok(noPhoto.body.errors.imageUrl);

  const created = await api('POST', '/api/actions', {
    token: sarah, body: { title: 'Tas belanja dari kaos lama', material: 'tekstil', weightKg: 0.4, imageUrl: up.body.data.url, tutorialId: 3 },
  });
  assert.equal(created.status, 201);
  const action = created.body.data;
  assert.equal(action.status, 'pending');
  assert.equal(action.coins, 40);
  assert.equal(action.co2Kg, 1.2);
  assert.equal(action.xp, 40);
  assert.equal(action.tutorial.id, 3);
  assert.equal(action.imageUrl, up.body.data.url);

  const patched = await api('PATCH', `/api/actions/${action.id}`, { token: sarah, body: { weightKg: 0.6 } });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.data.coins, 60);
  assert.equal(patched.body.data.co2Kg, 1.8);
  assert.equal((await api('PATCH', `/api/actions/${action.id}`, { token: sarah, body: {} })).status, 400);

  assert.equal((await api('POST', `/api/actions/${action.id}/kudos`, { token: sarah })).status, 403);
  const rizky = await login('rizky@ecocraft.id');
  assert.equal((await api('PATCH', `/api/actions/${action.id}`, { token: rizky, body: { title: 'Bukan milikku' } })).status, 403);

  const coinsBefore = (await api('GET', '/api/me', { token: sarah })).body.data.coins;
  const voters = ['rizky', 'dimas', 'anisa', 'maya', 'joko'];
  let last;
  for (const name of voters) {
    // eslint-disable-next-line no-await-in-loop
    last = await api('POST', `/api/actions/${action.id}/kudos`, { token: await login(`${name}@ecocraft.id`) });
    assert.equal(last.status, 201);
  }
  assert.equal(last.body.data.status, 'verified');
  assert.equal(last.body.data.kudosCount, 5);
  assert.equal(last.body.data.likedByMe, true);
  const after = (await api('GET', '/api/me', { token: sarah })).body.data;
  assert.equal(after.coins, coinsBefore + 60);

  assert.equal((await api('POST', `/api/actions/${action.id}/kudos`, { token: rizky })).status, 409);
  assert.equal((await api('DELETE', `/api/actions/${action.id}/kudos`, { token: rizky })).status, 200);
  assert.equal((await api('DELETE', `/api/actions/${action.id}/kudos`, { token: rizky })).status, 404);
  assert.equal((await api('PATCH', `/api/actions/${action.id}`, { token: sarah, body: { title: 'Ubah setelah verifikasi' } })).status, 409);
  assert.equal((await api('DELETE', `/api/actions/${action.id}`, { token: sarah })).status, 409);

  const feed = await api('GET', '/api/actions?status=verified', { token: rizky });
  assert.ok(feed.body.data.some((a) => a.id === action.id && a.likedByMe === false));
});

test('aksi: moderasi admin dan hapus', async () => {
  const admin = await login('admin@ecocraft.id', 'admin123');
  const rizky = await login('rizky@ecocraft.id');
  // aksi #2 milik Rizky (pending)
  const rejected = await api('PATCH', '/api/actions/2/status', { token: admin, body: { status: 'rejected' } });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.data.status, 'rejected');
  assert.ok(!(await api('GET', '/api/actions')).body.data.some((a) => a.id === 2));
  assert.ok((await api('GET', '/api/me/actions', { token: rizky })).body.data.some((a) => a.id === 2));
  assert.equal((await api('POST', '/api/actions/2/kudos', { token: await login('sarah@ecocraft.id') })).status, 409);
  assert.equal((await api('PATCH', '/api/actions/2/status', { token: rizky, body: { status: 'verified' } })).status, 403);
  assert.equal((await api('PATCH', '/api/actions/2/status', { token: admin, body: { status: 'aneh' } })).status, 400);

  // admin menghapus aksi terverifikasi milik Dimas -> koin ditarik
  const dimas = await login('dimas@ecocraft.id');
  const before = (await api('GET', '/api/me', { token: dimas })).body.data.coins;
  assert.equal((await api('DELETE', '/api/actions/3', { token: admin })).status, 200);
  assert.equal((await api('GET', '/api/me', { token: dimas })).body.data.coins, Math.max(0, before - 80));
  assert.equal((await api('GET', '/api/actions/3')).status, 404);
});

test('titik setor: filter dan CRUD admin', async () => {
  assert.equal((await api('GET', '/api/drop-points')).body.data.length, 6);
  assert.deepEqual((await api('GET', '/api/drop-points?material=tekstil')).body.data.map((d) => d.id), [3, 5]);
  assert.match((await api('GET', '/api/drop-points/1')).body.data.mapsUrl, /google\.com\/maps/);

  const admin = await login('admin@ecocraft.id', 'admin123');
  const body = { name: 'Bank Sampah Uji', type: 'Bank sampah', latitude: 3.59, longitude: 98.67, materials: ['plastik', 'kaca'], openingHours: 'Setiap hari' };
  const invalid = await api('POST', '/api/drop-points', { token: admin, body: { ...body, materials: [], latitude: 200 } });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.errors.materials && invalid.body.errors.latitude);

  const created = await api('POST', '/api/drop-points', { token: admin, body });
  assert.equal(created.status, 201);
  const { id } = created.body.data;
  const updated = await api('PUT', `/api/drop-points/${id}`, { token: admin, body: { ...body, materials: ['logam'] } });
  assert.deepEqual(updated.body.data.materials, ['logam']);
  assert.equal((await api('DELETE', `/api/drop-points/${id}`, { token: admin })).status, 200);
  assert.equal((await api('GET', `/api/drop-points/${id}`)).status, 404);
});

test('reward: tukar koin, saldo kurang, stok habis, riwayat', async () => {
  const anisa = await login('anisa@ecocraft.id');
  const balance = (await api('GET', '/api/me', { token: anisa })).body.data.coins; // 50 dari aksi terverifikasi
  const tooExpensive = await api('POST', '/api/rewards/1/redeem', { token: anisa });
  assert.equal(tooExpensive.status, 409);
  assert.equal((await api('GET', '/api/me', { token: anisa })).body.data.coins, balance);

  const sarah = await login('sarah@ecocraft.id');
  const ok = await api('POST', '/api/rewards/1/redeem', { token: sarah });
  assert.equal(ok.status, 201);
  assert.match(ok.body.data.redemption.voucherCode, /^ECO-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal((await api('GET', '/api/rewards/1')).body.data.stock, 24);
  const history = await api('GET', '/api/me/redemptions', { token: sarah });
  assert.equal(history.body.data.length, 2);

  const admin = await login('admin@ecocraft.id', 'admin123');
  const empty = await api('POST', '/api/rewards', { token: admin, body: { name: 'Stiker EcoCraft', costCoins: 10, stock: 0 } });
  assert.equal(empty.status, 201);
  const out = await api('POST', `/api/rewards/${empty.body.data.id}/redeem`, { token: sarah });
  assert.equal(out.status, 409);
  assert.match(out.body.message, /habis/);
  assert.equal((await api('PUT', `/api/rewards/${empty.body.data.id}`, { token: admin, body: { name: 'Stiker EcoCraft', costCoins: 10, stock: 5 } })).body.data.stock, 5);
  assert.equal((await api('DELETE', `/api/rewards/${empty.body.data.id}`, { token: admin })).status, 200);
  assert.equal((await api('POST', '/api/rewards/999/redeem', { token: sarah })).status, 404);
});
