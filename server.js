// ============================================================================
// CONFIGURAZIONE INIZIALE E CARICAMENTO MODULI
// ============================================================================

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Importazione utilities e middleware
const { getVersion, getSimpleVersion, getFullVersion } = require('./api/utils/version');
const { errorHandler, notFound, requestLogger } = require('./api/middleware/common');

// Importazione routes
const apiRoutes = require('./api/routes');
const downloadRoutes = require('./api/routes/downloadRoutes');

// ============================================================================
// CONFIGURAZIONE APPLICAZIONE
// ============================================================================

const app = express();

// Configurazione parametri base
const PORT = parseInt(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';

// Configurazione proxy per rate limiting dietro reverse proxy
const trustProxy = process.env.TRUST_PROXY === 'true';
app.set('trust proxy', trustProxy);

// Configurazione ETag per cache ottimizzata
app.set('etag', 'weak');

// ============================================================================
// VERIFICA CONFIGURAZIONE AMBIENTE
// ============================================================================

/**
 * Stampa la configurazione del server all'avvio
 */
function logServerConfiguration() {
  console.log('\n🔧 ===== CONFIGURAZIONE SERVER =====');
  console.log('🔧 [CONFIG] Versione:', getFullVersion());
  console.log('🔧 [CONFIG] NODE_ENV:', NODE_ENV);
  console.log('🔧 [CONFIG] PORT:', PORT);
  console.log('🔧 [CONFIG] TRUST_PROXY:', trustProxy ? 'ABILITATO' : 'DISABILITATO');
  console.log('🔧 [CONFIG] JWT_SECRET:', process.env.JWT_SECRET ? 'CONFIGURATO' : '❌ MANCANTE');
  console.log('🔧 [CONFIG] JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
  console.log('🔧 [CONFIG] API_PASSWORD:', process.env.API_PASSWORD ? 'CONFIGURATO' : '❌ MANCANTE');
  console.log('🔧 [CONFIG] BEARER_TOKEN:', process.env.BEARER_TOKEN ? `CONFIGURATO (${process.env.BEARER_TOKEN.length} caratteri)` : '❌ MANCANTE');
  console.log('🔧 [CONFIG] API_KEY:', process.env.API_KEY ? `CONFIGURATO (${process.env.API_KEY.length} caratteri)` : '❌ MANCANTE (opzionale)');
  console.log('🔧 [CONFIG] RATE_LIMIT_WINDOW_MS:', process.env.RATE_LIMIT_WINDOW_MS);
  console.log('🔧 [CONFIG] RATE_LIMIT_MAX_REQUESTS:', process.env.RATE_LIMIT_MAX_REQUESTS);
  console.log('🔧 [CONFIG] CORS_ORIGIN:', process.env.CORS_ORIGIN);
  console.log('🔧 ===================================\n');
}

logServerConfiguration();

// ============================================================================
// MIDDLEWARE DI SICUREZZA E PERFORMANCE
// ============================================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Configurazione CORS
const corsOptions = {
  origin: isProduction ? 
    (process.env.CORS_ORIGIN || false) :
    true,
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: isProduction ? 86400 : 0,
};

app.use(cors(corsOptions));

// Rate limiting configurabile per ambiente
const rateLimitConfig = {
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

const limiter = rateLimit(rateLimitConfig);
app.use('/api', limiter);

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

const bodyParserOptions = {
  limit: process.env.BODY_LIMIT || '10mb',
  parameterLimit: 10000,
};

app.use(express.json(bodyParserOptions));
app.use(express.urlencoded({ 
  extended: true, 
  ...bodyParserOptions 
}));

// ============================================================================
// VERIFICA BUILD CLIENT E CONFIGURAZIONE STATIC FILES
// ============================================================================

const clientDistPath = path.join(__dirname, 'client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

let hasClientBuild = null;
function checkClientBuild() {
  if (hasClientBuild === null) {
    hasClientBuild = fs.existsSync(clientIndexPath);
    if (hasClientBuild) {
      console.log('✅ Client React build trovato e servito');
    } else {
      console.log('⚠️  Client React build non trovato. Modalità API-only.');
    }
  }
  return hasClientBuild;
}

// ============================================================================
// CONFIGURAZIONE ROUTES
// ============================================================================

app.use('/', downloadRoutes);

app.use('/api', apiRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Rotta API non trovata: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// ENDPOINT HEALTH CHECK
// ============================================================================

/**
 * Calcola metriche di sistema ottimizzate
 */
function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptime = process.uptime();
  
  const totalMemoryMB = memoryUsage.heapTotal / 1024 / 1024;
  const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
  const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100;
  
  return {
    memoryUsage,
    cpuUsage,
    uptime,
    totalMemoryMB,
    usedMemoryMB,
    memoryUsagePercent,
    isHealthy: memoryUsagePercent < 80 && uptime > 60
  };
}

app.get('/health', (req, res) => {
  const metrics = getSystemMetrics();
  const clientBuildStatus = checkClientBuild();
  
  const baseResponse = {
    success: true,
    status: metrics.isHealthy ? 'healthy' : 'warning',
    message: metrics.isHealthy ? 'Server funziona in modo ottimale' : 'Rilevati problemi di performance del server',
    timestamp: new Date().toISOString(),
    version: getSimpleVersion(),
    clientBuild: clientBuildStatus,
    environment: NODE_ENV
  };

  if (isProduction) {
    res.json({
      ...baseResponse,
      system: {
        uptime: Math.round(metrics.uptime),
        memory: {
          status: metrics.memoryUsagePercent < 50 ? 'good' : 
                  metrics.memoryUsagePercent < 80 ? 'moderate' : 'high'
        }
      }
    });
  } else {
    res.json({
      ...baseResponse,
      system: {
        uptime: Math.round(metrics.uptime),
        memory: {
          used: Math.round(metrics.usedMemoryMB),
          total: Math.round(metrics.totalMemoryMB),
          percentage: Math.round(metrics.memoryUsagePercent),
          external: Math.round(metrics.memoryUsage.external / 1024 / 1024),
          rss: Math.round(metrics.memoryUsage.rss / 1024 / 1024)
        },
        cpu: {
          user: metrics.cpuUsage.user,
          system: metrics.cpuUsage.system
        },
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch
        }
      }
    });
  }
});

// ============================================================================
// SERVING FILE STATICI E SPA FALLBACK
// ============================================================================

if (checkClientBuild()) {
  const staticOptions = {
    maxAge: isProduction ? '1d' : '0',
    etag: true,
    lastModified: true,
    index: false,
  };
  
  app.use(express.static(clientDistPath, staticOptions));
}

/**
 * Genera HTML di fallback quando il client React non è disponibile
 */
function generateFallbackHTML() {
  const versionInfo = getSimpleVersion();
  
  return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="API Server Vicsam Group - Modalità API-only">
      <title>Vicsam Group API</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: #f8fafc;
          color: #334155;
          line-height: 1.6;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 { color: #1e40af; margin-bottom: 1rem; }
        h2 { color: #1e40af; margin-top: 2rem; }
        .api-list { 
          background: #f1f5f9; 
          padding: 1rem; 
          border-radius: 4px; 
          margin: 1rem 0; 
        }
        .endpoint { 
          font-family: monospace; 
          background: #e2e8f0; 
          padding: 0.25rem 0.5rem; 
          border-radius: 4px; 
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }
        .status { color: #059669; font-weight: bold; }
        .warning { 
          color: #d97706; 
          background: #fef3c7; 
          padding: 1rem; 
          border-radius: 4px; 
          margin: 1rem 0; 
        }
        .version { 
          color: #6b7280; 
          font-size: 0.875rem; 
          margin-top: 1rem; 
        }
        pre {
          background: #1e293b;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.9rem;
        }
        a {
          color: #1e40af;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Vicsam Group API Server</h1>
        <p class="status">✅ Server attivo e funzionante</p>
        <p class="version">📦 Versione: ${versionInfo}</p>
        
        <div class="warning">
          ⚠️ <strong>Client React non disponibile</strong><br>
          L'interfaccia web non è stata costruita. Server in modalità API-only.
        </div>
        
        <h2>📡 Endpoints API Disponibili</h2>
        <div class="api-list">
          <div class="endpoint">GET /health - Controllo stato del server</div>
          <div class="endpoint">GET /api/version - Informazioni sulla versione</div>
          <div class="endpoint">POST /api/auth/login - Autenticazione utente</div>
          <div class="endpoint">GET /api/auth/info - Informazioni sull'API</div>
          <div class="endpoint">POST /api/data - Salvataggio dati (richiede autenticazione)</div>
          <div class="endpoint">GET /api/data - Recupero dati (richiede autenticazione)</div>
        </div>

        <h2>📥 Endpoints di Download</h2>
        <div class="api-list">
          <div class="endpoint">GET /download - Scarica file dati principale</div>
          <div class="endpoint">GET /app - Scarica informazioni applicazione</div>
          <div class="endpoint">GET /downloads/info - Informazioni sui download disponibili</div>
          <div class="endpoint">GET /downloads/health - Controllo stato servizio download</div>
        </div>
        
        <h2>🔧 Per Sviluppatori</h2>
        <p>Per costruire il client React:</p>
        <pre>cd client && npm run build</pre>
        
        <p><strong>Collegamenti utili:</strong></p>
        <ul>
          <li><a href="/api/auth/info" target="_blank">Documentazione API completa</a></li>
          <li><a href="/api/version" target="_blank">Informazioni sulla versione</a></li>
          <li><a href="/health" target="_blank">Stato del server</a></li>
        </ul>
      </div>
    </body>
    </html>
  `;
}

app.get('*', (req, res) => {
  if (checkClientBuild()) {
    res.set({
      'Cache-Control': isProduction ? 'public, max-age=3600' : 'no-cache',
      'Content-Type': 'text/html; charset=utf-8'
    });
    res.sendFile(clientIndexPath);
  } else {
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.status(200).send(generateFallbackHTML());
  }
});

// ============================================================================
// MIDDLEWARE DI GESTIONE ERRORI
// ============================================================================

app.use(notFound);
app.use(errorHandler);

// ============================================================================
// GESTIONE GRACEFUL SHUTDOWN
// ============================================================================

function gracefulShutdown(signal) {
  console.log(`\n📴 Ricevuto segnale ${signal}: chiusura del server HTTP in corso...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Errore durante la chiusura del server:', err);
      process.exit(1);
    }
    
    console.log('✅ Server HTTP chiuso correttamente');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('⚠️  Timeout durante la chiusura del server, terminazione forzata');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('❌ Errore non catturato:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rifiutata non gestita:', reason);
  console.error('Promise:', promise);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// ============================================================================
// AVVIO SERVER
// ============================================================================

const server = app.listen(PORT, () => {
  console.log('\n🚀 ===== SERVER AVVIATO =====');
  console.log(`🌐 Server disponibile su: http://localhost:${PORT}`);
  console.log(`� API endpoint base: http://localhost:${PORT}/api`);
  console.log(`🔍 Documentazione API: http://localhost:${PORT}/api/auth/info`);
  console.log(`📋 Informazioni versione: http://localhost:${PORT}/api/version`);
  console.log(`💊 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Ambiente: ${NODE_ENV}`);
  console.log(`📦 Versione: ${getSimpleVersion()}`);
  console.log(`�️  Sicurezza: Rate limiting ${rateLimitConfig.max} req/${rateLimitConfig.windowMs}ms`);
  console.log(`🌍 CORS: ${corsOptions.origin === true ? 'Tutte le origini (dev)' : corsOptions.origin || 'Disabilitato'}`);
  console.log(`📁 Client React: ${checkClientBuild() ? 'Disponibile' : 'Non trovato (API-only)'}`);
  console.log('🚀 ============================\n');
});
