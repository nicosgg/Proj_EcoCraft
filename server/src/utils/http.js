/** Error dengan kode status HTTP. Ditangkap oleh middleware errorHandler. */
class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    if (errors) this.errors = errors;
  }
}

/** Membungkus controller async agar error otomatis diteruskan ke errorHandler. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Format respons sukses yang sama untuk semua endpoint: { message, data } */
const send = (res, status, message, data) => res.status(status).json({ message, data });

/** Mengubah "2026-10-30 11:00:00" (UTC dari SQLite) menjadi ISO 8601. */
const isoDate = (value) => (value ? `${String(value).replace(' ', 'T')}Z` : null);

/** Mengubah path relatif (/uploads/x.jpg) menjadi URL lengkap sesuai host yang dipanggil klien. */
const absoluteUrl = (req, value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${req.protocol}://${req.get('host')}${value.startsWith('/') ? '' : '/'}${value}`;
};

/** Kebalikan absoluteUrl: URL milik server ini disimpan sebagai path relatif
 *  agar tetap valid saat diakses dari host lain (misal HP lewat IP LAN). */
const toStoredUrl = (req, value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const v = String(value).trim();
  if (!v) return null;
  const own = `${req.protocol}://${req.get('host')}`;
  if (v.startsWith(own)) return v.slice(own.length) || null;
  const m = v.match(/^https?:\/\/[^/]+(\/(uploads|static)\/.+)$/i);
  return m ? m[1] : v;
};

module.exports = { HttpError, asyncHandler, send, isoDate, absoluteUrl, toStoredUrl };
