// Aksi upcycling: unggah bukti -> menunggu verifikasi -> terverifikasi oleh 5 Eco-Kudos
// dari pengguna lain (atau oleh admin) -> Eco-Coins dan XP cair ke pemilik aksi.
const actionModel = require('../models/actionModel');
const tutorialModel = require('../models/tutorialModel');
const userModel = require('../models/userModel');
const {
  MATERIAL_KEYS, ACTION_STATUSES, RULES, calcCoins, calcCo2,
} = require('../config/constants');
const { HttpError, send, toStoredUrl } = require('../utils/http');
const { validator, parseId } = require('../utils/validate');
const { presentAction } = require('./presenters');

const loadOr404 = async (id) => {
  const row = await actionModel.findRaw(id);
  if (!row) throw new HttpError(404, 'Aksi tidak ditemukan.');
  return row;
};

const respondAction = async (req, res, status, message, id) => {
  const action = await actionModel.findById(id, req.user && req.user.id);
  send(res, status, message, presentAction(req, action));
};

/** Mengubah status dan menyesuaikan saldo pemilik: cair saat terverifikasi, ditarik bila verifikasi dibatalkan. */
const transition = async (row, toStatus) => {
  const ok = await actionModel.changeStatus(row.id, row.status, toStatus);
  if (!ok) return false;
  if (toStatus === 'verified') await userModel.addCoinsXp(row.user_id, row.coins, row.xp);
  if (row.status === 'verified' && toStatus !== 'verified') await userModel.addCoinsXp(row.user_id, -row.coins, -row.xp);
  return true;
};

// GET /api/actions?status=&material=&userId=&tutorialId=
const list = async (req, res) => {
  const { status, material } = req.query;
  if (status && !ACTION_STATUSES.includes(status)) throw new HttpError(400, `Status tidak dikenal. Pilihan: ${ACTION_STATUSES.join(', ')}.`);
  if (material && !MATERIAL_KEYS.includes(material)) throw new HttpError(400, `Bahan tidak dikenal. Pilihan: ${MATERIAL_KEYS.join(', ')}.`);
  const userId = req.query.userId ? parseId(req.query.userId, 'userId') : undefined;
  const tutorialId = req.query.tutorialId ? parseId(req.query.tutorialId, 'tutorialId') : undefined;
  const items = await actionModel.findAll({ status, material, userId, tutorialId, viewerId: req.user && req.user.id });
  send(res, 200, 'Data aksi berhasil diambil', items.map((a) => presentAction(req, a)));
};

// GET /api/actions/:id
const getById = async (req, res) => {
  const id = parseId(req.params.id, 'ID aksi');
  await loadOr404(id);
  await respondAction(req, res, 200, 'Detail aksi berhasil diambil', id);
};

// POST /api/actions
const create = async (req, res) => {
  const b = req.body;
  const v = validator();
  const title = v.string('title', b.title, { min: 3, max: 120, label: 'Judul aksi' });
  const material = v.oneOf('material', b.material, MATERIAL_KEYS, { label: 'Bahan' });
  const weightKg = v.number('weightKg', b.weightKg, { min: RULES.minWeightKg, max: RULES.maxWeightKg, label: 'Berat (kg)' });
  const imageUrl = toStoredUrl(req, b.imageUrl);
  if (!imageUrl) v.errors.imageUrl = 'Foto bukti wajib diisi. Unggah lewat POST /api/uploads lalu kirim URL-nya.';
  const tutorialId = v.number('tutorialId', b.tutorialId, { required: false, min: 1, integer: true, label: 'ID tutorial' });
  v.check();

  let xp = RULES.defaultActionXp;
  if (tutorialId) {
    const tutorialXp = await tutorialModel.getXpReward(tutorialId);
    if (tutorialXp === null) throw new HttpError(400, 'Data yang dikirim tidak valid.', { tutorialId: 'Tutorial tidak ditemukan.' });
    xp = tutorialXp;
  }

  const id = await actionModel.create({
    userId: req.user.id, tutorialId, title, material, weightKg,
    co2Kg: calcCo2(weightKg, material), coins: calcCoins(weightKg), xp, imageUrl,
  });
  await respondAction(req, res, 201, 'Aksi berhasil dikirim dan menunggu verifikasi komunitas', id);
};

