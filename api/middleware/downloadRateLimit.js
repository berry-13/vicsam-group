const rateLimit = require('express-rate-limit');
const downloadConfig = require('../services/downloadConfig');

/**
 * Rate limiting middleware specifically for download endpoints
 */
const downloadRateLimit = rateLimit({
  windowMs: downloadConfig.config.rateWindow,
  max: downloadConfig.config.rateLimit,
  message: {
    success: false,
    error: 'Too many download requests, please try again later',
    retryAfter: Math.ceil(downloadConfig.config.rateWindow / 1000),
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address as the key for rate limiting
    return req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.includes('/health');
  },
  onLimitReached: (req, res, options) => {
    console.log(`[RATE LIMIT] Download rate limit exceeded for IP: ${req.ip}`);
  }
});

module.exports = downloadRateLimit;
