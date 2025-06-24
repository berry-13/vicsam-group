const { generateToken, verifyToken, extractBearerToken } = require('../api/utils/jwt');
const { successResponse, errorResponse, extractImportantData, generateFileName } = require('../api/utils/helpers');
const { validate, saveDataSchema } = require('../api/utils/validation');

describe('Utility Functions', () => {
  describe('JWT Utils', () => {
    const testPayload = { userId: 123, role: 'user' };
    const testSecret = 'test-secret';

    test('should generate valid JWT token', () => {
      const token = generateToken(testPayload, testSecret, '1h');
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format
    });

    test('should verify valid JWT token', () => {
      const token = generateToken(testPayload, testSecret, '1h');
      const decoded = verifyToken(token, testSecret);
      
      expect(decoded).toHaveProperty('userId', testPayload.userId);
      expect(decoded).toHaveProperty('role', testPayload.role);
      expect(decoded).toHaveProperty('iat');
      expect(decoded).toHaveProperty('exp');
    });

    test('should throw error for invalid JWT token', () => {
      expect(() => {
        verifyToken('invalid-token', testSecret);
      }).toThrow();
    });

    test('should extract bearer token from header', () => {
      const token = 'test-bearer-token';
      const authHeader = `Bearer ${token}`;
      
      const extracted = extractBearerToken(authHeader);
      expect(extracted).toBe(token);
    });

    test('should return null for invalid auth header', () => {
      expect(extractBearerToken('Invalid format')).toBeNull();
      expect(extractBearerToken('')).toBeNull();
      expect(extractBearerToken()).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    test('should create success response', () => {
      const data = { test: 'data' };
      const message = 'Success';
      const response = successResponse(data, message);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('message', message);
      expect(response).toHaveProperty('data', data);
      expect(response).toHaveProperty('timestamp');
    });

    test('should create error response', () => {
      const message = 'Error occurred';
      const details = 'Additional details';
      const response = errorResponse(message, 400, details);

      expect(response).toHaveProperty('success', false);
      expect(response).toHaveProperty('error', message);
      expect(response).toHaveProperty('details', details);
      expect(response).toHaveProperty('timestamp');
    });

    test('should extract important data', () => {
      const inputData = {
        nome: 'Mario Rossi',
        email: 'mario@example.com',
        telefono: '123456789',
        extraField: 'extra'
      };

      const extracted = extractImportantData(inputData);

      expect(extracted).toHaveProperty('nome', inputData.nome);
      expect(extracted).toHaveProperty('email', inputData.email);
      expect(extracted).toHaveProperty('data');
      expect(extracted).not.toHaveProperty('telefono');
      expect(extracted).not.toHaveProperty('extraField');
    });

    test('should generate unique filenames', async () => {
      const fileName1 = generateFileName('test', 'json');
      // Aspetta un millisecondo per garantire timestamp diversi
      await new Promise(resolve => setTimeout(resolve, 1));
      const fileName2 = generateFileName('test', 'json');

      expect(fileName1).toMatch(/^test_\d+\.json$/);
      expect(fileName2).toMatch(/^test_\d+\.json$/);
      expect(fileName1).not.toBe(fileName2);
    });
  });

  describe('Validation Utils', () => {
    test('should validate correct data', () => {
      const validData = {
        nome: 'Mario Rossi',
        email: 'mario@example.com'
      };

      const { error } = saveDataSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid data', () => {
      const invalidData = {
        nome: 'A', // Troppo corto
        email: 'invalid-email'
      };

      const { error } = saveDataSchema.validate(invalidData, { abortEarly: false });
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThanOrEqual(1);
      
      // Controlla che ci siano errori per entrambi i campi
      const errorMessages = error.details.map(detail => detail.message);
      expect(errorMessages).toContain('Nome deve avere almeno 2 caratteri');
      expect(errorMessages).toContain('Email deve essere valida');
    });

    test('should accept additional fields', () => {
      const dataWithExtra = {
        nome: 'Mario Rossi',
        email: 'mario@example.com',
        telefono: '123456789',
        extraField: 'extra'
      };

      const { error } = saveDataSchema.validate(dataWithExtra);
      expect(error).toBeUndefined();
    });
  });
});
