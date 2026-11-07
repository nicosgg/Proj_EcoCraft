// Data awal EcoCraft. Jalankan "npm run seed" untuk mengosongkan dan mengisi ulang database.
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const { calcCoins, calcCo2, RULES } = require('../config/constants');

const { run, get } = database;
const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
const img = (name) => `/static/illustrations/${name}.svg`;

const USERS = [
  { key: 'admin', name: 'Admin EcoCraft', email: 'admin@ecocraft.id', password: 'admin123', role: 'admin' },
  { key: 'sarah', name: 'Sarah Amalia', email: 'sarah@ecocraft.id', coins: 350, xp: 420 },
  { key: 'rizky', name: 'Rizky Hidayat', email: 'rizky@ecocraft.id' },
  { key: 'dimas', name: 'Dimas Prasetyo', email: 'dimas@ecocraft.id' },
  { key: 'anisa', name: 'Anisa Rahma', email: 'anisa@ecocraft.id' },
  { key: 'rina', name: 'Rina Eco', email: 'rina@ecocraft.id' },
  { key: 'budiDiy', name: 'Budi DIY', email: 'budi.diy@ecocraft.id' },
  { key: 'maya', name: 'Maya Green', email: 'maya@ecocraft.id' },
  { key: 'dewi', name: 'Dewi Lestari', email: 'dewi@ecocraft.id' },
  { key: 'joko', name: 'Joko Santoso', email: 'joko@ecocraft.id' },
  { key: 'budiTani', name: 'Budi Tani', email: 'budi.tani@ecocraft.id' },
];
const MEMBER_PASSWORD = 'eco12345';

const TUTORIALS = [
  {
    title: 'Pot Tanaman Gantung dari Botol Plastik', material: 'plastik', difficulty: 'Mudah', durationMinutes: 4, co2SavedKg: 0.2, xpReward: 50,
    author: 'rina', image: 'pot', description: 'Ubah botol minuman bekas menjadi pot gantung untuk tanaman hias kecil.',
    steps: [
      'Bersihkan botol plastik bekas minuman. Potong bagian tengah botol secara memanjang menggunakan gunting.',
      'Buat 3–4 lubang kecil di bagian bawah botol untuk resapan air tanaman.',
      'Ikat tali pada kedua ujung botol, masukkan tanah dan tanaman hias kecil. Selesai!',
    ],
  },
  {
    title: 'Organizer Meja dari Dus Sepatu', material: 'kardus', difficulty: 'Mudah', durationMinutes: 5, co2SavedKg: 0.4, xpReward: 60,
    author: 'budiDiy', image: 'organizer', description: 'Rapikan alat tulis dengan organizer bersekat dari dus sepatu.',
    steps: [
      'Potong bagian atas dus sepatu bekas, lalu bagi area dalam menjadi 3 sekat menggunakan potongan kardus.',
      'Lapisi seluruh bagian luar kardus menggunakan kertas kado bekas agar tampak rapi.',
    ],
  },
  {
    title: 'Totebag dari Kaos Bekas Tanpa Jahit', material: 'tekstil', difficulty: 'Sangat mudah', durationMinutes: 3, co2SavedKg: 0.8, xpReward: 40,
    author: 'maya', image: 'totebag', description: 'Kaos yang tidak terpakai bisa menjadi tas belanja tanpa perlu menjahit.',
    steps: [
      'Gunting lengan dan kerah kaos bekas untuk membentuk lubang pegangan tas.',
      'Gunting rumbai di bagian bawah kaos, lalu ikat kencang setiap pasangan rumbai depan dan belakang.',
    ],
  },
  {
    title: 'Vas Bunga Elegan dari Botol Kaca', material: 'kaca', difficulty: 'Sedang', durationMinutes: 6, co2SavedKg: 0.9, xpReward: 80,
    author: 'dewi', image: 'vas', description: 'Botol sirup bekas dililit tali rami menjadi vas bunga.',
    steps: [
      'Lepaskan label botol kaca dengan merendamnya di air hangat selama beberapa menit.',
      'Lilitkan tali rami dari leher hingga dasar botol secara rapat, kunci dengan lem tembak.',
    ],
  },
  {
    title: 'Tempat Pensil dari Kaleng Bekas', material: 'logam', difficulty: 'Mudah', durationMinutes: 4, co2SavedKg: 0.5, xpReward: 50,
    author: 'joko', image: 'kaleng', description: 'Kaleng susu bekas dicat ulang menjadi tempat pensil.',
    steps: [
      'Pastikan tepi kaleng tidak tajam, ratakan dengan palu bila perlu. Semprot permukaan kaleng dengan cat.',
      'Tempelkan kain flanel di bagian dasar kaleng agar tidak menggores meja.',
    ],
  },
  {
    title: 'Kompos Sederhana dari Sisa Dapur', material: 'organik', difficulty: 'Sedang', durationMinutes: 10, co2SavedKg: 1.5, xpReward: 100,
    author: 'budiTani', image: 'kompos', description: 'Olah sisa sayur dan buah menjadi kompos di ember bekas.',
    steps: [
      'Siapkan ember bekas dan buat beberapa lubang di bagian bawah untuk sirkulasi udara.',
      'Lapiskan sisa sayur dan tanah secara bergantian, lalu percikkan sedikit larutan EM4.',
    ],
  },
];

