// Titik masuk server. Jalankan: npm run dev  (atau npm start)
const os = require('os');
const env = require('./src/config/env');
const app = require('./src/app');
const { initSchema } = require('./src/config/database');
const { seedIfEmpty } = require('./src/db/seed');

/** Alamat IP LAN, dipakai aplikasi Mobile/Desktop di perangkat lain. */
const lanAddresses = () => Object.values(os.networkInterfaces()).flat()
  .filter((n) => n && n.family === 'IPv4' && !n.internal)
  .map((n) => n.address);

const start = async () => {
  await initSchema();
  if (await seedIfEmpty()) console.log('🌱 Database masih kosong, data awal sudah diisi.');

  app.listen(env.PORT, () => {
    console.log(`🚀 EcoCraft API: http://localhost:${env.PORT}`);
    lanAddresses().forEach((ip) => console.log(`   Dari perangkat lain (Mobile/Desktop): http://${ip}:${env.PORT}`));
    console.log(`📖 Daftar endpoint: http://localhost:${env.PORT}/api`);
  });
};

start().catch((err) => {
  console.error('❌ Server gagal dijalankan:', err);
  process.exit(1);
});
