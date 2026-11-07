import type { ActionStatus, Difficulty, MaterialKey } from '../types/data_type';

/** Label dan warna bahan (tampilan). Validasi tetap dilakukan server. */
export const MATERIALS: Record<MaterialKey, { label: string; color: string; tint: string; co2Factor: number }> = {
  plastik: { label: 'Plastik', color: '#2F6F9F', tint: '#E3EDF5', co2Factor: 1.5 },
  kardus: { label: 'Kardus', color: '#96693C', tint: '#F4ECE2', co2Factor: 0.9 },
  tekstil: { label: 'Tekstil', color: '#8A4F7D', tint: '#F3E8EF', co2Factor: 3.0 },
  kaca: { label: 'Kaca', color: '#2A7F72', tint: '#E0F0EC', co2Factor: 0.3 },
  logam: { label: 'Logam', color: '#5B6873', tint: '#E7EBEE', co2Factor: 2.0 },
  organik: { label: 'Organik', color: '#5E7D28', tint: '#EAF1E0', co2Factor: 0.5 },
};
export const MATERIAL_KEYS = Object.keys(MATERIALS) as MaterialKey[];
export const DIFFICULTIES: Difficulty[] = ['Sangat mudah', 'Mudah', 'Sedang', 'Sulit'];

export const STATUS_LABEL: Record<ActionStatus, string> = {
  pending: 'Menunggu verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
};

/** Perkiraan di sisi klien (server tetap menghitung ulang). */
export const estimateCoins = (weightKg: number) => Math.max(30, Math.round(weightKg * 100));
export const estimateCo2 = (weightKg: number, material: MaterialKey) => Math.round(weightKg * MATERIALS[material].co2Factor * 10) / 10;

const nf1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('id-ID');
export const fmt1 = (n: number) => nf1.format(n);
export const fmt = (n: number) => nf0.format(n);

export const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDate = (iso: string) => new Date(iso).toLocaleString('id-ID', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
