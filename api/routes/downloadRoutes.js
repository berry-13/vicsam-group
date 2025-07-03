const express = require('express');
const downloadController = require('../controllers/downloadController');

const router = express.Router();

router.get('/get', downloadController.handleDownload.bind(downloadController));
router.get('/app', downloadController.handleDownload.bind(downloadController));
router.get('/downloads/info', downloadController.getDownloadInfo.bind(downloadController));
router.get('/downloads/health', downloadController.getHealthStatus.bind(downloadController));

module.exports = router;
