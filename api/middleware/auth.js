const { verifyToken, extractBearerToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/helpers');

const authenticateBearer = async (req, res, next) => {
  try {
    console.log('🔐 [AUTH] Starting Bearer Token authentication...');
    
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      console.log('❌ [AUTH] Bearer token missing');
      return res.status(401).json(
        errorResponse('Bearer token required', 401, {
          error: 'MISSING_BEARER_TOKEN',
          expectedFormat: 'Authorization: Bearer <token>'
        })
      );
    }

    try {
      const { authService } = require('../services/authService');
      const decoded = await authService.verifyAccessToken(token);
      req.user = decoded;
      req.tokenPayload = decoded;
      req.authMethod = 'JWT';
      
      console.log('✅ [AUTH] JWT authentication successful:', decoded.email || decoded.userId || 'unknown');
      return next();
      
    } catch (jwtError) {
      console.log('🔄 [AUTH] JWT failed, trying direct bearer token...', jwtError.message);
      
      const expectedToken = process.env.BEARER_TOKEN;
      
      if (expectedToken && token === expectedToken) {
        req.authMethod = 'BEARER';
        req.user = { type: 'api_access' };
        console.log('✅ [AUTH] Direct bearer token authentication successful');
        return next();
      }
      
      console.log('❌ [AUTH] Both JWT and bearer token authentication failed');
      
      let errorCode = 'INVALID_BEARER_TOKEN';
      let errorMessage = 'Invalid Bearer token';
      
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
    console.log('💥 [AUTH] Authentication error:', error);
    return res.status(401).json(
      errorResponse('Authentication error', 401, {
        error: 'AUTHENTICATION_ERROR'
      })
    );
  }
};

/**
 * Middleware JWT semplificato (deprecato - usa authenticateBearer)
 */
const authenticateJWT = (req, res, next) => {
  console.log('⚠️ [AUTH] authenticateJWT is deprecated, use authenticateBearer instead');
  return authenticateBearer(req, res, next);
};

module.exports = {
  authenticateBearer,
  authenticateJWT
};
