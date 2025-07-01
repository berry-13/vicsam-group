const express = require('express');
const {
  authenticate,
  verifyAuth,
  getApiInfo
} = require('../controllers/authController');
const { authenticateBearer } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/auth/verify
 * @desc Verify Bearer token validity
 * @access Private (Bearer Token required)
 */
router.get('/verify', authenticateBearer, verifyAuth);

/**
 * @route GET /api/auth/info
 * @desc API information (public)
 * @access Public
 */
router.get('/info', getApiInfo);

/**
 * @route GET /api/auth/status
 * @desc Authentication status check
 * @access Private (Bearer Token required)
 */
router.get('/status', authenticateBearer, authenticate);

module.exports = router;
