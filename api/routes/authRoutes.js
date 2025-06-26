const express = require('express');
const {
  authenticate,
  verifyAuth,
  getApiInfo,
  debugAuth,
  testAuthErrors
} = require('../controllers/authController');
const { authenticatePassword, authenticateBearer } = require('../middleware/auth');
const { loginRateLimit } = require('../middleware/rateLimiting');
const { validate, authSchema } = require('../utils/validation');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Autenticazione con password e generazione token
 * @access Public (con rate limiting)
 */
router.post('/login', loginRateLimit, validate(authSchema), authenticatePassword, authenticate);

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

/**
 * @route GET /api/auth/debug
 * @desc Debug informazioni autenticazione (pubbliche)
 * @access Public
 */
router.get('/debug', debugAuth);

/**
 * @route GET /api/auth/test-errors
 * @desc Test scenari di errore per debug (pubbliche)
 * @access Public
 */
router.get('/test-errors', testAuthErrors);

module.exports = router;
