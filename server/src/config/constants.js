// Aturan bisnis EcoCraft. Dipakai bersama oleh semua controller,
// sehingga Web, Mobile, dan Desktop mendapat hasil perhitungan yang sama.

const MATERIALS = {
  plastik: { label: 'Plastik', color: '#2F6F9F', co2Factor: 1.5 },
  kardus: { label: 'Kardus', color: '#96693C', co2Factor: 0.9 },
  tekstil: { label: 'Tekstil', color: '#8A4F7D', co2Factor: 3.0 },
  kaca: { label: 'Kaca', color: '#2A7F72', co2Factor: 0.3 },
  logam: { label: 'Logam', color: '#5B6873', co2Factor: 2.0 },
  organik: { label: 'Organik', color: '#5E7D28', co2Factor: 0.5 },
};

const MATERIAL_KEYS = Object.keys(MATERIALS);

const DIFFICULTIES = ['Sangat mudah', 'Mudah', 'Sedang', 'Sulit'];

const ACTION_STATUSES = ['pending', 'verified', 'rejected'];

const RULES = {
  kudosToVerify: 5, // jumlah Eco-Kudos dari pengguna lain agar aksi terverifikasi
  coinsPerKg: 100,
  minCoins: 30,
  minWeightKg: 0.1,
  maxWeightKg: 10,
  xpPerLevel: 500,
  defaultActionXp: 20, // XP bila aksi tidak terhubung ke tutorial
};

const round1 = (n) => Math.round(n * 10) / 10;

/** Eco-Coins yang didapat dari sebuah aksi (cair setelah terverifikasi). */
const calcCoins = (weightKg) => Math.max(RULES.minCoins, Math.round(weightKg * RULES.coinsPerKg));

/** Perkiraan CO2e yang dicegah (kg) = berat (kg) x faktor emisi bahan. */
const calcCo2 = (weightKg, material) => round1(weightKg * (MATERIALS[material]?.co2Factor ?? 1));

const levelOf = (xp) => Math.floor(xp / RULES.xpPerLevel) + 1;

module.exports = {
  MATERIALS, MATERIAL_KEYS, DIFFICULTIES, ACTION_STATUSES, RULES,
  round1, calcCoins, calcCo2, levelOf,
};
