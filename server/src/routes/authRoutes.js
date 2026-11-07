// Autentikasi: /api/auth
const express = require('express');
const auth = require('../controllers/authController');
const { asyncHandler: h } = require('../utils/http');

const router = express.Router();

router.post('/register', h(auth.register));
router.post('/login', h(auth.login));

module.exports = router;
