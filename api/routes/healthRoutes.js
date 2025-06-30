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

module.exports = router;
