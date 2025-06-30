const { authService, AuthError } = require('../services/authService');
const { errorResponse } = require('../utils/helpers');

/**
 * Middleware di autenticazione avanzato per l'API
 */

/**
 * Estrae il token Bearer dall'header Authorization
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} Token estratto o null
 */
function extractBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

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
 * Middleware legacy per compatibilità con il sistema esistente
 * Mantiene la compatibilità con il Bearer Token esistente
 */
const authenticateBearer = (req, res, next) => {
  try {
    console.log('🔐 [AUTH LEGACY] Bearer token authentication...');
    
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

    const expectedToken = process.env.BEARER_TOKEN;
    
    if (token !== expectedToken) {
      return res.status(401).json(
        errorResponse('Invalid Bearer token', 401, {
          error: 'INVALID_BEARER_TOKEN'
        })
      );
    }

    console.log('✅ [AUTH LEGACY] Bearer token valid');
    next();
    
  } catch (error) {
    console.error('❌ [AUTH LEGACY] Bearer authentication failed:', error.message);
    return res.status(401).json(
      errorResponse('Bearer authentication error', 401, {
        error: 'BEARER_AUTH_ERROR'
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

module.exports = {
  authenticateJWT,
  requirePermissions,
  requireRoles,
  authenticate,
  requireOwnership,
  optionalAuth,
  authenticateBearer, // Legacy compatibility
  auditLogger,
  extractBearerToken
};
