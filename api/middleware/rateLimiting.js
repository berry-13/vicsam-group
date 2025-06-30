const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/helpers');

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
        console.log('🔍 [LOGIN RATE LIMIT] Using IP for rate limiting:', clientIp);
      }
      
      return clientIp;
    };
  }
  
  // Se trust proxy è disabilitato, usa il comportamento di default
  return undefined;
}

/**
 * Rate limiter specifico per il login
 * Più restrittivo del rate limiter generale
 */
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // massimo 5 tentativi di login per IP ogni 15 minuti
  skipSuccessfulRequests: true, // non conta le richieste riuscite
  skipFailedRequests: false, // conta le richieste fallite
  standardHeaders: true, // aggiunge info nei headers `RateLimit-*`
  legacyHeaders: false, // disabilita headers `X-RateLimit-*`
  
  // Configurazione sicura per trust proxy
  keyGenerator: createSecureKeyGenerator(),
  
  // Messaggio personalizzato per il ban
  message: (req) => {
    console.log(`🚫 [LOGIN RATE LIMIT] IP ${req.ip} ha superato il limite di tentativi di login`);
    console.log(`🚫 [LOGIN RATE LIMIT] User-Agent: ${req.get('User-Agent')}`);
    
    return errorResponse(
      'Troppi tentativi di login. Riprova tra 15 minuti.',
      429,
      {
        retryAfter: '15 minuti',
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        hint: 'Per sicurezza, l\'accesso è temporaneamente bloccato dopo troppi tentativi falliti'
      }
    );
  },
  
  // Handler per quando il limite viene superato
  handler: (req, res, next, options) => {
    console.log(`🚫 [LOGIN RATE LIMIT] Blocco attivato per IP: ${req.ip}`);
    console.log(`🚫 [LOGIN RATE LIMIT] Headers ricevuti:`, JSON.stringify(req.headers, null, 2));
    
    // Log di sicurezza quando il limite viene raggiunto
    console.log(`⚠️ [LOGIN RATE LIMIT] Limite raggiunto per IP: ${req.ip}`);
    console.log(`⚠️ [LOGIN RATE LIMIT] Max tentativi: 5, Finestra: 15 minuti`);
    
    // Log aggiuntivo per sicurezza
    console.log(`🔍 [SECURITY LOG] Possibile attacco brute force da:`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    });
    
    const resetTime = new Date(Date.now() + 15 * 60 * 1000);
    
    res.status(429).json(
      errorResponse(
        'Troppi tentativi di login falliti. Account temporaneamente bloccato.',
        429,
        {
          retryAfter: '15 minuti',
          resetTime: resetTime.toISOString(),
          maxAttempts: 5,
          securityNote: 'Questo blocco è una misura di sicurezza per proteggere il sistema',
          contact: 'Se ritieni che questo sia un errore, contatta l\'amministratore'
        }
      )
    );
  },
  
  // Funzione per identificare univocamente gli utenti
  keyGenerator: (req) => {
    // Usa una combinazione di IP e User-Agent per una migliore identificazione
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    const key = `${ip}:${userAgent.substring(0, 50)}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔑 [LOGIN RATE LIMIT] Key generata per rate limiting: ${key}`);
    }
    return key;
  }
});

/**
 * Rate limiter ancora più restrittivo per password errate consecutive
 * Si attiva dopo 3 password errate dallo stesso IP
 */
const strictLoginRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minuti
  max: 3, // massimo 3 password errate ogni 30 minuti
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  
  message: () => errorResponse(
    'Troppi tentativi con password errata. Account bloccato per 30 minuti.',
    429,
    {
      retryAfter: '30 minuti',
      securityLevel: 'high',
      reason: 'Possibile tentativo di accesso non autorizzato'
    }
  ),
  
  keyGenerator: (req) => `strict:${req.ip}`,
  
  handler: (req, res, next, options) => {
    console.log(`🚨 [STRICT RATE LIMIT] ALLARME SICUREZZA - Possibile attacco brute force da IP: ${req.ip}`);
    console.log(`🚨 [SECURITY ALERT] Dettagli:`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      action: 'BLOCKED_30_MIN'
    });
    
    res.status(429).json(
      errorResponse(
        'Troppi tentativi con password errata. Account bloccato per 30 minuti.',
        429,
        {
          retryAfter: '30 minuti',
          securityLevel: 'high',
          reason: 'Possibile tentativo di accesso non autorizzato'
        }
      )
    );
  }
});

module.exports = {
  loginRateLimit,
  strictLoginRateLimit
};
