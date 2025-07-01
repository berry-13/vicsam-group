const compression = require('compression');
const rateLimit = require('express-rate-limit');

/**
 * Download-specific middleware for performance optimization
 */

/**
 * Configurazione sicura per keyGenerator in base al trust proxy
 */
function createSecureKeyGenerator() {
  // Verifica se il trust proxy è abilitato
  const trustProxy = process.env.TRUST_PROXY === 'true';
  
  if (trustProxy) {
    return (req) => {
      // Usa l'IP più specifico disponibile, fallback a req.ip
      const forwarded = req.get('X-Forwarded-For');
      const realIp = req.get('X-Real-IP');
      const clientIp = realIp || (forwarded && forwarded.split(',')[0].trim()) || req.ip;
      
      // In sviluppo, aggiungi logging per debug
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 [DOWNLOAD RATE LIMIT] Using IP for rate limiting:', clientIp);
      }
      
      return clientIp;
    };
  }
  
  // Se trust proxy è disabilitato, usa il comportamento di default
  return undefined;
}

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
    const contentType = res.getHeader?.('content-type');
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
  
  // Configurazione sicura per trust proxy
  keyGenerator: createSecureKeyGenerator(),
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
