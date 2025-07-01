require('dotenv').config();
const express = require('express');

const { getServerConfig } = require('./config/serverConfig');
const { setupMiddleware } = require('./config/middleware');
const { logServerConfiguration, setupGracefulShutdown, logServerStartup } = require('./api/utils/serverUtils');
const { setupStaticRoutes } = require('./api/routes/staticRoutes');
const { tokenRotationManager } = require('./api/middleware/authMiddleware');

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
// TOKEN ROTATION MANAGER SETUP
// ============================================================================

let tokenCleanupInterval = null;

/**
 * Inizializza il token rotation manager
 */
async function initializeTokenRotation() {
  try {
    console.log('🔄 [SERVER] Initializing token rotation manager...');
    
    // Inizializza Redis connection
    await tokenRotationManager.init();
    
    // Setup cleanup interval (ogni ora)
    tokenCleanupInterval = setInterval(() => {
      tokenRotationManager.cleanupExpiredTokens().catch(error => {
        console.error('❌ [TOKEN] Error during token cleanup:', error.message);
      });
    }, 60 * 60 * 1000);
    
    console.log('✅ [SERVER] Token rotation manager initialized');
    
  } catch (error) {
    console.error('❌ [SERVER] Token rotation manager initialization failed:', error.message);
    console.warn('⚠️ [SERVER] Continuing without token rotation (fallback to in-memory)');
  }
}

/**
 * Pulisce le risorse del token rotation manager
 */
async function cleanupTokenRotation() {
  try {
    console.log('🧹 [SERVER] Cleaning up token rotation manager...');
    
    // Clear interval
    if (tokenCleanupInterval) {
      clearInterval(tokenCleanupInterval);
      tokenCleanupInterval = null;
      console.log('✅ [SERVER] Token cleanup interval cleared');
    }
    
    // Close Redis connection if available
    if (tokenRotationManager.redisClient && tokenRotationManager.redisClient.isOpen) {
      await tokenRotationManager.redisClient.quit();
      console.log('✅ [SERVER] Redis connection closed');
    }
    
  } catch (error) {
    console.error('❌ [SERVER] Error during token rotation cleanup:', error.message);
  }
}

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
    
    // Inizializza il servizio di autenticazione
    console.log('🔐 [SERVER] Initializing authentication service...');
    const { authService } = require('./api/services/authService');
    await authService.ensureInitialized();
    console.log('✅ [SERVER] Authentication service initialized');
    
    // Inizializza il token rotation manager
    await initializeTokenRotation();
    
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
      
      console.log('🔄 [SERVER] Cleaning up token rotation...');
      await cleanupTokenRotation();
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
