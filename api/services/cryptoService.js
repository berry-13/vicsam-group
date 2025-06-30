const crypto = require('crypto');
const forge = require('node-forge');
const argon2 = require('argon2');
const bcrypt = require('bcryptjs');

/**
 * Servizio di crittografia moderno utilizzando Web Crypto API e algoritmi sicuri
 * Supporta sia Node.js Crypto che fallback per compatibilità
 */
class CryptoService {
  constructor() {
    this.algorithms = {
      jwt: {
        RS256: 'RSA-PSS',
        ES256: 'ECDSA',
        HS256: 'HMAC'
      },
      encryption: {
        AES: 'AES-GCM',
        RSA: 'RSA-OAEP'
      }
    };
    
    this.keyCache = new Map();
    this.initializeDefaults();
  }

  /**
   * Inizializza le configurazioni di default
   */
  initializeDefaults() {
    this.defaultKeySize = 2048;
    this.defaultHashAlgorithm = 'SHA-256';
    this.defaultPasswordOptions = {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
      hashLength: 32
    };
  }

  // ============================================================================
  // PASSWORD HASHING
  // ============================================================================

  /**
   * Hash di una password utilizzando Argon2id (raccomandato)
   * @param {string} password - Password in chiaro
   * @param {Object} options - Opzioni per Argon2
   * @returns {Promise<Object>} Hash e salt
   */
  async hashPassword(password, options = {}) {
    try {
      const argonOptions = { ...this.defaultPasswordOptions, ...options };
      
      console.log('🔒 [CRYPTO] Hashing password with Argon2id');
      const hash = await argon2.hash(password, argonOptions);
      
      // Genera anche un salt separato per compatibilità
      const salt = crypto.randomBytes(32).toString('hex');
      
      return {
        hash,
        salt,
        algorithm: 'argon2id',
        options: argonOptions
      };
    } catch (error) {
      console.error('❌ [CRYPTO] Password hashing failed:', error.message);
      throw new CryptoError('Password hashing failed', error);
    }
  }

  /**
   * Fallback hash con bcrypt per compatibilità
   * @param {string} password - Password in chiaro
   * @param {number} rounds - Numero di round (min 12)
   * @returns {Promise<Object>} Hash e salt
   */
  async hashPasswordBcrypt(password, rounds = 12) {
    try {
      if (rounds < 12) {
        throw new Error('Bcrypt rounds must be at least 12 for security');
      }
      
      console.log(`🔒 [CRYPTO] Hashing password with bcrypt (${rounds} rounds)`);
      const salt = await bcrypt.genSalt(rounds);
      const hash = await bcrypt.hash(password, salt);
      
      return {
        hash,
        salt,
        algorithm: 'bcrypt',
        rounds
      };
    } catch (error) {
      console.error('❌ [CRYPTO] Bcrypt hashing failed:', error.message);
      throw new CryptoError('Bcrypt hashing failed', error);
    }
  }

  /**
   * Verifica una password
   * @param {string} password - Password in chiaro
   * @param {string} hash - Hash da verificare
   * @param {string} algorithm - Algoritmo usato
   * @returns {Promise<boolean>} True se la password è corretta
   */
  async verifyPassword(password, hash, algorithm = 'argon2id') {
    try {
      console.log(`🔍 [CRYPTO] Verifying password with ${algorithm}`);
      
      if (algorithm === 'argon2id') {
        return await argon2.verify(hash, password);
      } else if (algorithm === 'bcrypt') {
        return await bcrypt.compare(password, hash);
      } else {
        throw new Error(`Unsupported password algorithm: ${algorithm}`);
      }
    } catch (error) {
      console.error('❌ [CRYPTO] Password verification failed:', error.message);
      return false;
    }
  }

  // ============================================================================
  // JWT KEY MANAGEMENT
  // ============================================================================

  /**
   * Genera una coppia di chiavi per JWT (RS256)
   * @param {number} keySize - Dimensione della chiave in bit
   * @returns {Promise<Object>} Coppia di chiavi pubbliche/private
   */
  async generateJWTKeyPair(keySize = 2048) {
    try {
      console.log(`🔑 [CRYPTO] Generating RSA key pair (${keySize} bits)`);
      
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: keySize,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      const keyId = crypto.randomUUID();
      
      return {
        keyId,
        algorithm: 'RS256',
        publicKey,
        privateKey,
        createdAt: new Date().toISOString(),
        keySize
      };
    } catch (error) {
      console.error('❌ [CRYPTO] JWT key generation failed:', error.message);
      throw new CryptoError('JWT key generation failed', error);
    }
  }

  /**
   * Genera chiavi ECDSA per JWT (ES256)
   * @returns {Promise<Object>} Coppia di chiavi ECDSA
   */
  async generateECDSAKeyPair() {
    try {
      console.log('🔑 [CRYPTO] Generating ECDSA key pair (P-256)');
      
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      const keyId = crypto.randomUUID();
      
      return {
        keyId,
        algorithm: 'ES256',
        publicKey,
        privateKey,
        createdAt: new Date().toISOString(),
        curve: 'P-256'
      };
    } catch (error) {
      console.error('❌ [CRYPTO] ECDSA key generation failed:', error.message);
      throw new CryptoError('ECDSA key generation failed', error);
    }
  }

