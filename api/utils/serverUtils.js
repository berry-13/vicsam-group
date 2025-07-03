// ============================================================================
// SERVER UTILITIES
// ============================================================================

const fs = require('fs');
const path = require('path');

/**
 * Calcola metriche di sistema ottimizzate con gestione errori
 */
function getSystemMetrics() {
  try {
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
  } catch (error) {
    console.warn('⚠️  Impossibile ottenere metriche di sistema complete:', error.message);
    
    // Ritorna metriche ridotte quando process.memoryUsage() fallisce
    const uptime = process.uptime();
    
    return {
      memoryUsage: null,
      cpuUsage: null,
      uptime,
      totalMemoryMB: null,
      usedMemoryMB: null,
      memoryUsagePercent: null,
      isHealthy: uptime > 60, // Solo controllo uptime
      error: error.message
    };
  }
}

/**
 * Verifica se il client build esiste
 */
function checkClientBuild() {
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
  console.log('🔧 [CONFIG] BEARER_TOKEN:', process.env.BEARER_TOKEN ? `CONFIGURATO (${process.env.BEARER_TOKEN.length} caratteri)` : '❌ MANCANTE');
  console.log('🔧 [CONFIG] JWT System:', 'ABILITATO (AuthService)');
  console.log('🔧 [CONFIG] Download Service:', 'ABILITATO (File Hosting)');
  console.log('🔧 [CONFIG] CORS_ORIGIN:', process.env.CORS_ORIGIN);
  console.log('🔧 ===================================\n');
}

/**
 * Gestione graceful shutdown
 */
function setupGracefulShutdown(server, cleanupCallback = null) {
  async function gracefulShutdown(signal) {
    console.log(`\n📴 Ricevuto segnale ${signal}: chiusura del server in corso...`);
    
    try {
      // Esegui cleanup personalizzato se fornito
      if (cleanupCallback && typeof cleanupCallback === 'function') {
        console.log('🧹 Eseguendo cleanup personalizzato...');
        await cleanupCallback();
        console.log('✅ Cleanup personalizzato completato');
      }
    } catch (error) {
      console.error('❌ Errore durante il cleanup personalizzato:', error.message);
    }
    
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
