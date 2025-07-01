const { cryptoService, CryptoError } = require('../api/services/cryptoService');

describe('CryptoService', () => {
  beforeAll(() => {
    // Mock environment variables for testing
    process.env.NODE_ENV = 'test';
  });

  describe('Password Hashing', () => {
    test('should hash password with Argon2id', async () => {
      const password = 'testPassword123!';
      const result = await cryptoService.hashPassword(password);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('algorithm');
      expect(result.algorithm).toBe('argon2id');
      expect(typeof result.hash).toBe('string');
      expect(result.hash.length).toBeGreaterThan(0);
    });

    test('should hash password with bcrypt fallback', async () => {
      const password = 'testPassword123!';
      const result = await cryptoService.hashPasswordBcrypt(password, 12);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('algorithm');
      expect(result.algorithm).toBe('bcrypt');
      expect(typeof result.hash).toBe('string');
    });

    test('should verify correct password with Argon2id', async () => {
      const password = 'testPassword123!';
      const { hash } = await cryptoService.hashPassword(password);
      
      const isValid = await cryptoService.verifyPassword(password, hash, 'argon2id');
      expect(isValid).toBe(true);
    });

    test('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword';
      const { hash } = await cryptoService.hashPassword(password);
      
      const isValid = await cryptoService.verifyPassword(wrongPassword, hash, 'argon2id');
      expect(isValid).toBe(false);
    });

    test('should verify correct password with bcrypt', async () => {
      const password = 'testPassword123!';
      const { hash } = await cryptoService.hashPasswordBcrypt(password);
      
      const isValid = await cryptoService.verifyPassword(password, hash, 'bcrypt');
      expect(isValid).toBe(true);
    });

    test('should throw error for unsupported algorithm', async () => {
      const password = 'testPassword123!';
      const hash = 'dummy-hash';
      
      const isValid = await cryptoService.verifyPassword(password, hash, 'unsupported');
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Key Management', () => {
    test('should generate RSA key pair for JWT', async () => {
      const keys = await cryptoService.generateJWTKeyPair();

      expect(keys).toHaveProperty('keyId');
      expect(keys).toHaveProperty('algorithm');
      expect(keys).toHaveProperty('publicKey');
      expect(keys).toHaveProperty('privateKey');
      expect(keys.algorithm).toBe('RS256');
      expect(keys.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
      expect(keys.privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    });

    test('should generate ECDSA key pair', async () => {
      const keys = await cryptoService.generateECDSAKeyPair();

      expect(keys).toHaveProperty('keyId');
      expect(keys).toHaveProperty('algorithm');
      expect(keys).toHaveProperty('publicKey');
      expect(keys).toHaveProperty('privateKey');
      expect(keys.algorithm).toBe('ES256');
      expect(keys.curve).toBe('P-256');
    });

    test('should generate HMAC key', () => {
      const key = cryptoService.generateHMACKey(64);

      expect(key).toHaveProperty('keyId');
      expect(key).toHaveProperty('algorithm');
      expect(key).toHaveProperty('key');
      expect(key.algorithm).toBe('HS256');
      expect(key.length).toBe(64);
      expect(typeof key.key).toBe('string');
    });
  });

  describe('Token Generation', () => {
    test('should generate secure token', () => {
      const token = cryptoService.generateSecureToken(32);
      
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    test('should generate session ID', () => {
      const sessionId = cryptoService.generateSessionId();
      
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
      expect(sessionId).toMatch(/^[a-f0-9-]+$/); // UUID format
    });

    test('should generate JTI', () => {
      const jti = cryptoService.generateJTI();
      
      expect(typeof jti).toBe('string');
      expect(jti.length).toBeGreaterThan(0);
      expect(jti).toMatch(/^[a-f0-9-]+$/); // UUID format
    });

    test('should generate different tokens each time', () => {
      const token1 = cryptoService.generateSecureToken();
      const token2 = cryptoService.generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('Hashing Utilities', () => {
    test('should hash value with SHA-256', () => {
      const value = 'test-value';
      const hash = cryptoService.hashSHA256(value);
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 = 64 hex chars
    });

    test('should hash refresh token consistently', () => {
      const token = 'test-refresh-token';
      const hash1 = cryptoService.hashRefreshToken(token);
      const hash2 = cryptoService.hashRefreshToken(token);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBe(64);
    });
  });

  describe('Password Validation', () => {
    test('should validate strong password', () => {
      const strongPassword = 'MyStr0ng!P@ssw0rd';
      const result = cryptoService.validatePasswordStrength(strongPassword);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(5);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject weak password - too short', () => {
      const weakPassword = '123';
      const result = cryptoService.validatePasswordStrength(weakPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject common password patterns', () => {
      const commonPassword = 'password123';
      const result = cryptoService.validatePasswordStrength(commonPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password contains common patterns');
    });

    test('should provide suggestions for password improvement', () => {
      const simplePassword = 'simple';
      const result = cryptoService.validatePasswordStrength(simplePassword);

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions).toContain('Add uppercase letters');
      expect(result.suggestions).toContain('Add numbers');
      expect(result.suggestions).toContain('Add special characters');
    });

    test('should handle edge cases', () => {
      const emptyPassword = '';
      const result = cryptoService.validatePasswordStrength(emptyPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Key Cache Management', () => {
    test('should cache keys properly', () => {
      const keyId = 'test-key-id';
      const keyData = { algorithm: 'RS256', key: 'test-key' };
      
      cryptoService.setKeyInCache(keyId, keyData);
      const cached = cryptoService.getKeyFromCache(keyId);
      
      expect(cached).toEqual(keyData);
    });

    test('should return null for non-existent key', () => {
      const cached = cryptoService.getKeyFromCache('non-existent-key');
      expect(cached).toBeNull();
    });

    test('should clean old keys from cache', () => {
      const keyId = 'old-key';
      const keyData = { 
        algorithm: 'RS256', 
        key: 'test-key',
        cachedAt: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };
      
      cryptoService.setKeyInCache(keyId, keyData);
      cryptoService.cleanKeyCache(24 * 60 * 60 * 1000); // 24 hours max age
      
      const cached = cryptoService.getKeyFromCache(keyId);
      expect(cached).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle bcrypt rounds validation', async () => {
      const password = 'testPassword123!';
      
      await expect(cryptoService.hashPasswordBcrypt(password, 5))
        .rejects
        .toThrow('Bcrypt rounds must be at least 12 for security');
    });

    test('should handle crypto errors gracefully', async () => {
      // Test with invalid input that might cause crypto errors
      const result = await cryptoService.verifyPassword('test', 'invalid-hash', 'argon2id');
      expect(result).toBe(false);
    });
  });

  describe('CryptoError Class', () => {
    test('should create CryptoError with message', () => {
      const error = new CryptoError('Test error message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CryptoError);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('CryptoError');
    });

    test('should create CryptoError with original error', () => {
      const originalError = new Error('Original error');
      const cryptoError = new CryptoError('Crypto error', originalError);
      
      expect(cryptoError.originalError).toBe(originalError);
      expect(cryptoError.message).toBe('Crypto error');
    });
  });

  describe('Integration Tests', () => {
    test('should complete full password cycle', async () => {
      const password = 'ComplexP@ssw0rd!123';
      
      // Validate password strength
      const validation = cryptoService.validatePasswordStrength(password);
      expect(validation.isValid).toBe(true);
      
      // Hash password
      const { hash } = await cryptoService.hashPassword(password);
      expect(hash).toBeDefined();
      
      // Verify password
      const isValid = await cryptoService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      // Verify wrong password
      const isInvalid = await cryptoService.verifyPassword('wrong', hash);
      expect(isInvalid).toBe(false);
    });

    test('should generate and manage multiple key types', async () => {
      // Generate RSA keys
      const rsaKeys = await cryptoService.generateJWTKeyPair();
      expect(rsaKeys.algorithm).toBe('RS256');
      
      // Generate ECDSA keys
      const ecdsaKeys = await cryptoService.generateECDSAKeyPair();
      expect(ecdsaKeys.algorithm).toBe('ES256');
      
      // Generate HMAC key
      const hmacKey = cryptoService.generateHMACKey();
      expect(hmacKey.algorithm).toBe('HS256');
      
      // All should have unique IDs
      expect(rsaKeys.keyId).not.toBe(ecdsaKeys.keyId);
      expect(ecdsaKeys.keyId).not.toBe(hmacKey.keyId);
    });
  });
});