// Aksi contoh: dua menunggu verifikasi, dua sudah terverifikasi.
const ACTIONS = [
  { owner: 'sarah', tutorial: 1, title: 'Selesai membuat pot gantung dari botol bekas air mineral.', material: 'plastik', weightKg: 0.6, image: 'pot', minutesAgo: 4, status: 'pending', kudos: ['rina', 'maya'] },
  { owner: 'rizky', title: 'Rak sepatu mini dari tumpukan kardus bekas belanja online.', material: 'kardus', weightKg: 1.2, image: 'rak', minutesAgo: 25, status: 'pending', kudos: ['maya', 'joko', 'rina', 'anisa'] },
  { owner: 'dimas', title: 'Daur ulang jeriken oli bekas jadi tempat alat pertukangan!', material: 'plastik', weightKg: 0.8, image: 'oli', minutesAgo: 180, status: 'verified', kudos: ['sarah', 'rizky', 'anisa', 'rina', 'maya', 'joko'] },
  { owner: 'anisa', tutorial: 4, title: 'Selesai bikin vas bunga dari botol kaca bekas sirup.', material: 'kaca', weightKg: 0.5, image: 'vas', minutesAgo: 1560, status: 'verified', kudos: ['sarah', 'dimas', 'joko', 'dewi', 'maya'] },
];

// Lokasi mitra adalah data contoh untuk prototipe.
const DROP_POINTS = [
  { name: 'Eco-Drop Point A, Kebayoran', type: 'Bank sampah', address: 'Kebayoran Baru, Jakarta Selatan', latitude: -6.2440, longitude: 106.7990, materials: ['plastik', 'kardus', 'logam'], openingHours: 'Senin–Sabtu, 08.00–15.00' },
  { name: 'Eco-Drop Point B, Jatinegara', type: 'Bank sampah', address: 'Jatinegara, Jakarta Timur', latitude: -6.2250, longitude: 106.8704, materials: ['plastik', 'kaca', 'logam'], openingHours: 'Senin–Jumat, 09.00–16.00' },
  { name: 'Drop Box Tekstil C, Senayan', type: 'Drop box mitra', address: 'Senayan, Jakarta Pusat', latitude: -6.2270, longitude: 106.8010, materials: ['tekstil'], openingHours: 'Setiap hari, 10.00–21.00' },
  { name: 'TPS3R D, Depok', type: 'TPS3R', address: 'Beji, Depok', latitude: -6.4025, longitude: 106.7942, materials: ['organik', 'plastik', 'kardus'], openingHours: 'Senin–Sabtu, 07.00–14.00' },
  { name: 'Eco-Drop Point E, Bintaro', type: 'Bank sampah', address: 'Bintaro, Tangerang Selatan', latitude: -6.2786, longitude: 106.7279, materials: ['plastik', 'kardus', 'tekstil', 'kaca', 'logam'], openingHours: 'Sabtu–Minggu, 08.00–12.00' },
  { name: 'Pengepul Mitra F, Pulogadung', type: 'Pengepul', address: 'Pulogadung, Jakarta Timur', latitude: -6.1900, longitude: 106.9100, materials: ['logam', 'kaca', 'kardus'], openingHours: 'Senin–Sabtu, 08.00–17.00' },
];

