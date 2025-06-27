const express = require('express');
const {
  saveData,
  getFiles,
  getFileContent,
  downloadFile,
  deleteFile,
  getStats,
  getRecentActivities
} = require('../controllers/dataController');
const { authenticateBearer } = require('../middleware/auth');
const { validate, saveDataSchema, fileParamsSchema } = require('../utils/validation');

const router = express.Router();

// Middleware di autenticazione per tutte le rotte dati
router.use(authenticateBearer);

/**
 * @route POST /api/data/save
 * @desc Salva dati JSON senza validazione
 * @access Private (Bearer Token required)
 */
router.post('/save', saveData);

/**
 * @route GET /api/data/files
 * @desc Ottiene la lista di tutti i file di dati
 * @access Private (Bearer Token required)
 */
router.get('/files', getFiles);

/**
 * @route GET /api/data/file/:filename
 * @desc Ottiene il contenuto di un file specifico
 * @access Private (Bearer Token required)
 */
router.get('/file/:filename', validate(fileParamsSchema, 'params'), getFileContent);

/**
 * @route GET /api/data/download/:filename
 * @desc Download di un file specifico
 * @access Private (Bearer Token required)
 */
router.get('/download/:filename', validate(fileParamsSchema, 'params'), downloadFile);

/**
 * @route DELETE /api/data/file/:filename
 * @desc Elimina un file specifico
 * @access Private (Bearer Token required)
 */
router.delete('/file/:filename', validate(fileParamsSchema, 'params'), deleteFile);

/**
 * @route GET /api/data/stats
 * @desc Ottiene statistiche sui dati
 * @access Private (Bearer Token required)
 */
router.get('/stats', getStats);

/**
 * @route GET /api/data/activities
 * @desc Ottiene le attività recenti del sistema
 * @access Private (Bearer Token required)
 */
router.get('/activities', getRecentActivities);

module.exports = router;
