require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import middleware
const { errorHandler, notFound, requestLogger } = require('./api/middleware/common');

// Import routes
const apiRoutes = require('./api/routes');
const downloadRoutes = require('./api/routes/downloadRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Verifica configurazione all'avvio
console.log('\n🔧 ===== CONFIGURAZIONE SERVER =====');
console.log('🔧 [CONFIG] NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 [CONFIG] PORT:', PORT);
console.log('🔧 [CONFIG] JWT_SECRET:', process.env.JWT_SECRET ? 'CONFIGURATO' : '❌ MANCANTE');
console.log('🔧 [CONFIG] JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
console.log('🔧 [CONFIG] API_PASSWORD:', process.env.API_PASSWORD ? 'CONFIGURATO' : '❌ MANCANTE');
console.log('🔧 [CONFIG] BEARER_TOKEN:', process.env.BEARER_TOKEN ? `CONFIGURATO (${process.env.BEARER_TOKEN.length} caratteri)` : '❌ MANCANTE');
console.log('🔧 [CONFIG] API_KEY:', process.env.API_KEY ? `CONFIGURATO (${process.env.API_KEY.length} caratteri)` : '❌ MANCANTE (opzionale)');
console.log('🔧 [CONFIG] RATE_LIMIT_WINDOW_MS:', process.env.RATE_LIMIT_WINDOW_MS);
console.log('🔧 [CONFIG] RATE_LIMIT_MAX_REQUESTS:', process.env.RATE_LIMIT_MAX_REQUESTS);
console.log('🔧 [CONFIG] CORS_ORIGIN:', process.env.CORS_ORIGIN);
console.log('🔧 ===================================\n');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabilita CSP per consentire il serving di file statici
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minuti
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite di 100 richieste per finestra
  message: {
    success: false,
    error: 'Troppe richieste, riprova più tardi',
    timestamp: new Date().toISOString()
  }
});

app.use('/api', limiter);

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(requestLogger);
}

// Debug middleware per l'autenticazione
app.use('/api/auth', (req, res, next) => {
  console.log('\n🚀 ===== RICHIESTA AUTENTICAZIONE =====');
  console.log('🚀 [AUTH REQUEST] Timestamp:', new Date().toISOString());
  console.log('🚀 [AUTH REQUEST] Method:', req.method);
  console.log('🚀 [AUTH REQUEST] URL:', req.url);
  console.log('🚀 [AUTH REQUEST] Full URL:', req.originalUrl);
  console.log('🚀 [AUTH REQUEST] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🚀 [AUTH REQUEST] Body:', JSON.stringify(req.body, null, 2));
  console.log('🚀 [AUTH REQUEST] Query:', JSON.stringify(req.query, null, 2));
  console.log('🚀 [AUTH REQUEST] IP:', req.ip);
  console.log('🚀 [AUTH REQUEST] User Agent:', req.get('User-Agent'));
  console.log('🚀 =====================================\n');
  next();
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Download routes (no authentication required for public downloads)
app.use('/', downloadRoutes);

// API routes
app.use('/api', apiRoutes);

// API 404 handler (solo per rotte che iniziano con /api)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Rotta API non trovata: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

// Check if client build exists
const clientDistPath = path.join(__dirname, 'client/dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);

if (hasClientBuild) {
  // Serve static files from React build
  app.use(express.static(clientDistPath));
  console.log('✅ Client React build trovato e servito');
} else {
  console.log('⚠️  Client React build non trovato. API-only mode.');
}

// Health check endpoint with comprehensive system information
app.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  const uptime = process.uptime();
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  
  // Calculate memory usage percentages (assuming 1GB as reference)
  const totalMemoryMB = memoryUsage.heapTotal / 1024 / 1024;
  const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
  const memoryUsagePercent = (usedMemoryMB / totalMemoryMB) * 100;
  
  // Determine health status based on metrics
  const isHealthy = memoryUsagePercent < 80 && uptime > 60; // At least 1 minute uptime

  // Base response for all environments
  const baseResponse = {
    success: true,
    status: isHealthy ? 'healthy' : 'warning',
    message: isHealthy ? 'Server is running optimally' : 'Server performance issues detected',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    clientBuild: hasClientBuild,
    environment: environment
  };

  // In production, return minimal information
  if (isProduction) {
    res.json({
      ...baseResponse,
      system: {
        uptime: Math.round(uptime),
        // Only expose basic memory usage percentage, not detailed values
        memory: {
          status: memoryUsagePercent < 50 ? 'good' : memoryUsagePercent < 80 ? 'moderate' : 'high'
        }
      }
    });
  } else {
    // In development/staging, return full system information
    res.json({
      ...baseResponse,
      system: {
        uptime: Math.round(uptime),
        memory: {
          used: Math.round(usedMemoryMB),
          total: Math.round(totalMemoryMB),
          percentage: Math.round(memoryUsagePercent),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
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

// SPA fallback: tutte le altre rotte servono index.html o messaggio di fallback
app.get('*', (req, res) => {
  if (hasClientBuild) {
    res.sendFile(clientIndexPath);
  } else {
    // Fallback HTML quando il client non è disponibile
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vicsam Group API</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f8fafc;
            color: #334155;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          h1 { color: #1e40af; margin-bottom: 1rem; }
          .api-list { background: #f1f5f9; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
          .endpoint { font-family: monospace; background: #e2e8f0; padding: 0.25rem 0.5rem; border-radius: 4px; margin: 0.25rem 0; }
          .status { color: #059669; font-weight: bold; }
          .warning { color: #d97706; background: #fef3c7; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Vicsam Group API</h1>
          <p class="status">✅ Server attivo e funzionante</p>
          
          <div class="warning">
            ⚠️ <strong>Client React non disponibile</strong><br>
            L'interfaccia web non è stata buildada. Server in modalità API-only.
          </div>
          
          <h2>📡 API Endpoints Disponibili</h2>
          <div class="api-list">
            <div class="endpoint">GET /health - Health check</div>
            <div class="endpoint">POST /api/auth/login - Autenticazione</div>
            <div class="endpoint">GET /api/auth/info - Informazioni API</div>
            <div class="endpoint">POST /api/data - Salva dati (richiede auth)</div>
            <div class="endpoint">GET /api/data - Ottieni dati (richiede auth)</div>
          </div>

          <h2>📥 Download Endpoints</h2>
          <div class="api-list">
            <div class="endpoint">GET /download - Scarica file dati principale</div>
            <div class="endpoint">GET /app - Scarica informazioni applicazione</div>
            <div class="endpoint">GET /downloads/info - Info sui download disponibili</div>
            <div class="endpoint">GET /downloads/health - Health check servizio download</div>
          </div>
          
          <h2>🔧 Per sviluppatori</h2>
          <p>Per buildare il client React:</p>
          <pre style="background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 4px; overflow-x: auto;">cd client && npm run build</pre>
          
          <p>Documentazione completa: <a href="/api/auth/info" target="_blank">API Info</a></p>
        </div>
      </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
  console.log(`📁 API disponibili su http://localhost:${PORT}/api`);
  console.log(`🔍 Documentazione API: http://localhost:${PORT}/api/auth/info`);
  console.log(`⚡ Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
