// Validasi sederhana tanpa pustaka tambahan.
// Setiap fungsi menambahkan pesan ke objek errors bila nilai tidak valid,
// lalu controller melempar HttpError 400 dengan seluruh pesan sekaligus.
const { HttpError } = require('./http');

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

const validator = () => {
  const errors = {};
  const api = {
    errors,
    string(field, value, { required = true, min = 0, max = 1000, label = field } = {}) {
      if (isBlank(value)) {
        if (required) errors[field] = `${label} wajib diisi.`;
        return undefined;
      }
      if (typeof value !== 'string') { errors[field] = `${label} harus berupa teks.`; return undefined; }
      const v = value.trim();
      if (v.length < min) errors[field] = `${label} minimal ${min} karakter.`;
      else if (v.length > max) errors[field] = `${label} maksimal ${max} karakter.`;
      return v;
    },
    number(field, value, { required = true, min = -Infinity, max = Infinity, integer = false, label = field } = {}) {
      if (isBlank(value)) {
        if (required) errors[field] = `${label} wajib diisi.`;
        return undefined;
      }
      const n = Number(value);
      if (!Number.isFinite(n)) { errors[field] = `${label} harus berupa angka.`; return undefined; }
      if (integer && !Number.isInteger(n)) errors[field] = `${label} harus bilangan bulat.`;
      else if (n < min || n > max) errors[field] = `${label} harus di antara ${min} dan ${max}.`;
      return n;
    },
    oneOf(field, value, options, { required = true, label = field } = {}) {
      if (isBlank(value)) {
        if (required) errors[field] = `${label} wajib diisi.`;
        return undefined;
      }
      if (!options.includes(value)) errors[field] = `${label} harus salah satu dari: ${options.join(', ')}.`;
      return value;
    },
    email(field, value) {
      const v = api.string(field, value, { max: 120, label: 'Email' });
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors[field] = 'Format email tidak valid.';
      return v ? v.toLowerCase() : v;
    },
    /** Lempar 400 bila ada error. */
    check(message = 'Data yang dikirim tidak valid.') {
      if (Object.keys(errors).length) throw new HttpError(400, message, errors);
    },
  };
  return api;
};

/** Mengambil :id dari URL dan memastikan berupa bilangan bulat positif. */
const parseId = (raw, label = 'ID') => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `${label} tidak valid.`);
  return id;
};

module.exports = { validator, parseId, isBlank };
