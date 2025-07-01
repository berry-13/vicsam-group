require('dotenv').config();
const express = require('express');

const { getServerConfig } = require('./config/serverConfig');
const { setupMiddleware } = require('./config/middleware');
const { logServerConfiguration, setupGracefulShutdown, logServerStartup } = require('./api/utils/serverUtils');
const { setupStaticRoutes } = require('./api/routes/staticRoutes');

const { errorHandler, notFound } = require('./api/middleware/common');

// ============================================================================
// ROUTES IMPORT
// ============================================================================

const apiRoutes = require('./api/routes');
const downloadRoutes = require('./api/routes/downloadRoutes');
const healthRoutes = require('./api/routes/healthRoutes');

// Nuove routes per autenticazione avanzata
const authRoutesV2 = require('./api/routes/authRoutesV2');

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

const { db } = require('./database/database');

/**
 * Inizializza la connessione al database
 */
async function initializeDatabase() {
  try {
    console.log('🔌 [SERVER] Initializing database connection...');
    
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    console.log('✅ [SERVER] Database connection established');
    
    // Mostra informazioni sul database
    if (process.env.NODE_ENV === 'development') {
      const dbInfo = await db.getDatabaseInfo();
      console.log('📊 [SERVER] Database info:', {
        version: dbInfo.version,
        database: dbInfo.database,
        tables: dbInfo.tables.length
      });
    }
    
  } catch (error) {
    console.error('❌ [SERVER] Database initialization failed:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ [SERVER] Continuing without database in development mode');
    }
  }
}

// ============================================================================
// SERVER SETUP
// ============================================================================

const app = express();
const { PORT, NODE_ENV } = getServerConfig();

logServerConfiguration();

const { corsOptions, rateLimitConfig } = setupMiddleware(app);

// ============================================================================
// ROUTES CONFIGURATION
// ============================================================================

// Health check (sempre disponibile)
app.use('/', healthRoutes);

// Download routes (legacy)
app.use('/', downloadRoutes);

// API v1 (legacy routes)
app.use('/api', apiRoutes);

// API v2 (new authentication system)
app.use('/api/v2/auth', authRoutesV2);

// Catch-all per API non trovate
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.path}`,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    availableVersions: {
      'v1': '/api/*',
      'v2': '/api/v2/auth/*'
    }
  });
});

// Static routes (frontend)
setupStaticRoutes(app);

// Error handling
app.use(notFound);
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Avvia il server con inizializzazione completa
 */
async function startServer() {
  try {
    console.log('🚀 [SERVER] Starting Vicsam Group Platform...');
    
    // Inizializza il database
    await initializeDatabase();
    
    // Avvia il server HTTP
    const server = app.listen(PORT, () => {
      logServerStartup(PORT, corsOptions, rateLimitConfig);
      
      console.log('\n🎉 [SERVER] Vicsam Group Platform started successfully!');
      console.log('📚 [SERVER] Available endpoints:');
      console.log('   • Health Check: GET /health');
      console.log('   • Legacy Auth: POST /api/auth/login');
      console.log('   • New Auth: POST /api/v2/auth/login');
      console.log('   • New Register: POST /api/v2/auth/register');
      console.log('   • Auth Info: GET /api/v2/auth/info');
      console.log('   • Data API: /api/data/*');
      console.log('   • Downloads: /get, /app, /downloads/info, /downloads/health');
      console.log('');
      console.log('🔐 [SERVER] Authentication System:');
      console.log('   • JWT-based authentication with RS256');
      console.log('   • Role-based access control (RBAC)');
      console.log('   • Session management with refresh tokens');
      console.log('   • Audit logging enabled');
      console.log('');
      
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ [SERVER] Development mode - Debug features enabled');
        console.log('🔑 [SERVER] Default admin credentials:');
        console.log('   Email: admin@vicsam.com');
        console.log('   Password: VicsAm2025!');
        console.log('   ⚠️  Change these credentials in production!');
        console.log('');
      }
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server, async () => {
      console.log('🔌 [SERVER] Closing database connections...');
      await db.close();
    });
    
  } catch (error) {
    console.error('💥 [SERVER] Server startup failed:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// START THE SERVER
// ============================================================================

startServer();
