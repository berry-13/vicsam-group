// ============================================================================
// HEALTH CHECK ROUTES
// ============================================================================

const express = require('express');
const { getSimpleVersion } = require('../utils/version');
const { getSystemMetrics } = require('../utils/serverUtils');

const router = express.Router();

/**
 * Health check endpoint con metriche di sistema
 */
router.get('/health', (req, res) => {
  const metrics = getSystemMetrics();
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';
  
  // Verifica se il client build esiste
  const fs = require('fs');
  const path = require('path');
  const clientIndexPath = path.join(__dirname, '../../client/dist/index.html');
  const clientBuildStatus = fs.existsSync(clientIndexPath);
  
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

module.exports = router;
