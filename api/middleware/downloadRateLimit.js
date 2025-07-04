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
        console.log('🔍 [DOWNLOAD] Using IP:', clientIp);
      }
      
      return clientIp;
    };
  }
  
  // Se trust proxy è disabilitato, usa il comportamento di default
  return undefined;
}

module.exports = {};
