const fileService = require('../services/fileService');
const { successResponse, errorResponse } = require('../utils/helpers');

// Mock data for activities - in a real application, this would come from a database
let mockActivities = [
  {
    id: '1',
    type: 'system_update',
    message: 'Sistema di monitoraggio aggiornato',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'success',
    userId: 'system'
  },
  {
    id: '2',
    type: 'data_sync',
    message: 'Controlli di integrità completati',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'success',
    userId: 'system'
  },
  {
    id: '3',
    type: 'file_upload',
    message: 'File caricato con successo',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'success',
    userId: 'user'
  },
  {
    id: '4',
    type: 'backup',
    message: 'Backup automatico eseguito',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'success',
    userId: 'system'
  },
  {
    id: '5',
    type: 'user_action',
    message: 'Accesso utente effettuato',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    status: 'success',
    userId: 'user'
  }
];

/**
 * Controller per salvare nuovi dati JSON
 * Il nome del file sarà basato sul CustomerVAT presente nel JSON
 * Se un file con lo stesso CustomerVAT esiste, verrà aggiornato
 */
const saveData = async (req, res, next) => {
  try {
    const data = req.body;
    
    // Log per debug
    console.log('📊 [SAVE DATA] Tentativo di salvataggio dati');
    console.log('📊 [SAVE DATA] CustomerVAT ricevuto:', data?.CustomerVAT);
    
    const result = await fileService.saveData(data);
    
    const message = result.isUpdate 
      ? `File ${result.fileName} aggiornato con successo`
      : `Nuovo file ${result.fileName} creato con successo`;
    
    console.log('✅ [SAVE DATA] Salvataggio completato:', message);
    
    // Log activity
    addActivity(
      'file_upload',
      result.isUpdate ? `File aggiornato: ${result.fileName}` : `Nuovo file caricato: ${result.fileName}`,
      'success',
      req.user?.id || 'user'
    );
    
    res.status(result.isUpdate ? 200 : 201).json(
      successResponse(
        { 
          fileName: result.fileName, 
          isUpdate: result.isUpdate,
          customerVAT: data.CustomerVAT 
        },
        message,
        result.isUpdate ? 200 : 201
      )
    );
  } catch (error) {
    console.error('❌ [SAVE DATA] Errore durante il salvataggio:', error.message);
    
    // Log failed activity
    addActivity(
      'file_upload',
      `Errore nel salvataggio file: ${error.message}`,
      'error',
      req.user?.id || 'user'
    );
    
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
    
    // Log activity
    addActivity(
      'user_action',
      `File eliminato: ${filename}`,
      'success',
      req.user?.id || 'user'
    );
    
    res.json(
      successResponse(
        { filename },
        'File eliminato con successo'
      )
    );
  } catch (error) {
    // Log failed activity
    addActivity(
      'user_action',
      `Errore nell'eliminazione file: ${req.params.filename} - ${error.message}`,
      'error',
      req.user?.id || 'user'
    );
    
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

/**
 * Controller per ottenere le attività recenti
 */
const getRecentActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = mockActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
    
    res.json(
      successResponse(activities, 'Attività recenti recuperate con successo')
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Aggiunge una nuova attività al log (per uso interno)
 */
const addActivity = (type, message, status = 'success', userId = 'system', details = null) => {
  const newActivity = {
    id: Date.now().toString(),
    type,
    message,
    timestamp: new Date().toISOString(),
    status,
    userId,
    details
  };
  
  // Mantieni solo le ultime 50 attività
  mockActivities.unshift(newActivity);
  if (mockActivities.length > 50) {
    mockActivities = mockActivities.slice(0, 50);
  }
  
  return newActivity;
};

module.exports = {
  saveData,
  getFiles,
  getFileContent,
  downloadFile,
  deleteFile,
  getStats,
  getRecentActivities
};