  /**
   * Genera una chiave HMAC per JWT (HS256)
   * @param {number} length - Lunghezza della chiave in byte
   * @returns {Object} Chiave HMAC
   */
  generateHMACKey(length = 64) {
    try {
      console.log(`🔑 [CRYPTO] Generating HMAC key (${length} bytes)`);
      
      const key = crypto.randomBytes(length);
      const keyId = crypto.randomUUID();
      
      return {
        keyId,
        algorithm: 'HS256',
        key: key.toString('base64'),
        createdAt: new Date().toISOString(),
        length
      };
    } catch (error) {
      console.error('❌ [CRYPTO] HMAC key generation failed:', error.message);
      throw new CryptoError('HMAC key generation failed', error);
    }
  }

  // ============================================================================
  // SYMMETRIC ENCRYPTION
  // ============================================================================

  /**
   * Crittografa dati con AES-GCM
   * @param {string} data - Dati da crittografare
   * @param {string} key - Chiave di crittografia (base64)
   * @returns {Object} Dati crittografati con IV e tag
   */
  encryptAES(data, key) {
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-gcm', keyBuffer);
      
      cipher.setAAD(Buffer.from('vicsam-auth'));
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: 'AES-256-GCM'
      };
    } catch (error) {
      console.error('❌ [CRYPTO] AES encryption failed:', error.message);
      throw new CryptoError('AES encryption failed', error);
    }
  }

  /**
   * Decrittografa dati AES-GCM
   * @param {Object} encryptedData - Dati crittografati
   * @param {string} key - Chiave di decrittografia (base64)
   * @returns {string} Dati decrittografati
   */
  decryptAES(encryptedData, key) {
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');
      
      const decipher = crypto.createDecipher('aes-256-gcm', keyBuffer);
      decipher.setAAD(Buffer.from('vicsam-auth'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('❌ [CRYPTO] AES decryption failed:', error.message);
      throw new CryptoError('AES decryption failed', error);
    }
  }

  // ============================================================================
  // TOKEN GENERATION
  // ============================================================================

  /**
   * Genera un token sicuro per refresh token
   * @param {number} length - Lunghezza del token
   * @returns {string} Token sicuro
   */
  generateSecureToken(length = 64) {
    try {
      return crypto.randomBytes(length).toString('base64url');
    } catch (error) {
      console.error('❌ [CRYPTO] Secure token generation failed:', error.message);
      throw new CryptoError('Secure token generation failed', error);
    }
  }

  /**
   * Genera un session ID univoco
   * @returns {string} Session ID
   */
  generateSessionId() {
    return crypto.randomUUID();
  }

  /**
   * Genera un JTI (JWT ID) univoco
   * @returns {string} JTI
   */
  generateJTI() {
    return crypto.randomUUID();
  }

  // ============================================================================
  // HASHING UTILITIES
  // ============================================================================

  /**
   * Hash di un valore con SHA-256
   * @param {string} value - Valore da hashare
   * @returns {string} Hash esadecimale
   */
  hashSHA256(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Hash di un refresh token per storage sicuro
   * @param {string} token - Token da hashare
   * @returns {string} Hash del token
   */
  hashRefreshToken(token) {
    return this.hashSHA256(`refresh_token_${token}_vicsam`);
  }

  // ============================================================================
  // KEY MANAGEMENT
  // ============================================================================

  /**
   * Carica chiavi dalla cache
   * @param {string} keyId - ID della chiave
   * @returns {Object|null} Chiave o null se non trovata
   */
  getKeyFromCache(keyId) {
    return this.keyCache.get(keyId) || null;
  }

  /**
   * Salva chiave nella cache
   * @param {string} keyId - ID della chiave
   * @param {Object} keyData - Dati della chiave
   */
  setKeyInCache(keyId, keyData) {
    this.keyCache.set(keyId, {
      ...keyData,
      cachedAt: Date.now()
    });
  }

  /**
   * Pulisce la cache delle chiavi
   * @param {number} maxAge - Età massima in millisecondi
   */
  cleanKeyCache(maxAge = 24 * 60 * 60 * 1000) { // 24 ore
    const now = Date.now();
    for (const [keyId, keyData] of this.keyCache.entries()) {
      if (now - keyData.cachedAt > maxAge) {
        this.keyCache.delete(keyId);
      }
    }
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Valida la forza di una password
   * @param {string} password - Password da validare
   * @returns {Object} Risultato della validazione
   */
  validatePasswordStrength(password) {
    const result = {
      isValid: true,
      score: 0,
      errors: [],
      suggestions: []
    };

    // Lunghezza minima
    if (password.length < 8) {
      result.isValid = false;
      result.errors.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      result.score += 2;
    } else {
      result.score += 1;
    }

    // Caratteri maiuscoli
    if (!/[A-Z]/.test(password)) {
      result.suggestions.push('Add uppercase letters');
    } else {
      result.score += 1;
    }

    // Caratteri minuscoli
    if (!/[a-z]/.test(password)) {
      result.suggestions.push('Add lowercase letters');
    } else {
      result.score += 1;
    }

    // Numeri
    if (!/\d/.test(password)) {
      result.suggestions.push('Add numbers');
    } else {
      result.score += 1;
    }

    // Caratteri speciali
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.suggestions.push('Add special characters');
    } else {
      result.score += 2;
    }

    // Password comuni
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      result.isValid = false;
      result.errors.push('Password contains common patterns');
    }

    return result;
  }
}

/**
 * Classe di errore personalizzata per la crittografia
 */
class CryptoError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'CryptoError';
    this.originalError = originalError;
  }
}

// Istanza singleton del servizio di crittografia
const cryptoService = new CryptoService();

module.exports = {
  cryptoService,
  CryptoService,
  CryptoError
};
