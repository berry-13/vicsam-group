const { authService, AuthError } = require('../services/authService');
const { errorResponse } = require('../utils/helpers');
const { verifyToken, extractBearerToken } = require('../utils/jwt');
const { createClient } = require('redis');

/**
 * Middleware di autenticazione avanzato per l'API
 */

/**
 * Whitelist of legitimate resource patterns for wildcard permissions
 * This prevents malicious wildcard permission exploitation
 */
const VALID_RESOURCE_PATTERNS = [
  'data',        // data.read, data.write, data.delete
  'user',        // user.create, user.update, user.delete
  'admin',       // admin.users, admin.system, admin.config
  'system',      // system.maintenance, system.logs, system.backup
  'report',      // report.generate, report.view, report.export
  'file',        // file.upload, file.download, file.delete
  'auth',        // auth.manage, auth.sessions, auth.tokens
  'api',         // api.access, api.manage, api.configure
  'download',    // download.get, download.app, download.custom
  'audit',       // audit.view, audit.export, audit.manage
  'role',        // role.assign, role.remove, role.manage
  'session',     // session.create, session.revoke, session.manage
  'permission'   // permission.grant, permission.revoke, permission.manage
];

/**
 * Validates that a resource pattern is legitimate and authorized
 * @param {string} resource - The resource part before '.*' in wildcard permissions
 * @returns {boolean} True if the resource pattern is valid
 */
