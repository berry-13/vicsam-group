#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

/**
 * Script di test completo per verificare l'implementazione del sistema di autenticazione
 */
class AuthSystemTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  /**
   * Esegue tutti i test di verifica
   */
  async runAllTests() {
    console.log('🧪 [TEST] Starting comprehensive authentication system tests...');
    
    try {
      await this.testDatabaseConnection();
      await this.testDatabaseSchema();
      await this.testEnvironmentConfiguration();
      await this.testServerStartup();
      await this.testAPIEndpoints();
      await this.testAuthenticationFlow();
      await this.testRoleBasedAccess();
      await this.testSecurityFeatures();
      await this.testPerformance();
      
      this.generateSummary();
      this.printResults();
      
    } catch (error) {
      console.error('❌ [TEST] Testing failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Test della connessione al database
   */
  async testDatabaseConnection() {
    console.log('🗄️ [TEST] Testing database connection...');
    
    try {
      await execAsync('node -e "require(\'./database/database\').db.testConnection().then(r => process.exit(r ? 0 : 1))"');
      
      this.addResult({
        name: 'Database Connection',
        status: 'PASS',
        message: 'Database connection successful'
      });
      
    } catch (error) {
      this.addResult({
        name: 'Database Connection',
        status: 'FAIL',
        message: 'Database connection failed'
      });
    }
  }

  /**
   * Test dello schema del database
   */
  async testDatabaseSchema() {
    console.log('📋 [TEST] Testing database schema...');
    
    try {
      const { stdout } = await execAsync('node database/migrate.js verify');
      
      if (stdout.includes('Schema integrity verified')) {
        this.addResult({
          name: 'Database Schema',
          status: 'PASS',
          message: 'All required tables present'
        });
      } else {
        this.addResult({
          name: 'Database Schema',
          status: 'FAIL',
          message: 'Schema verification failed'
        });
      }
      
    } catch (error) {
      this.addResult({
        name: 'Database Schema',
        status: 'FAIL',
        message: `Schema check failed: ${error.message}`
      });
    }
  }

  /**
   * Test della configurazione ambiente
   */
  async testEnvironmentConfiguration() {
    console.log('🌍 [TEST] Testing environment configuration...');
    
    const requiredEnvVars = [
      'JWT_PRIVATE_KEY',
      'JWT_PUBLIC_KEY', 
      'DB_HOST',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME'
    ];
    
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingVars.length === 0) {
      this.addResult({
        name: 'Environment Configuration',
        status: 'PASS',
        message: 'All required environment variables set'
      });
    } else {
      this.addResult({
        name: 'Environment Configuration',
        status: 'FAIL',
        message: `Missing variables: ${missingVars.join(', ')}`
      });
    }
  }

  /**
   * Test dell'avvio del server
   */
  async testServerStartup() {
    console.log('🚀 [TEST] Testing server startup...');
    
    try {
      // Test che il server possa essere importato senza errori
      await execAsync('node -e "require(\'./server.js\')" --check');
      
      this.addResult({
        name: 'Server Startup',
        status: 'PASS',
        message: 'Server configuration valid'
      });
      
    } catch (error) {
      this.addResult({
        name: 'Server Startup',
        status: 'FAIL',
        message: `Server startup failed: ${error.message}`
      });
    }
  }

  /**
   * Test degli endpoint API
   */
  async testAPIEndpoints() {
    console.log('🔌 [TEST] Testing API endpoints...');
    
    try {
      // Test che i file delle route esistano
      const fs = require('fs').promises;
      
      const routeFiles = [
        'api/routes/authRoutesV2.js',
        'api/controllers/authControllerV2.js',
        'api/middleware/authMiddleware.js',
        'api/services/authService.js'
      ];
      
      let existingFiles = 0;
      for (const file of routeFiles) {
        try {
          await fs.access(path.join(process.cwd(), file));
          existingFiles++;
        } catch {
          // File not found
        }
      }
      
      if (existingFiles === routeFiles.length) {
        this.addResult({
          name: 'API Endpoints',
          status: 'PASS',
          message: 'All API files present'
        });
      } else {
        this.addResult({
          name: 'API Endpoints',
          status: 'FAIL',
          message: `Missing ${routeFiles.length - existingFiles} API files`
        });
      }
      
    } catch (error) {
      this.addResult({
        name: 'API Endpoints',
        status: 'FAIL',
        message: `API check failed: ${error.message}`
      });
    }
  }

  /**
   * Test del flusso di autenticazione
   */
  async testAuthenticationFlow() {
    console.log('🔐 [TEST] Testing authentication flow...');
    
    try {
      // Test che i servizi di autenticazione possano essere importati
      await execAsync('node -e "const auth = require(\'./api/services/authService\'); console.log(\'Auth service loaded\')"');
      
      this.addResult({
        name: 'Authentication Flow',
        status: 'PASS',
        message: 'Authentication services loadable'
      });
      
    } catch (error) {
      this.addResult({
        name: 'Authentication Flow',
        status: 'FAIL',
        message: `Authentication flow test failed: ${error.message}`
      });
    }
  }

  /**
   * Test del controllo accesso basato sui ruoli
   */
  async testRoleBasedAccess() {
    console.log('👥 [TEST] Testing role-based access control...');
    
    try {
      const { db } = require('./database/database');
      
      // Test che le tabelle RBAC esistano
      const tables = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name IN ('roles', 'permissions', 'user_roles', 'role_permissions')
      `, [process.env.DB_NAME || 'vicsam_auth']);
      
      if (tables.rows.length === 4) {
        this.addResult({
          name: 'Role-Based Access Control',
          status: 'PASS',
          message: 'RBAC tables present'
        });
      } else {
        this.addResult({
          name: 'Role-Based Access Control',
          status: 'FAIL',
          message: `Missing RBAC tables: ${4 - tables.rows.length}`
        });
      }
      
    } catch (error) {
      this.addResult({
        name: 'Role-Based Access Control',
        status: 'FAIL',
        message: `RBAC test failed: ${error.message}`
      });
    }
  }

  /**
   * Test delle funzionalità di sicurezza
   */
  async testSecurityFeatures() {
    console.log('🛡️ [TEST] Testing security features...');
    
    try {
      const fs = require('fs').promises;
      
      // Test che i file di sicurezza esistano
      const securityFiles = [
        'api/utils/authValidation.js',
        'api/services/cryptoService.js',
        'scripts/security-scan.js'
      ];
      
      let existingFiles = 0;
      for (const file of securityFiles) {
        try {
          await fs.access(path.join(process.cwd(), file));
          existingFiles++;
        } catch {
          // File not found
        }
      }
      
      if (existingFiles === securityFiles.length) {
        this.addResult({
          name: 'Security Features',
          status: 'PASS',
          message: 'Security components present'
        });
      } else {
        this.addResult({
          name: 'Security Features',
          status: 'WARN',
          message: `Missing ${securityFiles.length - existingFiles} security files`
        });
      }
      
    } catch (error) {
      this.addResult({
        name: 'Security Features',
        status: 'FAIL',
        message: `Security test failed: ${error.message}`
      });
    }
  }

  /**
   * Test delle prestazioni
   */
  async testPerformance() {
    console.log('⚡ [TEST] Testing performance configuration...');
    
    try {
      const fs = require('fs').promises;
      
      // Test che il file di performance test esista
      await fs.access(path.join(process.cwd(), 'scripts/performance-test.js'));
      
      this.addResult({
        name: 'Performance Testing',
        status: 'PASS',
        message: 'Performance test script available'
      });
      
    } catch (error) {
      this.addResult({
        name: 'Performance Testing',
        status: 'WARN',
        message: 'Performance test script not found'
      });
    }
  }

  /**
   * Aggiungi risultato test
   */
  addResult(result) {
    this.results.tests.push(result);
    
    switch (result.status) {
      case 'PASS':
        console.log(`  ✅ ${result.name}: ${result.message}`);
        break;
      case 'WARN':
        console.log(`  ⚠️ ${result.name}: ${result.message}`);
        break;
      case 'FAIL':
        console.log(`  ❌ ${result.name}: ${result.message}`);
        break;
    }
  }

  /**
   * Genera il riepilogo
   */
  generateSummary() {
    this.results.summary.total = this.results.tests.length;
    this.results.summary.passed = this.results.tests.filter(t => t.status === 'PASS').length;
    this.results.summary.warnings = this.results.tests.filter(t => t.status === 'WARN').length;
    this.results.summary.failed = this.results.tests.filter(t => t.status === 'FAIL').length;
  }

  /**
   * Stampa i risultati finali
   */
  printResults() {
    console.log('\n🎉 [TEST] System Verification Summary:');
    console.log('=====================================');
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`⚠️ Warnings: ${this.results.summary.warnings}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log('=====================================\n');

    if (this.results.summary.failed === 0) {
      console.log('🎉 All critical tests passed! System is ready for use.');
      
      if (this.results.summary.warnings > 0) {
        console.log('⚠️ Some warnings present - consider reviewing for optimal setup.');
      }
      
      console.log('\n📋 Next Steps:');
      console.log('1. Start the server: npm start');
      console.log('2. Build the client: cd client && npm run build');
      console.log('3. Access admin interface: http://localhost:3000/users');
      console.log('4. Default admin: admin@vicsam.com / VicsAm2025!');
      console.log('5. Run security scan: npm run security:scan');
      console.log('6. Run performance test: npm run performance:test');
      
    } else {
      console.log('❌ Critical issues found! Please fix the following:');
      
      this.results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.message}`);
        });
        
      console.log('\nRefer to README-AUTH.md for detailed setup instructions.');
      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  console.log('🧪 Starting Vicsam Group Authentication System Verification\n');
  
  // Load environment variables
  require('dotenv').config();
  
  const tester = new AuthSystemTester();
  await tester.runAllTests();
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  AuthSystemTester
};
