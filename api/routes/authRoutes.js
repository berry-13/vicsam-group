const express = require('express');
const {
  authenticate,
  verifyAuth,
  getApiInfo
} = require('../controllers/authController');
const { authenticatePassword, authenticateBearer } = require('../middleware/auth');
const { validate, authSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Autenticazione con password e generazione token
 * @access Public
 */
router.post('/login', validate(authSchema), authenticatePassword, authenticate);

/**
 * @route GET /api/auth/verify
 * @desc Verifica la validità del token Bearer
 * @access Private (Bearer Token required)
 */
router.get('/verify', authenticateBearer, verifyAuth);

/**
 * @route GET /api/auth/info
 * @desc Informazioni sull'API (pubbliche)
 * @access Public
 */
router.get('/info', getApiInfo);

module.exports = router;
