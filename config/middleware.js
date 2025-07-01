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
  // Solo in produzione o quando esplicitamente richiesto
  if (trustProxy !== false) {
    app.set('trust proxy', trustProxy);
    
    if (isDevelopment) {
      console.log(`⚠️  [PROXY] Trust proxy enabled with value: ${trustProxy} - ensure this is intended for your environment`);
    }
  } else {
    app.set('trust proxy', false);
  }

  // Configurazione ETag per cache ottimizzata
  app.set('etag', 'weak');

  // ============================================================================
  // MIDDLEWARE DI SICUREZZA E PERFORMANCE
  // ============================================================================
  
  // Configurazione Helmet per sicurezza web
  // CSP personalizzata per supportare React/Vite, API calls e assets
  // COEP disabilitata per compatibilità con risorse esterne e embedding
  
  const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      // Necessario per React e hot reload in sviluppo
      ...(isDevelopment ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
      // Vite inject scripts con hash/nonce in produzione
      ...(isDevelopment ? [] : ["'unsafe-inline'"]) // TODO: Implementare nonce-based CSP
    ],
    styleSrc: [
      "'self'", 
      "'unsafe-inline'" // Necessario per styled-components e CSS-in-JS
    ],
    imgSrc: [
      "'self'", 
      "data:", 
      "blob:",
      "https:" // Permette immagini da CDN esterni
    ],
    fontSrc: [
      "'self'", 
      "data:",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ],
    connectSrc: [
      "'self'",
      // API endpoints
      ...(isDevelopment ? ["http://localhost:*", "ws://localhost:*"] : []),
      // WebSocket per hot reload in sviluppo
      ...(isDevelopment ? ["ws:", "wss:"] : [])
    ],
    objectSrc: ["'none'"], // Blocca plugin pericolosi
    upgradeInsecureRequests: isDevelopment ? false : [], // HTTPS in produzione
  };

  app.use(helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
      reportOnly: isDevelopment // Solo report in sviluppo, enforce in produzione
    },
    crossOriginEmbedderPolicy: false, // Disabilitata per compatibilità con iframe e embed esterni
    hsts: {
      maxAge: 31536000, // 1 anno
      includeSubDomains: true,
      preload: true
    }
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
