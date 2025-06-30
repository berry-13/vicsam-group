const express = require('express');
const { getVersion, getSimpleVersion, getFullVersion } = require('../utils/version');

const router = express.Router();

/**
 * GET /api/version
 * Returns detailed version information
 */
router.get('/', async (req, res) => {
  try {
    const versionInfo = await getVersion();
    
    // Filter sensitive information in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // In production, return minimal version info
      res.json({
        success: true,
        version: await getSimpleVersion(),
        environment: versionInfo.environment,
        timestamp: versionInfo.timestamp
      });
    } else {
      // In development/staging, return full version info
      res.json({
        success: true,
        ...versionInfo
      });
    }
  } catch (error) {
    console.error('❌ [VERSION] Error getting version info:', error);
    res.status(500).json({
      success: false,
      error: 'Could not retrieve version information',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/version/simple
 * Returns simple version string
 */
router.get('/simple', async (req, res) => {
  try {
    res.json({
      success: true,
      version: await getSimpleVersion(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [VERSION] Error getting simple version:', error);
    res.status(500).json({
      success: false,
      error: 'Could not retrieve version information',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/version/full
 * Returns full version string (development only)
 */
router.get('/full', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Full version information not available in production',
      timestamp: new Date().toISOString()
    });
  }

  try {
    res.json({
      success: true,
      version: await getFullVersion(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [VERSION] Error getting full version:', error);
    res.status(500).json({
      success: false,
      error: 'Could not retrieve version information',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
