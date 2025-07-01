const { authService, AuthError } = require('../services/authService');
const { errorResponse } = require('../utils/helpers');
const { verifyToken, extractBearerToken } = require('../utils/jwt');

/**
 * Middleware di autenticazione avanzato per l'API
 */

/**
 * Middleware per autenticazione JWT con verifica di sessione
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const authenticateJWT = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH] Starting JWT authentication...');
    
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      console.log('❌ [AUTH] No JWT token provided');
      return res.status(401).json(
        errorResponse('Access token required', 401, {
          error: 'MISSING_TOKEN',
          message: 'Please provide a valid Bearer token in the Authorization header'
        })
      );
    }

    // Verifica il token JWT
    const decoded = await authService.verifyAccessToken(token);
    
    // Carica i dati completi dell'utente
    const userResult = await authService.findUserByEmail(decoded.email);
    if (!userResult) {
      console.log('❌ [AUTH] User not found for token');
      return res.status(401).json(
        errorResponse('User not found', 401, {
          error: 'USER_NOT_FOUND'
        })
      );
    }

    // Aggiunge i dati dell'utente alla richiesta
    req.user = {
      id: decoded.sub,
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      roles: decoded.roles,
      permissions: decoded.permissions,
      jti: decoded.jti
    };

    // Log di debug
    console.log('✅ [AUTH] JWT authentication successful:', {
      user: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions.length
    });

    next();
    
  } catch (error) {
    console.error('❌ [AUTH] JWT authentication failed:', error.message);
    
    let errorCode = 'INVALID_TOKEN';
    let message = 'Invalid or expired token';
    
    if (error instanceof AuthError) {
      errorCode = error.code;
      message = error.message;
    }
    
    return res.status(401).json(
      errorResponse(message, 401, {
        error: errorCode,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

/**
 * Middleware per verificare permessi specifici
 * @param {string|Array} requiredPermissions - Permessi richiesti
 * @returns {Function} Middleware function
 */
const requirePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      console.log('🔒 [AUTH] Checking permissions:', requiredPermissions);
      
      if (!req.user) {
        return res.status(401).json(
          errorResponse('Authentication required', 401, {
            error: 'AUTHENTICATION_REQUIRED'
          })
        );
      }

      const userPermissions = req.user.permissions || [];
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      
      // Verifica se l'utente ha il permesso di admin (accesso totale)
      if (userPermissions.includes('*') || userPermissions.includes('system.admin')) {
        console.log('✅ [AUTH] Admin permissions granted');
        return next();
      }
      
      // Verifica permessi specifici
      const hasAllPermissions = permissions.every(permission => {
        // Supporta wildcard per risorsa (es. "data.*")
        if (permission.endsWith('.*')) {
          const resource = permission.slice(0, -2);
          return userPermissions.some(userPerm => userPerm.startsWith(resource + '.'));
        }
        return userPermissions.includes(permission);
      });
      
      if (!hasAllPermissions) {
        console.log('❌ [AUTH] Insufficient permissions:', {
          required: permissions,
          userHas: userPermissions
        });
        
        return res.status(403).json(
          errorResponse('Insufficient permissions', 403, {
            error: 'INSUFFICIENT_PERMISSIONS',
            required: permissions,
            message: 'You do not have the required permissions to access this resource'
          })
        );
      }
      
      console.log('✅ [AUTH] Permission check passed');
      next();
      
    } catch (error) {
      console.error('❌ [AUTH] Permission check failed:', error.message);
      return res.status(500).json(
        errorResponse('Permission check error', 500, {
          error: 'PERMISSION_CHECK_ERROR'
        })
      );
    }
  };
};

/**
 * Middleware per verificare ruoli specifici
 * @param {string|Array} requiredRoles - Ruoli richiesti
 * @returns {Function} Middleware function
 */
