const path = require('path');

// Load test environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.test') });

// Global test setup
global.console = {
  ...console,
  // Suppress console.log in tests but keep error and warn
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Global test timeout
jest.setTimeout(30000);

// Mock timers by default
jest.useFakeTimers();

// Global mocks for crypto and JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => `mocked-jwt-token-${Date.now()}`),
  verify: jest.fn((token, secret, options) => ({
    sub: 'user-uuid',
    email: 'test@example.com',
    roles: ['user'],
    permissions: ['read'],
    jti: 'jwt-id',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  })),
  decode: jest.fn()
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  randomBytes: jest.fn((size) => Buffer.from('a'.repeat(size), 'utf8'))
}));

// Mock argon2 for faster tests
jest.mock('argon2', () => ({
  hash: jest.fn(async (password) => `$argon2id$v=19$m=65536,t=3,p=1$mock-salt$mock-hash-${password}`),
  verify: jest.fn(async (hash, password) => {
    // Simple mock verification - in real tests you'd want more sophisticated logic
    return hash.includes(password) || password === 'correct-password';
  }),
  argon2id: 0
}));

// Mock bcrypt for compatibility tests
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(async (rounds) => `mock-salt-rounds-${rounds}`),
  hash: jest.fn(async (password, salt) => `$2b$12$mock-bcrypt-hash-${password}`),
  compare: jest.fn(async (password, hash) => {
    return hash.includes(password) || password === 'correct-password';
  })
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
}));

// Mock node-forge
jest.mock('node-forge', () => ({
  pki: {
    rsa: {
      generateKeyPair: jest.fn(() => ({
        publicKey: {
          n: 'mock-n',
          e: 'mock-e'
        },
        privateKey: {
          n: 'mock-n',
          e: 'mock-e',
          d: 'mock-d'
        }
      }))
    },
    publicKeyToPem: jest.fn(() => '-----BEGIN PUBLIC KEY-----\nmock-public-key\n-----END PUBLIC KEY-----'),
    privateKeyToPem: jest.fn(() => '-----BEGIN PRIVATE KEY-----\nmock-private-key\n-----END PRIVATE KEY-----')
  },
  md: {
    sha256: {
      create: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn(() => ({
          toHex: jest.fn(() => 'mock-sha256-hash')
        }))
      }))
    }
  }
}));

// Global test helpers
global.testHelpers = {
  createMockUser: (overrides = {}) => ({
    id: 1,
    uuid: 'test-user-uuid',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    is_active: true,
    is_verified: false,
    created_at: new Date(),
    ...overrides
  }),

  createMockAuthData: (overrides = {}) => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    sessionId: 'mock-session-id',
    expiresIn: 900,
    tokenType: 'Bearer',
    user: {
      id: 'test-user-uuid',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read']
    },
    ...overrides
  }),

  createMockRequest: (overrides = {}) => ({
    headers: {},
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('TestAgent/1.0'),
    params: {},
    query: {},
    body: {},
    user: undefined,
    ...overrides
  }),

  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis()
    };
    return res;
  },

  createMockNext: () => jest.fn(),

  // Helper to wait for promises to resolve
  waitForPromises: () => new Promise(setImmediate),

  // Helper to simulate async operations
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Custom matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid UUID`
          : `Expected ${received} to be a valid UUID`,
      pass
    };
  },

  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = typeof received === 'string' && jwtRegex.test(received);
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid JWT`
          : `Expected ${received} to be a valid JWT`,
      pass
    };
  },

  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    
    return {
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
      pass
    };
  },

  toHaveValidationError(received, field) {
    const pass = received && 
                  received.isValid === false && 
                  Array.isArray(received.errors) && 
                  received.errors.some(error => error.includes(field));
    
    return {
      message: () => 
        pass 
          ? `Expected validation result not to have error for field ${field}`
          : `Expected validation result to have error for field ${field}`,
      pass
    };
  }
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.useFakeTimers();
});

// Clean up after all tests
afterAll(() => {
  jest.useRealTimers();
});

console.log('Jest setup completed for authentication tests');
