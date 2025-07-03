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
  
  // Parse TRUST_PROXY to support both numeric and boolean values
  let trustProxy = false;
  if (process.env.TRUST_PROXY) {
    const trustProxyValue = process.env.TRUST_PROXY.toLowerCase();
    if (trustProxyValue === 'true') {
      trustProxy = true;
    } else if (trustProxyValue === 'false') {
      trustProxy = false;
    } else if (!isNaN(parseInt(trustProxyValue))) {
      trustProxy = parseInt(trustProxyValue);
    } else {
      // For other string values like 'loopback', 'linklocal', 'uniquelocal'
      trustProxy = process.env.TRUST_PROXY;
    }
  }

  return {
    PORT,
    NODE_ENV,
    isProduction,
    isDevelopment,
    trustProxy
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
  getBodyParserOptions,
  getStaticOptions,
  getPathConfig
};
