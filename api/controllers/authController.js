const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Controller per autenticazione ottimizzato
 * Supporta solo JWT moderno e bearer token diretto
 */
const authenticate = async (req, res) => {
  console.log('🔐 [AUTH CONTROLLER] Authentication request');
  
  try {
    return res.json(
      successResponse(
        {
          authenticated: true,
          method: req.authMethod || 'unknown',
          user: req.user || null,
          timestamp: new Date().toISOString()
        },
        'Authentication successful'
      )
    );
  } catch (error) {
    console.error('❌ [AUTH CONTROLLER] Authentication failed:', error.message);
    return res.status(401).json(
      errorResponse('Authentication failed', 401, {
        error: 'AUTHENTICATION_FAILED'
      })
    );
  }
};

/**
 * Verifica lo stato del token Bearer
 */
const verifyAuth = async (req, res) => {
  console.log('🔍 [AUTH CONTROLLER] Token verification');
  
  return res.json(
    successResponse(
      {
        valid: true,
        method: req.authMethod || 'unknown',
        user: req.user || null,
        timestamp: new Date().toISOString()
      },
      'Token is valid'
    )
  );
};

/**
 * Informazioni sull'API di autenticazione
 */
const getApiInfo = async (req, res) => {
  console.log('ℹ️ [AUTH CONTROLLER] API info request');
  
  const apiInfo = {
    name: 'VicSam Auth API',
    version: '2.0.0',
    description: 'Modern authentication system with JWT and Bearer token support',
    supportedMethods: [
      'JWT (recommended)',
      'Direct Bearer Token'
    ],
    endpoints: {
      auth: {
        'POST /api/auth/login': 'Login with credentials (JWT system)',
        'GET /api/auth/verify': 'Verify Bearer token',
        'GET /api/auth/info': 'API information'
      },
      download: {
        'GET /get': 'Download ZIP file',
        'GET /app': 'Download EXE file'
      }
    },
    authentication: 'Bearer Token (JWT or direct)',
    documentation: {
      jwt: 'Use JWT tokens from /api/auth/login endpoint',
      bearer: 'Use direct bearer token from environment configuration'
    }
  };
  
  res.json(
    successResponse(apiInfo, 'API Information')
  );
};

module.exports = {
  authenticate,
  verifyAuth,
  getApiInfo
};
