const { db } = require('../database/database');
const cryptoService = require('../api/services/cryptoService');
const { AuthError } = require('../api/services/authService');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Script per la migrazione delle password dal sistema legacy al nuovo sistema
 */
class PasswordMigrator {
  constructor() {
    this.migrationLog = [];
  }

  /**
   * Avvia la migrazione delle password
   */
  async migrate() {
    try {
      console.log('🔐 [MIGRATION] Starting password migration...');
      
      await this.verifyConnection();
      await this.createMigrationTable();
      await this.migrateExistingUsers();
      await this.updateSystemConfig();
      await this.generateReport();
      
      console.log('✅ [MIGRATION] Password migration completed successfully!');
      
    } catch (error) {
      console.error('❌ [MIGRATION] Password migration failed:', error.message);
      throw error;
    }
  }

  /**
   * Verifica la connessione al database
   */
  async verifyConnection() {
    console.log('🔌 [MIGRATION] Verifying database connection...');
    
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    console.log('✅ [MIGRATION] Database connection verified');
  }

  /**
   * Crea la tabella di log per la migrazione
   */
  async createMigrationTable() {
    console.log('📊 [MIGRATION] Creating migration log table...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_migration_log (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        user_id INTEGER,
        old_password_hash VARCHAR(255),
        new_password_hash VARCHAR(255),
        migration_status ENUM('success', 'failed', 'skipped'),
        migration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error_message TEXT,
        
        INDEX idx_migration_user (user_id),
        INDEX idx_migration_status (migration_status),
        INDEX idx_migration_date (migration_date)
      )
    `);
    
    console.log('✅ [MIGRATION] Migration log table ready');
  }

  /**
   * Migra gli utenti esistenti dal sistema legacy
   */
  async migrateExistingUsers() {
    console.log('👥 [MIGRATION] Starting user migration...');
    
    // Verifica se ci sono utenti legacy da migrare
    const legacyUsers = await this.findLegacyUsers();
    
    if (legacyUsers.length === 0) {
      console.log('ℹ️ [MIGRATION] No legacy users found to migrate');
      return;
    }
    
    console.log(`📋 [MIGRATION] Found ${legacyUsers.length} legacy users to migrate`);
    
    for (const legacyUser of legacyUsers) {
      await this.migrateSingleUser(legacyUser);
    }
    
    console.log('✅ [MIGRATION] User migration completed');
  }

  /**
   * Trova gli utenti legacy da migrare
   */
  async findLegacyUsers() {
    // Cerca utenti che potrebbero avere password nel formato legacy
    // Questo dipende da come sono strutturati i dati esistenti
    
    // Per ora, assumiamo che non ci siano utenti legacy
    // In un caso reale, questa query cercherebbe nella tabella esistente
    
    console.log('🔍 [MIGRATION] Searching for legacy users...');
    
    // Esempio di query per trovare utenti legacy:
    // return await db.query(`
    //   SELECT id, email, password, created_at 
    //   FROM legacy_users 
    //   WHERE migrated = FALSE OR migrated IS NULL
    // `);
    
    return [];
  }

