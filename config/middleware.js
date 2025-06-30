// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

const helmet = require('helmet');
const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');

const { getCorsOptions } = require('./corsConfig');
const { getRateLimitConfig, getBodyParserOptions, getServerConfig } = require('./serverConfig');
const { requestLogger } = require('../api/middleware/common');

/**
 * Configura tutti i middleware del server
 */
function setupMiddleware(app) {
  const { isDevelopment, trustProxy } = getServerConfig();
  const corsOptions = getCorsOptions();
  const rateLimitConfig = getRateLimitConfig();
  const bodyParserOptions = getBodyParserOptions();

  // Configurazione proxy per rate limiting dietro reverse proxy
  app.set('trust proxy', trustProxy);

  // Configurazione ETag per cache ottimizzata
  app.set('etag', 'weak');

  // ============================================================================
  // MIDDLEWARE DI SICUREZZA E PERFORMANCE
  // ============================================================================
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // Configurazione CORS
  app.use(cors(corsOptions));

  // Rate limiting configurabile per ambiente
  const limiter = rateLimit(rateLimitConfig);
  app.use('/api', limiter);

  // Debug middleware per sviluppo
  if (isDevelopment) {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-for']) {
        console.log('🔍 [PROXY DEBUG] X-Forwarded-For:', req.headers['x-forwarded-for']);
        console.log('🔍 [PROXY DEBUG] req.ip:', req.ip);
        console.log('🔍 [PROXY DEBUG] Trust proxy setting:', app.get('trust proxy'));
      }
      next();
    });

    app.use(requestLogger);
  }

  // ============================================================================
  // MIDDLEWARE DI PARSING
  // ============================================================================
  app.use(express.json(bodyParserOptions));
  app.use(express.urlencoded({ 
    extended: true, 
    ...bodyParserOptions 
  }));

  return {
    corsOptions,
    rateLimitConfig
  };
}

module.exports = {
  setupMiddleware
};
