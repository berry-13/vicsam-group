const fileService = require('../services/fileService');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Controller per salvare nuovi dati JSON
 * Accetta qualsiasi struttura JSON e la salva senza validazione
 */
const saveData = async (req, res, next) => {
  try {
    const data = req.body;
    const fileName = await fileService.saveData(data);
    
    res.status(201).json(
      successResponse(
        { fileName },
        'Dati JSON salvati con successo',
        201
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller per ottenere la lista dei file
 */
const getFiles = async (req, res, next) => {
  try {
    const files = await fileService.getFilesList();
    
    res.json(
      successResponse(
        { files, count: files.length },
        'Lista file recuperata con successo'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller per ottenere il contenuto di un file
 */
const getFileContent = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const content = await fileService.getFileContent(filename);
    
    res.json(
      successResponse(
        { filename, content },
        'Contenuto file recuperato con successo'
      )
    );
  } catch (error) {
    if (error.message === 'File non trovato') {
      return res.status(404).json(
        errorResponse('File non trovato', 404)
      );
    }
    if (error.message === 'Nome file non valido') {
      return res.status(400).json(
        errorResponse('Nome file non valido', 400)
      );
    }
    next(error);
  }
};

/**
 * Controller per il download di un file
 */
const downloadFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = fileService.getFilePath(filename);
    
    res.download(filePath, filename, (err) => {
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    if (error.message === 'File non trovato') {
      return res.status(404).json(
        errorResponse('File non trovato', 404)
      );
    }
    if (error.message === 'Nome file non valido') {
      return res.status(400).json(
        errorResponse('Nome file non valido', 400)
      );
    }
    next(error);
  }
};

/**
 * Controller per eliminare un file
 */
const deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    await fileService.deleteFile(filename);
    
    res.json(
      successResponse(
        { filename },
        'File eliminato con successo'
      )
    );
  } catch (error) {
    if (error.message === 'File non trovato') {
      return res.status(404).json(
        errorResponse('File non trovato', 404)
      );
    }
    if (error.message === 'Impossibile eliminare questo file') {
      return res.status(403).json(
        errorResponse('Impossibile eliminare questo file', 403)
      );
    }
    next(error);
  }
};

/**
 * Controller per ottenere statistiche sui dati
 */
const getStats = async (req, res, next) => {
  try {
    const files = await fileService.getFilesList();
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    // Calcola le statistiche dei dati generali
    let generalDataCount = 0;
    try {
      const generalContent = await fileService.getFileContent('dati_generali.json');
      generalDataCount = Array.isArray(generalContent) ? generalContent.length : 0;
    } catch (error) {
      // File generale non esiste ancora
    }
    
    const stats = {
      totalFiles,
      totalSize,
      generalDataCount,
      lastUpdate: files.length > 0 ? files[0].modified : null
    };
    
    res.json(
      successResponse(stats, 'Statistiche recuperate con successo')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveData,
  getFiles,
  getFileContent,
  downloadFile,
  deleteFile,
  getStats
};
