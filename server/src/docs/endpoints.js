// Daftar endpoint yang ditampilkan oleh GET /api.
// auth: "publik" = tanpa token, "opsional" = token boleh dikirim, "login" = wajib token, "admin" = token admin.
module.exports = [
  { group: 'Umum', method: 'GET', path: '/', auth: 'publik', description: 'Cek server berjalan' },
  { group: 'Umum', method: 'GET', path: '/api', auth: 'publik', description: 'Daftar seluruh endpoint (halaman ini)' },
  { group: 'Umum', method: 'GET', path: '/api/materials', auth: 'publik', description: 'Daftar bahan, tingkat kesulitan, dan aturan poin' },
  { group: 'Umum', method: 'GET', path: '/api/stats', auth: 'publik', description: 'Ringkasan statistik untuk dashboard' },

  { group: 'Autentikasi', method: 'POST', path: '/api/auth/register', auth: 'publik', description: 'Daftar akun anggota baru', body: '{ name, email, password }' },
  { group: 'Autentikasi', method: 'POST', path: '/api/auth/login', auth: 'publik', description: 'Login, mengembalikan token JWT', body: '{ email, password }' },

  { group: 'Profil', method: 'GET', path: '/api/me', auth: 'login', description: 'Profil, saldo koin, XP, dan statistik pengguna yang login' },
  { group: 'Profil', method: 'GET', path: '/api/me/actions', auth: 'login', description: 'Semua aksi milik pengguna (termasuk yang ditolak)', query: 'status' },
  { group: 'Profil', method: 'GET', path: '/api/me/redemptions', auth: 'login', description: 'Riwayat penukaran reward' },

  { group: 'Tutorial', method: 'GET', path: '/api/tutorials', auth: 'publik', description: 'Daftar tutorial', query: 'material, q, maxDuration' },
  { group: 'Tutorial', method: 'GET', path: '/api/tutorials/:id', auth: 'publik', description: 'Detail tutorial beserta langkah-langkahnya' },
  { group: 'Tutorial', method: 'POST', path: '/api/tutorials', auth: 'admin', description: 'Tambah tutorial', body: '{ title, description?, material, difficulty, durationMinutes, co2SavedKg?, xpReward?, imageUrl?, steps: [{ description, imageUrl? }] }' },
  { group: 'Tutorial', method: 'PUT', path: '/api/tutorials/:id', auth: 'admin', description: 'Ubah seluruh isi tutorial (langkah diganti)', body: 'sama dengan POST' },
  { group: 'Tutorial', method: 'DELETE', path: '/api/tutorials/:id', auth: 'admin', description: 'Hapus tutorial' },

  { group: 'Aksi', method: 'GET', path: '/api/actions', auth: 'opsional', description: 'Feed aksi komunitas (tanpa yang ditolak)', query: 'status, material, userId, tutorialId' },
  { group: 'Aksi', method: 'GET', path: '/api/actions/:id', auth: 'opsional', description: 'Detail aksi' },
  { group: 'Aksi', method: 'POST', path: '/api/actions', auth: 'login', description: 'Kirim bukti aksi (status awal pending)', body: '{ title, material, weightKg, imageUrl, tutorialId? }' },
  { group: 'Aksi', method: 'PATCH', path: '/api/actions/:id', auth: 'login', description: 'Ubah aksi sendiri selama pending', body: '{ title?, material?, weightKg?, imageUrl? }' },
  { group: 'Aksi', method: 'DELETE', path: '/api/actions/:id', auth: 'login', description: 'Hapus aksi sendiri (pending) atau aksi apa pun (admin)' },
  { group: 'Aksi', method: 'POST', path: '/api/actions/:id/kudos', auth: 'login', description: 'Beri Eco-Kudos. Kudos ke-5 memverifikasi aksi dan mencairkan koin' },
  { group: 'Aksi', method: 'DELETE', path: '/api/actions/:id/kudos', auth: 'login', description: 'Batalkan Eco-Kudos' },
  { group: 'Aksi', method: 'PATCH', path: '/api/actions/:id/status', auth: 'admin', description: 'Moderasi: verifikasi atau tolak aksi', body: '{ status: "pending" | "verified" | "rejected" }' },

  { group: 'Unggah', method: 'POST', path: '/api/uploads', auth: 'login', description: 'Unggah foto (form-data field "image", JPG/PNG/WEBP, maks 3 MB)' },

  { group: 'Titik setor', method: 'GET', path: '/api/drop-points', auth: 'publik', description: 'Daftar bank sampah dan mitra daur ulang', query: 'material' },
  { group: 'Titik setor', method: 'GET', path: '/api/drop-points/:id', auth: 'publik', description: 'Detail titik setor' },
  { group: 'Titik setor', method: 'POST', path: '/api/drop-points', auth: 'admin', description: 'Tambah titik setor', body: '{ name, type, address?, latitude, longitude, materials: [], openingHours? }' },
  { group: 'Titik setor', method: 'PUT', path: '/api/drop-points/:id', auth: 'admin', description: 'Ubah titik setor', body: 'sama dengan POST' },
  { group: 'Titik setor', method: 'DELETE', path: '/api/drop-points/:id', auth: 'admin', description: 'Hapus titik setor' },

  { group: 'Reward', method: 'GET', path: '/api/rewards', auth: 'publik', description: 'Katalog reward' },
  { group: 'Reward', method: 'GET', path: '/api/rewards/:id', auth: 'publik', description: 'Detail reward' },
  { group: 'Reward', method: 'POST', path: '/api/rewards', auth: 'admin', description: 'Tambah reward', body: '{ name, partner?, description?, costCoins, stock }' },
  { group: 'Reward', method: 'PUT', path: '/api/rewards/:id', auth: 'admin', description: 'Ubah reward', body: 'sama dengan POST' },
  { group: 'Reward', method: 'DELETE', path: '/api/rewards/:id', auth: 'admin', description: 'Hapus reward' },
  { group: 'Reward', method: 'POST', path: '/api/rewards/:id/redeem', auth: 'login', description: 'Tukar Eco-Coins dengan reward, mengembalikan kode voucher' },
];
