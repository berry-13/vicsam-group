const request = require('supertest');
const express = require('express');
const {
  register,
  login,
  refreshToken,
  logout,
  me,
  changePassword,
  listUsers,
  assignRole,
  listRoles,
  getAuthInfo
} = require('../api/controllers/authControllerV2');

// Mock services
jest.mock('../api/services/authService');
const { authService, AuthError } = require('../api/services/authService');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Set up routes
  app.post('/register', register);
  app.post('/login', login);
  app.post('/refresh', refreshToken);
  app.post('/logout', logout);
  app.get('/me', me);
  app.post('/change-password', changePassword);
  app.get('/users', listUsers);
  app.post('/assign-role', assignRole);
  app.get('/roles', listRoles);
  app.get('/auth-info', getAuthInfo);
  
  return app;
};

describe('AuthControllerV2', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    test('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      };

      const mockUser = {
        id: 1,
        uuid: 'test-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.registerUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
      expect(authService.registerUser).toHaveBeenCalledWith(userData);
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/register')
        .send({
          email: 'test@example.com'
          // Missing password, firstName, lastName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('MISSING_FIELDS');
      expect(response.body.data.required).toContain('password');
    });

    test('should handle registration errors', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.registerUser.mockRejectedValue(
        new AuthError('Email already registered', 'EMAIL_EXISTS')
      );

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('EMAIL_EXISTS');
    });

    test('should handle validation errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Weak password
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.registerUser.mockRejectedValue(
        new AuthError('Weak password: Password must be at least 8 characters long', 'WEAK_PASSWORD')
      );

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('WEAK_PASSWORD');
    });

    test('should handle unexpected errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.registerUser.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('REGISTRATION_ERROR');
    });
  });

  describe('POST /login', () => {
    test('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123'
      };

      const mockAuthData = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        sessionId: 'session-id',
        expiresIn: 900,
        user: {
          id: 'user-uuid',
          email: 'test@example.com',
          name: 'John Doe'
        }
      };

      authService.loginUser.mockResolvedValue(mockAuthData);

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAuthData);
      expect(authService.loginUser).toHaveBeenCalledWith(
        credentials.email,
        credentials.password,
        expect.objectContaining({
          ip: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });

    test('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('MISSING_CREDENTIALS');
    });

    test('should handle invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      authService.loginUser.mockRejectedValue(
        new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')
      );

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('INVALID_CREDENTIALS');
    });

    test('should handle account locked error', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password'
      };

      authService.loginUser.mockRejectedValue(
        new AuthError('Account temporarily locked', 'ACCOUNT_LOCKED')
      );

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('POST /refresh', () => {
    test('should refresh token successfully', async () => {
      const refreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const mockNewToken = {
        accessToken: 'new-access-token',
        expiresIn: 900
      };

      authService.refreshAccessToken.mockResolvedValue(mockNewToken);

      const response = await request(app)
        .post('/refresh')
        .send(refreshData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockNewToken);
      expect(authService.refreshAccessToken).toHaveBeenCalledWith(
        refreshData.refreshToken,
        expect.any(Object)
      );
    });

    test('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('MISSING_REFRESH_TOKEN');
    });

    test('should handle invalid refresh token', async () => {
      const refreshData = {
        refreshToken: 'invalid-refresh-token'
      };

      authService.refreshAccessToken.mockRejectedValue(
        new AuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN')
      );

      const response = await request(app)
        .post('/refresh')
        .send(refreshData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('POST /logout', () => {
    test('should logout user successfully', async () => {
      const logoutData = {
        sessionId: 'session-id'
      };

      authService.logoutUser.mockResolvedValue();

      const response = await request(app)
        .post('/logout')
        .send(logoutData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authService.logoutUser).toHaveBeenCalledWith(logoutData.sessionId);
    });

    test('should return 400 for missing session ID', async () => {
      const response = await request(app)
        .post('/logout')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('MISSING_SESSION_ID');
    });

    test('should handle logout errors', async () => {
      const logoutData = {
        sessionId: 'invalid-session-id'
      };

      authService.logoutUser.mockRejectedValue(new Error('Session not found'));

      const response = await request(app)
        .post('/logout')
        .send(logoutData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('LOGOUT_ERROR');
    });
  });

  describe('GET /me', () => {
    test('should return user info successfully', async () => {
      const mockReq = {
        user: {
          email: 'test@example.com',
          jti: 'jwt-id',
          roles: ['user'],
          permissions: ['read']
        }
      };

      const mockUser = {
        id: 1,
        uuid: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.findUserByEmail.mockResolvedValue({ id: 1 });
      authService.getUserById.mockResolvedValue(mockUser);

      // Mock the middleware that sets req.user
      app.use('/me', (req, res, next) => {
        req.user = mockReq.user;
        next();
      });

      const response = await request(app)
        .get('/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockUser);
      expect(response.body.data.session.jti).toBe('jwt-id');
    });

    test('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('POST /change-password', () => {
    test('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword',
        newPassword: 'NewStr0ng!P@ssw0rd'
      };

      const mockReq = {
        user: { id: 1 }
      };

      authService.changeUserPassword.mockResolvedValue(true);

      // Mock authentication middleware
      app.use('/change-password', (req, res, next) => {
        req.user = mockReq.user;
        next();
      });

      const response = await request(app)
        .post('/change-password')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authService.changeUserPassword).toHaveBeenCalledWith(
        mockReq.user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );
    });

    test('should return 400 for missing passwords', async () => {
      app.use('/change-password', (req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const response = await request(app)
        .post('/change-password')
        .send({
          currentPassword: 'oldPassword'
          // Missing newPassword
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('MISSING_PASSWORDS');
    });

    test('should handle invalid current password', async () => {
      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'NewStr0ng!P@ssw0rd'
      };

      authService.changeUserPassword.mockRejectedValue(
        new AuthError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD')
      );

      app.use('/change-password', (req, res, next) => {
        req.user = { id: 1 };
        next();
      });

      const response = await request(app)
        .post('/change-password')
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('INVALID_CURRENT_PASSWORD');
    });
  });

  describe('GET /users', () => {
    test('should list users successfully', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          roles: ['user']
        },
        {
          id: 2,
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          roles: ['admin']
        }
      ];

      authService.listUsers.mockResolvedValue({
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 10
      });

      const response = await request(app)
        .get('/users')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toEqual(mockUsers);
      expect(response.body.data.total).toBe(2);
    });

    test('should handle list users with filters', async () => {
      const queryParams = {
        page: 2,
        limit: 5,
        search: 'john',
        role: 'admin'
      };

      authService.listUsers.mockResolvedValue({
        users: [],
        total: 0,
        page: 2,
        limit: 5
      });

      await request(app)
        .get('/users')
        .query(queryParams)
        .expect(200);

      expect(authService.listUsers).toHaveBeenCalledWith(
        expect.objectContaining(queryParams)
      );
    });
  });

  describe('POST /assign-role', () => {
    test('should assign role successfully', async () => {
      const roleData = {
        userId: 1,
        roleName: 'admin',
        expiresAt: '2024-12-31T23:59:59Z'
      };

      const mockReq = {
        user: { id: 2 }
      };

      authService.assignRoleToUser.mockResolvedValue(true);

      app.use('/assign-role', (req, res, next) => {
        req.user = mockReq.user;
        next();
      });

      const response = await request(app)
        .post('/assign-role')
        .send(roleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(authService.assignRoleToUser).toHaveBeenCalledWith(
        roleData.userId,
        roleData.roleName,
        mockReq.user.id,
        expect.any(Object) // metadata
      );
    });

    test('should return 400 for missing required fields', async () => {
      app.use('/assign-role', (req, res, next) => {
        req.user = { id: 2 };
        next();
      });

      const response = await request(app)
        .post('/assign-role')
        .send({
          userId: 1
          // Missing roleName
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('MISSING_FIELDS');
    });
  });

  describe('GET /roles', () => {
    test('should list roles successfully', async () => {
      const mockRoles = [
        {
          id: 1,
          name: 'admin',
          displayName: 'Administrator',
          description: 'Full access',
          permissions: ['read', 'write', 'delete'],
          isSystemRole: true,
          userCount: 2
        },
        {
          id: 2,
          name: 'user',
          displayName: 'User',
          description: 'Basic access',
          permissions: ['read'],
          isSystemRole: false,
          userCount: 10
        }
      ];

      authService.listRoles.mockResolvedValue(mockRoles);

      const response = await request(app)
        .get('/roles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roles).toEqual(mockRoles);
    });

    test('should handle empty roles list', async () => {
      authService.listRoles.mockResolvedValue([]);

      const response = await request(app)
        .get('/roles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roles).toEqual([]);
    });
  });

  describe('GET /auth-info', () => {
    test('should return auth info successfully', async () => {
      const response = await request(app)
        .get('/auth-info')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data).toHaveProperty('features');
      expect(response.body.data).toHaveProperty('endpoints');
      expect(response.body.data).toHaveProperty('security');
      expect(response.body.data.name).toBe('Vicsam Group Authentication API');
    });
  });

  describe('Error Handling', () => {
    test('should handle AuthError with specific error codes', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.registerUser.mockRejectedValue(
        new AuthError('User not found', 'USER_NOT_FOUND')
      );

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('USER_NOT_FOUND');
    });

    test('should handle validation errors', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.registerUser.mockRejectedValue(
        new AuthError('Password validation failed', 'VALIDATION_ERROR')
      );

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('VALIDATION_ERROR');
    });

    test('should handle rate limiting errors', async () => {
      authService.loginUser.mockRejectedValue(
        new AuthError('Too many requests', 'RATE_LIMIT_EXCEEDED')
      );

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    test('should handle database errors', async () => {
      authService.listUsers.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/users')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('USER_LIST_ERROR');
    });
  });

  describe('Input Validation', () => {
    test('should validate email format in registration', async () => {
      const userData = {
        email: 'invalid-email-format',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.registerUser.mockRejectedValue(
        new AuthError('Invalid email format', 'VALIDATION_ERROR')
      );

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle SQL injection attempts', async () => {
      const maliciousData = {
        email: "'; DROP TABLE users; --",
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.registerUser.mockRejectedValue(
        new AuthError('Invalid input', 'VALIDATION_ERROR')
      );

      const response = await request(app)
        .post('/register')
        .send(maliciousData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate role names', async () => {
      app.use('/assign-role', (req, res, next) => {
        req.user = { id: 2 };
        next();
      });

      authService.assignRoleToUser.mockRejectedValue(
        new AuthError('Invalid role name', 'ROLE_NOT_FOUND')
      );

      const response = await request(app)
        .post('/assign-role')
        .send({
          userId: 1,
          roleName: 'invalid-role'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('ROLE_NOT_FOUND');
    });
  });

  describe('Security Headers and Metadata', () => {
    test('should include IP and User-Agent in login metadata', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123'
      };

      authService.loginUser.mockResolvedValue({
        accessToken: 'token',
        user: { email: 'test@example.com' }
      });

      await request(app)
        .post('/login')
        .set('User-Agent', 'TestAgent/1.0')
        .set('X-Forwarded-For', '192.168.1.1')
        .send(credentials)
        .expect(200);

      expect(authService.loginUser).toHaveBeenCalledWith(
        credentials.email,
        credentials.password,
        expect.objectContaining({
          ip: expect.any(String),
          userAgent: 'TestAgent/1.0',
          timestamp: expect.any(String)
        })
      );
    });

    test('should handle missing User-Agent gracefully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123'
      };

      authService.loginUser.mockResolvedValue({
        accessToken: 'token',
        user: { email: 'test@example.com' }
      });

      await request(app)
        .post('/login')
        .send(credentials)
        .expect(200);

      expect(authService.loginUser).toHaveBeenCalledWith(
        credentials.email,
        credentials.password,
        expect.objectContaining({
          ip: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });
  });
});
