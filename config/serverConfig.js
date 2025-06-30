// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

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
  const { isProduction } = getServerConfig();
  
  return {
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
  getStaticOptions
};
