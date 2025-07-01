const express = require('express');
const downloadController = require('../controllers/downloadController');
const downloadRateLimit = require('../middleware/downloadRateLimit');

const router = express.Router();

router.use(downloadRateLimit);

/**
 * @route GET /get
 * @desc Download ZIP file (URL shortener endpoint)
 * @access Public
 */
router.get('/get', downloadController.handleDownload.bind(downloadController));

/**
 * @route GET /app
 * @desc Download EXE file (URL shortener endpoint)
 * @access Public
 */
router.get('/app', downloadController.handleDownload.bind(downloadController));

/**
 * @route GET /downloads/info
 * @desc Get information about available downloads
 * @access Public
 */
router.get('/downloads/info', downloadController.getDownloadInfo.bind(downloadController));

/**
 * @route GET /downloads/health
 * @desc Health check for download service
 * @access Public
 */
router.get('/downloads/health', downloadController.getHealthStatus.bind(downloadController));

module.exports = router;