  /**
   * Migra un singolo utente
   */
  async migrateSingleUser(legacyUser) {
    const transaction = await db.beginTransaction();
    
    try {
      console.log(`🔄 [MIGRATION] Migrating user: ${legacyUser.email}`);
      
      // Genera un UUID per l'utente
      const userUuid = uuidv4();
      
      // Se l'utente ha una password in chiaro nel sistema legacy (sconsigliato)
      // la hash-iamo con il nuovo sistema
      let passwordHash, passwordSalt;
      
      if (legacyUser.plainPassword) {
        // Hash della password con il nuovo sistema
        const hashResult = await cryptoService.hashPassword(legacyUser.plainPassword);
        passwordHash = hashResult.hash;
        passwordSalt = hashResult.salt;
        
      } else if (legacyUser.legacyHash) {
        // Se abbiamo un hash legacy, chiediamo all'utente di reimpostare la password
        // Per ora, generiamo una password temporanea
        const tempPassword = this.generateTemporaryPassword();
        const hashResult = await cryptoService.hashPassword(tempPassword);
        passwordHash = hashResult.hash;
        passwordSalt = hashResult.salt;
        
        this.migrationLog.push({
          email: legacyUser.email,
          action: 'temp_password_generated',
          tempPassword
        });
      }
      
      // Inserisci l'utente nel nuovo sistema
      const userResult = await transaction.query(`
        INSERT INTO users (
          uuid, email, password_hash, password_salt, 
          first_name, last_name, is_active, is_verified, 
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, ?)
      `, [
        userUuid,
        legacyUser.email.toLowerCase(),
        passwordHash,
        passwordSalt,
        legacyUser.firstName || 'Legacy',
        legacyUser.lastName || 'User',
        legacyUser.created_at
      ]);
      
      const userId = userResult.rows.insertId;
      
      // Assegna un ruolo di default (user)
      const roleResult = await transaction.query(`
        SELECT id FROM roles WHERE name = 'user'
      `);
      
      if (roleResult.rows.length > 0) {
        await transaction.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES (?, ?)
        `, [userId, roleResult.rows[0].id]);
      }
      
      // Log della migrazione
      await transaction.query(`
        INSERT INTO password_migration_log (
          user_id, old_password_hash, new_password_hash, 
          migration_status
        )
        VALUES (?, ?, ?, 'success')
      `, [userId, legacyUser.legacyHash || 'N/A', passwordHash]);
      
      await transaction.commit();
      
      console.log(`✅ [MIGRATION] User migrated successfully: ${legacyUser.email}`);
      
    } catch (error) {
      await transaction.rollback();
      
      console.error(`❌ [MIGRATION] Failed to migrate user ${legacyUser.email}:`, error.message);
      
      // Log dell'errore
      try {
        await db.query(`
          INSERT INTO password_migration_log (
            user_id, migration_status, error_message
          )
          VALUES (NULL, 'failed', ?)
        `, [error.message]);
      } catch (logError) {
        console.error('❌ [MIGRATION] Failed to log migration error:', logError.message);
      }
    }
  }

  /**
   * Genera una password temporanea sicura usando crypto random
   */
  generateTemporaryPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    const allChars = uppercase + lowercase + digits + special;
    
    let result = '';
    
    // Assicura che abbia almeno un carattere di ogni tipo usando crypto.randomInt
    result += uppercase[crypto.randomInt(0, uppercase.length)]; // Maiuscola
    result += lowercase[crypto.randomInt(0, lowercase.length)]; // Minuscola
    result += digits[crypto.randomInt(0, digits.length)]; // Numero
    result += special[crypto.randomInt(0, special.length)]; // Speciale
    
    // Riempie il resto con caratteri casuali sicuri
    for (let i = result.length; i < 12; i++) {
      result += allChars[crypto.randomInt(0, allChars.length)];
    }
    
    // Mescola i caratteri usando Fisher-Yates shuffle con crypto.randomInt
    const resultArray = result.split('');
    for (let i = resultArray.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [resultArray[i], resultArray[j]] = [resultArray[j], resultArray[i]];
    }
    
    return resultArray.join('');
  }

  /**
   * Aggiorna la configurazione del sistema
   */
  async updateSystemConfig() {
    console.log('⚙️ [MIGRATION] Updating system configuration...');
    
    // Marca il sistema come migrato
    const migrationDate = new Date().toISOString();
    
    await db.query(`
      INSERT INTO crypto_keys (
        key_id, key_type, algorithm, key_metadata, is_active
      )
      VALUES (?, 'migration', 'info', ?, TRUE)
      ON DUPLICATE KEY UPDATE
      key_metadata = ?, rotated_at = NOW()
    `, [
      'password_migration',
      JSON.stringify({
        migration_date: migrationDate,
        migration_version: '1.0.0',
        status: 'completed'
      }),
      JSON.stringify({
        migration_date: migrationDate,
        migration_version: '1.0.0',
        status: 'completed'
      })
    ]);
    
    console.log('✅ [MIGRATION] System configuration updated');
  }

  /**
   * Genera il report finale della migrazione
   */
  async generateReport() {
    console.log('📊 [MIGRATION] Generating migration report...');
    
    const stats = await db.query(`
      SELECT 
        migration_status,
        COUNT(*) as count
      FROM password_migration_log
      GROUP BY migration_status
    `);
    
    const totalUsers = await db.query(`
      SELECT COUNT(*) as count FROM users
    `);
    
    console.log('\n🎉 [MIGRATION] Migration Report:');
    console.log('================================');
    
    stats.rows.forEach(stat => {
      console.log(`${stat.migration_status.toUpperCase()}: ${stat.count} users`);
    });
    
    console.log(`Total users in system: ${totalUsers.rows[0].count}`);
    
    if (this.migrationLog.length > 0) {
      console.log('\nUsers with temporary passwords:');
      this.migrationLog.forEach(log => {
        if (log.action === 'temp_password_generated') {
          console.log(`  📧 ${log.email}: ${log.tempPassword}`);
        }
      });
      console.log('\n⚠️ Please ask these users to change their passwords on first login!');
    }
    
    console.log('================================\n');
  }

  /**
   * Rollback della migrazione (se necessario)
   */
  async rollback() {
    console.log('🔄 [MIGRATION] Starting rollback...');
    
    const transaction = await db.beginTransaction();
    
    try {
      // Rimuovi gli utenti migrati
      const migratedUsers = await transaction.query(`
        SELECT user_id FROM password_migration_log 
        WHERE migration_status = 'success' AND user_id IS NOT NULL
      `);
      
      for (const user of migratedUsers.rows) {
        await transaction.query(`DELETE FROM users WHERE id = ?`, [user.user_id]);
      }
      
      // Pulisci le tabelle di migrazione
      await transaction.query(`DROP TABLE IF EXISTS password_migration_log`);
      
      // Rimuovi le chiavi di migrazione
      await transaction.query(`
        DELETE FROM crypto_keys 
        WHERE key_id = 'password_migration'
      `);
      
      await transaction.commit();
      
      console.log('✅ [MIGRATION] Rollback completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ [MIGRATION] Rollback failed:', error.message);
      throw error;
    }
  }

  /**
   * Verifica lo stato della migrazione
   */
  async checkMigrationStatus() {
    try {
      const result = await db.query(`
        SELECT key_metadata 
        FROM crypto_keys 
        WHERE key_id = 'password_migration' AND key_type = 'migration'
      `);
      
      if (result.rows.length > 0) {
        const metadata = JSON.parse(result.rows[0].key_metadata);
        console.log('📊 [MIGRATION] Migration status:', metadata);
        return metadata;
      } else {
        console.log('ℹ️ [MIGRATION] No migration found');
        return null;
      }
      
    } catch (error) {
      console.error('❌ [MIGRATION] Failed to check migration status:', error.message);
      return null;
    }
  }
}

// CLI Interface
async function main() {
  const migrator = new PasswordMigrator();
  
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'migrate':
        await migrator.migrate();
        break;
        
      case 'rollback':
        await migrator.rollback();
        break;
        
      case 'status':
        await migrator.checkMigrationStatus();
        break;
        
      default:
        console.log('Usage: node migrate-passwords.js [migrate|rollback|status]');
        console.log('');
        console.log('Commands:');
        console.log('  migrate  - Start password migration');
        console.log('  rollback - Rollback migration');
        console.log('  status   - Check migration status');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  main();
}

module.exports = {
  PasswordMigrator
};
