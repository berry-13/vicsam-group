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
      
      const dbName = process.env.DB_NAME || 'vicsam_auth';
      
      // Connessione senza specificare il database
      const { db: mysql } = require('./database');
      
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
      
      // Divide lo script in statement individuali
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await db.query(statement);
          } catch (error) {
            // Ignora errori per statement che potrebbero già esistere
            if (!error.message.includes('already exists')) {
              console.warn('⚠️ [MIGRATION] Statement warning:', error.message);
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
        // Esegue la migrazione
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            await transaction.query(statement);
          }
        }
        
        // Registra la migrazione come eseguita
        await transaction.query(
          'INSERT INTO schema_migrations (migration_name) VALUES (?)',
          [migrationFile]
        );
        
        await transaction.commit();
        console.log(`✅ [MIGRATION] Migration completed: ${migrationFile}`);
        
      } catch (error) {
        await transaction.rollback();
        throw error;
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
   * Reset completo del database
   */
  async reset() {
    try {
      console.log('🚨 [MIGRATION] Resetting database...');
      
      const dbName = process.env.DB_NAME || 'vicsam_auth';
      
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
        await migrator.reset();
        break;
      case 'status':
        await migrator.status();
        break;
      default:
        console.log('Available commands: migrate, rollback, reset, status');
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