const isValidResourcePattern = (resource) => {
  if (!resource || typeof resource !== 'string') {
    return false;
  }
  
  // Normalize resource name (trim, lowercase)
  const normalizedResource = resource.trim().toLowerCase();
  
  // Check against whitelist
  if (VALID_RESOURCE_PATTERNS.includes(normalizedResource)) {
    return true;
  }
  
  // Additional security checks
  // Prevent injection patterns and malicious inputs
  const maliciousPatterns = [
    /[<>\"\'`]/,        // HTML/JS injection characters
    /\$\{/,             // Template literal injection
    /\.\./,             // Path traversal
    /[;|&]/,            // Command injection
    /javascript:/i,     // Protocol injection
    /data:/i,           // Data URL injection
    /\x00/,             // Null byte injection
-   /[\u0000-\u001f]/   // Control characters
+   /[\x00-\x1f]/       // Control characters (properly escaped)
  ];
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(resource)) {
      // Log security events but avoid exposing sensitive details in production
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🚨 [SECURITY] Malicious pattern detected in resource: ${resource}`);
      } else {
        console.warn('🚨 [SECURITY] Malicious resource pattern detected');
      }
      return false;
    }
  }
  
  // Check resource length (prevent extremely long inputs)
  if (normalizedResource.length > 50) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 [SECURITY] Resource name too long: ${normalizedResource.length} characters`);
    } else {
      console.warn('🚨 [SECURITY] Resource name length exceeded');
    }
    return false;
  }
  
  // Check for valid format (alphanumeric with optional hyphens/underscores)
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(normalizedResource)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 [SECURITY] Invalid resource format: ${normalizedResource}`);
    } else {
      console.warn('🚨 [SECURITY] Invalid resource format detected');
    }
    return false;
  }
  
  // Resource not in whitelist - log appropriately based on environment
  if (process.env.NODE_ENV === 'development') {
    console.warn(`🔒 [AUTH] Resource pattern not in whitelist: ${normalizedResource}`);
  } else {
    console.warn('🔒 [AUTH] Unauthorized resource pattern blocked');
  }
  return false;
};

/**
 * Middleware per autenticazione JWT con verifica di sessione
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Only log in development environment to prevent information leakage
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 [AUTH] Starting JWT authentication...');
    }
    
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (!token) {
      // Minimal logging in production
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ [AUTH] No JWT token provided');
      }
      return res.status(401).json(
        errorResponse('Authentication required', 401, {
          error: 'MISSING_TOKEN'
        })
      );
    }

    // Verifica il token JWT
    const decoded = await authService.verifyAccessToken(token);
    
    // Carica i dati completi dell'utente
    const userResult = await authService.findUserByEmail(decoded.email);
    if (!userResult) {
      // Log security event but avoid exposing user details in production
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ [AUTH] User not found for token');
      }
      return res.status(401).json(
        errorResponse('Authentication failed', 401, {
          error: 'AUTHENTICATION_FAILED'
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

    // Detailed logging only in development to prevent sensitive data exposure
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [AUTH] JWT authentication successful:', {
        user: decoded.email,
        roles: decoded.roles,
        permissions: decoded.permissions.length
      });
    }

    next();
    
  } catch (error) {
    // Log error details only in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ [AUTH] JWT authentication failed:', error.message);
    } else {
      // In production, log minimal information for security monitoring
      console.error('❌ [AUTH] Authentication attempt failed');
    }
    
    let errorCode = 'AUTHENTICATION_FAILED';
    let message = 'Authentication failed';
    
    // Only provide specific error details in development
    if (error instanceof AuthError && process.env.NODE_ENV === 'development') {
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
      // Only log detailed permission checks in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 [AUTH] Checking permissions:', requiredPermissions);
      }
      
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
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [AUTH] Admin permissions granted');
        }
        return next();
      }
      
      // Verifica permessi specifici
      const hasAllPermissions = permissions.every(permission => {
        // Supporta wildcard per risorsa (es. "data.*")
        if (permission.endsWith('.*')) {
          const resource = permission.slice(0, -2);
          
          // Validate resource pattern against whitelist of legitimate resources
          if (!isValidResourcePattern(resource)) {
            // Avoid logging sensitive resource details in production
            if (process.env.NODE_ENV === 'development') {
              console.log('❌ [AUTH] Invalid wildcard resource pattern blocked:', resource);
            }
            return false;
          }
          
          return userPermissions.some(userPerm => userPerm.startsWith(resource + '.'));
        }
        return userPermissions.includes(permission);
      });
      
      if (!hasAllPermissions) {
        // Log permission failures with sensitive data only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ [AUTH] Insufficient permissions:', {
            required: permissions,
            userHas: userPermissions
          });
        } else {
          console.log('❌ [AUTH] Access denied - insufficient permissions');
        }
        
        return res.status(403).json(
          errorResponse('Insufficient permissions', 403, {
            error: 'INSUFFICIENT_PERMISSIONS',
            // Only include detailed information in development
            ...(process.env.NODE_ENV === 'development' && {
              required: permissions,
              message: 'You do not have the required permissions to access this resource'
            })
          })
        );
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [AUTH] Permission check passed');
      }
      next();
      
    } catch (error) {
      // Log error details only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [AUTH] Permission check failed:', error.message);
      } else {
        console.error('❌ [AUTH] Permission check error occurred');
      }
      return res.status(500).json(
        errorResponse('Internal server error', 500, {
          error: 'PERMISSION_CHECK_ERROR',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

  // Prima prova con JWT usando authService
  try {
    const authService = require('../services/authService');
    const decoded = await authService.verifyAccessToken(token);
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
const authenticateBearerWithRotation = async (req, res, next) => {
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

    // Valida il token usando il sistema di rotazione (async con Redis)
    const validation = await tokenRotationManager.validateRotatedToken(token);
    
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
 * Utility per la gestione del token rotation per token statici con Redis
 */
const tokenRotationManager = {
  // Redis client per la persistenza dei token
  redisClient: null,
  
  /**
   * Inizializza la connessione Redis
   */
  async init() {
    if (!this.redisClient) {
      try {
        this.redisClient = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          socket: {
            reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
          }
        });
        
        this.redisClient.on('error', (err) => {
          console.error('Redis Client Error:', err);
        });
        
        this.redisClient.on('connect', () => {
          console.log('🔗 Redis connected for token rotation');
        });
        
        await this.redisClient.connect();
      } catch (error) {
        console.error('Failed to initialize Redis for token rotation:', error);
        // Fallback to in-memory storage if Redis is not available
        this.tokenCache = new Map();
      }
    }
  },
  
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
  async validateRotatedToken(token, maxAge = 24 * 60 * 60 * 1000) {
    // Controlla il token corrente dal env
    const currentToken = process.env.BEARER_TOKEN;
    if (token === currentToken) {
      return { valid: true, method: 'current' };
    }
    
    // Controlla token ruotati recenti in Redis o fallback cache
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        const tokenData = await this.redisClient.get(`token:${token}`);
        if (tokenData) {
          const tokenInfo = JSON.parse(tokenData);
          const age = Date.now() - tokenInfo.timestamp;
          if (age <= maxAge) {
            return { valid: true, method: 'rotated', age };
          } else {
            // Token scaduto, rimuovi da Redis
            await this.redisClient.del(`token:${token}`);
            return { valid: false, reason: 'expired', age };
          }
        }
      } else if (this.tokenCache) {
        // Fallback alla cache in memoria
        const tokenInfo = this.tokenCache.get(token);
        if (tokenInfo) {
          const age = Date.now() - tokenInfo.timestamp;
          if (age <= maxAge) {
            return { valid: true, method: 'rotated', age };
          } else {
            this.tokenCache.delete(token);
            return { valid: false, reason: 'expired', age };
          }
        }
      }
    } catch (error) {
      console.error('Error validating token from Redis:', error);
      // Fallback to current token validation only
    }
    
    return { valid: false, reason: 'unknown' };
  },
  
  /**
   * Aggiungi un token alla cache di rotazione Redis
   * @param {string} token - Token da aggiungere
   */
  async addToRotationCache(token) {
    const tokenInfo = {
      timestamp: Date.now(),
      used: false
    };
    
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        // Salva in Redis con TTL di 25 ore (1 ora più del maxAge)
        await this.redisClient.setEx(`token:${token}`, 25 * 60 * 60, JSON.stringify(tokenInfo));
        
        // Mantieni solo gli ultimi 10 token (cleanup automatico)
        await this._cleanupOldTokens();
      } else if (this.tokenCache) {
        // Fallback alla cache in memoria
        this.tokenCache.set(token, tokenInfo);
        
        if (this.tokenCache.size > 10) {
          const tokens = Array.from(this.tokenCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
          
          tokens.slice(0, tokens.length - 10).forEach(([token]) => {
            this.tokenCache.delete(token);
          });
        }
      }
    } catch (error) {
      console.error('Error adding token to rotation cache:', error);
    }
  },
  
  /**
   * Pulisce i token più vecchi mantenendo solo gli ultimi 10
   */
  async _cleanupOldTokens() {
    try {
      if (!this.redisClient || !this.redisClient.isOpen) return;
      
      // Ottieni tutti i token keys
      const tokenKeys = await this.redisClient.keys('token:*');
      
      if (tokenKeys.length <= 10) return;
      
      // Ottieni i timestamp di tutti i token
      const tokenData = [];
      for (const key of tokenKeys) {
        const data = await this.redisClient.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          tokenData.push({ key, timestamp: parsed.timestamp });
        }
      }
      
      // Ordina per timestamp e rimuovi i più vecchi
      tokenData.sort((a, b) => a.timestamp - b.timestamp);
      const tokensToRemove = tokenData.slice(0, tokenData.length - 10);
      
      if (tokensToRemove.length > 0) {
        await this.redisClient.del(tokensToRemove.map(t => t.key));
      }
    } catch (error) {
      console.error('Error cleaning up old tokens:', error);
    }
  },
  
  /**
   * Pulisci i token scaduti dalla cache Redis
   * @param {number} maxAge - Età massima in millisecondi
   */
  async cleanupExpiredTokens(maxAge = 24 * 60 * 60 * 1000) {
    try {
      if (this.redisClient && this.redisClient.isOpen) {
        const tokenKeys = await this.redisClient.keys('token:*');
        const now = Date.now();
        
        for (const key of tokenKeys) {
          const data = await this.redisClient.get(key);
          if (data) {
            const tokenInfo = JSON.parse(data);
            if (now - tokenInfo.timestamp > maxAge) {
              await this.redisClient.del(key);
            }
          }
        }
      } else if (this.tokenCache) {
        // Fallback cleanup per cache in memoria
        const now = Date.now();
        for (const [token, info] of this.tokenCache.entries()) {
          if (now - info.timestamp > maxAge) {
            this.tokenCache.delete(token);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
    }
  }
};

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
   
   // Add old token to rotation cache before updating (async with Redis)
   await tokenRotationManager.addToRotationCache(process.env.BEARER_TOKEN);
   
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
