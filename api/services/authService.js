const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../database/database');
const { cryptoService } = require('./cryptoService');

/**
 * Servizio di autenticazione avanzato con gestione utenti, ruoli e sessioni
 */
class AuthService {
  constructor() {
    this.jwtSecrets = new Map();
    this.refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 giorni
    this.accessTokenExpiry = '15m';
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minuti
    this.initialized = false;
    
    // Initialize keys asynchronously
    this.initializeKeys();
  }

  /**
   * Inizializza le chiavi JWT
   */
  async initializeKeys() {
    try {
      // Carica chiavi esistenti dal database o genera nuove
      const keys = await this.loadOrGenerateJWTKeys();
      this.jwtSecrets.set('current', keys);
      this.initialized = true;
      console.log('🔑 [AUTH] JWT keys initialized');
    } catch (error) {
      console.error('❌ [AUTH] Failed to initialize JWT keys:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Ensures service is initialized before use
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeKeys();
    }
    if (!this.initialized) {
      throw new Error('AuthService failed to initialize');
    }
  }

  // ============================================================================
  // USER REGISTRATION
  // ============================================================================

  /**
   * Registra un nuovo utente
   * @param {Object} userData - Dati dell'utente
   * @returns {Promise<Object>} Utente creato (senza password)
   */
  async registerUser({ email, password, firstName, lastName, role = 'user' }) {
    const transaction = await db.beginTransaction();
    
    try {
      console.log('👤 [AUTH] Registering new user:', email);
      
      // Verifica se l'email esiste già
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new AuthError('Email already registered', 'EMAIL_EXISTS');
      }

      // Valida la password
      const passwordValidation = cryptoService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new AuthError(`Weak password: ${passwordValidation.errors.join(', ')}`, 'WEAK_PASSWORD');
      }

      // Hash della password
      const { hash: passwordHash, salt } = await cryptoService.hashPassword(password);
      
      // Crea l'utente
      const userUuid = uuidv4();
      const userResult = await transaction.query(`
        INSERT INTO users (uuid, email, password_hash, password_salt, first_name, last_name, is_active, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, TRUE, FALSE)
      `, [userUuid, email.toLowerCase(), passwordHash, salt, firstName, lastName]);

      const userId = userResult.rows.insertId;

      // Assegna il ruolo di default
      await this.assignRoleToUser(userId, role, null, transaction);

      // Log dell'audit
      await this.logAuditEvent(userId, 'user.register', 'users', userId, {
        email: email.toLowerCase(), // Log email in consistent lowercase format
        role,
        method: 'email_password'
      }, true, transaction);

      await transaction.commit();

      // Ritorna l'utente senza dati sensibili
      return await this.getUserById(userId);
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [AUTH] User registration failed:', error.message);
      throw error;
    }
  }

  // ============================================================================
  // USER LOGIN
  // ============================================================================

  /**
   * Autentica un utente con email e password
   * @param {string} email - Email dell'utente
   * @param {string} password - Password dell'utente
   * @param {Object} metadata - Metadati della richiesta (IP, User-Agent)
   * @returns {Promise<Object>} Dati di autenticazione
   */
  async loginUser(email, password, metadata = {}) {
    const transaction = await db.beginTransaction();
    
    try {
      console.log('🔐 [AUTH] User login attempt:', email);
      
      // Trova l'utente
      const user = await this.findUserByEmail(email);
      if (!user) {
        await this.logAuditEvent(null, 'user.login_failed', 'users', null, {
          email: email.toLowerCase(), // Log email in consistent lowercase format
          reason: 'user_not_found',
          ip: metadata.ip
        }, false, transaction);
        
        throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Verifica se l'account è bloccato
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        await this.logAuditEvent(user.id, 'user.login_blocked', 'users', user.id, {
          email: email.toLowerCase(), // Ensure email is consistently lowercase
          locked_until: user.locked_until,
          ip: metadata.ip
        }, false, transaction);
        
        throw new AuthError('Account temporarily locked', 'ACCOUNT_LOCKED');
      }

      // Verifica se l'account è attivo
      if (!user.is_active) {
        throw new AuthError('Account disabled', 'ACCOUNT_DISABLED');
      }

      // Verifica la password
      const passwordValid = await cryptoService.verifyPassword(password, user.password_hash, 'argon2id');
      
      if (!passwordValid) {
        // Incrementa i tentativi falliti
        await this.incrementFailedAttempts(user.id, transaction);
        
        await this.logAuditEvent(user.id, 'user.login_failed', 'users', user.id, {
          email: email.toLowerCase(), // Ensure email is consistently lowercase
          reason: 'invalid_password',
          failed_attempts: user.failed_login_attempts + 1,
          ip: metadata.ip
        }, false, transaction);
        
        throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Reset dei tentativi falliti e aggiornamento ultimo login
      await transaction.query(`
        UPDATE users 
        SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW()
        WHERE id = ?
      `, [user.id]);

      // Genera sessione e token
      const authData = await this.createUserSession(user, metadata, transaction);

      // Log dell'audit
      await this.logAuditEvent(user.id, 'user.login_success', 'users', user.id, {
        email: email.toLowerCase(), // Ensure email is consistently lowercase
        session_id: authData.sessionId,
        ip: metadata.ip,
        user_agent: metadata.userAgent
      }, true, transaction);

      await transaction.commit();

      console.log('✅ [AUTH] User login successful:', email);
      return authData;
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [AUTH] User login failed:', error.message);
      throw error;
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Crea una nuova sessione utente
   * @param {Object} user - Dati dell'utente
   * @param {Object} metadata - Metadati della sessione
   * @param {Object} transaction - Transazione database
   * @returns {Promise<Object>} Dati della sessione
   */
  async createUserSession(user, metadata, transaction) {
    try {
      // Genera ID univoci
      const sessionId = cryptoService.generateSessionId();
      const jti = cryptoService.generateJTI();
      const refreshToken = cryptoService.generateSecureToken();
      const refreshTokenHash = cryptoService.hashRefreshToken(refreshToken);

      // Carica ruoli e permessi dell'utente
      const userRoles = await this.getUserRoles(user.id);
      const userPermissions = await this.getUserPermissions(user.id);

      // Crea il payload JWT
      const jwtPayload = {
        sub: user.uuid,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`.trim(),
        roles: userRoles.map(r => r.name),
        permissions: userPermissions.map(p => p.name),
        jti,
        aud: 'vicsam-platform'
      };

      // Genera JWT
      const accessToken = this.generateAccessToken(jwtPayload);
      
      // Calcola scadenze
      const accessTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minuti
      const refreshTokenExpires = new Date(Date.now() + this.refreshTokenExpiry);

      // Salva la sessione nel database
      await transaction.query(`
        INSERT INTO user_sessions (
          session_id, user_id, jwt_jti, refresh_token_hash,
          ip_address, user_agent, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [sessionId, user.id, jti, refreshTokenHash, metadata.ip, metadata.userAgent, refreshTokenExpires]);

      // Salva il refresh token
      const sessionQuery = await transaction.query('SELECT id FROM user_sessions WHERE session_id = ?', [sessionId]);
      const sessionDbId = sessionQuery.rows[0].id;

      await transaction.query(`
        INSERT INTO refresh_tokens (
          token_hash, user_id, session_id, expires_at
        ) VALUES (?, ?, ?, ?)
      `, [refreshTokenHash, user.id, sessionDbId, refreshTokenExpires]);

      return {
        accessToken,
        refreshToken,
        sessionId,
        expiresIn: 900, // 15 minuti in secondi
        tokenType: 'Bearer',
        user: {
          id: user.uuid,
          email: user.email,
          name: jwtPayload.name,
          roles: jwtPayload.roles,
          permissions: jwtPayload.permissions,
          isVerified: user.is_verified
        }
      };
      
    } catch (error) {
      console.error('❌ [AUTH] Session creation failed:', error.message);
      throw new AuthError('Session creation failed', 'SESSION_ERROR');
    }
  }

  /**
   * Rinnova un access token usando un refresh token
   * @param {string} refreshToken - Refresh token
   * @param {Object} metadata - Metadati della richiesta
   * @returns {Promise<Object>} Nuovo access token
   */
  async refreshAccessToken(refreshToken, metadata = {}) {
    const transaction = await db.beginTransaction();
    
    try {
      console.log('🔄 [AUTH] Refreshing access token');
      
      const refreshTokenHash = cryptoService.hashRefreshToken(refreshToken);
      
      // Trova il refresh token nel database
      const tokenQuery = await transaction.query(`
        SELECT rt.*, us.user_id, us.session_id, us.ip_address, u.uuid, u.email, u.first_name, u.last_name, u.is_active
        FROM refresh_tokens rt
        JOIN user_sessions us ON rt.session_id = us.id
        JOIN users u ON rt.user_id = u.id
        WHERE rt.token_hash = ? AND rt.is_revoked = FALSE AND rt.expires_at > NOW()
      `, [refreshTokenHash]);

      if (tokenQuery.rows.length === 0) {
        throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
      }

      const tokenData = tokenQuery.rows[0];
      
      // Verifica che l'utente sia ancora attivo
      if (!tokenData.is_active) {
        throw new AuthError('User account disabled', 'ACCOUNT_DISABLED');
      }

      // Marca il token come usato
      await transaction.query(`
        UPDATE refresh_tokens 
        SET used_at = NOW() 
        WHERE token_hash = ?
      `, [refreshTokenHash]);

      // Aggiorna l'attività della sessione
      await transaction.query(`
        UPDATE user_sessions 
        SET last_activity = NOW() 
        WHERE session_id = ?
      `, [tokenData.session_id]);

      // Carica ruoli e permessi aggiornati
      const userRoles = await this.getUserRoles(tokenData.user_id);
      const userPermissions = await this.getUserPermissions(tokenData.user_id);

      // Genera nuovo JWT
      const jti = cryptoService.generateJTI();
      const jwtPayload = {
        sub: tokenData.uuid,
        email: tokenData.email,
        name: `${tokenData.first_name} ${tokenData.last_name}`.trim(),
        roles: userRoles.map(r => r.name),
        permissions: userPermissions.map(p => p.name),
        jti,
        aud: 'vicsam-platform'
      };

      const accessToken = this.generateAccessToken(jwtPayload);

      // Log dell'audit
      await this.logAuditEvent(tokenData.user_id, 'token.refresh', 'tokens', null, {
        session_id: tokenData.session_id,
        ip: metadata.ip
      }, true, transaction);

      await transaction.commit();

      return {
        accessToken,
        expiresIn: 900, // 15 minuti
        tokenType: 'Bearer'
      };
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [AUTH] Token refresh failed:', error.message);
      throw error;
    }
  }

  // ============================================================================
  // TOKEN GENERATION AND VERIFICATION
  // ============================================================================

  /**
   * Genera un access token JWT
   * @param {Object} payload - Payload del token
   * @returns {string} JWT token
   */
  generateAccessToken(payload) {
    try {
      if (!this.initialized) {
        throw new Error('AuthService not initialized');
      }
      
      const keys = this.jwtSecrets.get('current');
      if (!keys || !keys.privateKey) {
        throw new Error('JWT private key not available');
      }

      return jwt.sign(payload, keys.privateKey, {
        algorithm: 'RS256',
        expiresIn: this.accessTokenExpiry,
        issuer: 'vicsam-auth'
      });
    } catch (error) {
      console.error('❌ [AUTH] Access token generation failed:', error.message);
      throw new AuthError('Token generation failed', 'TOKEN_ERROR');
    }
  }

  /**
   * Verifica un access token JWT
   * @param {string} token - JWT token
   * @returns {Object} Payload decodificato
   */
  async verifyAccessToken(token) {
    try {
      await this.ensureInitialized();
      
      const keys = this.jwtSecrets.get('current');
      if (!keys || !keys.publicKey) {
        throw new Error('JWT public key not available');
      }

      const decoded = jwt.verify(token, keys.publicKey, {
        algorithm: 'RS256',
        issuer: 'vicsam-auth'
      });

      // Verifica se il JTI è ancora valido (sessione attiva)
      const sessionQuery = await db.query(`
        SELECT us.is_active, u.is_active as user_active
        FROM user_sessions us
        JOIN users u ON us.user_id = u.id
        WHERE us.jwt_jti = ? AND us.expires_at > NOW()
      `, [decoded.jti]);

      if (sessionQuery.rows.length === 0 || !sessionQuery.rows[0].is_active || !sessionQuery.rows[0].user_active) {
        throw new Error('Session invalid or expired');
      }

      return decoded;
    } catch (error) {
      console.error('❌ [AUTH] Token verification failed:', error.message);
      throw new AuthError('Invalid token', 'INVALID_TOKEN');
    }
  }

  // ============================================================================
  // USER AND ROLE MANAGEMENT
  // ============================================================================

  /**
   * Trova un utente per email
   * @param {string} email - Email dell'utente
   * @returns {Promise<Object|null>} Utente o null
   */
  async findUserByEmail(email) {
    try {
      const result = await db.query(`
        SELECT * FROM users WHERE email = ? AND is_active = TRUE
      `, [email.toLowerCase()]);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('❌ [AUTH] Find user by email failed:', error.message);
      throw error;
    }
  }

  /**
   * Ottiene un utente per ID
   * @param {number} userId - ID dell'utente
   * @returns {Promise<Object|null>} Utente senza dati sensibili
   */
  async getUserById(userId) {
    try {
      const result = await db.query(`
        SELECT id, uuid, email, first_name, last_name, is_active, is_verified, last_login_at, created_at
        FROM users WHERE id = ?
      `, [userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const roles = await this.getUserRoles(userId);
      
      return {
        ...user,
        email: user.email.toLowerCase(), // Ensure email is consistently lowercase
        roles: roles.map(r => ({
          name: r.name,
          displayName: r.display_name
        }))
      };
    } catch (error) {
      console.error('❌ [AUTH] Get user by ID failed:', error.message);
      throw error;
    }
  }

  /**
   * Cambia la password di un utente
   * @param {number} userId - ID dell'utente
   * @param {string} currentPassword - Password attuale
   * @param {string} newPassword - Nuova password
   * @returns {Promise<boolean>} Successo dell'operazione
   */
  async changeUserPassword(userId, currentPassword, newPassword) {
    const transaction = await db.beginTransaction();
    
    try {
      console.log('🔒 [AUTH] Change password for user:', userId);
      
      // Ottieni l'utente
      const user = await this.getUserById(userId);
      if (!user) {
        throw new AuthError('User not found', 'USER_NOT_FOUND');
      }
      
      // Verifica la password attuale
      const isCurrentPasswordValid = await cryptoService.verifyPassword(
        currentPassword, 
        user.password_hash, 
        'argon2id'
      );
      
      if (!isCurrentPasswordValid) {
        await this.logAuditEvent(userId, 'password.change_failed', 'users', userId, {
          reason: 'invalid_current_password'
        }, false, transaction);
        
        throw new AuthError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
      }
      
      // Valida la nuova password
      const passwordValidation = cryptoService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AuthError(`Weak password: ${passwordValidation.errors.join(', ')}`, 'WEAK_PASSWORD');
      }
      
      // Hash della nuova password
      const { hash: newPasswordHash, salt: newPasswordSalt } = await cryptoService.hashPassword(newPassword);
      
      // Aggiorna la password nel database
      await transaction.query(`
        UPDATE users 
        SET password_hash = ?, password_salt = ?, updated_at = NOW()
        WHERE id = ?
      `, [newPasswordHash, newPasswordSalt, userId]);
      
      // Revoca tutte le sessioni attive (forza re-login)
      await transaction.query(`
        UPDATE user_sessions 
        SET is_active = FALSE 
        WHERE user_id = ? AND is_active = TRUE
      `, [userId]);
      
      // Revoca tutti i refresh token
      await transaction.query(`
        UPDATE refresh_tokens 
        SET is_revoked = TRUE, revoked_at = NOW(), revoke_reason = 'password_changed'
        WHERE user_id = ? AND is_revoked = FALSE
      `, [userId]);
      
      // Log dell'audit
      await this.logAuditEvent(userId, 'password.changed', 'users', userId, {
        sessions_revoked: true
      }, true, transaction);
      
      await transaction.commit();
      
      console.log('✅ [AUTH] Password changed successfully for user:', userId);
      return true;
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [AUTH] Change password failed:', error.message);
      throw error;
    }
  }

  /**
   * Lista gli utenti con paginazione
   * @param {Object} options - Opzioni di paginazione
   * @returns {Promise<Object>} Lista utenti e totale
   */
  async listUsers({ limit = 20, offset = 0, search = '', role = null }) {
    try {
      console.log('👥 [AUTH] Listing users with options:', { limit, offset, search, role });
      
      let whereConditions = ['u.is_active = TRUE'];
      let queryParams = [];
      
      // Filtro per ricerca
      if (search) {
        whereConditions.push('(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
        const searchPattern = `%${search.toLowerCase()}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }
      
      // Filtro per ruolo
      if (role) {
        whereConditions.push('r.name = ?');
        queryParams.push(role);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Query per contare il totale
      const countQuery = `
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams);
      const total = countResult.rows[0].total;
      
      // Query per ottenere gli utenti
      const usersQuery = `
        SELECT 
          u.id,
          u.uuid,
          u.email,
          u.first_name,
          u.last_name,
          u.is_active,
          u.is_verified,
          u.last_login_at,
          u.created_at,
          GROUP_CONCAT(DISTINCT r.name) as roles,
          GROUP_CONCAT(DISTINCT r.display_name) as role_names
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE ${whereClause}
        GROUP BY u.id, u.uuid, u.email, u.first_name, u.last_name, u.is_active, u.is_verified, u.last_login_at, u.created_at
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const usersResult = await db.query(usersQuery, [...queryParams, limit, offset]);
      
      // Formatta i risultati
      const users = usersResult.rows.map(user => ({
        id: user.uuid,
        email: user.email.toLowerCase(), // Ensure email is consistently lowercase
        name: `${user.first_name} ${user.last_name}`.trim(),
        firstName: user.first_name,
        lastName: user.last_name,
        isActive: user.is_active,
        isVerified: user.is_verified,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        roles: user.roles ? user.roles.split(',') : [],
        roleNames: user.role_names ? user.role_names.split(',') : []
      }));
      
      console.log(`✅ [AUTH] Retrieved ${users.length} users (total: ${total})`);
      
      return { users, total };
      
    } catch (error) {
      console.error('❌ [AUTH] List users failed:', error.message);
      throw error;
    }
  }

  /**
   * Lista tutti i ruoli disponibili
   * @returns {Promise<Array>} Lista dei ruoli
   */
  async listRoles() {
    try {
      console.log('📋 [AUTH] Listing roles');
      
      const result = await db.query(`
        SELECT 
          r.id,
          r.name,
          r.display_name,
          r.description,
          r.permissions,
          r.is_system_role,
          r.created_at,
          COUNT(ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        GROUP BY r.id, r.name, r.display_name, r.description, r.permissions, r.is_system_role, r.created_at
        ORDER BY r.is_system_role DESC, r.name ASC
      `);
      
      const roles = result.rows.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        permissions: JSON.parse(role.permissions || '[]'),
        isSystemRole: role.is_system_role,
        userCount: role.user_count,
        createdAt: role.created_at
      }));
      
      console.log(`✅ [AUTH] Retrieved ${roles.length} roles`);
      return roles;
      
    } catch (error) {
      console.error('❌ [AUTH] List roles failed:', error.message);
      throw error;
    }
  }

  /**
   * Ottiene i dettagli di un ruolo specifico
   * @param {string} roleName - Nome del ruolo
   * @returns {Promise<Object|null>} Dettagli del ruolo
   */
  async getRoleDetails(roleName) {
    try {
      console.log('📋 [AUTH] Getting role details:', roleName);
      
      const result = await db.query(`
        SELECT 
          r.*,
          COUNT(ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        WHERE r.name = ?
        GROUP BY r.id
      `, [roleName]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const role = result.rows[0];
      
      // Ottieni i permessi associati
      const permissionsResult = await db.query(`
        SELECT p.name, p.display_name, p.description, p.resource, p.action
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
        ORDER BY p.resource, p.action
      `, [role.id]);
      
      return {
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        permissions: JSON.parse(role.permissions || '[]'),
        detailedPermissions: permissionsResult.rows,
        isSystemRole: role.is_system_role,
        userCount: role.user_count,
        createdAt: role.created_at,
        updatedAt: role.updated_at
      };
      
    } catch (error) {
      console.error('❌ [AUTH] Get role details failed:', error.message);
      throw error;
    }
  }

  // ============================================================================
  // SECURITY HELPERS
  // ============================================================================

  /**
   * Incrementa i tentativi di login falliti
   * @param {number} userId - ID dell'utente
   * @param {Object} transaction - Transazione database
   */
  async incrementFailedAttempts(userId, transaction) {
    try {
      const result = await transaction.query(`
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE 
              WHEN failed_login_attempts + 1 >= ? THEN DATE_ADD(NOW(), INTERVAL ? MICROSECOND)
              ELSE locked_until 
            END
        WHERE id = ?
      `, [this.maxFailedAttempts, this.lockoutDuration * 1000, userId]);
      
      return result;
    } catch (error) {
      console.error('❌ [AUTH] Increment failed attempts failed:', error.message);
      throw error;
    }
  }

  /**
   * Log di un evento di audit
   * @param {number|null} userId - ID dell'utente
   * @param {string} action - Azione eseguita
   * @param {string} resource - Risorsa interessata
   * @param {string|null} resourceId - ID della risorsa
   * @param {Object} details - Dettagli aggiuntivi
   * @param {boolean} success - Se l'azione è riuscita
   * @param {Object} transaction - Transazione database
   */
  async logAuditEvent(userId, action, resource, resourceId, details, success, transaction = null) {
    const db_conn = transaction || db;
    
    try {
      await db_conn.query(`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details, success)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, action, resource, resourceId, JSON.stringify(details), success]);
    } catch (error) {
      console.error('❌ [AUTH] Audit logging failed:', error.message);
      // Non lanciare errore per evitare di bloccare l'operazione principale
    }
  }

  /**
   * Carica o genera le chiavi JWT
   * @returns {Promise<Object>} Chiavi JWT
   */
  async loadOrGenerateJWTKeys() {
    try {
      // Cerca chiavi attive nel database
      const keyResult = await db.query(`
        SELECT * FROM crypto_keys 
        WHERE key_type = 'jwt_signing' AND is_active = TRUE
        ORDER BY created_at DESC LIMIT 1
      `);

      if (keyResult.rows.length > 0) {
        const keyData = keyResult.rows[0];
        
        // Decrittografa la chiave privata se presente
        let privateKey = null;
        if (keyData.private_key_encrypted) {
          try {
            privateKey = cryptoService.decryptPrivateKey(keyData.private_key_encrypted);
          } catch (error) {
            console.error('❌ [AUTH] Failed to decrypt private key:', error.message);
            throw new Error('Failed to decrypt private key');
          }
        }
        
        return {
          keyId: keyData.key_id,
          publicKey: keyData.public_key,
          privateKey: privateKey,
          algorithm: keyData.algorithm
        };
      } else {
        // Genera nuove chiavi
        console.log('🔑 [AUTH] Generating new JWT keys');
        const keys = await cryptoService.generateJWTKeyPair();
        
        // Crittografa la chiave privata prima del salvataggio
        const encryptedPrivateKey = cryptoService.encryptPrivateKey(keys.privateKey);
        
        // Salva le chiavi nel database
        await db.query(`
          INSERT INTO crypto_keys (key_id, key_type, algorithm, public_key, private_key_encrypted)
          VALUES (?, 'jwt_signing', ?, ?, ?)
        `, [keys.keyId, keys.algorithm, keys.publicKey, encryptedPrivateKey]);

        return keys;
      }
    } catch (error) {
      console.error('❌ [AUTH] Load/generate JWT keys failed:', error.message);
      throw error;
    }
  }

  /**
   * Logout dell'utente (revoca sessione e refresh token)
   * @param {string} sessionId - ID della sessione
   * @returns {Promise<void>}
   */
  async logoutUser(sessionId) {
    const transaction = await db.beginTransaction();
    
    try {
      console.log('👋 [AUTH] User logout:', sessionId);
      
      // Disattiva la sessione
      await transaction.query(`
        UPDATE user_sessions SET is_active = FALSE WHERE session_id = ?
      `, [sessionId]);

      // Revoca tutti i refresh token della sessione
      await transaction.query(`
        UPDATE refresh_tokens rt
        JOIN user_sessions us ON rt.session_id = us.id
        SET rt.is_revoked = TRUE, rt.revoked_at = NOW(), rt.revoke_reason = 'logout'
        WHERE us.session_id = ?
      `, [sessionId]);

      await transaction.commit();
      console.log('✅ [AUTH] User logged out successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [AUTH] Logout failed:', error.message);
      throw error;
    }
  }

  /**
   * Ottiene un utente completo (con ruoli) per email in una singola query ottimizzata
   * @param {string} email - Email dell'utente
   * @returns {Promise<Object|null>} Utente completo senza dati sensibili o null
   */
  async getUserByEmailComplete(email) {
    try {
      const result = await db.query(`
        SELECT 
          u.id, 
          u.uuid, 
          u.email, 
          u.first_name, 
          u.last_name, 
          u.is_active, 
          u.is_verified, 
          u.last_login_at, 
          u.created_at
        FROM users u 
        WHERE u.email = ? AND u.is_active = TRUE
      `, [email.toLowerCase()]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      const roles = await this.getUserRoles(user.id);
      
      return {
        ...user,
        email: user.email.toLowerCase(), // Ensure email is consistently lowercase
        roles: roles.map(r => ({
          name: r.name,
          displayName: r.display_name
        }))
      };
    } catch (error) {
      console.error('❌ [AUTH] Get user by email complete failed:', error.message);
      throw error;
    }
  }

  /**
   * Assegna un ruolo a un utente
   * @param {number} userId - ID dell'utente
   * @param {string} roleName - Nome del ruolo da assegnare
   * @param {number|null} assignedBy - ID dell'utente che assegna il ruolo
   * @param {Object|null} transaction - Transazione del database
   * @param {Date|null} expiresAt - Data di scadenza del ruolo (opzionale)
   * @returns {Promise<void>}
   */
  async assignRoleToUser(userId, roleName, assignedBy = null, transaction = null, expiresAt = null) {
    try {
      console.log(`👑 [AUTH] Assigning role '${roleName}' to user ${userId}`);
      
      // Trova l'ID del ruolo
      const roleResult = await (transaction || db).query(`
        SELECT id FROM roles WHERE name = ?
      `, [roleName]);
      
      if (roleResult.rows.length === 0) {
        throw new Error(`Role '${roleName}' not found`);
      }
      
      const roleId = roleResult.rows[0].id;
      
      // Verifica se l'utente ha già questo ruolo
      const existingResult = await (transaction || db).query(`
        SELECT id FROM user_roles 
        WHERE user_id = ? AND role_id = ? AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId, roleId]);
      
      if (existingResult.rows.length > 0) {
        console.log(`⚠️ [AUTH] User ${userId} already has role '${roleName}'`);
        return;
      }
      
      // Assegna il ruolo
      await (transaction || db).query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
        VALUES (?, ?, ?, ?)
      `, [userId, roleId, assignedBy, expiresAt]);
      
      console.log(`✅ [AUTH] Role '${roleName}' assigned to user ${userId}`);
      
      // Log dell'audit
      await this.logAuditEvent(assignedBy || userId, 'role.assign', 'user_roles', `${userId}:${roleId}`, {
        userId,
        roleName,
        assignedBy,
        expiresAt
      }, true, transaction);
      
    } catch (error) {
      console.error(`❌ [AUTH] Assign role failed:`, error.message);
      throw error;
    }
  }

  /**
   * Ottiene i ruoli di un utente
   * @param {number} userId - ID dell'utente
   * @returns {Promise<Array>} Lista dei ruoli dell'utente
   */
  async getUserRoles(userId) {
    try {
      console.log(`👑 [AUTH] Getting roles for user ${userId}`);
      
      const result = await db.query(`
        SELECT 
          r.id,
          r.name,
          r.display_name,
          r.description,
          r.permissions,
          r.is_system_role,
          ur.assigned_at,
          ur.expires_at,
          ur.assigned_by
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ? 
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ORDER BY r.is_system_role DESC, r.name ASC
      `, [userId]);
      
      const roles = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        permissions: JSON.parse(row.permissions || '[]'),
        isSystemRole: row.is_system_role,
        assignedAt: row.assigned_at,
        expiresAt: row.expires_at,
        assignedBy: row.assigned_by
      }));
      
      console.log(`✅ [AUTH] Found ${roles.length} roles for user ${userId}`);
      return roles;
      
    } catch (error) {
      console.error(`❌ [AUTH] Get user roles failed:`, error.message);
      throw error;
    }
  }

  /**
   * Ottiene tutti i permessi di un utente attraverso i suoi ruoli
   * @param {number} userId - ID dell'utente
   * @returns {Promise<Array>} Lista dei permessi dell'utente
   */
  async getUserPermissions(userId) {
    try {
      console.log(`🔑 [AUTH] Getting permissions for user ${userId}`);
      
      const result = await db.query(`
        SELECT DISTINCT
          p.id,
          p.name,
          p.display_name,
          p.description,
          p.resource,
          p.action
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = ? 
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
        ORDER BY p.resource ASC, p.action ASC
      `, [userId]);
      
      const permissions = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        resource: row.resource,
        action: row.action
      }));
      
      console.log(`✅ [AUTH] Found ${permissions.length} permissions for user ${userId}`);
      return permissions;
      
    } catch (error) {
      console.error(`❌ [AUTH] Get user permissions failed:`, error.message);
      throw error;
    }
  }

  // ============================================================================
}

// /**
//  * Classe di errore personalizzata per l'autenticazione
//  */
class AuthError extends Error {
  constructor(message, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// Istanza singleton del servizio di autenticazione
const authService = new AuthService();

module.exports = {
  authService,
  AuthService,
  AuthError
};
