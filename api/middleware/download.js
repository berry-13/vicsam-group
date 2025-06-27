const compression = require('compression');
const rateLimit = require('express-rate-limit');

/**
 * Download-specific middleware for performance optimization
 */

// Compression middleware with optimized settings for downloads
const downloadCompression = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,
  
  // Use fastest compression for better performance
  level: 1,
  
  // Only compress specific file types
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (!req.headers['accept-encoding'] || !req.headers['accept-encoding'].includes('gzip')) {
      return false;
    }
    
    // Compress JSON files
    const contentType = res.getHeader('content-type');
    if (contentType && contentType.includes('application/json')) {
      return true;
    }
    
    // Don't compress already compressed files
    return false;
  }
});

// Rate limiting for downloads - more generous than API
const downloadRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 downloads per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many download requests, please try again later',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString()
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.includes('/health') || req.path.includes('/info');
  }
});

// Security headers specifically for file downloads
const downloadSecurityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Download-Options': 'noopen',
    'Referrer-Policy': 'no-referrer'
  });
  next();
};

// Performance monitoring middleware
const downloadMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalEnd = res.end;
  
  // Override res.end to measure timing
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const contentLength = res.getHeader('content-length') || 0;
    
    console.log(`📊 [DOWNLOAD METRICS] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${contentLength} bytes`);
    
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  downloadCompression,
  downloadRateLimit,
  downloadSecurityHeaders,
  downloadMonitoring
};
