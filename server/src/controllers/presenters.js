// Mengubah path gambar yang disimpan (relatif) menjadi URL lengkap sebelum dikirim ke klien.
const { absoluteUrl } = require('../utils/http');

const presentTutorial = (req, t) => t && {
  ...t,
  imageUrl: absoluteUrl(req, t.imageUrl),
  ...(t.steps ? { steps: t.steps.map((s) => ({ ...s, imageUrl: absoluteUrl(req, s.imageUrl) })) } : {}),
};

const presentAction = (req, a) => a && { ...a, imageUrl: absoluteUrl(req, a.imageUrl) };

module.exports = { presentTutorial, presentAction };
