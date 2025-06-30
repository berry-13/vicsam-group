const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

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
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

/**
 * Pool di connessioni per performance ottimali
 */
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

/**
 * Wrapper per query con logging e error handling
 */
class DatabaseService {
  constructor() {
    this.pool = pool;
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
      console.log('🔍 [DB] Parameters:', params);
      
      connection = await this.pool.getConnection();
      const [rows, fields] = await connection.execute(sql, params);
      
      const duration = Date.now() - start;
      console.log(`✅ [DB] Query executed in ${duration}ms`);
      
      return { rows, fields, meta: { duration, rowCount: rows.length } };
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`❌ [DB] Query failed after ${duration}ms:`, error.message);
      console.error('❌ [DB] SQL:', sql);
      console.error('❌ [DB] Params:', params);
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
          user: dbConfig.user,
          ssl: !!dbConfig.ssl
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
  }

  select(fields) {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  where(field, operator, value) {
    this.whereConditions.push(`${field} ${operator} ?`);
    this.params.push(value);
    return this;
  }

  whereIn(field, values) {
    const placeholders = values.map(() => '?').join(', ');
    this.whereConditions.push(`${field} IN (${placeholders})`);
    this.params.push(...values);
    return this;
  }

  join(table, condition) {
    this.joinClauses.push(`JOIN ${table} ON ${condition}`);
    return this;
  }

  leftJoin(table, condition) {
    this.joinClauses.push(`LEFT JOIN ${table} ON ${condition}`);
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.orderByClauses.push(`${field} ${direction}`);
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