const REWARDS = [
  { name: 'Paket bibit tanaman hias', partner: 'Mitra Kebun Kota', description: 'Tiga jenis bibit tanaman hias siap tanam.', costCoins: 150, stock: 25 },
  { name: 'Voucher diskon 20% toko organik', partner: 'Mitra Toko Organik', description: 'Berlaku untuk pembelian minimal Rp50.000.', costCoins: 200, stock: 40 },
  { name: 'Totebag daur ulang EcoCraft', partner: 'EcoCraft', description: 'Totebag dari kain sisa produksi.', costCoins: 300, stock: 10 },
  { name: 'Pulsa Rp10.000', partner: 'Semua operator', description: 'Dikirim ke nomor terdaftar.', costCoins: 500, stock: 50 },
  { name: 'Saldo e-wallet Rp25.000', partner: 'E-wallet pilihan', description: 'Dikirim ke akun e-wallet terdaftar.', costCoins: 1000, stock: 20 },
];

/** Mengisi seluruh data awal. Diasumsikan tabel kosong. */
const seed = async () => {
  const ids = {};
  for (const u of USERS) {
    const hash = bcrypt.hashSync(u.password || MEMBER_PASSWORD, 10);
    const { lastID } = await run(
      'INSERT INTO users (name, email, password_hash, role, coins, xp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.name, u.email, hash, u.role || 'member', u.coins || 0, u.xp || 0, ago(60 * 24 * 30)],
    );
    ids[u.key] = lastID;
  }

  for (const t of TUTORIALS) {
    const { lastID } = await run(`
      INSERT INTO tutorials (title, description, material, difficulty, duration_minutes, co2_saved_kg, xp_reward, image_url, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.title, t.description, t.material, t.difficulty, t.durationMinutes, t.co2SavedKg, t.xpReward, img(t.image), ids[t.author]]);
    for (let i = 0; i < t.steps.length; i += 1) {
      await run('INSERT INTO tutorial_steps (tutorial_id, step_order, description) VALUES (?, ?, ?)', [lastID, i + 1, t.steps[i]]);
    }
  }

  for (const a of ACTIONS) {
    const xp = a.tutorial ? TUTORIALS[a.tutorial - 1].xpReward : RULES.defaultActionXp;
    const coins = calcCoins(a.weightKg);
    const created = ago(a.minutesAgo);
    const { lastID } = await run(`
      INSERT INTO actions (user_id, tutorial_id, title, material, weight_kg, co2_kg, coins, xp, image_url, status, created_at, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [ids[a.owner], a.tutorial || null, a.title, a.material, a.weightKg, calcCo2(a.weightKg, a.material), coins, xp,
      img(a.image), a.status, created, a.status === 'verified' ? ago(a.minutesAgo - 30) : null]);
    for (const k of a.kudos) {
      await run('INSERT INTO kudos (action_id, user_id) VALUES (?, ?)', [lastID, ids[k]]);
    }
    if (a.status === 'verified') {
      await run('UPDATE users SET coins = coins + ?, xp = xp + ? WHERE id = ?', [coins, xp, ids[a.owner]]);
    }
  }

  for (const d of DROP_POINTS) {
    await run(`
      INSERT INTO drop_points (name, type, address, latitude, longitude, materials, opening_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?)`, [d.name, d.type, d.address, d.latitude, d.longitude, d.materials.join(','), d.openingHours]);
  }

  for (const r of REWARDS) {
    await run('INSERT INTO rewards (name, partner, description, cost_coins, stock) VALUES (?, ?, ?, ?, ?)',
      [r.name, r.partner, r.description, r.costCoins, r.stock]);
  }

  // Riwayat penukaran contoh milik Sarah (saldo 350 adalah sisa setelah penukaran ini)
  await run('INSERT INTO redemptions (user_id, reward_id, reward_name, cost_coins, voucher_code, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [ids.sarah, 1, REWARDS[0].name, REWARDS[0].costCoins, 'ECO-SEED-B1B1T', ago(60 * 24 * 3)]);
};

/** Dipanggil saat server menyala: isi data awal hanya bila database masih kosong. */
const seedIfEmpty = async () => {
  const row = await get('SELECT COUNT(*) AS n FROM users');
  if (row.n > 0) return false;
  await seed();
  return true;
};

module.exports = { seed, seedIfEmpty, MEMBER_PASSWORD };

// npm run seed  ->  kosongkan dan isi ulang
if (require.main === module) {
  (async () => {
    await database.resetSchema();
    await seed();
    console.log('🌱 Database diisi ulang dengan data awal.');
    console.log('   Admin : admin@ecocraft.id / admin123');
    console.log(`   Member: sarah@ecocraft.id / ${MEMBER_PASSWORD} (dan akun anggota lain dengan sandi yang sama)`);
    await database.close();
  })().catch((err) => { console.error(err); process.exit(1); });
}
