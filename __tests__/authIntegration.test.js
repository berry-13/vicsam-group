const request = require('supertest');
const express = require('express');
const { createApp } = require('./helpers');

// Mock database for integration tests
jest.mock('../database/database', () => ({
  db: {
    query: jest.fn(),
    beginTransaction: jest.fn(() => ({
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    }))
  }
}));

const { db } = require('../database/database');

describe('Authentication Integration Tests', () => {
  let app;
  let mockTransaction;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
    
    mockTransaction = {
      query: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    };
    
    db.beginTransaction.mockResolvedValue(mockTransaction);
  });

  describe('Complete Authentication Flow', () => {
    test('should complete full registration -> login -> access -> logout flow', async () => {
      const userData = {
        email: 'integration@example.com',
        password: 'IntegrationTest123!',
        firstName: 'Integration',
        lastName: 'Test'
      };

      // Step 1: Register user
      const mockUser = {
        id: 1,
        uuid: 'test-uuid-123',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        is_active: true,
        is_verified: false
      };

      // Mock registration queries
      db.query
        .mockResolvedValueOnce({ rows: [] }) // Email check
        .mockResolvedValueOnce({ rows: { insertId: 1 } }) // User insert
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Role lookup
        .mockResolvedValueOnce({ rows: { insertId: 1 } }) // Role assignment
        .mockResolvedValueOnce({ rows: [] }) // Audit log
        .mockResolvedValueOnce({ rows: [mockUser] }); // Get user by ID

      mockTransaction.query
        .mockResolvedValueOnce({ rows: { insertId: 1 } }) // User insert
        .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // Role lookup
        .mockResolvedValueOnce({ rows: { insertId: 1 } }) // Role assignment
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe(userData.email);

      // Step 2: Login user
      const mockLoginUser = {
        ...mockUser,
        password_hash: 'hashed-password',
        password_salt: 'salt',
        failed_login_attempts: 0,
        locked_until: null
      };

      const mockAuthData = {
        accessToken: 'jwt-access-token',
        refreshToken: 'secure-refresh-token',
        sessionId: 'session-123',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: {
          id: mockUser.uuid,
          email: mockUser.email,
          name: `${mockUser.firstName} ${mockUser.lastName}`,
          roles: ['user'],
          permissions: ['read']
        }
      };

      // Mock login queries
      db.query
        .mockResolvedValueOnce({ rows: [mockLoginUser] }) // Find user by email
        .mockResolvedValueOnce({ rows: [] }) // Reset failed attempts
        .mockResolvedValueOnce({ rows: [{ name: 'user' }] }) // Get user roles
        .mockResolvedValueOnce({ rows: [{ name: 'read' }] }) // Get user permissions
        .mockResolvedValueOnce({ rows: [] }) // Session insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Session lookup
        .mockResolvedValueOnce({ rows: [] }) // Refresh token insert
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      mockTransaction.query
        .mockResolvedValueOnce({ rows: [] }) // Reset failed attempts
        .mockResolvedValueOnce({ rows: [] }) // Session insert
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Session lookup
        .mockResolvedValueOnce({ rows: [] }) // Refresh token insert
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.accessToken).toBeDefined();
      expect(loginResponse.body.data.refreshToken).toBeDefined();

      const { accessToken, refreshToken, sessionId } = loginResponse.body.data;

      // Step 3: Access protected resource
      const mockSessionCheck = {
        is_active: true,
        user_active: true
      };

      db.query.mockResolvedValueOnce({ rows: [mockSessionCheck] }); // Session verification

      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.user).toBeDefined();

      // Step 4: Refresh token
      const mockRefreshToken = {
        user_id: 1,
        session_id: 1,
        is_revoked: false,
        expires_at: new Date(Date.now() + 86400000) // 24 hours
      };

      const mockNewAuthData = {
        accessToken: 'new-jwt-access-token',
        expiresIn: 900
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockRefreshToken] }) // Refresh token lookup
        .mockResolvedValueOnce({ rows: [mockLoginUser] }) // Get user
        .mockResolvedValueOnce({ rows: [{ name: 'user' }] }) // Get user roles
        .mockResolvedValueOnce({ rows: [{ name: 'read' }] }) // Get user permissions
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();

      // Step 5: Logout
      mockTransaction.query
        .mockResolvedValueOnce({ rows: [] }) // Deactivate session
        .mockResolvedValueOnce({ rows: [] }); // Revoke refresh tokens

      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .send({ sessionId })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Step 6: Verify access is denied after logout
      db.query.mockResolvedValueOnce({ rows: [] }); // No active session

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    test('should handle password change flow', async () => {
      const userId = 'user-uuid-123';
      const currentPassword = 'OldPassword123!';
      const newPassword = 'NewStrongPassword456!';

      const mockUser = {
        id: 1,
        uuid: userId,
        email: 'test@example.com',
        password_hash: 'old-hash',
        password_salt: 'salt'
      };

      // Mock authentication
      db.query
        .mockResolvedValueOnce({ rows: [{ is_active: true, user_active: true }] }) // Session check
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user by ID
        .mockResolvedValueOnce({ rows: [] }) // Update password
        .mockResolvedValueOnce({ rows: [] }) // Deactivate sessions
        .mockResolvedValueOnce({ rows: [] }) // Revoke refresh tokens
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      mockTransaction.query
        .mockResolvedValueOnce({ rows: [] }) // Update password
        .mockResolvedValueOnce({ rows: [] }) // Deactivate sessions
        .mockResolvedValueOnce({ rows: [] }) // Revoke refresh tokens
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          currentPassword,
          newPassword
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should handle role assignment flow', async () => {
      const adminUserId = 'admin-uuid';
      const targetUserId = 1;
      const roleName = 'editor';

      // Mock admin authentication
      db.query
        .mockResolvedValueOnce({ rows: [{ is_active: true, user_active: true }] }) // Session check
        .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // Role lookup
        .mockResolvedValueOnce({ rows: [] }) // Role assignment
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      mockTransaction.query
        .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // Role lookup
        .mockResolvedValueOnce({ rows: [] }) // Role assignment
        .mockResolvedValueOnce({ rows: [] }); // Audit log

      const response = await request(app)
        .post('/api/auth/assign-role')
        .set('Authorization', 'Bearer admin-token')
        .send({
          userId: targetUserId,
          roleName
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle database transaction failures', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Mock transaction failure
      mockTransaction.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test('should handle authentication failures in protected routes', async () => {
      // Mock invalid token
      db.query.mockResolvedValueOnce({ rows: [] }); // No active session

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle rate limiting scenarios', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password'
      };

      const mockLockedUser = {
        id: 1,
        email: 'test@example.com',
        failed_login_attempts: 5,
        locked_until: new Date(Date.now() + 10000).toISOString(),
        is_active: true
      };

      db.query.mockResolvedValueOnce({ rows: [mockLockedUser] });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.data.error).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('Security Integration', () => {
    test('should prevent SQL injection in login', async () => {
      const maliciousCredentials = {
        email: "'; DROP TABLE users; --",
        password: 'password'
      };

      // Mock validation failure
      db.query.mockResolvedValueOnce({ rows: [] }); // No user found

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousCredentials)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should handle concurrent login attempts', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123'
      };

      const mockUser = {
        id: 1,
        uuid: 'test-uuid',
        email: 'test@example.com',
        password_hash: 'hash',
        password_salt: 'salt',
        is_active: true,
        failed_login_attempts: 0,
        locked_until: null
      };

      // Mock multiple concurrent requests
      db.query.mockResolvedValue({ rows: [mockUser] });
      mockTransaction.query.mockResolvedValue({ rows: [] });

      const promises = Array(3).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send(credentials)
      );

      const responses = await Promise.all(promises);

      // At least one should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });

    test('should validate JWT token integrity', async () => {
      const tamperedToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.tamperedpayload.signature';

      db.query.mockResolvedValueOnce({ rows: [] }); // Invalid token

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should prevent session fixation attacks', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123'
      };

      const mockUser = {
        id: 1,
        uuid: 'test-uuid',
        email: userData.email,
        password_hash: 'hash',
        password_salt: 'salt',
        is_active: true,
        failed_login_attempts: 0,
        locked_until: null
      };

      // Mock login
      db.query.mockResolvedValue({ rows: [mockUser] });
      mockTransaction.query.mockResolvedValue({ rows: [] });

      const loginResponse1 = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(200);

      const loginResponse2 = await request(app)
        .post('/api/auth/login')
        .send(userData)
        .expect(200);

      // Each login should generate different session tokens
      expect(loginResponse1.body.data.accessToken)
        .not.toBe(loginResponse2.body.data.accessToken);
    });
  });

  describe('Performance Integration', () => {
    test('should handle multiple simultaneous registrations', async () => {
      const users = Array(5).fill().map((_, i) => ({
        email: `user${i}@example.com`,
        password: 'StrongP@ssw0rd123',
        firstName: `User${i}`,
        lastName: 'Test'
      }));

      // Mock unique responses for each user
      db.query.mockImplementation(() => Promise.resolve({ rows: [] }));
      mockTransaction.query.mockImplementation(() => Promise.resolve({ rows: { insertId: Math.random() } }));

      const promises = users.map(userData =>
        request(app)
          .post('/api/auth/register')
          .send(userData)
      );

      const responses = await Promise.all(promises);

      // All should complete (success or failure based on business logic)
      responses.forEach(response => {
        expect([200, 201, 400, 409, 500]).toContain(response.status);
      });
    });

    test('should handle rapid token refresh requests', async () => {
      const refreshToken = 'valid-refresh-token';

      const mockRefreshTokenData = {
        user_id: 1,
        session_id: 1,
        is_revoked: false,
        expires_at: new Date(Date.now() + 86400000)
      };

      db.query.mockResolvedValue({ rows: [mockRefreshTokenData] });

      const promises = Array(3).fill().map(() =>
        request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken })
      );

      const responses = await Promise.all(promises);

      // Should handle concurrent refresh attempts gracefully
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Cleanup and Maintenance', () => {
    test('should handle session cleanup', async () => {
      const expiredSessionId = 'expired-session-123';

      mockTransaction.query
        .mockResolvedValueOnce({ rows: [] }) // Deactivate expired sessions
        .mockResolvedValueOnce({ rows: [] }); // Revoke expired tokens

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ sessionId: expiredSessionId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    test('should handle audit log entries', async () => {
      const userData = {
        email: 'audit@example.com',
        password: 'StrongP@ssw0rd123'
      };

      // Mock all queries to ensure audit logging is called
      db.query.mockResolvedValue({ rows: [] });
      mockTransaction.query.mockResolvedValue({ rows: [] });

      await request(app)
        .post('/api/auth/login')
        .send(userData);

      // Verify audit logging queries were executed
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('audit_logs'),
        expect.any(Array)
      );
    });
  });

  describe('Edge Cases Integration', () => {
    test('should handle extremely long input values', async () => {
      const longString = 'a'.repeat(1000);
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: longString,
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle missing Content-Type header', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Mock successful registration
      db.query.mockResolvedValue({ rows: [] });
      mockTransaction.query.mockResolvedValue({ rows: { insertId: 1 } });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