const requireRoles = (requiredRoles) => {
  return (req, res, next) => {
    try {
      console.log('👑 [AUTH] Checking roles:', requiredRoles);
      
      if (!req.user) {
        return res.status(401).json(
          errorResponse('Authentication required', 401, {
            error: 'AUTHENTICATION_REQUIRED'
          })
        );
      }

      const userRoles = req.user.roles || [];
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      
      // Verifica se l'utente ha almeno uno dei ruoli richiesti
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        console.log('❌ [AUTH] Insufficient roles:', {
          required: roles,
          userHas: userRoles
        });
        
        return res.status(403).json(
          errorResponse('Insufficient role privileges', 403, {
            error: 'INSUFFICIENT_ROLES',
            required: roles,
            message: 'You do not have the required role to access this resource'
          })
        );
      }
      
      console.log('✅ [AUTH] Role check passed');
      next();
      
    } catch (error) {
      console.error('❌ [AUTH] Role check failed:', error.message);
      return res.status(500).json(
        errorResponse('Role check error', 500, {
          error: 'ROLE_CHECK_ERROR'
        })
      );
    }
  };
};

/**
 * Middleware combinato per autenticazione e autorizzazione
 * @param {Object} options - Opzioni di autenticazione
 * @param {Array} options.permissions - Permessi richiesti
 * @param {Array} options.roles - Ruoli richiesti
 * @returns {Function} Middleware function
 */
