const request = require('supertest');
const express = require('express');
const authRoutesV2 = require('../api/routes/authRoutesV2');

// Mock services and middleware
jest.mock('../api/services/authService');
jest.mock('../api/middleware/authMiddleware');
jest.mock('../api/controllers/authControllerV2');

const { authService } = require('../api/services/authService');
const authMiddleware = require('../api/middleware/authMiddleware');
const authController = require('../api/controllers/authControllerV2');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutesV2);
  
  // Error handling
  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  });
  
  return app;
};

describe('Auth Routes V2', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();

    // Mock middleware to pass through by default
    authMiddleware.authenticateToken.mockImplementation((req, res, next) => {
      req.user = {
        id: 'user-uuid',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read']
      };
      next();
    });

    authMiddleware.requireRole.mockImplementation(() => (req, res, next) => next());
    authMiddleware.requirePermission.mockImplementation(() => (req, res, next) => next());
    authMiddleware.requireOwnership.mockImplementation(() => (req, res, next) => next());

    // Mock controllers to return success responses
    authController.register.mockImplementation((req, res) => {
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user: { id: 1, email: req.body.email } }
      });
    });

    authController.login.mockImplementation((req, res) => {
      res.json({
        success: true,
        message: 'Login successful',
        data: { accessToken: 'token', user: { email: req.body.email } }
      });
    });

    authController.refreshToken.mockImplementation((req, res) => {
      res.json({
        success: true,
        message: 'Token refreshed',
        data: { accessToken: 'new-token' }
      });
    });

    authController.logout.mockImplementation((req, res) => {
      res.json({
        success: true,
        message: 'Logout successful'
      });
    });

    authController.me.mockImplementation((req, res) => {
      res.json({
        success: true,
        data: { user: req.user }
      });
    });

    authController.changePassword.mockImplementation((req, res) => {
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    });

    authController.listUsers.mockImplementation((req, res) => {
      res.json({
        success: true,
        data: { users: [], total: 0 }
      });
    });

    authController.assignRole.mockImplementation((req, res) => {
      res.json({
        success: true,
        message: 'Role assigned successfully'
      });
    });

    authController.listRoles.mockImplementation((req, res) => {
      res.json({
        success: true,
        data: { roles: [] }
      });
    });

    authController.getAuthInfo.mockImplementation((req, res) => {
      res.json({
        success: true,
        data: { name: 'Auth API', version: '2.0.0' }
      });
    });
  });

  describe('Public Routes', () => {
    test('POST /api/auth/register should call register controller', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(authController.register).toHaveBeenCalled();
    });

    test('POST /api/auth/login should call login controller', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authController.login).toHaveBeenCalled();
    });

    test('POST /api/auth/refresh should call refresh controller', async () => {
      const refreshData = {
        refreshToken: 'refresh-token-123'
      };

      const response = await request(app)
        .post('/api/auth/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authController.refreshToken).toHaveBeenCalled();
    });

    test('GET /api/auth/info should call getAuthInfo controller', async () => {
      const response = await request(app)
        .get('/api/auth/info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authController.getAuthInfo).toHaveBeenCalled();
    });
  });

  describe('Protected Routes', () => {
    test('POST /api/auth/logout should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ sessionId: 'session-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authMiddleware.authenticateToken).toHaveBeenCalled();
      expect(authController.logout).toHaveBeenCalled();
    });

    test('GET /api/auth/me should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authMiddleware.authenticateToken).toHaveBeenCalled();
      expect(authController.me).toHaveBeenCalled();
    });

    test('POST /api/auth/change-password should require authentication', async () => {
      const passwordData = {
        currentPassword: 'oldPassword',
        newPassword: 'NewStrongP@ssw0rd123'
      };

      const response = await request(app)
        .post('/api/auth/change-password')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authMiddleware.authenticateToken).toHaveBeenCalled();
      expect(authController.changePassword).toHaveBeenCalled();
    });
  });

  describe('Admin Routes', () => {
    test('GET /api/auth/users should require admin role', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authMiddleware.authenticateToken).toHaveBeenCalled();
      expect(authMiddleware.requireRole).toHaveBeenCalledWith(['admin', 'super_admin']);
      expect(authController.listUsers).toHaveBeenCalled();
    });

    test('POST /api/auth/assign-role should require admin role', async () => {
      const roleData = {
        userId: 1,
        roleName: 'editor'
      };

      const response = await request(app)
        .post('/api/auth/assign-role')
        .send(roleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authMiddleware.authenticateToken).toHaveBeenCalled();
      expect(authMiddleware.requireRole).toHaveBeenCalledWith(['admin', 'super_admin']);
      expect(authController.assignRole).toHaveBeenCalled();
    });

    test('GET /api/auth/roles should require admin role', async () => {
      const response = await request(app)
        .get('/api/auth/roles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authMiddleware.authenticateToken).toHaveBeenCalled();
      expect(authMiddleware.requireRole).toHaveBeenCalledWith(['admin', 'super_admin']);
      expect(authController.listRoles).toHaveBeenCalled();
    });
  });

  describe('Route Parameters and Query Strings', () => {
    test('GET /api/auth/users should handle query parameters', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .query({
          page: 2,
          limit: 5,
          search: 'john',
          role: 'admin'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authController.listUsers).toHaveBeenCalled();
    });

    test('GET /api/auth/me should work without parameters', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authController.me).toHaveBeenCalled();
    });
  });

  describe('Authentication Middleware Integration', () => {
    test('should reject unauthenticated requests to protected routes', async () => {
      // Mock authentication failure
      authMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          data: { error: 'NO_TOKEN' }
        });
      });

      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('NO_TOKEN');
      expect(authController.me).not.toHaveBeenCalled();
    });

    test('should reject insufficient role for admin routes', async () => {
      // Mock role requirement failure
      authMiddleware.requireRole.mockImplementation(() => (req, res, next) => {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          data: { error: 'INSUFFICIENT_ROLE' }
        });
      });

      const response = await request(app)
        .get('/api/auth/users')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('INSUFFICIENT_ROLE');
      expect(authController.listUsers).not.toHaveBeenCalled();
    });
  });

  describe('HTTP Methods', () => {
    test('should only accept POST for registration', async () => {
      await request(app)
        .get('/api/auth/register')
        .expect(404); // Not found because GET is not defined

      await request(app)
        .put('/api/auth/register')
        .expect(404);

      await request(app)
        .delete('/api/auth/register')
        .expect(404);
    });

    test('should only accept GET for user info', async () => {
      await request(app)
        .post('/api/auth/me')
        .expect(404);

      await request(app)
        .put('/api/auth/me')
        .expect(404);

      await request(app)
        .delete('/api/auth/me')
        .expect(404);
    });

    test('should accept both GET and POST for appropriate routes', async () => {
      // GET routes
      await request(app)
        .get('/api/auth/me')
        .expect(200);

      await request(app)
        .get('/api/auth/users')
        .expect(200);

      await request(app)
        .get('/api/auth/roles')
        .expect(200);

      // POST routes
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(201);

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        })
        .expect(200);
    });
  });

  describe('Content Type Handling', () => {
    test('should handle JSON content type', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should handle missing content type gracefully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle controller errors', async () => {
      // Mock controller to throw an error
      authController.register.mockImplementation((req, res, next) => {
        const error = new Error('Controller error');
        next(error);
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Controller error');
    });

    test('should handle middleware errors', async () => {
      // Mock middleware to throw an error
      authMiddleware.authenticateToken.mockImplementation((req, res, next) => {
        const error = new Error('Middleware error');
        next(error);
      });

      const response = await request(app)
        .get('/api/auth/me')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Middleware error');
    });
  });

  describe('Security Headers', () => {
    test('should handle requests with various headers', async () => {
      const response = await request(app)
        .get('/api/auth/info')
        .set('X-Forwarded-For', '192.168.1.1')
        .set('User-Agent', 'TestAgent/1.0')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle missing authorization header for public routes', async () => {
      const response = await request(app)
        .get('/api/auth/info')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting Integration', () => {
    test('should pass through rate limiting middleware if present', async () => {
      // This test assumes rate limiting middleware would be applied
      // In a real scenario, you'd mock the rate limiting middleware
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Validation Integration', () => {
    test('should work with validation middleware if present', async () => {
      // This test assumes validation middleware would be applied
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongP@ssw0rd123',
          firstName: 'John',
          lastName: 'Doe'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Route Ordering', () => {
    test('should match specific routes before generic ones', async () => {
      // Test that /api/auth/info is matched before any potential wildcard routes
      const response = await request(app)
        .get('/api/auth/info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authController.getAuthInfo).toHaveBeenCalled();
    });

    test('should handle 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/auth/nonexistent')
        .expect(404);

      // Should not call any controller
      expect(authController.register).not.toHaveBeenCalled();
      expect(authController.login).not.toHaveBeenCalled();
    });
  });

  describe('Async Route Handling', () => {
    test('should handle async controller functions', async () => {
      // Mock async controller
      authController.login.mockImplementation(async (req, res) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        res.json({
          success: true,
          message: 'Async login successful',
          data: { accessToken: 'async-token' }
        });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Async login successful');
    });

    test('should handle async middleware functions', async () => {
      // Mock async middleware
      authMiddleware.authenticateToken.mockImplementation(async (req, res, next) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        req.user = { id: 'async-user' };
        next();
      });

      const response = await request(app)
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
