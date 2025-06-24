const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Controller per l'autenticazione e generazione token
 */
const authenticate = async (req, res, next) => {
  try {
    // A questo punto la password è già stata validata dal middleware authenticatePassword
    // Genera un JWT token per future implementazioni
    const token = generateToken({ 
      authenticated: true,
      timestamp: Date.now()
    });
    
    res.json(
      successResponse(
        { 
          token,
          bearerToken: process.env.BEARER_TOKEN,
          expiresIn: process.env.JWT_EXPIRES_IN
        },
        'Autenticazione completata con successo'
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller per verificare lo stato dell'autenticazione
 */
const verifyAuth = async (req, res) => {
  res.json(
    successResponse(
      { authenticated: true },
      'Token valido'
    )
  );
};

/**
 * Controller per ottenere informazioni sull'API
 */
const getApiInfo = async (req, res) => {
  const apiInfo = {
    name: 'VicSam Group API',
    version: '2.0.0',
    description: 'API ottimizzata per la gestione dei dati',
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Autenticazione con password',
        'GET /api/auth/verify': 'Verifica token Bearer'
      },
      data: {
        'POST /api/data/save': 'Salva nuovi dati',
        'GET /api/data/files': 'Lista tutti i file',
        'GET /api/data/file/:filename': 'Contenuto di un file specifico',
        'GET /api/data/download/:filename': 'Download di un file',
        'DELETE /api/data/file/:filename': 'Elimina un file',
        'GET /api/data/stats': 'Statistiche sui dati'
      }
    },
    authentication: 'Bearer Token',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
    }
  };
  
  res.json(
    successResponse(apiInfo, 'Informazioni API')
  );
};

module.exports = {
  authenticate,
  verifyAuth,
  getApiInfo
};
