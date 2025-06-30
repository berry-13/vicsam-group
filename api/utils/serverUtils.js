// ============================================================================
// SERVER UTILITIES
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

/**
 * Verifica se il client build esiste
 */
function checkClientBuild() {
  const fs = require('fs');
  const path = require('path');
  const clientIndexPath = path.join(__dirname, '../../client/dist/index.html');
  
  const hasClientBuild = fs.existsSync(clientIndexPath);
  if (hasClientBuild) {
    console.log('✅ Client React build trovato e servito');
  } else {
    console.log('⚠️  Client React build non trovato. Modalità API-only.');
  }
  
  return hasClientBuild;
}

/**
 * Stampa la configurazione del server all'avvio
 */
function logServerConfiguration() {
  const { getFullVersion } = require('./version');
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const PORT = parseInt(process.env.PORT) || 3000;
  const trustProxy = process.env.TRUST_PROXY === 'true';

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

/**
 * Gestione graceful shutdown
 */
function setupGracefulShutdown(server) {
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
}

/**
 * Log di avvio del server
 */
function logServerStartup(PORT, corsOptions, rateLimitConfig) {
  const { getSimpleVersion } = require('./version');
  const NODE_ENV = process.env.NODE_ENV || 'development';

  console.log('\n🚀 ===== SERVER AVVIATO =====');
  console.log(`🌐 Server disponibile su: http://localhost:${PORT}`);
  console.log(`🔌 API endpoint base: http://localhost:${PORT}/api`);
  console.log(`🔍 Documentazione API: http://localhost:${PORT}/api/auth/info`);
  console.log(`📋 Informazioni versione: http://localhost:${PORT}/api/version`);
  console.log(`💊 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Ambiente: ${NODE_ENV}`);
  console.log(`📦 Versione: ${getSimpleVersion()}`);
  console.log(`🛡️  Sicurezza: Rate limiting ${rateLimitConfig.max} req/${rateLimitConfig.windowMs}ms`);
  console.log(`🌍 CORS: ${corsOptions.origin === true ? 'Tutte le origini (dev)' : corsOptions.origin || 'Disabilitato'}`);
  console.log(`📁 Client React: ${checkClientBuild() ? 'Disponibile' : 'Non trovato (API-only)'}`);
  console.log('🚀 ============================\n');
}

module.exports = {
  getSystemMetrics,
  checkClientBuild,
  logServerConfiguration,
  setupGracefulShutdown,
  logServerStartup
};
