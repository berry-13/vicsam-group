const {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateRoleAssignment,
  sanitizeUserInput,
  validateEmail,
  validatePassword,
  validateUUID,
  validateRole,
  validatePagination
} = require('../api/utils/authValidation');

describe('AuthValidation', () => {
  describe('validateRegistration', () => {
    test('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
      };

      const result = validateRegistration(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com'
        // Missing password, firstName, lastName
      };

      const result = validateRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(err => err.includes('firstName'))).toBe(true);
      expect(result.errors.some(err => err.includes('lastName'))).toBe(true);
      expect(result.errors.some(err => err.includes('password'))).toBe(true);
    });

    test('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email-format',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = validateRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('email'))).toBe(true);
    });

    test('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123', // Weak password
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = validateRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('password'))).toBe(true);
    });

    test('should reject invalid names', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'A', // Too short
        lastName: 'B'   // Too short
      };

      const result = validateRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('firstName'))).toBe(true);
      expect(result.errors.some(err => err.includes('lastName'))).toBe(true);
    });

    test('should reject invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid-role'
      };

      const result = validateRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('role'))).toBe(true);
    });

    test('should sanitize HTML in input fields', () => {
      const dataWithHTML = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: '<script>alert("xss")</script>John',
        lastName: '<b>Doe</b>'
      };

      const result = validateRegistration(dataWithHTML);
      expect(result.sanitized.firstName).not.toContain('<script>');
      expect(result.sanitized.lastName).not.toContain('<b>');
    });

    test('should handle empty strings', () => {
      const invalidData = {
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      };

      const result = validateRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle null values', () => {
      const invalidData = {
        email: null,
        password: null,
        firstName: null,
        lastName: null
      };

      const result = validateRegistration(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateLogin', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123'
      };

      const result = validateLogin(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing email', () => {
      const invalidData = {
        password: 'StrongP@ssw0rd123'
      };

      const result = validateLogin(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('email'))).toBe(true);
    });

    test('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com'
      };

      const result = validateLogin(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('password'))).toBe(true);
    });

    test('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const result = validateLogin(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('email'))).toBe(true);
    });

    test('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      };

      const result = validateLogin(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('password'))).toBe(true);
    });

    test('should sanitize email input', () => {
      const dataWithHTML = {
        email: '<script>alert("xss")</script>test@example.com',
        password: 'password123'
      };

      const result = validateLogin(dataWithHTML);
      expect(result.sanitized.email).not.toContain('<script>');
    });
  });

  describe('validatePasswordChange', () => {
    test('should validate correct password change data', () => {
      const validData = {
        currentPassword: 'OldP@ssw0rd123',
        newPassword: 'NewStr0ng!P@ssw0rd'
      };

      const result = validatePasswordChange(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject missing current password', () => {
      const invalidData = {
        newPassword: 'NewStr0ng!P@ssw0rd'
      };

      const result = validatePasswordChange(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('currentPassword'))).toBe(true);
    });

    test('should reject missing new password', () => {
      const invalidData = {
        currentPassword: 'OldP@ssw0rd123'
      };

      const result = validatePasswordChange(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('newPassword'))).toBe(true);
    });

    test('should reject weak new password', () => {
      const invalidData = {
        currentPassword: 'OldP@ssw0rd123',
        newPassword: '123' // Too weak
      };

      const result = validatePasswordChange(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('password'))).toBe(true);
    });

    test('should reject same current and new password', () => {
      const invalidData = {
        currentPassword: 'SameP@ssw0rd123',
        newPassword: 'SameP@ssw0rd123'
      };

      const result = validatePasswordChange(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('same'))).toBe(true);
    });

    test('should handle password confirmation', () => {
      const validData = {
        currentPassword: 'OldP@ssw0rd123',
        newPassword: 'NewStr0ng!P@ssw0rd',
        confirmPassword: 'NewStr0ng!P@ssw0rd'
      };

      const result = validatePasswordChange(validData);
      expect(result.isValid).toBe(true);
    });

    test('should reject mismatched password confirmation', () => {
      const invalidData = {
        currentPassword: 'OldP@ssw0rd123',
        newPassword: 'NewStr0ng!P@ssw0rd',
        confirmPassword: 'DifferentP@ssw0rd'
      };

      const result = validatePasswordChange(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('match'))).toBe(true);
    });
  });

  describe('validateRoleAssignment', () => {
    test('should validate correct role assignment data', () => {
      const validData = {
        userId: 123,
        roleName: 'admin',
        expiresAt: '2024-12-31T23:59:59Z'
      };

      const result = validateRoleAssignment(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate with UUID user ID', () => {
      const validData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        roleName: 'user'
      };

      const result = validateRoleAssignment(validData);
      expect(result.isValid).toBe(true);
    });

    test('should reject missing user ID', () => {
      const invalidData = {
        roleName: 'admin'
      };

      const result = validateRoleAssignment(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('userId'))).toBe(true);
    });

    test('should reject invalid user ID', () => {
      const invalidData = {
        userId: 'invalid-id',
        roleName: 'admin'
      };

      const result = validateRoleAssignment(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('userId'))).toBe(true);
    });

    test('should reject missing role name', () => {
      const invalidData = {
        userId: 123
      };

      const result = validateRoleAssignment(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('roleName'))).toBe(true);
    });

    test('should reject invalid role name', () => {
      const invalidData = {
        userId: 123,
        roleName: 'invalid-role-name'
      };

      const result = validateRoleAssignment(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('role'))).toBe(true);
    });

    test('should reject invalid expiration date', () => {
      const invalidData = {
        userId: 123,
        roleName: 'admin',
        expiresAt: 'invalid-date'
      };

      const result = validateRoleAssignment(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('expiresAt'))).toBe(true);
    });

    test('should reject past expiration date', () => {
      const invalidData = {
        userId: 123,
        roleName: 'admin',
        expiresAt: '2020-01-01T00:00:00Z' // Past date
      };

      const result = validateRoleAssignment(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('future'))).toBe(true);
    });
  });

  describe('sanitizeUserInput', () => {
    test('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello <b>World</b>';
      const sanitized = sanitizeUserInput(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<b>');
      expect(sanitized).toContain('Hello');
      expect(sanitized).toContain('World');
    });

    test('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = sanitizeUserInput(input);
      
      expect(sanitized).toBe('Hello World');
    });

    test('should handle special characters', () => {
      const input = 'Test@example.com!#$%';
      const sanitized = sanitizeUserInput(input);
      
      expect(sanitized).toBe(input); // Should preserve valid special chars
    });

    test('should handle empty string', () => {
      const input = '';
      const sanitized = sanitizeUserInput(input);
      
      expect(sanitized).toBe('');
    });

    test('should handle null and undefined', () => {
      expect(sanitizeUserInput(null)).toBe('');
      expect(sanitizeUserInput(undefined)).toBe('');
    });

    test('should handle SQL injection attempts', () => {
      const input = "'; DROP TABLE users; --";
      const sanitized = sanitizeUserInput(input);
      
      // Should escape or remove dangerous characters
      expect(sanitized).not.toContain('DROP TABLE');
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'test+tag@example.org',
        'user123@example-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    test('should handle international domains', () => {
      const internationalEmail = 'test@пример.рф';
      // Depending on implementation, this might be valid or invalid
      const result = validateEmail(internationalEmail);
      expect(typeof result).toBe('boolean');
    });

    test('should handle long email addresses', () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
      const result = validateEmail(longEmail);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('validatePassword', () => {
    test('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongP@ssw0rd123',
        'MySecure!P@ss2024',
        'C0mpl3x#P@ssw0rd!'
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.score).toBeGreaterThan(5);
      });
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        '123456',
        'password',
        'abc123',
        '123',
        ''
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
      });
    });

    test('should provide helpful suggestions', () => {
      const simplePassword = 'simple';
      const result = validatePassword(simplePassword);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Add uppercase letters');
      expect(result.suggestions).toContain('Add numbers');
      expect(result.suggestions).toContain('Add special characters');
    });

    test('should check password length', () => {
      const shortPassword = 'Ab1!';
      const result = validatePassword(shortPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should detect common patterns', () => {
      const commonPassword = 'password123';
      const result = validatePassword(commonPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('common'))).toBe(true);
    });
  });

  describe('validateUUID', () => {
    test('should validate correct UUID formats', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff'
      ];

      validUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(true);
      });
    });

    test('should reject invalid UUID formats', () => {
      const invalidUUIDs = [
        '123',
        'invalid-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-42661417400g', // Invalid character
        '',
        null,
        undefined
      ];

      invalidUUIDs.forEach(uuid => {
        expect(validateUUID(uuid)).toBe(false);
      });
    });

    test('should handle case sensitivity', () => {
      const upperCaseUUID = '123E4567-E89B-12D3-A456-426614174000';
      const lowerCaseUUID = '123e4567-e89b-12d3-a456-426614174000';
      
      expect(validateUUID(upperCaseUUID)).toBe(true);
      expect(validateUUID(lowerCaseUUID)).toBe(true);
    });
  });

  describe('validateRole', () => {
    test('should validate system roles', () => {
      const systemRoles = ['admin', 'user', 'editor', 'viewer', 'super_admin'];
      
      systemRoles.forEach(role => {
        expect(validateRole(role)).toBe(true);
      });
    });

    test('should reject invalid roles', () => {
      const invalidRoles = [
        'invalid-role',
        'hacker',
        'root',
        '',
        null,
        undefined,
        'admin; DROP TABLE users;'
      ];

      invalidRoles.forEach(role => {
        expect(validateRole(role)).toBe(false);
      });
    });

    test('should handle case sensitivity', () => {
      expect(validateRole('Admin')).toBe(false); // Should be case sensitive
      expect(validateRole('ADMIN')).toBe(false);
      expect(validateRole('admin')).toBe(true);
    });

    test('should handle special characters in role names', () => {
      expect(validateRole('user-role')).toBe(false); // Hyphens not allowed
      expect(validateRole('user_role')).toBe(true);  // Underscores allowed
    });
  });

  describe('validatePagination', () => {
    test('should validate correct pagination parameters', () => {
      const validParams = {
        page: 1,
        limit: 10,
        search: 'john',
        sortBy: 'email',
        sortOrder: 'asc'
      };

      const result = validatePagination(validParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle string numbers', () => {
      const params = {
        page: '2',
        limit: '20'
      };

      const result = validatePagination(params);
      expect(result.isValid).toBe(true);
      expect(result.sanitized.page).toBe(2);
      expect(result.sanitized.limit).toBe(20);
    });

    test('should reject invalid page numbers', () => {
      const invalidParams = {
        page: 0, // Should be >= 1
        limit: 10
      };

      const result = validatePagination(invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('page'))).toBe(true);
    });

    test('should reject invalid limit values', () => {
      const invalidParams = {
        page: 1,
        limit: 101 // Should be <= 100
      };

      const result = validatePagination(invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('limit'))).toBe(true);
    });

    test('should set default values', () => {
      const emptyParams = {};

      const result = validatePagination(emptyParams);
      expect(result.isValid).toBe(true);
      expect(result.sanitized.page).toBe(1);
      expect(result.sanitized.limit).toBe(10);
    });

    test('should validate sort parameters', () => {
      const validSortParams = {
        page: 1,
        limit: 10,
        sortBy: 'email',
        sortOrder: 'desc'
      };

      const result = validatePagination(validSortParams);
      expect(result.isValid).toBe(true);
    });

    test('should reject invalid sort parameters', () => {
      const invalidSortParams = {
        page: 1,
        limit: 10,
        sortBy: 'invalid_field',
        sortOrder: 'invalid_order'
      };

      const result = validatePagination(invalidSortParams);
      expect(result.isValid).toBe(false);
    });

    test('should sanitize search input', () => {
      const params = {
        page: 1,
        limit: 10,
        search: '<script>alert("xss")</script>john'
      };

      const result = validatePagination(params);
      expect(result.sanitized.search).not.toContain('<script>');
      expect(result.sanitized.search).toContain('john');
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle extremely long inputs', () => {
      const longString = 'a'.repeat(10000);
      const result = validateRegistration({
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: longString,
        lastName: 'Doe'
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('too long'))).toBe(true);
    });

    test('should handle unicode characters', () => {
      const unicodeData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'João',
        lastName: 'José'
      };

      const result = validateRegistration(unicodeData);
      expect(result.isValid).toBe(true);
    });

    test('should handle malformed JSON injection attempts', () => {
      const maliciousData = {
        email: '{"malicious": "json"}@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = validateRegistration(maliciousData);
      expect(result.isValid).toBe(false);
    });

    test('should handle null prototype pollution attempts', () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe',
        '__proto__': { 'isAdmin': true }
      };

      const result = validateRegistration(maliciousData);
      // Should not have prototype pollution
      expect(result.sanitized.__proto__).toBeUndefined();
    });
  });
});
