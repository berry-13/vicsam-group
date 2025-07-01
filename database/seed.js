const { db } = require('./database');
const { authService } = require('../api/services/authService');
const { cryptoService } = require('../api/services/cryptoService');
require('dotenv').config();

/**
 * Script per il seeding del database con dati iniziali
 */

class DatabaseSeeder {
  constructor() {
    this.defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@vicsam.com';
    this.defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'VicsAm2025!';
    this.seedData = {
      permissions: [
        // Permessi utenti
        { name: 'users.create', displayName: 'Create Users', description: 'Permission to create new users', resource: 'users', action: 'create' },
        { name: 'users.read', displayName: 'Read Users', description: 'Permission to view users', resource: 'users', action: 'read' },
        { name: 'users.update', displayName: 'Update Users', description: 'Permission to modify users', resource: 'users', action: 'update' },
        { name: 'users.delete', displayName: 'Delete Users', description: 'Permission to delete users', resource: 'users', action: 'delete' },
        
        // Permessi ruoli
        { name: 'roles.create', displayName: 'Create Roles', description: 'Permission to create new roles', resource: 'roles', action: 'create' },
        { name: 'roles.read', displayName: 'Read Roles', description: 'Permission to view roles', resource: 'roles', action: 'read' },
        { name: 'roles.update', displayName: 'Update Roles', description: 'Permission to modify roles', resource: 'roles', action: 'update' },
        { name: 'roles.delete', displayName: 'Delete Roles', description: 'Permission to delete roles', resource: 'roles', action: 'delete' },
        { name: 'roles.assign', displayName: 'Assign Roles', description: 'Permission to assign roles to users', resource: 'roles', action: 'assign' },
        
        // Permessi dati
        { name: 'data.create', displayName: 'Create Data', description: 'Permission to create new data', resource: 'data', action: 'create' },
        { name: 'data.read', displayName: 'Read Data', description: 'Permission to read data', resource: 'data', action: 'read' },
        { name: 'data.update', displayName: 'Update Data', description: 'Permission to modify data', resource: 'data', action: 'update' },
        { name: 'data.delete', displayName: 'Delete Data', description: 'Permission to delete data', resource: 'data', action: 'delete' },
        
        // Permessi sistema
        { name: 'system.admin', displayName: 'System Administration', description: 'Full system access', resource: 'system', action: 'admin' },
        { name: 'audit.read', displayName: 'Read Audit Logs', description: 'Permission to view audit logs', resource: 'audit', action: 'read' },
        { name: 'sessions.manage', displayName: 'Manage Sessions', description: 'Permission to manage user sessions', resource: 'sessions', action: 'manage' }
      ],
      
      roles: [
        {
          name: 'admin',
          displayName: 'Administrator',
          description: 'Full system access with all permissions',
          isSystemRole: true,
          permissions: ['*'] // Tutti i permessi
        },
        {
          name: 'manager',
          displayName: 'Manager',
          description: 'Management access with limited permissions',
          isSystemRole: true,
          permissions: [
            'users.read', 'users.update',
            'data.create', 'data.read', 'data.update',
            'roles.read'
          ]
        },
        {
          name: 'user',
          displayName: 'User',
          description: 'Basic user access',
          isSystemRole: true,
          permissions: ['data.create', 'data.read']
        }
      ],
      
      sampleUsers: [
        {
          email: 'manager@vicsam.com',
          password: 'Manager2024!',
          firstName: 'Mario',
          lastName: 'Rossi',
          role: 'manager'
        },
        {
          email: 'user@vicsam.com',
          password: 'User2024!',
          firstName: 'Giulia',
          lastName: 'Bianchi',
          role: 'user'
        }
      ]
    };
  }

  /**
   * Esegue il seeding completo del database
   */
  async seed() {
    try {
      console.log('🌱 [SEED] Starting database seeding...');
      
      // Verifica connessione
      const isConnected = await db.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      // Seed dei permessi
      await this.seedPermissions();
      
      // Seed dei ruoli
      await this.seedRoles();
      
      // Associazione permessi ai ruoli
      await this.assignPermissionsToRoles();
      
      // Seed dell'utente admin
      await this.seedAdminUser();
      
      // Seed utenti di esempio (opzionale)
      if (process.env.SEED_SAMPLE_USERS === 'true') {
        await this.seedSampleUsers();
      }
      
      // Genera chiavi crittografiche
      await this.seedCryptoKeys();
      
      console.log('✅ [SEED] Database seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ [SEED] Seeding failed:', error.message);
      throw error;
    }
  }

