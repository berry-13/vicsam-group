const fs = require('fs').promises;
const path = require('path');
const { db } = require('./database');
require('dotenv').config();

/**
 * Script di migrazione del database per il sistema di autenticazione avanzato
 */

class DatabaseMigrator {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.schemaPath = path.join(__dirname, 'schema.sql');
  }

  /**
   * Esegue tutte le migrazioni del database
   */
  async migrate() {
    try {
      console.log('🚀 [MIGRATION] Starting database migration...');
      
      // Verifica connessione database
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      // Crea il database se non esiste
      await this.createDatabaseIfNotExists();

      // Esegue lo schema base
      await this.executeSchema();

      // Esegue le migrazioni incrementali
      await this.runMigrations();

      // Verifica l'integrità dello schema
      await this.verifySchema();

      console.log('✅ [MIGRATION] Database migration completed successfully!');
      
    } catch (error) {
      console.error('❌ [MIGRATION] Migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Testa la connessione al database
   */
  async testConnection() {
    try {
      console.log('🔍 [MIGRATION] Testing database connection...');
      const result = await db.testConnection();
      console.log('✅ [MIGRATION] Database connection successful');
      return result;
    } catch (error) {
      console.error('❌ [MIGRATION] Database connection failed:', error.message);
      return false;
    }
  }

  /**
   * Crea il database se non esiste
   */
  async createDatabaseIfNotExists() {
    try {
      console.log('🏗️ [MIGRATION] Checking database existence...');
      
      const rawDbName = process.env.DB_NAME || 'vicsam_auth';
      
      // Valida il nome del database per prevenire SQL injection
      const dbName = this.validateDatabaseName(rawDbName);
      
      // La connessione db è già disponibile dal modulo importato
      
      await db.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await db.query(`USE \`${dbName}\``);
      
      console.log(`✅ [MIGRATION] Database '${dbName}' ready`);
      
    } catch (error) {
      console.error('❌ [MIGRATION] Database creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Esegue lo schema SQL principale
   */
  async executeSchema() {
    try {
      console.log('📋 [MIGRATION] Executing database schema...');
      
      const schemaSQL = await fs.readFile(this.schemaPath, 'utf8');
      
      // Dividi il file SQL in statement individuali, gestendo procedure e trigger
      const statements = this.parseSchemaStatements(schemaSQL);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement && !statement.startsWith('--') && statement !== '') {
          try {
            console.log(`🔍 [MIGRATION] Executing statement ${i + 1}/${statements.length}`);
            await db.query(statement);
          } catch (error) {
            // Verifica se è un errore "safe" di entità già esistente
            if (this.isSafeAlreadyExistsError(error)) {
              console.log(`⚠️ [MIGRATION] Safe "already exists" condition detected: ${error.message}`);
            } else {
              console.error(`❌ [MIGRATION] Statement ${i + 1} failed:`, statement.substring(0, 100) + '...');
              console.error('❌ [MIGRATION] Error:', error.message);
              console.error('❌ [MIGRATION] Error code:', error.code);
              throw error;
            }
          }
        }
      }
      
      console.log('✅ [MIGRATION] Schema executed successfully');
      
    } catch (error) {
      console.error('❌ [MIGRATION] Schema execution failed:', error.message);
      throw error;
    }
  }

  /**
   * Analizza il file schema SQL in statement individuali
   * Gestisce correttamente procedure, funzioni e trigger
   */
  parseSchemaStatements(sql) {
    // Rimuovi commenti a blocco /* ... */
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
    
    const statements = [];
    const lines = sql.split('\n');
    let currentStatement = '';
    let inBlock = false;
    let blockType = '';
    let beginCount = 0; // Conta i BEGIN per gestire blocchi annidati
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Ignora righe vuote e commenti
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }
      
      // Rileva inizio di blocchi (PROCEDURE, FUNCTION, TRIGGER, EVENT)
      const blockStartPattern = /^\s*CREATE\s+(PROCEDURE|FUNCTION|TRIGGER|EVENT)\s+/i;
      const blockMatch = trimmedLine.match(blockStartPattern);
      
      if (blockMatch && !inBlock) {
        inBlock = true;
        blockType = blockMatch[1].toUpperCase();
        currentStatement = line;
        beginCount = 0;
        continue;
      }
      
      if (inBlock) {
        currentStatement += '\n' + line;
        
        // Conta i BEGIN per gestire blocchi annidati
        if (trimmedLine.match(/\bBEGIN\b/i)) {
          beginCount++;
        }
        
        // Rileva fine del blocco con END; ma solo quando tutti i BEGIN sono chiusi
        if (trimmedLine.match(/\bEND\b/i)) {
          if (beginCount > 0) {
            beginCount--;
          }
          
          // Se non ci sono più BEGIN aperti e la riga finisce con ; è la fine del blocco
          if (beginCount === 0 && trimmedLine.match(/END\s*;?\s*$/i)) {
            inBlock = false;
            blockType = '';
            statements.push(currentStatement);
            currentStatement = '';
            continue;
          }
        }
      } else {
        currentStatement += (currentStatement ? '\n' : '') + line;
        
        // Statement normale che termina con ;
        if (trimmedLine.endsWith(';') && !trimmedLine.match(/^\s*--/)) {
          statements.push(currentStatement);
          currentStatement = '';
        }
      }
    }
    
    // Aggiungi l'ultimo statement se presente
    if (currentStatement.trim()) {
      statements.push(currentStatement);
    }
    
    return statements.filter(stmt => stmt.trim() !== '');
  }

  /**
   * Esegue le migrazioni incrementali
   */
  async runMigrations() {
    try {
      console.log('🔄 [MIGRATION] Running incremental migrations...');
      
      // Crea tabella delle migrazioni se non esiste
      await this.createMigrationsTable();
      
      // Ottiene le migrazioni già eseguite
      const executedMigrations = await this.getExecutedMigrations();
      
      // Trova i file di migrazione
      const migrationFiles = await this.getMigrationFiles();
      
      for (const migrationFile of migrationFiles) {
        if (!executedMigrations.includes(migrationFile)) {
          await this.executeMigration(migrationFile);
        }
      }
      
      console.log('✅ [MIGRATION] All migrations completed');
      
    } catch (error) {
      console.error('❌ [MIGRATION] Migrations failed:', error.message);
      throw error;
    }
  }

  /**
   * Crea la tabella per tracciare le migrazioni
   */
  async createMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.query(createTableSQL);
  }

  /**
   * Ottiene le migrazioni già eseguite
   */
  async getExecutedMigrations() {
    try {
      const result = await db.query('SELECT migration_name FROM schema_migrations');
      return result.rows.map(row => row.migration_name);
    } catch (error) {
      console.warn('⚠️ [MIGRATION] Could not get executed migrations:', error.message);
      return [];
    }
  }

  /**
   * Trova i file di migrazione
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.log('ℹ️ [MIGRATION] No migration files found');
      return [];
    }
  }

  /**
   * Esegue una singola migrazione
   */
  async executeMigration(migrationFile) {
    try {
      console.log(`🔄 [MIGRATION] Executing migration: ${migrationFile}`);
      
      const migrationPath = path.join(this.migrationsPath, migrationFile);
      const migrationSQL = await fs.readFile(migrationPath, 'utf8');
      
      const transaction = await db.beginTransaction();
      
      try {
        // Esegue l'intera migrazione SQL utilizzando multipleStatements
        // Questo è più sicuro rispetto al split per semicolon che può rompersi
        // con semicolon all'interno di stringhe o commenti
        await transaction.query(migrationSQL);
        
        // Registra la migrazione come eseguita
        await transaction.query(
          'INSERT INTO schema_migrations (migration_name) VALUES (?)',
          [migrationFile]
        );
        
        await transaction.commit();
        console.log(`✅ [MIGRATION] Migration completed: ${migrationFile}`);
        
      } catch (error) {
        await transaction.rollback();
        
        // Verifica se è un errore "safe" di entità già esistente
        if (this.isSafeAlreadyExistsError(error)) {
          console.log(`⚠️ [MIGRATION] Safe "already exists" condition in migration ${migrationFile}: ${error.message}`);
          // Non rigenerare l'errore per condizioni "safe"
          console.log(`✅ [MIGRATION] Migration ${migrationFile} completed (some objects already existed)`);
        } else {
          console.error(`❌ [MIGRATION] Migration failed: ${migrationFile}`, error.message);
          console.error('❌ [MIGRATION] Error code:', error.code);
          throw error;
        }
      }
      
    } catch (error) {
      console.error(`❌ [MIGRATION] Migration failed: ${migrationFile}`, error.message);
      throw error;
    }
  }

  /**
   * Verifica l'integrità dello schema
   */
  async verifySchema() {
    try {
      console.log('🔍 [MIGRATION] Verifying schema integrity...');
      
      const requiredTables = [
        'users',
        'roles',
        'permissions',
        'user_roles',
        'role_permissions',
        'user_sessions',
        'refresh_tokens',
        'audit_logs',
        'crypto_keys'
      ];
      
      for (const table of requiredTables) {
        const result = await db.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = ? AND table_name = ?
        `, [process.env.DB_NAME || 'vicsam_auth', table]);
        
        if (result.rows[0].count === 0) {
          throw new Error(`Required table '${table}' not found`);
        }
      }
      
      console.log('✅ [MIGRATION] Schema integrity verified');
      
    } catch (error) {
      console.error('❌ [MIGRATION] Schema verification failed:', error.message);
      throw error;
    }
  }

  /**
   * Rollback dell'ultima migrazione
   */
  async rollback() {
    try {
      console.log('🔄 [MIGRATION] Rolling back last migration...');
      
      const result = await db.query(`
        SELECT migration_name FROM schema_migrations 
        ORDER BY executed_at DESC LIMIT 1
      `);
      
      if (result.rows.length === 0) {
        console.log('ℹ️ [MIGRATION] No migrations to rollback');
        return;
      }
      
      const migrationName = result.rows[0].migration_name;
      console.log(`🔄 [MIGRATION] Rolling back: ${migrationName}`);
      
      // Rimuove la migrazione dalla tabella
      await db.query('DELETE FROM schema_migrations WHERE migration_name = ?', [migrationName]);
      
      console.log('✅ [MIGRATION] Rollback completed');
      
    } catch (error) {
      console.error('❌ [MIGRATION] Rollback failed:', error.message);
      throw error;
    }
  }

  /**
   * Reset completo del database con controlli di sicurezza
   * @param {boolean} forceConfirm - Conferma esplicita per procedere (opzionale)
   */
  async reset(forceConfirm = false) {
    try {
      console.log('🚨 [MIGRATION] Database reset requested...');
      
      // Controlli di sicurezza per prevenire perdita accidentale di dati
      this.validateResetSafety(forceConfirm);
      
      const rawDbName = process.env.DB_NAME || 'vicsam_auth';
      
      // Valida il nome del database per prevenire SQL injection
      const dbName = this.validateDatabaseName(rawDbName);
      
      console.log('⚠️ [MIGRATION] DANGER: About to drop and recreate database!');
      console.log(`⚠️ [MIGRATION] Database: ${dbName}`);
      console.log(`⚠️ [MIGRATION] Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Drop e ricrea il database
      await db.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
      await db.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await db.query(`USE \`${dbName}\``);
      
      // Esegue nuovamente lo schema
      await this.executeSchema();
      
      console.log('✅ [MIGRATION] Database reset completed');
      
    } catch (error) {
      console.error('❌ [MIGRATION] Database reset failed:', error.message);
      throw error;
    }
  }

  /**
   * Valida che l'operazione di reset sia sicura da eseguire
   * @param {boolean} forceConfirm - Conferma esplicita per bypassare alcuni controlli
   */
  validateResetSafety(forceConfirm = false) {
    const environment = process.env.NODE_ENV || 'development';
    const resetConfirmation = process.env.ALLOW_DATABASE_RESET;
    const explicitConfirm = process.env.CONFIRM_DATABASE_RESET === 'yes';
    
    // Controllo 1: Ambiente di produzione
    if (environment === 'production') {
      throw new Error(
        '🚫 [MIGRATION] SAFETY ERROR: Database reset is FORBIDDEN in production environment! ' +
        'This operation would cause irreversible data loss.'
      );
    }
    
    // Controllo 2: Ambienti sicuri
    const safeEnvironments = ['development', 'test', 'testing', 'local'];
    if (!safeEnvironments.includes(environment.toLowerCase())) {
      throw new Error(
        `🚫 [MIGRATION] SAFETY ERROR: Database reset not allowed in '${environment}' environment. ` +
        `Allowed environments: ${safeEnvironments.join(', ')}`
      );
    }
    
    // Controllo 3: Conferma esplicita richiesta
    if (!forceConfirm && !explicitConfirm && resetConfirmation !== 'true') {
      throw new Error(
        '🚫 [MIGRATION] SAFETY ERROR: Database reset requires explicit confirmation. ' +
        'Set CONFIRM_DATABASE_RESET=yes or ALLOW_DATABASE_RESET=true environment variable, ' +
        'or call reset(true) to confirm this destructive operation.'
      );
    }
    
    // Controllo 4: Database name safety
    const rawDbName = process.env.DB_NAME || 'vicsam_auth';
    
    // Valida il nome del database per prevenire SQL injection
    const dbName = this.validateDatabaseName(rawDbName);
    
    const unsafeNames = ['production', 'prod', 'live', 'main'];
    if (unsafeNames.some(name => dbName.toLowerCase().includes(name))) {
      throw new Error(
        `🚫 [MIGRATION] SAFETY ERROR: Database name '${dbName}' appears to be a production database. ` +
        'Reset operation blocked for safety.'
      );
    }
    
    console.log('✅ [MIGRATION] Safety checks passed for database reset');
    console.log(`✅ [MIGRATION] Environment: ${environment}`);
    console.log(`✅ [MIGRATION] Database: ${dbName}`);
    console.log('✅ [MIGRATION] Explicit confirmation: ' + (forceConfirm || explicitConfirm || resetConfirmation === 'true'));
  }

  /**
   * Mostra lo stato delle migrazioni
   */
  async status() {
    try {
      console.log('📊 [MIGRATION] Migration status:');
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      console.log(`\nExecuted migrations (${executedMigrations.length}):`);
      executedMigrations.forEach(migration => {
        console.log(`  ✅ ${migration}`);
      });
      
      const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));
      console.log(`\nPending migrations (${pendingMigrations.length}):`);
      pendingMigrations.forEach(migration => {
        console.log(`  ⏳ ${migration}`);
      });
      
      // Informazioni sul database
      const dbInfo = await db.getDatabaseInfo();
      console.log('\nDatabase info:');
      console.log(`  Version: ${dbInfo.version}`);
      console.log(`  Database: ${dbInfo.database}`);
      console.log(`  Tables: ${dbInfo.tables.length}`);
      
    } catch (error) {
      console.error('❌ [MIGRATION] Status check failed:', error.message);
    }
  }

  /**
   * Verifica se un errore è un errore "safe" di tipo "already exists"
   * @param {Error} error - L'errore da verificare
   * @returns {boolean} True se l'errore può essere ignorato in sicurezza
   */
  isSafeAlreadyExistsError(error) {
    // MySQL error codes per entità che già esistono
    const safeErrorCodes = [
      'ER_TABLE_EXISTS_ERROR',     // 1050: Table already exists
      'ER_DB_CREATE_EXISTS',       // 1007: Database already exists
      'ER_DUP_KEYNAME',           // 1061: Duplicate key name
      'ER_DUP_INDEX',             // 1831: Duplicate index
      'ER_CANT_DROP_FIELD_OR_KEY' // 1091: Can't DROP; check that it exists
    ];
    
    // Verifica il codice di errore
    if (error.code && safeErrorCodes.includes(error.code)) {
      return true;
    }
    
    // Verifica messaggi specifici di MySQL in inglese
    const safeMessagePatterns = [
      /Table '.*' already exists/i,
      /Database .* already exists/i,
      /Duplicate key name '.*'/i,
      /Duplicate index '.*'/i,
      /Key column '.*' doesn't exist in table/i
    ];
    
    return safeMessagePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Valida e sanitizza il nome del database per prevenire SQL injection
   * @param {string} dbName - Nome del database da validare
   * @returns {string} Nome del database validato e sanitizzato
   * @throws {Error} Se il nome del database non è valido
   */
  validateDatabaseName(dbName) {
    // Controlla che il nome non sia vuoto
    if (!dbName || typeof dbName !== 'string') {
      throw new Error('🚫 [MIGRATION] SECURITY ERROR: Database name must be a non-empty string');
    }
    
    // Rimuove spazi bianchi
    const trimmedName = dbName.trim();
    
    // Controlla lunghezza (MySQL limita i nomi a 64 caratteri)
    if (trimmedName.length === 0) {
      throw new Error('🚫 [MIGRATION] SECURITY ERROR: Database name cannot be empty');
    }
    
    if (trimmedName.length > 64) {
      throw new Error('🚫 [MIGRATION] SECURITY ERROR: Database name too long (max 64 characters)');
    }
    
    // Pattern per caratteri consentiti: lettere, numeri, underscore, trattini
    // Deve iniziare con una lettera o underscore
    const validPattern = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
    
    if (!validPattern.test(trimmedName)) {
      throw new Error(
        '🚫 [MIGRATION] SECURITY ERROR: Invalid database name. ' +
        'Database names must start with a letter or underscore and contain only ' +
        'letters, numbers, underscores, and hyphens. ' +
        `Received: "${trimmedName}"`
      );
    }
    
    // Lista di nomi riservati che non dovrebbero essere usati
    const reservedNames = [
      'information_schema', 'performance_schema', 'mysql', 'sys',
      'test', 'null', 'undefined', 'admin', 'root', 'config'
    ];
    
    if (reservedNames.includes(trimmedName.toLowerCase())) {
      throw new Error(
        `🚫 [MIGRATION] SECURITY ERROR: Database name "${trimmedName}" is reserved and cannot be used`
      );
    }
    
    // Controlla pattern sospetti che potrebbero indicare tentativi di injection
    const suspiciousPatterns = [
      /['"`;\\]/,  // Quote, punto e virgola, backslash
      /--/,        // Commenti SQL
      /\/\*/,      // Commenti SQL multiline
      /\s/,        // Spazi bianchi (dovrebbero essere già rimossi)
      /[<>]/       // Caratteri HTML/XML
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmedName)) {
        throw new Error(
          `🚫 [MIGRATION] SECURITY ERROR: Database name contains suspicious characters. ` +
          `This could indicate a SQL injection attempt. Received: "${trimmedName}"`
        );
      }
    }
    
    console.log(`✅ [MIGRATION] Database name validated: "${trimmedName}"`);
    return trimmedName;
  }
}

/**
 * Esegue il comando dalla CLI
 */
async function main() {
  const command = process.argv[2] || 'migrate';
  const migrator = new DatabaseMigrator();
  
  try {
    switch (command) {
      case 'migrate':
        await migrator.migrate();
        break;
      case 'rollback':
        await migrator.rollback();
        break;
      case 'reset':
        // Richiede conferma esplicita per l'operazione di reset
        const forceReset = process.argv.includes('--force') || process.argv.includes('--confirm');
        await migrator.reset(forceReset);
        break;
      case 'status':
        await migrator.status();
        break;
      default:
        console.log('Available commands:');
        console.log('  migrate  - Run database migrations');
        console.log('  rollback - Rollback last migration');
        console.log('  reset    - Reset database (DESTRUCTIVE - requires confirmation)');
        console.log('            Use: node migrate.js reset --force');
        console.log('            Or set: CONFIRM_DATABASE_RESET=yes');
        console.log('  status   - Show migration status');
    }
    
    await db.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ [MIGRATION] Command failed:', error.message);
    await db.close();
    process.exit(1);
  }
}

// Esegue solo se chiamato direttamente
if (require.main === module) {
  main();
}

module.exports = {
  DatabaseMigrator,
  main
};
