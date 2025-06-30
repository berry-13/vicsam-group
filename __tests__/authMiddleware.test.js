const {
  authenticateJWT: authenticateToken,
  requireRoles: requireRole,
  requirePermissions: requirePermission,
  requireOwnership,
  optionalAuth
} = require('../api/middleware/authMiddleware');

// Mock services
jest.mock('../api/services/authService');
const { authService, AuthError } = require('../api/services/authService');

describe('AuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('TestAgent/1.0'),
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    test('should authenticate valid Bearer token', async () => {
      const token = 'valid-jwt-token';
      const decodedUser = {
        sub: 'user-uuid',
        email: 'test@example.com',
        name: 'John Doe',
        roles: ['user'],
        permissions: ['read'],
        jti: 'jwt-id'
      };

      req.headers.authorization = `Bearer ${token}`;
      authService.verifyAccessToken.mockResolvedValue(decodedUser);

      await authenticateToken(req, res, next);

      expect(req.user).toEqual({
        id: decodedUser.sub,
        email: decodedUser.email,
        name: decodedUser.name,
        roles: decodedUser.roles,
        permissions: decodedUser.permissions,
        jti: decodedUser.jti
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without Authorization header', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication required',
          data: expect.objectContaining({
            error: 'NO_TOKEN'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject malformed Authorization header', async () => {
      req.headers.authorization = 'Invalid token-format';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'INVALID_TOKEN_FORMAT'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid JWT token', async () => {
      const token = 'invalid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;
      
      authService.verifyAccessToken.mockRejectedValue(
        new AuthError('Invalid token', 'INVALID_TOKEN')
      );

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'INVALID_TOKEN'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle expired token', async () => {
      const token = 'expired-jwt-token';
      req.headers.authorization = `Bearer ${token}`;
      
      authService.verifyAccessToken.mockRejectedValue(
        new AuthError('Token expired', 'TOKEN_EXPIRED')
      );

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'TOKEN_EXPIRED'
          })
        })
      );
    });

    test('should handle service errors', async () => {
      const token = 'valid-token';
      req.headers.authorization = `Bearer ${token}`;
      
      authService.verifyAccessToken.mockRejectedValue(new Error('Service unavailable'));

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'AUTHENTICATION_ERROR'
          })
        })
      );
    });

    test('should extract token from different header formats', async () => {
      const testCases = [
        'Bearer valid-token',
        'bearer valid-token',
        'BEARER valid-token'
      ];

      const decodedUser = {
        sub: 'user-uuid',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read'],
        jti: 'jwt-id'
      };

      for (const authHeader of testCases) {
        req.headers.authorization = authHeader;
        authService.verifyAccessToken.mockResolvedValue(decodedUser);
        
        await authenticateToken(req, res, next);
        
        expect(authService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
        
        // Reset mocks for next iteration
        jest.clearAllMocks();
      }
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-id',
        email: 'test@example.com',
        roles: ['user', 'editor'],
        permissions: ['read', 'write']
      };
    });

    test('should allow access with required role', async () => {
      const middleware = requireRole('user');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access with any of multiple required roles', async () => {
      const middleware = requireRole(['admin', 'editor']);
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should deny access without required role', async () => {
      const middleware = requireRole('admin');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'INSUFFICIENT_ROLE'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access for unauthenticated user', async () => {
      req.user = undefined;
      const middleware = requireRole('user');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'AUTHENTICATION_REQUIRED'
          })
        })
      );
    });

    test('should handle role check errors', async () => {
      req.user = null; // Simulate edge case
      const middleware = requireRole('user');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requirePermission', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-id',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read', 'write', 'delete:own']
      };
    });

    test('should allow access with required permission', async () => {
      const middleware = requirePermission('read');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access with any of multiple required permissions', async () => {
      const middleware = requirePermission(['admin', 'write']);
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny access without required permission', async () => {
      const middleware = requirePermission('admin');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'INSUFFICIENT_PERMISSION'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access for unauthenticated user', async () => {
      req.user = undefined;
      const middleware = requirePermission('read');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should handle permission check with resource-specific permissions', async () => {
      const middleware = requirePermission('delete:own');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireOwnership', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-123',
        email: 'test@example.com',
        roles: ['user']
      };
    });

    test('should allow access to own resource via params', async () => {
      req.params.userId = 'user-123';
      const middleware = requireOwnership('userId');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow access to own resource via body', async () => {
      req.body.userId = 'user-123';
      const middleware = requireOwnership('userId', 'body');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should allow access to own resource via query', async () => {
      req.query.userId = 'user-123';
      const middleware = requireOwnership('userId', 'query');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should deny access to other users resource', async () => {
      req.params.userId = 'other-user-456';
      const middleware = requireOwnership('userId');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'NOT_RESOURCE_OWNER'
          })
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access for unauthenticated user', async () => {
      req.user = undefined;
      req.params.userId = 'user-123';
      const middleware = requireOwnership('userId');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should handle missing resource ID', async () => {
      req.params = {}; // No userId in params
      const middleware = requireOwnership('userId');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'MISSING_RESOURCE_ID'
          })
        })
      );
    });

    test('should handle ownership check errors', async () => {
      req.user = { id: null }; // Edge case
      req.params.userId = 'user-123';
      const middleware = requireOwnership('userId');
      
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    test('should allow admin override', async () => {
      req.user = {
        id: 'admin-user',
        email: 'admin@example.com',
        roles: ['admin']
      };
      req.params.userId = 'other-user-123';
      
      const middleware = requireOwnership('userId', 'params', ['admin']);
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    test('should set user info if valid token provided', async () => {
      const token = 'valid-jwt-token';
      const decodedUser = {
        sub: 'user-uuid',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read'],
        jti: 'jwt-id'
      };

      req.headers.authorization = `Bearer ${token}`;
      authService.verifyAccessToken.mockResolvedValue(decodedUser);

      await optionalAuth(req, res, next);

      expect(req.user).toEqual({
        id: decodedUser.sub,
        email: decodedUser.email,
        roles: decodedUser.roles,
        permissions: decodedUser.permissions,
        jti: decodedUser.jti
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should continue without user info if no token provided', async () => {
      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should continue without user info if token is invalid', async () => {
      const token = 'invalid-jwt-token';
      req.headers.authorization = `Bearer ${token}`;
      
      authService.verifyAccessToken.mockRejectedValue(
        new AuthError('Invalid token', 'INVALID_TOKEN')
      );

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should handle malformed authorization header gracefully', async () => {
      req.headers.authorization = 'Malformed header';

      await optionalAuth(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle null authorization header', async () => {
      req.headers.authorization = null;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'NO_TOKEN'
          })
        })
      );
    });

    test('should handle empty Bearer token', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            error: 'INVALID_TOKEN_FORMAT'
          })
        })
      );
    });

    test('should handle extremely long tokens', async () => {
      const longToken = 'a'.repeat(10000);
      req.headers.authorization = `Bearer ${longToken}`;
      
      authService.verifyAccessToken.mockRejectedValue(
        new AuthError('Token too long', 'INVALID_TOKEN')
      );

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should handle special characters in roles', async () => {
      req.user = {
        id: 'user-id',
        roles: ['user-role', 'special@role', 'role:with:colons']
      };

      const middleware = requireRole('special@role');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should handle case sensitivity in roles', async () => {
      req.user = {
        id: 'user-id',
        roles: ['Admin', 'USER']
      };

      const middleware = requireRole('admin');
      
      await middleware(req, res, next);

      // Should be case sensitive and deny access
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should handle circular permission checks', async () => {
      req.user = {
        id: 'user-id',
        permissions: ['read', 'write', 'read'] // Duplicate permissions
      };

      const middleware = requirePermission('read');
      
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Integration with Multiple Middlewares', () => {
    test('should work with chained middleware', async () => {
      const token = 'valid-jwt-token';
      const decodedUser = {
        sub: 'user-uuid',
        email: 'test@example.com',
        roles: ['user', 'editor'],
        permissions: ['read', 'write'],
        jti: 'jwt-id'
      };

      req.headers.authorization = `Bearer ${token}`;
      authService.verifyAccessToken.mockResolvedValue(decodedUser);

      // Simulate middleware chain
      await authenticateToken(req, res, next);
      expect(next).toHaveBeenCalled();
      
      // Reset next mock
      next.mockClear();
      
      // Apply role middleware
      const roleMiddleware = requireRole('user');
      await roleMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      
      // Reset next mock
      next.mockClear();
      
      // Apply permission middleware
      const permissionMiddleware = requirePermission('write');
      await permissionMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('should fail chain on authentication failure', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      authService.verifyAccessToken.mockRejectedValue(
        new AuthError('Invalid token', 'INVALID_TOKEN')
      );

      await authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();

      // Subsequent middleware should not be called
      const roleMiddleware = requireRole('user');
      await roleMiddleware(req, res, next);
      
      // Should still be 401 from authentication failure
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
