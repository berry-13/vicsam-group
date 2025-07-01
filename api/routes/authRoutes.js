const express = require('express');
const {
  authenticate,
  verifyAuth,
  getApiInfo
} = require('../controllers/authController');
const { authenticateBearer } = require('../middleware/auth');

const router = express.Router();

router.get('/verify', authenticateBearer, verifyAuth);
router.get('/info', getApiInfo);
router.get('/status', authenticateBearer, authenticate);

module.exports = router;
