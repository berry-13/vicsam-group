const rateLimit = require('express-rate-limit');
const downloadConfig = require('../services/downloadConfig');

/**
 * Anonymize IP address for privacy compliance
 * @param {string} ip - Original IP address
 * @returns {string} - Anonymized IP address
 */
function anonymizeIP(ip) {
  if (!ip) return 'unknown';
  
  // Check if IP logging is disabled via environment variable
  if (process.env.DOWNLOAD_LOG_IPS === 'false') {
    return '[IP_HIDDEN]';
  }
  
  // IPv4 anonymization (mask last octet)
  if (ip.includes('.') && !ip.includes(':')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  
  // IPv6 anonymization (mask last 80 bits, keep first 48 bits)
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}:xxxx:xxxx:xxxx:xxxx:xxxx`;
    }
  }
  
  // Fallback for unknown format
  return '[IP_MASKED]';
}

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

/**
 * Rate limiting middleware specifically for download endpoints
 */
const downloadRateLimit = rateLimit({
  windowMs: downloadConfig.config.rateWindow,
  max: downloadConfig.config.rateLimit,
  
  // Configurazione sicura per trust proxy
  keyGenerator: createSecureKeyGenerator(),
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
  handler: (req, res, next, options) => {
    const anonymizedIP = anonymizeIP(req.ip);
    console.log(`[RATE LIMIT] Download rate limit exceeded for IP: ${anonymizedIP}`);
    res.status(options.statusCode).json(options.message);
  }
});

module.exports = downloadRateLimit;
