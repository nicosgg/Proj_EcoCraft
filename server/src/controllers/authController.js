const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const { signToken } = require('../middleware/auth');
const { HttpError, send } = require('../utils/http');
const { validator } = require('../utils/validate');

// POST /api/auth/register
const register = async (req, res) => {
  const v = validator();
  const name = v.string('name', req.body.name, { min: 2, max: 60, label: 'Nama' });
  const email = v.email('email', req.body.email);
  const password = v.string('password', req.body.password, { min: 6, max: 72, label: 'Kata sandi' });
  v.check();

  if (await userModel.emailExists(email)) throw new HttpError(409, 'Email sudah terdaftar. Silakan login.');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userModel.create({ name, email, passwordHash });
  send(res, 201, 'Registrasi berhasil', { token: signToken(user), user });
};

// POST /api/auth/login
const login = async (req, res) => {
  const v = validator();
  const email = v.email('email', req.body.email);
  const password = v.string('password', req.body.password, { label: 'Kata sandi' });
  v.check();

  const row = await userModel.findByEmailWithPassword(email);
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new HttpError(401, 'Email atau kata sandi salah.');
  }
  const user = userModel.toUser(row);
  send(res, 200, 'Login berhasil', { token: signToken(user), user });
};

module.exports = { register, login };
