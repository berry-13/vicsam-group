const { authService, AuthError } = require('../api/services/authService');
const { cryptoService } = require('../api/services/cryptoService');

// Mock database
jest.mock('../../database/database', () => ({
  db: {
    query: jest.fn(),
    beginTransaction: jest.fn(() => ({
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    }))
  }
}));

const { db } = require('../../database/database');

describe('AuthService', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransaction = {
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    };
    
    db.beginTransaction.mockResolvedValue(mockTransaction);
  });

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      };

      // Mock email check (user doesn't exist)
      authService.findUserByEmail = jest.fn().mockResolvedValue(null);
      
      // Mock user insertion
      mockTransaction.query
        .mockResolvedValueOnce({ rows: { insertId: 1 } }) // User insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Role lookup
        .mockResolvedValueOnce({ rows: { insertId: 1 } }); // Role assignment

      // Mock getUserById
      authService.getUserById = jest.fn().mockResolvedValue({
        id: 1,
        uuid: 'test-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });

      authService.assignRoleToUser = jest.fn().mockResolvedValue(true);
      authService.logAuditEvent = jest.fn().mockResolvedValue(true);

      const result = await authService.registerUser(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(authService.findUserByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should reject registration with existing email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Mock existing user
      authService.findUserByEmail = jest.fn().mockResolvedValue({
        id: 1,
        email: 'existing@example.com'
      });

      await expect(authService.registerUser(userData))
        .rejects
        .toThrow(AuthError);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Weak password
        firstName: 'John',
        lastName: 'Doe'
      };

      authService.findUserByEmail = jest.fn().mockResolvedValue(null);

      await expect(authService.registerUser(userData))
        .rejects
        .toThrow(AuthError);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('User Login', () => {
    const mockUser = {
      id: 1,
      uuid: 'test-uuid',
      email: 'test@example.com',
      password_hash: 'hashed-password',
      password_salt: 'salt',
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
      failed_login_attempts: 0,
      locked_until: null
    };

    test('should login user successfully', async () => {
      const email = 'test@example.com';
      const password = 'StrongP@ssw0rd123';
      const metadata = { ip: '127.0.0.1', userAgent: 'test-agent' };

      authService.findUserByEmail = jest.fn().mockResolvedValue(mockUser);
      cryptoService.verifyPassword = jest.fn().mockResolvedValue(true);
      authService.createUserSession = jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        sessionId: 'session-id'
      });
      authService.logAuditEvent = jest.fn().mockResolvedValue(true);

      // Mock password reset and session creation queries
      mockTransaction.query.mockResolvedValue({ rows: [] });

      const result = await authService.loginUser(email, password, metadata);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access-token');
      expect(authService.findUserByEmail).toHaveBeenCalledWith(email);
      expect(cryptoService.verifyPassword).toHaveBeenCalledWith(password, mockUser.password_hash, 'argon2id');
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should reject login with non-existent user', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password';

      authService.findUserByEmail = jest.fn().mockResolvedValue(null);
      authService.logAuditEvent = jest.fn().mockResolvedValue(true);

      await expect(authService.loginUser(email, password))
        .rejects
        .toThrow(AuthError);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should reject login with incorrect password', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      authService.findUserByEmail = jest.fn().mockResolvedValue(mockUser);
      cryptoService.verifyPassword = jest.fn().mockResolvedValue(false);
      authService.incrementFailedAttempts = jest.fn().mockResolvedValue(true);
      authService.logAuditEvent = jest.fn().mockResolvedValue(true);

      await expect(authService.loginUser(email, password))
        .rejects
        .toThrow(AuthError);

      expect(authService.incrementFailedAttempts).toHaveBeenCalledWith(mockUser.id, mockTransaction);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should reject login for locked account', async () => {
      const lockedUser = {
        ...mockUser,
        locked_until: new Date(Date.now() + 10000).toISOString() // Locked for 10 seconds
      };
      
      authService.findUserByEmail = jest.fn().mockResolvedValue(lockedUser);
      authService.logAuditEvent = jest.fn().mockResolvedValue(true);

      await expect(authService.loginUser('test@example.com', 'password'))
        .rejects
        .toThrow(AuthError);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should reject login for inactive account', async () => {
      const inactiveUser = {
        ...mockUser,
        is_active: false
      };
      
      authService.findUserByEmail = jest.fn().mockResolvedValue(inactiveUser);

      await expect(authService.loginUser('test@example.com', 'password'))
        .rejects
        .toThrow(AuthError);

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    const mockUser = {
      id: 1,
      uuid: 'test-uuid',
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      is_verified: true
    };

    test('should create user session successfully', async () => {
      const metadata = { ip: '127.0.0.1', userAgent: 'test-agent' };

      authService.getUserRoles = jest.fn().mockResolvedValue([
        { name: 'user', display_name: 'User' }
      ]);
      authService.getUserPermissions = jest.fn().mockResolvedValue([
        { name: 'read', display_name: 'Read' }
      ]);

      // Mock JWT generation
      authService.generateAccessToken = jest.fn().mockReturnValue('access-token');
      
      // Mock database queries
      mockTransaction.query
        .mockResolvedValueOnce({ rows: [] }) // Session insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Session lookup
        .mockResolvedValueOnce({ rows: [] }); // Refresh token insert

      const result = await authService.createUserSession(mockUser, metadata, mockTransaction);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('access-token');
      expect(result.tokenType).toBe('Bearer');
      expect(result.user.email).toBe(mockUser.email);
      expect(authService.getUserRoles).toHaveBeenCalledWith(mockUser.id);
      expect(authService.getUserPermissions).toHaveBeenCalledWith(mockUser.id);
    });

    test('should handle session creation errors', async () => {
      const metadata = { ip: '127.0.0.1', userAgent: 'test-agent' };

      authService.getUserRoles = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(authService.createUserSession(mockUser, metadata, mockTransaction))
        .rejects
        .toThrow(AuthError);
    });
  });

  describe('Token Management', () => {
    beforeEach(() => {
      // Mock JWT secrets
      authService.jwtSecrets = new Map();
      authService.jwtSecrets.set('current', {
        privateKey: 'private-key',
        publicKey: 'public-key'
      });
    });

    test('should generate access token', () => {
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        roles: ['user']
      };

      // Mock jwt.sign
      const jwt = require('jsonwebtoken');
      jwt.sign = jest.fn().mockReturnValue('generated-token');

      const token = authService.generateAccessToken(payload);

      expect(token).toBe('generated-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        payload,
        'private-key',
        expect.objectContaining({
          algorithm: 'RS256',
          expiresIn: authService.accessTokenExpiry
        })
      );
    });

    test('should throw error when JWT keys not available', () => {
      authService.jwtSecrets.clear();

      const payload = { sub: 'user-id' };

      expect(() => authService.generateAccessToken(payload))
        .toThrow(AuthError);
    });

    test('should verify access token', async () => {
      const token = 'valid-token';
      const decoded = {
        jti: 'jwt-id',
        sub: 'user-id',
        email: 'test@example.com'
      };

      // Mock jwt.verify
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue(decoded);

      // Mock session verification
      db.query.mockResolvedValue({
        rows: [{
          is_active: true,
          user_active: true
        }]
      });

      const result = await authService.verifyAccessToken(token);

      expect(result).toEqual(decoded);
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        'public-key',
        expect.objectContaining({
          algorithm: 'RS256'
        })
      );
    });

    test('should reject invalid token', async () => {
      const token = 'invalid-token';

      // Mock jwt.verify to throw error
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyAccessToken(token))
        .rejects
        .toThrow(AuthError);
    });

    test('should reject token with inactive session', async () => {
      const token = 'valid-token';
      const decoded = { jti: 'jwt-id' };

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn().mockReturnValue(decoded);

      // Mock inactive session
      db.query.mockResolvedValue({
        rows: [{
          is_active: false,
          user_active: true
        }]
      });

      await expect(authService.verifyAccessToken(token))
        .rejects
        .toThrow(AuthError);
    });
  });

  describe('User Management', () => {
    test('should find user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await authService.findUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [email.toLowerCase()]
      );
    });

    test('should return null for non-existent user', async () => {
      const email = 'nonexistent@example.com';

      db.query.mockResolvedValue({ rows: [] });

      const result = await authService.findUserByEmail(email);

      expect(result).toBeNull();
    });

    test('should get user by ID', async () => {
      const userId = 1;
      const mockUser = {
        id: 1,
        uuid: 'test-uuid',
        email: 'test@example.com'
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await authService.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [userId]
      );
    });

    test('should change user password', async () => {
      const userId = 1;
      const currentPassword = 'oldPassword';
      const newPassword = 'NewStr0ng!P@ssw0rd';

      const mockUser = {
        id: 1,
        password_hash: 'old-hash',
        password_salt: 'salt'
      };

      authService.getUserById = jest.fn().mockResolvedValue(mockUser);
      cryptoService.verifyPassword = jest.fn().mockResolvedValue(true);
      cryptoService.validatePasswordStrength = jest.fn().mockReturnValue({
        isValid: true,
        errors: []
      });
      cryptoService.hashPassword = jest.fn().mockResolvedValue({
        hash: 'new-hash',
        salt: 'new-salt'
      });
      authService.logAuditEvent = jest.fn().mockResolvedValue(true);

      mockTransaction.query.mockResolvedValue({ rows: [] });

      const result = await authService.changeUserPassword(userId, currentPassword, newPassword);

      expect(result).toBe(true);
      expect(cryptoService.verifyPassword).toHaveBeenCalledWith(
        currentPassword,
        mockUser.password_hash,
        mockUser.password_salt
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('Role Management', () => {
    test('should list all roles', async () => {
      const mockRoles = [
        {
          id: 1,
          name: 'admin',
          display_name: 'Administrator',
          description: 'Full access',
          permissions: '["read", "write", "delete"]',
          is_system_role: true,
          user_count: 2,
          created_at: new Date()
        },
        {
          id: 2,
          name: 'user',
          display_name: 'User',
          description: 'Basic access',
          permissions: '["read"]',
          is_system_role: false,
          user_count: 10,
          created_at: new Date()
        }
      ];

      db.query.mockResolvedValue({ rows: mockRoles });

      const result = await authService.listRoles();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('admin');
      expect(result[0].permissions).toEqual(['read', 'write', 'delete']);
      expect(result[1].name).toBe('user');
      expect(result[1].permissions).toEqual(['read']);
    });

    test('should assign role to user', async () => {
      const userId = 1;
      const roleName = 'admin';
      const assignedBy = 2;

      db.query
        .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // Role lookup
        .mockResolvedValueOnce({ rows: [] }); // Role assignment

      authService.logAuditEvent = jest.fn().mockResolvedValue(true);

      const result = await authService.assignRoleToUser(userId, roleName, assignedBy, mockTransaction);

      expect(result).toBe(true);
      expect(mockTransaction.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_roles'),
        expect.arrayContaining([userId, 3])
      );
    });
  });

  describe('Logout', () => {
    test('should logout user successfully', async () => {
      const sessionId = 'test-session-id';

      mockTransaction.query.mockResolvedValue({ rows: [] });

      await authService.logoutUser(sessionId);

      expect(mockTransaction.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE user_sessions'),
        [sessionId]
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should handle logout errors', async () => {
      const sessionId = 'test-session-id';

      mockTransaction.query.mockRejectedValue(new Error('Database error'));

      await expect(authService.logoutUser(sessionId))
        .rejects
        .toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('Audit Logging', () => {
    test('should log audit event', async () => {
      const userId = 1;
      const action = 'user.login';
      const resource = 'users';
      const resourceId = 1;
      const details = { ip: '127.0.0.1' };
      const success = true;

      db.query.mockResolvedValue({ rows: [] });

      await authService.logAuditEvent(userId, action, resource, resourceId, details, success);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_logs'),
        [userId, action, resource, resourceId, JSON.stringify(details), success]
      );
    });

    test('should not throw error if audit logging fails', async () => {
      const userId = 1;
      const action = 'test.action';

      db.query.mockRejectedValue(new Error('Audit logging failed'));

      // Should not throw error
      await expect(authService.logAuditEvent(userId, action, 'test', 1, {}, true))
        .resolves
        .toBeUndefined();
    });
  });

  describe('AuthError Class', () => {
    test('should create AuthError with message and code', () => {
      const error = new AuthError('Test error', 'TEST_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('AuthError');
    });

    test('should create AuthError with default code', () => {
      const error = new AuthError('Test error');

      expect(error.code).toBe('AUTH_ERROR');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle database connection errors', async () => {
      db.query.mockRejectedValue(new Error('Connection failed'));

      await expect(authService.findUserByEmail('test@example.com'))
        .rejects
        .toThrow('Connection failed');
    });

    test('should handle invalid UUID format', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await authService.getUserById('invalid-id');
      expect(result).toBeNull();
    });

    test('should handle empty role permissions', async () => {
      const mockRoles = [{
        id: 1,
        name: 'empty',
        display_name: 'Empty Role',
        permissions: null,
        is_system_role: false,
        user_count: 0,
        created_at: new Date()
      }];

      db.query.mockResolvedValue({ rows: mockRoles });

      const result = await authService.listRoles();
      expect(result[0].permissions).toEqual([]);
    });
  });
});