const authenticate = (options = {}) => {
  return async (req, res, next) => {
    try {
      // Prima autentica l'utente
      await new Promise((resolve, reject) => {
        authenticateJWT(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Poi verifica i permessi se specificati
      if (options.permissions) {
        await new Promise((resolve, reject) => {
          requirePermissions(options.permissions)(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      // Infine verifica i ruoli se specificati
      if (options.roles) {
        await new Promise((resolve, reject) => {
          requireRoles(options.roles)(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      next();
      
    } catch (error) {
      // L'errore è già stato gestito dai middleware precedenti
      return;
    }
  };
};

/**
 * Middleware per verificare se l'utente è proprietario della risorsa
 * @param {Function} getResourceOwner - Funzione per ottenere il proprietario della risorsa
 * @returns {Function} Middleware function
 */
const requireOwnership = (getResourceOwner) => {
  return async (req, res, next) => {
    try {
      console.log('👤 [AUTH] Checking resource ownership...');
      
      if (!req.user) {
        return res.status(401).json(
          errorResponse('Authentication required', 401, {
            error: 'AUTHENTICATION_REQUIRED'
          })
        );
      }

      // Se è admin, bypassa il controllo di ownership
      if (req.user.roles.includes('admin') || req.user.permissions.includes('*')) {
        console.log('✅ [AUTH] Admin bypass ownership check');
        return next();
      }

      // Ottiene il proprietario della risorsa
      const resourceOwner = await getResourceOwner(req);
      
      if (!resourceOwner) {
        return res.status(404).json(
          errorResponse('Resource not found', 404, {
            error: 'RESOURCE_NOT_FOUND'
          })
        );
      }
      
      // Verifica se l'utente è il proprietario
      if (resourceOwner !== req.user.id && resourceOwner !== req.user.email) {
        console.log('❌ [AUTH] Access denied - not resource owner:', {
          user: req.user.email,
          owner: resourceOwner
        });
        
        return res.status(403).json(
          errorResponse('Access denied - not resource owner', 403, {
            error: 'NOT_RESOURCE_OWNER'
          })
        );
      }
      
      console.log('✅ [AUTH] Ownership verification passed');
      next();
      
    } catch (error) {
      console.error('❌ [AUTH] Ownership check failed:', error.message);
      return res.status(500).json(
        errorResponse('Ownership check error', 500, {
          error: 'OWNERSHIP_CHECK_ERROR'
        })
      );
    }
  };
};

/**
 * Middleware opzionale per autenticazione (non blocca se non autenticato)
 * Utile per endpoint che funzionano sia con che senza autenticazione
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (token) {
      try {
        const decoded = await authService.verifyAccessToken(token);
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          roles: decoded.roles,
          permissions: decoded.permissions,
          jti: decoded.jti
        };
        console.log('✅ [AUTH] Optional authentication successful:', decoded.email);
      } catch (error) {
        console.log('⚠️ [AUTH] Optional authentication failed, continuing without auth');
        // Non blocca la richiesta, continua senza autenticazione
      }
    }
    
    next();
    
  } catch (error) {
    console.error('❌ [AUTH] Optional auth error:', error.message);
    // Anche in caso di errore, continua senza autenticazione
    next();
  }
};

/**
 * Middleware per autenticazione JWT con Bearer token
 * Sostituisce l'autenticazione con token statico per maggiore sicurezza
 */
const authenticateBearer = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH JWT] JWT Bearer token authentication...');
    
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      return res.status(401).json(
        errorResponse('Bearer token required', 401, {
          error: 'MISSING_BEARER_TOKEN',
          message: 'Please provide a Bearer token in the Authorization header'
        })
      );
    }

    // Verifica il token JWT invece del token statico
    try {
      const decoded = verifyToken(token);
      
      // Verifica che il token non sia scaduto (già verificato da verifyToken)
      // Aggiungi informazioni del token decodificato alla richiesta
      req.user = decoded;
      req.tokenPayload = decoded;
      
      console.log('✅ [AUTH JWT] JWT Bearer token valid for user:', decoded.email || decoded.userId || 'unknown');
      next();
      
    } catch (jwtError) {
      console.error('❌ [AUTH JWT] JWT verification failed:', jwtError.message);
      
      let errorCode = 'INVALID_BEARER_TOKEN';
      let errorMessage = 'Invalid Bearer token';
      
      // Gestisci diversi tipi di errori JWT
      if (jwtError.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = 'Bearer token has expired';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorCode = 'MALFORMED_TOKEN';
        errorMessage = 'Malformed Bearer token';
      } else if (jwtError.name === 'NotBeforeError') {
        errorCode = 'TOKEN_NOT_ACTIVE';
        errorMessage = 'Bearer token not active yet';
      }
      
      return res.status(401).json(
        errorResponse(errorMessage, 401, {
          error: errorCode,
          details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
        })
      );
    }
    
  } catch (error) {
    console.error('❌ [AUTH JWT] Bearer authentication failed:', error.message);
    return res.status(401).json(
      errorResponse('Bearer authentication error', 401, {
        error: 'BEARER_AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

/**
 * Middleware di autenticazione ibrido con fallback al token statico
 * Prova prima JWT, poi fallback al token statico per compatibilità
 */
const authenticateBearerHybrid = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH HYBRID] Starting hybrid authentication...');
    
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      return res.status(401).json(
        errorResponse('Bearer token required', 401, {
          error: 'MISSING_BEARER_TOKEN',
          message: 'Please provide a Bearer token in the Authorization header'
        })
      );
    }

    // Prima prova con JWT
    try {
      const decoded = verifyToken(token);
      req.user = decoded;
      req.tokenPayload = decoded;
      req.authMethod = 'JWT';
      
      console.log('✅ [AUTH HYBRID] JWT authentication successful for user:', decoded.email || decoded.userId || 'unknown');
      return next();
      
    } catch (jwtError) {
      console.log('🔄 [AUTH HYBRID] JWT failed, trying legacy token...', jwtError.message);
      
      // Fallback al token statico legacy
      const expectedToken = process.env.BEARER_TOKEN;
      
      if (expectedToken && token === expectedToken) {
        req.authMethod = 'LEGACY';
        console.log('✅ [AUTH HYBRID] Legacy token authentication successful');
        return next();
      }
      
      // Entrambi i metodi falliti
      console.error('❌ [AUTH HYBRID] Both JWT and legacy authentication failed');
      
      let errorCode = 'INVALID_BEARER_TOKEN';
      let errorMessage = 'Invalid Bearer token';
      
      // Se sembra un JWT malformato, dai un messaggio più specifico
      if (token.includes('.') && token.split('.').length === 3) {
        if (jwtError.name === 'TokenExpiredError') {
          errorCode = 'TOKEN_EXPIRED';
          errorMessage = 'Bearer token has expired';
        } else if (jwtError.name === 'JsonWebTokenError') {
          errorCode = 'MALFORMED_JWT_TOKEN';
          errorMessage = 'Malformed JWT token';
        }
      }
      
      return res.status(401).json(
        errorResponse(errorMessage, 401, {
          error: errorCode,
          details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
        })
      );
    }
    
  } catch (error) {
    console.error('❌ [AUTH HYBRID] Authentication error:', error.message);
    return res.status(401).json(
      errorResponse('Authentication error', 401, {
        error: 'AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

/**
 * Middleware per autenticazione Bearer con supporto token rotation
 * Versione migliorata della autenticazione legacy con scadenza
 */
const authenticateBearerWithRotation = (req, res, next) => {
  try {
    console.log('🔐 [AUTH ROTATION] Bearer token with rotation authentication...');
    
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      return res.status(401).json(
        errorResponse('Bearer token required', 401, {
          error: 'MISSING_BEARER_TOKEN',
          message: 'Please provide a Bearer token in the Authorization header'
        })
      );
    }

    // Valida il token usando il sistema di rotazione
    const validation = tokenRotationManager.validateRotatedToken(token);
    
    if (!validation.valid) {
      console.error('❌ [AUTH ROTATION] Token validation failed:', validation.reason);
      
      let errorMessage = 'Invalid Bearer token';
      let errorCode = 'INVALID_BEARER_TOKEN';
      
      if (validation.reason === 'expired') {
        errorMessage = 'Bearer token has expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (validation.reason === 'unknown') {
        errorMessage = 'Unknown Bearer token';
        errorCode = 'UNKNOWN_TOKEN';
      }
      
      return res.status(401).json(
        errorResponse(errorMessage, 401, {
          error: errorCode,
          details: process.env.NODE_ENV === 'development' ? validation : undefined
        })
      );
    }

    // Token valido, aggiungi informazioni alla richiesta
    req.authMethod = validation.method;
    req.tokenAge = validation.age;
    
    console.log(`✅ [AUTH ROTATION] Bearer token valid (method: ${validation.method})`);
    
    // Se il token è vicino alla scadenza, emetti un warning nell'header di risposta
    if (validation.age && validation.age > 20 * 60 * 60 * 1000) { // 20 ore
      res.set('X-Token-Warning', 'Token will expire soon, consider refreshing');
    }
    
    next();
    
  } catch (error) {
    console.error('❌ [AUTH ROTATION] Bearer authentication failed:', error.message);
    return res.status(401).json(
      errorResponse('Bearer authentication error', 401, {
        error: 'BEARER_AUTH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    );
  }
};

/**
 * Middleware per logging delle richieste autenticate
 */
const auditLogger = (action) => {
  return (req, res, next) => {
    // Salva i dati originali del response.json per catturare il risultato
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log dell'audit dopo la risposta
      setImmediate(async () => {
        try {
          if (req.user) {
            await authService.logAuditEvent(
              req.user.id,
              action,
              req.route?.path || req.path,
              req.params?.id || null,
              {
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                success: res.statusCode < 400
              },
              res.statusCode < 400
            );
          }
        } catch (error) {
          console.error('❌ [AUDIT] Logging failed:', error.message);
        }
      });
      
      // Chiama il json originale
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Utility per la gestione del token rotation per token statici
 */
const tokenRotationManager = {
  // Cache per i token ruotati con timestamp
  tokenCache: new Map(),
  
  /**
   * Genera un nuovo token statico con timestamp
   */
  generateRotatedToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `static_${timestamp}_${random}`;
  },
  
  /**
   * Valida un token considerando la rotazione
   * @param {string} token - Token da validare
   * @param {number} maxAge - Età massima del token in millisecondi (default: 24 ore)
   */
  validateRotatedToken(token, maxAge = 24 * 60 * 60 * 1000) {
    // Controlla il token corrente dal env
    const currentToken = process.env.BEARER_TOKEN;
    if (token === currentToken) {
      return { valid: true, method: 'current' };
    }
    
    // Controlla token ruotati recenti nella cache
    const tokenInfo = this.tokenCache.get(token);
    if (tokenInfo) {
      const age = Date.now() - tokenInfo.timestamp;
      if (age <= maxAge) {
        return { valid: true, method: 'rotated', age };
      } else {
        // Token scaduto, rimuovi dalla cache
        this.tokenCache.delete(token);
        return { valid: false, reason: 'expired', age };
      }
    }
    
    return { valid: false, reason: 'unknown' };
  },
  
  /**
   * Aggiungi un token alla cache di rotazione
   * @param {string} token - Token da aggiungere
   */
  addToRotationCache(token) {
    this.tokenCache.set(token, {
      timestamp: Date.now(),
      used: false
    });
    
    // Cleanup automatico dei token vecchi (mantieni solo gli ultimi 10)
    if (this.tokenCache.size > 10) {
      const tokens = Array.from(this.tokenCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Rimuovi i più vecchi
      tokens.slice(0, tokens.length - 10).forEach(([token]) => {
        this.tokenCache.delete(token);
      });
    }
  },
  
  /**
   * Pulisci i token scaduti dalla cache
   * @param {number} maxAge - Età massima in millisecondi
   */
  cleanupExpiredTokens(maxAge = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [token, info] of this.tokenCache.entries()) {
      if (now - info.timestamp > maxAge) {
        this.tokenCache.delete(token);
      }
    }
  }
};

// Cleanup automatico ogni ora
setInterval(() => {
  tokenRotationManager.cleanupExpiredTokens();
}, 60 * 60 * 1000);

/*
USAGE EXAMPLES:

1. JWT Authentication (Recommended):
   app.get('/api/secure', authenticateBearer, (req, res) => {
     // req.user contains decoded JWT payload
     // req.tokenPayload contains full token data
     res.json({ message: 'Secure endpoint', user: req.user });
   });

2. Hybrid Authentication (JWT with Legacy Fallback):
   app.get('/api/hybrid', authenticateBearerHybrid, (req, res) => {
     // Works with both JWT tokens and legacy static tokens
     // req.authMethod indicates which method was used: 'JWT' or 'LEGACY'
     res.json({ message: 'Hybrid endpoint', method: req.authMethod });
   });

3. Token Rotation for Static Tokens:
   app.get('/api/rotation', authenticateBearerWithRotation, (req, res) => {
     // Supports static token rotation with expiration
     // req.tokenAge indicates token age in milliseconds
     res.json({ message: 'Token rotation endpoint', age: req.tokenAge });
   });

4. Manual Token Rotation:
   // Generate a new rotated token
   const newToken = tokenRotationManager.generateRotatedToken();
   
   // Add old token to rotation cache before updating
   tokenRotationManager.addToRotationCache(process.env.BEARER_TOKEN);
   
   // Update environment variable (in production, update your deployment config)
   process.env.BEARER_TOKEN = newToken;

JWT Token Structure:
{
  "email": "user@example.com",
  "userId": "12345",
  "role": "admin",
  "iat": 1625097600,
  "exp": 1625184000
}

Environment Variables Required:
- JWT_SECRET: Secret key for JWT signing/verification
- JWT_EXPIRES_IN: JWT expiration time (e.g., '1h', '24h', '7d')
- BEARER_TOKEN: Legacy static token (for backward compatibility)
*/

module.exports = {
  authenticateJWT,
  requirePermissions,
  requireRoles,
  authenticate,
  requireOwnership,
  optionalAuth,
  authenticateBearer, // Legacy compatibility
  auditLogger,
  extractBearerToken,
  authenticateBearerHybrid,
  authenticateBearerWithRotation,
  tokenRotationManager
};
