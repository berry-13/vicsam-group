const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

/**
 * SICUREZZA SSL DATABASE
 * 
 * Questo modulo implementa una configurazione SSL sicura per il database:
 * 
 * AMBIENTI DI PRODUZIONE:
 * - Validazione certificati abilitata (rejectUnauthorized: true)
 * - Verifica identità server abilitata
 * - Supporto per certificati personalizzati tramite variabili d'ambiente
 * 
 * AMBIENTI DI SVILUPPO:
 * - Permette certificati self-signed solo se esplicitamente configurato
 * - Mostra avvisi di sicurezza appropriati
 * 
 * VARIABILI D'AMBIENTE:
 * - DB_SSL: 'true' per abilitare SSL
 * - DB_SSL_REJECT_UNAUTHORIZED: 'false' per disabilitare validazione (solo sviluppo)
 * - DB_SSL_CA: Percorso o contenuto del certificate authority
 * - DB_SSL_CERT: Percorso o contenuto del certificato client
 * - DB_SSL_KEY: Percorso o contenuto della chiave privata client
 * - NODE_ENV: 'production', 'staging', 'development', 'test'
 */

/**
 * Configurazione SSL sicura per ambiente di produzione
 * @returns {Object|false} Configurazione SSL appropriata per l'ambiente
 */
function getSSLConfig() {
  if (process.env.DB_SSL !== 'true') {
    return false;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isStaging = process.env.NODE_ENV === 'staging';
  
  // In production e staging, abilita la validazione completa dei certificati
  if (isProduction || isStaging) {
    const sslConfig = {
      rejectUnauthorized: true,  // Sicuro: valida i certificati
      checkServerIdentity: true // Verifica l'identità del server
    };

    // Opzioni aggiuntive per certificati personalizzati in produzione
    if (process.env.DB_SSL_CA) {
      sslConfig.ca = process.env.DB_SSL_CA;
    }
    if (process.env.DB_SSL_CERT) {
      sslConfig.cert = process.env.DB_SSL_CERT;
    }
    if (process.env.DB_SSL_KEY) {
      sslConfig.key = process.env.DB_SSL_KEY;
    }

    return sslConfig;
  }
  
  // Solo in sviluppo locale, permetti certificati self-signed
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.warn('⚠️ [DB] SSL certificate validation disabled for development environment');
    return {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
    };
  }

  // Default sicuro per ambienti non specificati
  console.warn('⚠️ [DB] Unknown environment, using secure SSL defaults');
  return {
    rejectUnauthorized: true,
    checkServerIdentity: true
  };
}

/**
 * Configurazione del database
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vicsam_auth',
  charset: 'utf8mb4',
  multipleStatements: true,
  ssl: getSSLConfig()
};

const dbConfigWithoutDatabase = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4',
  multipleStatements: true,
  ssl: getSSLConfig()
};

/**
 * Pool di connessioni per performance ottimali
 */
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Wrapper per query con logging e error handling
 */
class DatabaseService {
  constructor() {
    this.pool = pool;
    // Fields that should be redacted in logs for security
    this.sensitiveFields = new Set([
      'password', 'token', 'secret', 'key', 'auth', 'credential',
      'pass', 'pwd', 'hash', 'salt', 'refresh_token', 'access_token',
      'session_id', 'api_key', 'private_key', 'signature'
    ]);
    
    // Control parameter logging based on environment
    this.logParams = process.env.NODE_ENV !== 'production' || process.env.DB_LOG_PARAMS === 'true';
    
    // Log SSL configuration status for security awareness
    this.logSSLStatus();
  }

