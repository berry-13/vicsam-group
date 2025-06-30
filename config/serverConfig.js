// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

const path = require('path');

/**
 * Configurazione dei percorsi del progetto
 */
function getPathConfig() {
  // Risolve il percorso della root del progetto
  const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(__dirname, '..');
  const CLIENT_DIR = process.env.CLIENT_DIR || path.join(PROJECT_ROOT, 'client');
  const CLIENT_DIST_DIR = process.env.CLIENT_DIST_DIR || path.join(CLIENT_DIR, 'dist');
  const CLIENT_INDEX_PATH = path.join(CLIENT_DIST_DIR, 'index.html');

  return {
    PROJECT_ROOT,
    CLIENT_DIR,
    CLIENT_DIST_DIR,
    CLIENT_INDEX_PATH
  };
}

/**
 * Configurazione principale del server
 */
function getServerConfig() {
  const PORT = parseInt(process.env.PORT) || 3000;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';
  const isDevelopment = NODE_ENV === 'development';
  const trustProxy = process.env.TRUST_PROXY === 'true';

  return {
    PORT,
    NODE_ENV,
    isProduction,
    isDevelopment,
    trustProxy
  };
}

/**
 * Configurazione rate limiting
 */
function getRateLimitConfig() {
  const { isProduction, trustProxy } = getServerConfig();
  
  const config = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (isProduction ? 15 * 60 * 1000 : 60 * 1000), // 15min prod, 1min dev
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProduction ? 100 : 1000), // 100 prod, 1000 dev
    message: {
      success: false,
      error: 'Troppe richieste, riprova più tardi',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.path === '/health';
    }
  };

  // Configurazione sicura per rate limiting con trust proxy
  if (trustProxy) {
    // Quando trust proxy è abilitato, usa una configurazione più sicura
    config.keyGenerator = (req) => {
      // Usa l'IP più specifico disponibile, fallback a req.ip
      const forwarded = req.get('X-Forwarded-For');
      const realIp = req.get('X-Real-IP');
      const clientIp = realIp || (forwarded && forwarded.split(',')[0].trim()) || req.ip;
      
      // In sviluppo, aggiungi logging per debug
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [RATE LIMIT] Using IP for rate limiting:', clientIp);
      }
      
      return clientIp;
    };
  }

  return config;
}

/**
 * Configurazione body parser
 */
function getBodyParserOptions() {
  return {
    limit: process.env.BODY_LIMIT || '10mb',
    parameterLimit: 10000,
  };
}

/**
 * Configurazione file statici
 */
function getStaticOptions() {
  const { isProduction } = getServerConfig();
  
  return {
    maxAge: isProduction ? '1d' : '0',
    etag: true,
    lastModified: true,
    index: false,
  };
}

module.exports = {
  getServerConfig,
  getRateLimitConfig,
  getBodyParserOptions,
  getStaticOptions,
  getPathConfig
};