  /**
   * Seed dei permessi di base
   */
  async seedPermissions() {
    try {
      console.log('🔑 [SEED] Seeding permissions...');
      
      for (const permission of this.seedData.permissions) {
        // Verifica se il permesso esiste già
        const existingResult = await db.query(
          'SELECT id FROM permissions WHERE name = ?',
          [permission.name]
        );
        
        if (existingResult.rows.length === 0) {
          await db.query(`
            INSERT INTO permissions (name, display_name, description, resource, action)
            VALUES (?, ?, ?, ?, ?)
          `, [
            permission.name,
            permission.displayName,
            permission.description,
            permission.resource,
            permission.action
          ]);
          
          console.log(`  ✅ Created permission: ${permission.name}`);
        } else {
          console.log(`  ⏭️ Permission already exists: ${permission.name}`);
        }
      }
      
      console.log('✅ [SEED] Permissions seeded successfully');
      
    } catch (error) {
      console.error('❌ [SEED] Permission seeding failed:', error.message);
      throw error;
    }
  }

  /**
   * Seed dei ruoli di base
   */
  async seedRoles() {
    try {
      console.log('👑 [SEED] Seeding roles...');
      
      for (const role of this.seedData.roles) {
        // Verifica se il ruolo esiste già
        const existingResult = await db.query(
          'SELECT id FROM roles WHERE name = ?',
          [role.name]
        );
        
        if (existingResult.rows.length === 0) {
          await db.query(`
            INSERT INTO roles (name, display_name, description, permissions, is_system_role)
            VALUES (?, ?, ?, ?, ?)
          `, [
            role.name,
            role.displayName,
            role.description,
            JSON.stringify(role.permissions),
            role.isSystemRole
          ]);
          
          console.log(`  ✅ Created role: ${role.name}`);
        } else {
          console.log(`  ⏭️ Role already exists: ${role.name}`);
        }
      }
      
      console.log('✅ [SEED] Roles seeded successfully');
      
    } catch (error) {
      console.error('❌ [SEED] Role seeding failed:', error.message);
      throw error;
    }
  }

  /**
   * Associa permessi ai ruoli
   */
  async assignPermissionsToRoles() {
    try {
      console.log('🔗 [SEED] Assigning permissions to roles...');
      
      for (const roleData of this.seedData.roles) {
        const roleResult = await db.query(
          'SELECT id FROM roles WHERE name = ?',
          [roleData.name]
        );
        
        if (roleResult.rows.length > 0) {
          const roleId = roleResult.rows[0].id;
          
          // Admin ha tutti i permessi
          if (roleData.name === 'admin') {
            const allPermissionsResult = await db.query('SELECT id FROM permissions');
            for (const permission of allPermissionsResult.rows) {
              await this.assignPermissionToRole(roleId, permission.id);
            }
          } else {
            // Altri ruoli hanno permessi specifici
            for (const permissionName of roleData.permissions) {
              const permissionResult = await db.query(
                'SELECT id FROM permissions WHERE name = ?',
                [permissionName]
              );
              
              if (permissionResult.rows.length > 0) {
                await this.assignPermissionToRole(roleId, permissionResult.rows[0].id);
              }
            }
          }
          
          console.log(`  ✅ Assigned permissions to role: ${roleData.name}`);
        }
      }
      
      console.log('✅ [SEED] Permission assignments completed');
      
    } catch (error) {
      console.error('❌ [SEED] Permission assignment failed:', error.message);
      throw error;
    }
  }

