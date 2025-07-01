// ============================================================================
// HEALTH CHECK ROUTES
// ============================================================================

const express = require('express');
const fs = require('fs');
const { getSimpleVersion } = require('../utils/version');
const { getSystemMetrics } = require('../utils/serverUtils');
const { getPathConfig } = require('../../config/serverConfig');

const router = express.Router();

/**
 * Health check endpoint con metriche di sistema
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = getSystemMetrics();
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const isProduction = NODE_ENV === 'production';
    
    // Verifica se il client build esiste
    const { CLIENT_INDEX_PATH } = getPathConfig();
    const clientBuildStatus = fs.existsSync(CLIENT_INDEX_PATH);
    
    const baseResponse = {
      success: true,
      status: metrics.isHealthy ? 'healthy' : 'warning',
      message: metrics.isHealthy ? 'Server funziona in modo ottimale' : 'Rilevati problemi di performance del server',
      timestamp: new Date().toISOString(),
      version: await getSimpleVersion(),
      clientBuild: clientBuildStatus,
      environment: NODE_ENV
    };

  if (isProduction) {
    const systemInfo = {
      uptime: Math.round(metrics.uptime)
    };
    
    // Aggiungi informazioni memoria solo se disponibili
    if (metrics.memoryUsagePercent !== null) {
      systemInfo.memory = {
        status: metrics.memoryUsagePercent < 50 ? 'good' : 
                metrics.memoryUsagePercent < 80 ? 'moderate' : 'high'
      };
    } else {
      systemInfo.memory = { status: 'unavailable' };
    }
    
    res.json({
      ...baseResponse,
      system: systemInfo
    });
  } else {
    const systemInfo = {
      uptime: Math.round(metrics.uptime),
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    // Aggiungi informazioni dettagliate solo se disponibili
    if (metrics.memoryUsage !== null) {
      systemInfo.memory = {
        used: Math.round(metrics.usedMemoryMB),
        total: Math.round(metrics.totalMemoryMB),
        percentage: Math.round(metrics.memoryUsagePercent),
        external: Math.round(metrics.memoryUsage.external / 1024 / 1024),
        rss: Math.round(metrics.memoryUsage.rss / 1024 / 1024)
      };
    } else {
      systemInfo.memory = { status: 'unavailable', error: metrics.error };
    }
    
    if (metrics.cpuUsage !== null) {
      systemInfo.cpu = {
        user: metrics.cpuUsage.user,
        system: metrics.cpuUsage.system
      };
    } else {
      systemInfo.cpu = { status: 'unavailable' };
    }
    
    res.json({
      ...baseResponse,
      system: systemInfo
    });
  }
  } catch (error) {
    console.error('❌ Errore durante health check:', error);
    
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Errore interno del server durante il controllo di salute',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