// PATCH /api/actions/:id  (pemilik, selama masih menunggu verifikasi)
const update = async (req, res) => {
  const id = parseId(req.params.id, 'ID aksi');
  const row = await loadOr404(id);
  if (row.user_id !== req.user.id) throw new HttpError(403, 'Kamu hanya dapat mengubah aksi milikmu sendiri.');
  if (row.status !== 'pending') throw new HttpError(409, 'Aksi yang sudah diverifikasi atau ditolak tidak dapat diubah.');

  const b = req.body;
  const v = validator();
  const fields = {
    title: v.string('title', b.title, { required: false, min: 3, max: 120, label: 'Judul aksi' }),
    material: v.oneOf('material', b.material, MATERIAL_KEYS, { required: false, label: 'Bahan' }),
    weightKg: v.number('weightKg', b.weightKg, { required: false, min: RULES.minWeightKg, max: RULES.maxWeightKg, label: 'Berat (kg)' }),
  };
  if (b.imageUrl !== undefined) {
    fields.imageUrl = toStoredUrl(req, b.imageUrl);
    if (!fields.imageUrl) v.errors.imageUrl = 'Foto bukti tidak boleh dikosongkan.';
  }
  v.check();
  if (Object.values(fields).every((x) => x === undefined)) {
    throw new HttpError(400, 'Kirim minimal satu field yang ingin diubah: title, material, weightKg, imageUrl.');
  }
  // Hitung ulang dampak bila berat atau bahan berubah
  const weight = fields.weightKg ?? row.weight_kg;
  const mat = fields.material ?? row.material;
  fields.co2Kg = calcCo2(weight, mat);
  fields.coins = calcCoins(weight);

  await actionModel.update(id, fields);
  await respondAction(req, res, 200, 'Aksi berhasil diperbarui', id);
};

// DELETE /api/actions/:id  (pemilik selama menunggu verifikasi, atau admin)
const remove = async (req, res) => {
  const id = parseId(req.params.id, 'ID aksi');
  const row = await loadOr404(id);
  const isOwner = row.user_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new HttpError(403, 'Kamu hanya dapat menghapus aksi milikmu sendiri.');
  if (isOwner && !isAdmin && row.status !== 'pending') throw new HttpError(409, 'Aksi yang sudah diverifikasi tidak dapat dihapus pemiliknya.');
  if (row.status === 'verified') await userModel.addCoinsXp(row.user_id, -row.coins, -row.xp); // tarik koin bila admin menghapus
  await actionModel.remove(id);
  send(res, 200, 'Aksi berhasil dihapus', { id });
};

// POST /api/actions/:id/kudos
const giveKudos = async (req, res) => {
  const id = parseId(req.params.id, 'ID aksi');
  const row = await loadOr404(id);
  if (row.user_id === req.user.id) throw new HttpError(403, 'Tidak dapat memberi Eco-Kudos untuk aksi milik sendiri.');
  if (row.status === 'rejected') throw new HttpError(409, 'Aksi ini sudah ditolak dan tidak dapat diberi Eco-Kudos.');
  if (!(await actionModel.addKudos(id, req.user.id))) throw new HttpError(409, 'Kamu sudah memberi Eco-Kudos untuk aksi ini.');

  let message = 'Eco-Kudos berhasil diberikan';
  if (row.status === 'pending' && (await actionModel.countKudos(id)) >= RULES.kudosToVerify) {
    if (await transition(row, 'verified')) message = 'Eco-Kudos berhasil diberikan. Aksi ini kini terverifikasi dan koin pemilik sudah cair';
  }
  await respondAction(req, res, 201, message, id);
};

// DELETE /api/actions/:id/kudos
const removeKudos = async (req, res) => {
  const id = parseId(req.params.id, 'ID aksi');
  await loadOr404(id);
  if (!(await actionModel.removeKudos(id, req.user.id))) throw new HttpError(404, 'Kamu belum memberi Eco-Kudos untuk aksi ini.');
  await respondAction(req, res, 200, 'Eco-Kudos dibatalkan', id);
};

// PATCH /api/actions/:id/status  (admin: moderasi)
const setStatus = async (req, res) => {
  const id = parseId(req.params.id, 'ID aksi');
  const row = await loadOr404(id);
  const v = validator();
  const status = v.oneOf('status', req.body.status, ACTION_STATUSES, { label: 'Status' });
  v.check();
  if (status === row.status) throw new HttpError(409, `Aksi sudah berstatus ${status}.`);
  if (!(await transition(row, status))) throw new HttpError(409, 'Status aksi baru saja berubah. Muat ulang lalu coba lagi.');
  await respondAction(req, res, 200, `Status aksi diubah menjadi ${status}`, id);
};

module.exports = { list, getById, create, update, remove, giveKudos, removeKudos, setStatus };