  /**
   * Assegna un singolo permesso a un ruolo
   * Utilizza gestione degli errori robusta basata sui codici di errore MySQL
   */
  async assignPermissionToRole(roleId, permissionId) {
    try {
      // Verifica se l'associazione esiste già
      const existingResult = await db.query(
        'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [roleId, permissionId]
      );
      
      if (existingResult.rows.length === 0) {
        await db.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permissionId]
        );
      }
    } catch (error) {
      // Ignora errori di duplicazione utilizzando il codice di errore MySQL
      // ER_DUP_ENTRY (1062) è il codice specifico per duplicate entry in MySQL
      if (error.code !== 'ER_DUP_ENTRY' && error.errno !== 1062) {
        throw error;
      }
      // Se è un errore di duplicazione, continua silenziosamente
    }
  }

  /**
   * Seed dell'utente amministratore
   */
  async seedAdminUser() {
    try {
      console.log('👤 [SEED] Creating admin user...');
      
      // Verifica se l'admin esiste già
      const existingAdmin = await authService.findUserByEmail(this.defaultAdminEmail);
      
      if (!existingAdmin) {
        const adminUser = await authService.registerUser({
          email: this.defaultAdminEmail,
          password: this.defaultAdminPassword,
          firstName: 'System',
          lastName: 'Administrator',
          role: 'admin'
        });
        
        console.log(`  ✅ Created admin user: ${this.defaultAdminEmail}`);
        console.log(`  🔑 Default password: ${this.defaultAdminPassword}`);
        console.log('  ⚠️ Please change the default password after first login!');
      } else {
        console.log(`  ⏭️ Admin user already exists: ${this.defaultAdminEmail}`);
      }
      
      console.log('✅ [SEED] Admin user ready');
      
    } catch (error) {
      console.error('❌ [SEED] Admin user creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Seed di utenti di esempio
   */
  async seedSampleUsers() {
    try {
      console.log('👥 [SEED] Creating sample users...');
      
      for (const userData of this.seedData.sampleUsers) {
        const existingUser = await authService.findUserByEmail(userData.email);
        
        if (!existingUser) {
          await authService.registerUser(userData);
          console.log(`  ✅ Created sample user: ${userData.email}`);
        } else {
          console.log(`  ⏭️ Sample user already exists: ${userData.email}`);
        }
      }
      
      console.log('✅ [SEED] Sample users created');
      
    } catch (error) {
      console.error('❌ [SEED] Sample user creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Genera e salva chiavi crittografiche
   */
  async seedCryptoKeys() {
    try {
      console.log('🔐 [SEED] Generating crypto keys...');
      
      // Verifica se esistono già chiavi JWT
      const existingKeysResult = await db.query(
        'SELECT id FROM crypto_keys WHERE key_type = ? AND is_active = TRUE',
        ['jwt_signing']
      );
      
      if (existingKeysResult.rows.length === 0) {
        // Genera nuove chiavi JWT
        const jwtKeys = await cryptoService.generateJWTKeyPair();
        
        // Crittografa la chiave privata prima dello storage
        const encryptedPrivateKey = cryptoService.encryptPrivateKey(jwtKeys.privateKey);
        
        await db.query(`
          INSERT INTO crypto_keys (key_id, key_type, algorithm, public_key, private_key_encrypted, is_active)
          VALUES (?, ?, ?, ?, ?, TRUE)
        `, [
          jwtKeys.keyId,
          'jwt_signing',
          jwtKeys.algorithm,
          jwtKeys.publicKey,
          encryptedPrivateKey
        ]);
        
        console.log(`  ✅ Generated and encrypted JWT keys: ${jwtKeys.keyId}`);
      } else {
        console.log('  ⏭️ JWT keys already exist');
      }
      
      // Genera chiave HMAC per sessioni se non esiste
      const hmacKeyResult = await db.query(
        'SELECT id FROM crypto_keys WHERE key_type = ? AND is_active = TRUE',
        ['hmac']
      );
      
      if (hmacKeyResult.rows.length === 0) {
        const hmacKey = cryptoService.generateHMACKey();
        
        // Crittografa la chiave HMAC prima dello storage
        const encryptedHmacKey = cryptoService.encryptPrivateKey(hmacKey.key);
        
        await db.query(`
          INSERT INTO crypto_keys (key_id, key_type, algorithm, private_key_encrypted, is_active)
          VALUES (?, ?, ?, ?, TRUE)
        `, [
          hmacKey.keyId,
          'hmac',
          hmacKey.algorithm,
          encryptedHmacKey
        ]);
        
        console.log(`  ✅ Generated and encrypted HMAC key: ${hmacKey.keyId}`);
      } else {
        console.log('  ⏭️ HMAC key already exists');
      }
      
      console.log('✅ [SEED] Crypto keys ready');
      
    } catch (error) {
      console.error('❌ [SEED] Crypto key generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Pulisce tutti i dati di seed (per testing)
   */
  async clean() {
    try {
      console.log('🧹 [SEED] Cleaning seed data...');
      
      const transaction = await db.beginTransaction();
      
      try {
        // Rimuove associazioni
        await transaction.query('DELETE FROM user_roles');
        await transaction.query('DELETE FROM role_permissions');
        
        // Rimuove utenti non admin
        await transaction.query('DELETE FROM users WHERE email != ?', [this.defaultAdminEmail]);
        
        // Rimuove ruoli non di sistema
        await transaction.query('DELETE FROM roles WHERE is_system_role = FALSE');
        
        // Reset auto increment
        await transaction.query('ALTER TABLE users AUTO_INCREMENT = 1');
        await transaction.query('ALTER TABLE roles AUTO_INCREMENT = 1');
        await transaction.query('ALTER TABLE permissions AUTO_INCREMENT = 1');
        
        await transaction.commit();
        console.log('✅ [SEED] Seed data cleaned');
        
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
      
    } catch (error) {
      console.error('❌ [SEED] Cleaning failed:', error.message);
      throw error;
    }
  }

  /**
   * Mostra le statistiche del seeding
   */
  async stats() {
    try {
      console.log('📊 [SEED] Seeding statistics:');
      
      const stats = {
        users: await db.query('SELECT COUNT(*) as count FROM users'),
        roles: await db.query('SELECT COUNT(*) as count FROM roles'),
        permissions: await db.query('SELECT COUNT(*) as count FROM permissions'),
        rolePermissions: await db.query('SELECT COUNT(*) as count FROM role_permissions'),
        userRoles: await db.query('SELECT COUNT(*) as count FROM user_roles'),
        cryptoKeys: await db.query('SELECT COUNT(*) as count FROM crypto_keys WHERE is_active = TRUE')
      };
      
      console.log(`  Users: ${stats.users.rows[0].count}`);
      console.log(`  Roles: ${stats.roles.rows[0].count}`);
      console.log(`  Permissions: ${stats.permissions.rows[0].count}`);
      console.log(`  Role-Permission mappings: ${stats.rolePermissions.rows[0].count}`);
      console.log(`  User-Role mappings: ${stats.userRoles.rows[0].count}`);
      console.log(`  Active crypto keys: ${stats.cryptoKeys.rows[0].count}`);
      
      // Lista utenti con ruoli (database-agnostic)
      const roleAggregationSQL = db.getStringAggregationSQL('r.name', ', ');
      const users = await db.query(`
        SELECT u.email, ${roleAggregationSQL} as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        GROUP BY u.id, u.email
      `);
      
      console.log('\nUsers and their roles:');
      users.rows.forEach(user => {
        console.log(`  ${user.email}: ${user.roles || 'No roles'}`);
      });
      
    } catch (error) {
      console.error('❌ [SEED] Stats retrieval failed:', error.message);
    }
  }
}

/**
 * Esegue il comando dalla CLI
 */
async function main() {
  const command = process.argv[2] || 'seed';
  const seeder = new DatabaseSeeder();
  
  try {
    switch (command) {
      case 'seed':
        await seeder.seed();
        break;
      case 'clean':
        await seeder.clean();
        break;
      case 'stats':
        await seeder.stats();
        break;
      default:
        console.log('Available commands: seed, clean, stats');
    }
    
    await db.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ [SEED] Command failed:', error.message);
    await db.close();
    process.exit(1);
  }
}

// Esegue solo se chiamato direttamente
if (require.main === module) {
  main();
}

module.exports = {
  DatabaseSeeder,
  main
};