  /**
   * Logs the current SSL configuration status for security monitoring
   */
  logSSLStatus() {
    const sslConfig = dbConfig.ssl;
    
    if (!sslConfig) {
      console.log('🔓 [DB] SSL: Disabled');
      return;
    }

    const isSecure = sslConfig.rejectUnauthorized !== false;
    const environment = process.env.NODE_ENV || 'unknown';
    
    if (isSecure) {
      console.log(`🔒 [DB] SSL: Enabled with certificate validation (${environment})`);
    } else {
      console.warn(`⚠️ [DB] SSL: Enabled but certificate validation disabled (${environment})`);
      if (environment === 'production') {
        console.error('❌ [DB] SECURITY WARNING: SSL certificate validation disabled in production!');
      }
    }
  }

  /**
   * Filters sensitive parameters for safe logging
   * Redacts potential passwords, tokens, and other sensitive data
   * @param {Array} params - Query parameters
   * @returns {Array} Filtered parameters with sensitive data redacted
   * 
   * Security features:
   * - Redacts object properties with sensitive field names
   * - Identifies and redacts token-like strings (long alphanumeric)
   * - Identifies and redacts password-like strings (complex patterns)
   * - Preserves non-sensitive data for debugging purposes
   */
  filterSensitiveParams(params) {
    if (!Array.isArray(params)) {
      return params;
    }

    return params.map((param, index) => {
      // If param is an object, check for sensitive keys
      if (param && typeof param === 'object') {
        const filtered = {};
        for (const [key, value] of Object.entries(param)) {
          const lowerKey = key.toLowerCase();
          const isSensitive = Array.from(this.sensitiveFields).some(field => 
            lowerKey.includes(field)
          );
          filtered[key] = isSensitive ? '[REDACTED]' : value;
        }
        return filtered;
      }

      // For primitive values, we can't easily determine if they're sensitive
      // So we'll redact based on common patterns or position
      if (typeof param === 'string') {
        // Redact values that look like tokens or hashes (long alphanumeric strings)
        if (param.length > 20 && /^[a-zA-Z0-9+/=._-]+$/.test(param)) {
          return '[REDACTED_TOKEN]';
        }
        // Redact values that look like passwords (containing mix of chars)
        if (param.length >= 8 && /[A-Z]/.test(param) && /[a-z]/.test(param) && /\d/.test(param)) {
          return '[REDACTED_PASSWORD]';
        }
      }

      return param;
    });
  }

  /**
   * Esegue una query con parametri
   * @param {string} sql - Query SQL
   * @param {Array} params - Parametri per la query
   * @returns {Promise<Object>} Risultato della query
   */
  async query(sql, params = []) {
    const start = Date.now();
    let connection;
    
    try {
      console.log('🔍 [DB] Executing query:', sql.substring(0, 100) + '...');
      if (this.logParams) {
        console.log('🔍 [DB] Parameters:', this.filterSensitiveParams(params));
      }
      
      connection = await this.pool.getConnection();
      const [rows, fields] = await connection.execute(sql, params);
      
      const duration = Date.now() - start;
      console.log(`✅ [DB] Query executed in ${duration}ms`);
      
      return { rows, fields, meta: { duration, rowCount: rows.length } };
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ [DB] Query failed after ${duration}ms:`, error.message);
      console.error('❌ [DB] SQL:', sql);
      if (this.logParams) {
        console.error('❌ [DB] Params:', this.filterSensitiveParams(params));
      }
      throw new DatabaseError(`Database query failed: ${error.message}`, error.code);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Executes query without database selection (for database creation)
   * @param {string} sql - Query SQL
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  async queryWithoutDatabase(sql, params = []) {
    const start = Date.now();
    let connection;
    
    try {
      console.log('🔍 [DB] Executing query:', sql.substring(0, 100) + '...');
      if (this.logParams) {
        console.log('🔍 [DB] Parameters:', this.filterSensitiveParams(params));
      }
      
      connection = await mysql.createConnection(dbConfigWithoutDatabase);
      const [rows, fields] = await connection.execute(sql, params);
      
      const duration = Date.now() - start;
      console.log(`✅ [DB] Query executed in ${duration}ms`);
      
      return { rows, fields, meta: { duration, rowCount: rows.length } };
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ [DB] Query failed after ${duration}ms:`, error.message);
      console.error('❌ [DB] SQL:', sql);
      if (this.logParams) {
        console.error('❌ [DB] Params:', this.filterSensitiveParams(params));
      }
      throw new DatabaseError(`Database query failed: ${error.message}`, error.code);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  /**
   * Executes unprepared query (for DDL statements like CREATE TRIGGER, PROCEDURE, etc.)
   * @param {string} sql - Query SQL
   * @returns {Promise<Object>} Query result
   */
  async queryUnprepared(sql) {
    const start = Date.now();
    let connection;
    
    try {
      console.log('🔍 [DB] Executing query:', sql.substring(0, 100) + '...');
      
      connection = await this.pool.getConnection();
      const [rows, fields] = await connection.query(sql);
      
      const duration = Date.now() - start;
      console.log(`✅ [DB] Query executed in ${duration}ms`);
      
      return { rows, fields, meta: { duration, rowCount: rows.length } };
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ [DB] Query failed after ${duration}ms:`, error.message);
      console.error('❌ [DB] SQL:', sql);
      throw new DatabaseError(`Database query failed: ${error.message}`, error.code);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  /**
   * Inizia una transazione
   * @returns {Promise<Object>} Connessione con transazione
   */
  async beginTransaction() {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    
    return {
      query: async (sql, params = []) => {
        try {
          const [rows, fields] = await connection.execute(sql, params);
          return { rows, fields };
        } catch (error) {
          console.error('❌ [DB TRANSACTION] Query failed:', error.message);
          throw error;
        }
      },
      commit: async () => {
        await connection.commit();
        connection.release();
      },
      rollback: async () => {
        await connection.rollback();
        connection.release();
      }
    };
  }

  /**
   * Verifica la connessione al database
   * @returns {Promise<boolean>} True se la connessione è attiva
   */
  async testConnection() {
    try {
      const { rows } = await this.query('SELECT 1 as test');
      return rows[0].test === 1;
    } catch (error) {
      console.error('❌ [DB] Connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Ottiene informazioni sul database
   * Note: Excludes sensitive credentials (user, password) for security
   * @returns {Promise<Object>} Informazioni sul database
   */
  async getDatabaseInfo() {
    try {
      const versionQuery = await this.query('SELECT VERSION() as version');
      const tablesQuery = await this.query(`
        SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ?
      `, [dbConfig.database]);

      return {
        version: versionQuery.rows[0].version,
        database: dbConfig.database,
        tables: tablesQuery.rows,
        connectionConfig: {
          host: dbConfig.host,
          port: dbConfig.port,
          ssl: this.getSSLSecurityInfo()
        }
      };
    } catch (error) {
      console.error('❌ [DB] Failed to get database info:', error.message);
      throw error;
    }
  }

  /**
   * Chiude il pool di connessioni
   */
  async close() {
    await this.pool.end();
  }

  /**
   * Costruisce una query per aggregazione di stringhe compatibile con diversi database
   * @param {string} field - Campo da aggregare 
   * @param {string} separator - Separatore per la concatenazione (default: ',')
   * @returns {string} SQL per aggregazione di stringhe
   */
  getStringAggregationSQL(field, separator = ',') {
    // Rileva il tipo di database dalla configurazione
    const dbType = this.detectDatabaseType();
    
    switch (dbType) {
      case 'mysql':
      case 'mariadb':
        return `GROUP_CONCAT(${field} SEPARATOR '${separator}')`;
        
      case 'postgresql':
      case 'postgres':
        return `STRING_AGG(${field}::text, '${separator}')`;
        
      case 'sqlite':
        return `GROUP_CONCAT(${field}, '${separator}')`;
        
      case 'sqlserver':
      case 'mssql':
        return `STRING_AGG(${field}, '${separator}')`;
        
      default:
        // Fallback per database non supportati: usa CASE WHEN o subquery semplice
        console.warn(`⚠️ [DB] Unknown database type '${dbType}', using MySQL-compatible fallback`);
        return `GROUP_CONCAT(${field} SEPARATOR '${separator}')`;
    }
  }

  /**
   * Rileva il tipo di database dalla configurazione
   * @returns {string} Tipo di database
   */
  detectDatabaseType() {
    // Prima priorità: variabile di ambiente esplicita
    const explicitDbType = process.env.DB_TYPE || process.env.DATABASE_TYPE;
    if (explicitDbType) {
      return explicitDbType.toLowerCase();
    }
    
    // Seconda priorità: rileva dal driver utilizzato
    try {
      if (require.resolve('mysql2')) {
        return 'mysql';
      }
    } catch (e) {
      // mysql2 non disponibile
    }
    
    try {
      if (require.resolve('pg')) {
        return 'postgresql';
      }
    } catch (e) {
      // pg non disponibile
    }
    
    // Terza priorità: rileva dalla porta di default
    const port = parseInt(process.env.DB_PORT || dbConfig.port);
    switch (port) {
      case 3306: return 'mysql';
      case 5432: return 'postgresql'; 
      case 1433: return 'sqlserver';
      default: return 'mysql'; // Default fallback sicuro
    }
  }

  /**
   * Get SSL security information for reporting (safe for info endpoints)
   * @returns {Object} SSL security status without sensitive details
   */
  getSSLSecurityInfo() {
    const sslConfig = dbConfig.ssl;
    
    if (!sslConfig) {
      return {
        enabled: false,
        secure: false,
        status: 'disabled'
      };
    }

    const isSecure = sslConfig.rejectUnauthorized !== false;
    const environment = process.env.NODE_ENV || 'unknown';
    
    return {
      enabled: true,
      secure: isSecure,
      status: isSecure ? 'secure' : 'insecure',
      certificateValidation: isSecure ? 'enabled' : 'disabled',
      environment: environment,
      warning: !isSecure ? 'Certificate validation disabled' : null
    };
  }

  /**
   * Validates that the ORDER BY direction is safe to use in SQL queries
   * @param {string} direction - The ORDER BY direction to validate
   * @returns {string} The validated, normalized direction ('ASC' or 'DESC')
   * @throws {Error} If the direction is not valid
   */
  validateOrderDirection(direction) {
    if (!direction || typeof direction !== 'string') {
      throw new Error('Order direction must be a non-empty string');
    }
    
    const normalizedDirection = direction.trim().toUpperCase();
    const allowedDirections = ['ASC', 'DESC'];
    
    if (!allowedDirections.includes(normalizedDirection)) {
      throw new Error(`Invalid ORDER BY direction: '${direction}'. Allowed values: ${allowedDirections.join(', ')}`);
    }
    
    return normalizedDirection;
  }

  /**
   * Validates database field names to prevent injection
   * @param {string} field - The field name to validate
   * @returns {string} The validated field name
   * @throws {Error} If the field name contains potentially dangerous characters
   */
  validateFieldName(field) {
    if (!field || typeof field !== 'string') {
      throw new Error('Field name must be a non-empty string');
    }
    
    // Allow standard database field patterns: letters, numbers, underscores, dots (for table.field)
    const fieldPattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)?$/;
    
    if (!fieldPattern.test(field.trim())) {
      throw new Error(`Invalid field name: '${field}'. Field names must contain only letters, numbers, underscores, and optional table prefix (table.field)`);
    }
    
    return field.trim();
  }
}

/**
 * Classe di errore personalizzata per il database
 */
class DatabaseError extends Error {
  constructor(message, code = null) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
  }
}

/**
 * Helper per costruire query dinamiche
 */
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectFields = ['*'];
    this.whereConditions = [];
    this.joinClauses = [];
    this.orderByClauses = [];
    this.limitValue = null;
    this.offsetValue = null;
    this.params = [];
    
    // Whitelist of allowed SQL operators to prevent injection
    this.allowedOperators = new Set([
      '=', '!=', '<>', '<', '>', '<=', '>=',
      'LIKE', 'NOT LIKE', 'ILIKE', 'NOT ILIKE',
      'IN', 'NOT IN',
      'IS', 'IS NOT', 'IS NULL', 'IS NOT NULL',
      'REGEXP', 'NOT REGEXP', 'RLIKE',
      'BETWEEN', 'NOT BETWEEN'
    ]);
  }

  /**
   * Validates that the operator is safe to use in SQL queries
   * @param {string} operator - The SQL operator to validate
   * @throws {Error} If the operator is not in the whitelist
   */
  validateOperator(operator) {
    if (!operator || typeof operator !== 'string') {
      throw new Error('Operator must be a non-empty string');
    }
    
    const normalizedOperator = operator.trim().toUpperCase();
    
    if (!this.allowedOperators.has(normalizedOperator)) {
      throw new Error(`Invalid SQL operator: '${operator}'. Allowed operators: ${Array.from(this.allowedOperators).join(', ')}`);
    }
    
    return normalizedOperator;
  }

  select(fields) {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  /**
   * Add a WHERE condition to the query with operator validation
   * @param {string} field - Database field name
   * @param {string} operator - SQL operator (validated against whitelist)
   * @param {*} value - Value to compare against
   * @returns {QueryBuilder} This instance for chaining
   * @throws {Error} If operator is not in the allowed list
   */
  where(field, operator, value) {
    const validatedOperator = this.validateOperator(operator);
    this.whereConditions.push(`${field} ${validatedOperator} ?`);
    this.params.push(value);
    return this;
  }

  whereIn(field, values) {
    const placeholders = values.map(() => '?').join(', ');
    this.whereConditions.push(`${field} IN (${placeholders})`);
    this.params.push(...values);
    return this;
  }

  /**
   * Add a JOIN clause to the query with proper parameterization
   * @param {string} table - Table to join
   * @param {string} leftField - Field from the main table or complete condition (deprecated)
   * @param {string} operator - Comparison operator (=, !=, <, >, IN, etc.)
   * @param {string} rightField - Field from the joined table
   * @param {Array} params - Parameters for the join condition (used with IN, etc.)
   * @returns {QueryBuilder} This instance for chaining
   * 
   * Examples:
   * - Simple join: .join('users', 'posts.user_id', '=', 'users.id')
   * - IN clause: .join('categories', 'posts.category_id', 'IN', 'categories.id', [1, 2, 3])
   * - Deprecated: .join('users', 'posts.user_id = users.id') // Still works but shows warning
   */
  join(table, leftField, operator, rightField, params = []) {
    // If called with old signature (table, condition), maintain backward compatibility
    if (typeof leftField === 'string' && !operator && !rightField) {
      console.warn('[QueryBuilder] Warning: Using deprecated join syntax. Consider upgrading to parameterized version.');
      this.joinClauses.push(`JOIN ${table} ON ${leftField}`);
      return this;
    }
    
    // Validate operator for security
    const validatedOperator = this.validateOperator(operator);
    
    // New parameterized version
    if (params.length > 0) {
      const placeholders = params.map(() => '?').join(', ');
      this.joinClauses.push(`JOIN ${table} ON ${leftField} ${validatedOperator} (${placeholders})`);
      this.params.push(...params);
    } else {
      // Simple field-to-field join
      this.joinClauses.push(`JOIN ${table} ON ${leftField} ${validatedOperator} ${rightField}`);
    }
    return this;
  }

  /**
   * Simple join between two tables on matching fields
   * @param {string} table - Table to join
   * @param {string} leftField - Field from the main table
   * @param {string} rightField - Field from the joined table
   * @returns {QueryBuilder} This instance for chaining
   */
  joinOn(table, leftField, rightField) {
    return this.join(table, leftField, '=', rightField);
  }

  /**
   * Add a LEFT JOIN clause to the query with proper parameterization
   * @param {string} table - Table to join
   * @param {string} leftField - Field from the main table or complete condition (deprecated)
   * @param {string} operator - Comparison operator (=, !=, <, >, IN, etc.)
   * @param {string} rightField - Field from the joined table
   * @param {Array} params - Parameters for the join condition (used with IN, etc.)
   * @returns {QueryBuilder} This instance for chaining
   * 
   * Examples:
   * - Simple left join: .leftJoin('users', 'posts.user_id', '=', 'users.id')
   * - IN clause: .leftJoin('tags', 'posts.id', 'IN', 'post_tags.post_id', [1, 2, 3])
   * - Deprecated: .leftJoin('users', 'posts.user_id = users.id') // Still works but shows warning
   */
  leftJoin(table, leftField, operator, rightField, params = []) {
    // If called with old signature (table, condition), maintain backward compatibility
    if (typeof leftField === 'string' && !operator && !rightField) {
      console.warn('[QueryBuilder] Warning: Using deprecated leftJoin syntax. Consider upgrading to parameterized version.');
      this.joinClauses.push(`LEFT JOIN ${table} ON ${leftField}`);
      return this;
    }
    
    // Validate operator for security
    const validatedOperator = this.validateOperator(operator);
    
    // New parameterized version
    if (params.length > 0) {
      const placeholders = params.map(() => '?').join(', ');
      this.joinClauses.push(`LEFT JOIN ${table} ON ${leftField} ${validatedOperator} (${placeholders})`);
      this.params.push(...params);
    } else {
      // Simple field-to-field join
      this.joinClauses.push(`LEFT JOIN ${table} ON ${leftField} ${validatedOperator} ${rightField}`);
    }
    return this;
  }

  /**
   * Simple left join between two tables on matching fields
   * @param {string} table - Table to join
   * @param {string} leftField - Field from the main table
   * @param {string} rightField - Field from the joined table
   * @returns {QueryBuilder} This instance for chaining
   */
  leftJoinOn(table, leftField, rightField) {
    return this.leftJoin(table, leftField, '=', rightField);
  }

  /**
   * Join with IN clause using parameterized values
   * @param {string} table - Table to join
   * @param {string} leftField - Field from the main table
   * @param {string} rightField - Field from the joined table
   * @param {Array} values - Values for the IN clause
   * @returns {QueryBuilder} This instance for chaining
   */
  joinIn(table, leftField, rightField, values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('joinIn requires a non-empty array of values');
    }
    return this.join(table, leftField, 'IN', rightField, values);
  }

  /**
   * Left join with IN clause using parameterized values
   * @param {string} table - Table to join
   * @param {string} leftField - Field from the main table
   * @param {string} rightField - Field from the joined table
   * @param {Array} values - Values for the IN clause
   * @returns {QueryBuilder} This instance for chaining
   */
  leftJoinIn(table, leftField, rightField, values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('leftJoinIn requires a non-empty array of values');
    }
    return this.leftJoin(table, leftField, 'IN', rightField, values);
  }

  /**
   * Add ORDER BY clause to the query with direction validation
   * @param {string} field - Database field name to order by
   * @param {string} direction - Sort direction ('ASC' or 'DESC', case-insensitive)
   * @returns {QueryBuilder} This instance for chaining
   * @throws {Error} If direction is not 'ASC' or 'DESC' or field name is invalid
   */
  orderBy(field, direction = 'ASC') {
    const validatedField = this.validateFieldName(field);
    const validatedDirection = this.validateOrderDirection(direction);
    this.orderByClauses.push(`${validatedField} ${validatedDirection}`);
    return this;
  }

  /**
   * Convenience methods for common ORDER BY patterns with validated directions
   */
  
  /**
   * Add ORDER BY field ASC clause
   * @param {string} field - Database field name to order by
   * @returns {QueryBuilder} This instance for chaining
   */
  orderByAsc(field) {
    return this.orderBy(field, 'ASC');
  }

  /**
   * Add ORDER BY field DESC clause
   * @param {string} field - Database field name to order by
   * @returns {QueryBuilder} This instance for chaining
   */
  orderByDesc(field) {
    return this.orderBy(field, 'DESC');
  }

  /**
   * Add multiple ORDER BY clauses at once
   * @param {Array<Object>} fields - Array of {field, direction} objects
   * @returns {QueryBuilder} This instance for chaining
   * @example
   * .orderByMultiple([
   *   {field: 'created_at', direction: 'DESC'},
   *   {field: 'name', direction: 'ASC'}
   * ])
   */
  orderByMultiple(fields) {
    if (!Array.isArray(fields)) {
      throw new Error('orderByMultiple requires an array of field objects');
    }
    
    fields.forEach(({ field, direction = 'ASC' }) => {
      if (!field) {
        throw new Error('Each field object must have a field property');
      }
      this.orderBy(field, direction);
    });
    
    return this;
  }

  limit(count) {
    this.limitValue = count;
    return this;
  }

  offset(count) {
    this.offsetValue = count;
    return this;
  }

  build() {
    let sql = `SELECT ${this.selectFields.join(', ')} FROM ${this.table}`;
    
    if (this.joinClauses.length > 0) {
      sql += ' ' + this.joinClauses.join(' ');
    }
    
    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.whereConditions.join(' AND ');
    }
    
    if (this.orderByClauses.length > 0) {
      sql += ' ORDER BY ' + this.orderByClauses.join(', ');
    }
    
    if (this.limitValue !== null) {
      sql += ` LIMIT ${this.limitValue}`;
    }
    
    if (this.offsetValue !== null) {
      sql += ` OFFSET ${this.offsetValue}`;
    }
    
    return { sql, params: this.params };
  }
  
  /**
   * Convenience methods for common WHERE conditions with safe operators
   */
  
  /**
   * Add WHERE field = value condition
   * @param {string} field - Database field name
   * @param {*} value - Value to compare against
   * @returns {QueryBuilder} This instance for chaining
   */
  whereEquals(field, value) {
    return this.where(field, '=', value);
  }

  /**
   * Add WHERE field != value condition
   * @param {string} field - Database field name
   * @param {*} value - Value to compare against
   * @returns {QueryBuilder} This instance for chaining
   */
  whereNotEquals(field, value) {
    return this.where(field, '!=', value);
  }

  /**
   * Add WHERE field > value condition
   * @param {string} field - Database field name
   * @param {*} value - Value to compare against
   * @returns {QueryBuilder} This instance for chaining
   */
  whereGreaterThan(field, value) {
    return this.where(field, '>', value);
  }

  /**
   * Add WHERE field < value condition
   * @param {string} field - Database field name
   * @param {*} value - Value to compare against
   * @returns {QueryBuilder} This instance for chaining
   */
  whereLessThan(field, value) {
    return this.where(field, '<', value);
  }

  /**
   * Add WHERE field LIKE value condition
   * @param {string} field - Database field name
   * @param {string} pattern - LIKE pattern (use % for wildcards)
   * @returns {QueryBuilder} This instance for chaining
   */
  whereLike(field, pattern) {
    return this.where(field, 'LIKE', pattern);
  }

  /**
   * Add WHERE field IS NULL condition
   * @param {string} field - Database field name
   * @returns {QueryBuilder} This instance for chaining
   */
  whereNull(field) {
    return this.where(field, 'IS NULL', null);
  }

  /**
   * Add WHERE field IS NOT NULL condition
   * @param {string} field - Database field name
   * @returns {QueryBuilder} This instance for chaining
   */
  whereNotNull(field) {
    return this.where(field, 'IS NOT NULL', null);
  }
}

// Istanza singleton del servizio database
const db = new DatabaseService();

module.exports = {
  db,
  DatabaseService,
  DatabaseError,
  QueryBuilder,
  dbConfig,
  pool
};
