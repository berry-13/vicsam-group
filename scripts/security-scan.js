const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { db } = require('../database/database');

const execAsync = promisify(exec);

/**
 * Generatore di report di sicurezza automatico
 */
class SecurityReportGenerator {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      recommendations: []
    };
  }

  /**
   * Genera il report completo di sicurezza
   */
  async generateReport() {
    try {
      console.log('🔒 [SECURITY] Starting security analysis...');
      
      await this.checkDatabaseSecurity();
      await this.checkAuthenticationSecurity();
      await this.checkCryptographicSecurity();
      await this.checkInputValidationSecurity();
      await this.checkSessionSecurity();
      await this.checkRateLimitingSecurity();
      await this.checkDependencySecurity();
      await this.checkEnvironmentSecurity();
      await this.checkOWASPCompliance();
      
      await this.generateSummary();
      await this.saveReport();
      
      console.log('✅ [SECURITY] Security analysis completed');
      
    } catch (error) {
      console.error('❌ [SECURITY] Security analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Verifica la sicurezza del database
   */
  async checkDatabaseSecurity() {
    console.log('🗄️ [SECURITY] Checking database security...');
    
    const checks = [];
    
    try {
      // Verifica connessione sicura
      const connection = await db.query('SELECT @@ssl_ca, @@require_secure_transport');
      checks.push({
        name: 'Database SSL Connection',
        status: connection.rows[0]['@@require_secure_transport'] ? 'PASS' : 'WARN',
        message: connection.rows[0]['@@require_secure_transport'] 
          ? 'SSL connections required' 
          : 'SSL connections not enforced'
      });
      
      // Verifica schema integrità
      const tables = await db.query(`
        SELECT table_name, table_comment 
        FROM information_schema.tables 
        WHERE table_schema = ?
      `, [process.env.DB_NAME || 'vicsam_auth']);
      
      const requiredTables = ['users', 'roles', 'permissions', 'user_sessions', 'refresh_tokens', 'audit_logs'];
      const existingTables = tables.rows.map(t => t.table_name);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));
      
      checks.push({
        name: 'Database Schema Integrity',
        status: missingTables.length === 0 ? 'PASS' : 'FAIL',
        message: missingTables.length === 0 
          ? 'All required tables present' 
          : `Missing tables: ${missingTables.join(', ')}`
      });
      
      // Verifica indici di sicurezza
      const indexes = await db.query(`
        SELECT table_name, index_name, column_name
        FROM information_schema.statistics 
        WHERE table_schema = ? AND index_name LIKE '%security%' OR index_name LIKE '%audit%'
      `, [process.env.DB_NAME || 'vicsam_auth']);
      
      checks.push({
        name: 'Security Indexes',
        status: indexes.rows.length > 0 ? 'PASS' : 'WARN',
        message: `Found ${indexes.rows.length} security-related indexes`
      });
      
    } catch (error) {
      checks.push({
        name: 'Database Security Check',
        status: 'FAIL',
        message: `Database check failed: ${error.message}`
      });
    }
    
    this.report.checks.push(...checks);
  }

  /**
   * Verifica la sicurezza dell'autenticazione
   */
  async checkAuthenticationSecurity() {
    console.log('🔐 [SECURITY] Checking authentication security...');
    
    const checks = [];
    
    try {
      // Verifica configurazione password
      const passwordPolicy = {
        minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
        requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
        requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
        requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
        requireSpecial: process.env.PASSWORD_REQUIRE_SPECIAL === 'true'
      };
      
      const strongPolicy = passwordPolicy.minLength >= 8 && 
                          passwordPolicy.requireUppercase && 
                          passwordPolicy.requireLowercase && 
                          passwordPolicy.requireNumbers && 
                          passwordPolicy.requireSpecial;
      
      checks.push({
        name: 'Password Policy Strength',
        status: strongPolicy ? 'PASS' : 'WARN',
        message: strongPolicy 
          ? 'Strong password policy enforced' 
          : 'Weak password policy - consider strengthening requirements'
      });
      
      // Verifica lockout policy
      const maxAttempts = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5;
      const lockoutDuration = process.env.ACCOUNT_LOCKOUT_DURATION || '30m';
      
      checks.push({
        name: 'Account Lockout Policy',
        status: maxAttempts <= 5 && lockoutDuration ? 'PASS' : 'WARN',
        message: `Max attempts: ${maxAttempts}, Lockout: ${lockoutDuration}`
      });
      
      // Verifica JWT configuration
      const jwtConfig = {
        algorithm: process.env.JWT_ALGORITHM || 'RS256',
        expiration: process.env.JWT_EXPIRATION || '1h',
        issuer: process.env.JWT_ISSUER
      };
      
      const secureJWT = jwtConfig.algorithm.startsWith('RS') || jwtConfig.algorithm.startsWith('ES');
      
      checks.push({
        name: 'JWT Security Configuration',
        status: secureJWT ? 'PASS' : 'FAIL',
        message: secureJWT 
          ? `Using secure algorithm: ${jwtConfig.algorithm}` 
          : `Insecure algorithm: ${jwtConfig.algorithm}`
      });
      
      // Verifica sessioni
      const sessionConfig = {
        timeout: process.env.SESSION_TIMEOUT || '24h',
        secure: process.env.SESSION_SECURE === 'true',
        httpOnly: process.env.SESSION_HTTP_ONLY === 'true'
      };
      
      checks.push({
        name: 'Session Security',
        status: sessionConfig.secure && sessionConfig.httpOnly ? 'PASS' : 'WARN',
        message: `Secure: ${sessionConfig.secure}, HttpOnly: ${sessionConfig.httpOnly}`
      });
      
    } catch (error) {
      checks.push({
        name: 'Authentication Security Check',
        status: 'FAIL',
        message: `Authentication check failed: ${error.message}`
      });
    }
    
    this.report.checks.push(...checks);
  }

  /**
   * Verifica la sicurezza crittografica
   */
  async checkCryptographicSecurity() {
    console.log('🔑 [SECURITY] Checking cryptographic security...');
    
    const checks = [];
    
    try {
      // Verifica chiavi JWT
      const jwtKeys = await db.query(`
        SELECT key_type, algorithm, is_active, created_at, expires_at
        FROM crypto_keys 
        WHERE key_type IN ('jwt_signing', 'jwt_verification')
        AND is_active = TRUE
      `);
      
      checks.push({
        name: 'JWT Key Management',
        status: jwtKeys.rows.length > 0 ? 'PASS' : 'FAIL',
        message: `Found ${jwtKeys.rows.length} active JWT keys`
      });
      
      // Verifica rotazione chiavi
      const oldKeys = await db.query(`
        SELECT COUNT(*) as count
        FROM crypto_keys 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
        AND is_active = TRUE
      `);
      
      checks.push({
        name: 'Key Rotation Policy',
        status: oldKeys.rows[0].count === 0 ? 'PASS' : 'WARN',
        message: oldKeys.rows[0].count === 0 
          ? 'No old keys found' 
          : `${oldKeys.rows[0].count} keys older than 90 days`
      });
      
      // Verifica algoritmi
      const algorithms = await db.query(`
        SELECT DISTINCT algorithm 
        FROM crypto_keys 
        WHERE is_active = TRUE
      `);
      
      const secureAlgorithms = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
      const usedAlgorithms = algorithms.rows.map(a => a.algorithm);
      const insecureAlgorithms = usedAlgorithms.filter(a => !secureAlgorithms.includes(a));
      
      checks.push({
        name: 'Cryptographic Algorithms',
        status: insecureAlgorithms.length === 0 ? 'PASS' : 'FAIL',
        message: insecureAlgorithms.length === 0 
          ? 'All algorithms are secure' 
          : `Insecure algorithms found: ${insecureAlgorithms.join(', ')}`
      });
      
    } catch (error) {
      checks.push({
        name: 'Cryptographic Security Check',
        status: 'FAIL',
        message: `Cryptography check failed: ${error.message}`
      });
    }
    
    this.report.checks.push(...checks);
  }

  /**
   * Verifica la sicurezza della validazione input
   */
  async checkInputValidationSecurity() {
    console.log('🛡️ [SECURITY] Checking input validation security...');
    
    const checks = [];
    
    try {
      // Verifica presenza di validatori
      const validationFiles = [
        'api/utils/authValidation.js',
        'api/middleware/authMiddleware.js'
      ];
      
      let validationScore = 0;
      for (const file of validationFiles) {
        try {
          await fs.access(path.join(process.cwd(), file));
          validationScore++;
        } catch {
          // File not found
        }
      }
      
      checks.push({
        name: 'Input Validation Implementation',
        status: validationScore === validationFiles.length ? 'PASS' : 'WARN',
        message: `${validationScore}/${validationFiles.length} validation files found`
      });
      
      // Verifica sanitizzazione
      const sanitizationCheck = await this.checkCodeForPatterns([
        'api/utils/authValidation.js'
      ], ['sanitize', 'escape', 'validator']);
      
      checks.push({
        name: 'Input Sanitization',
        status: sanitizationCheck.found ? 'PASS' : 'WARN',
        message: sanitizationCheck.found 
          ? 'Sanitization patterns found' 
          : 'No sanitization patterns detected'
      });
      
    } catch (error) {
      checks.push({
        name: 'Input Validation Security Check',
        status: 'FAIL',
        message: `Input validation check failed: ${error.message}`
      });
    }
    
    this.report.checks.push(...checks);
  }

  /**
   * Verifica la sicurezza delle sessioni
   */
  async checkSessionSecurity() {
    console.log('🎫 [SECURITY] Checking session security...');
    
    const checks = [];
    
    try {
      // Verifica configurazione sessioni
      const activeSessions = await db.query(`
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE is_active = TRUE
      `);
      
      const expiredSessions = await db.query(`
        SELECT COUNT(*) as count 
        FROM user_sessions 
        WHERE expires_at < NOW() AND is_active = TRUE
      `);
      
      checks.push({
        name: 'Session Management',
        status: expiredSessions.rows[0].count === 0 ? 'PASS' : 'WARN',
        message: `Active: ${activeSessions.rows[0].count}, Expired: ${expiredSessions.rows[0].count}`
      });
      
      // Verifica refresh tokens
      const activeTokens = await db.query(`
        SELECT COUNT(*) as count 
        FROM refresh_tokens 
        WHERE is_revoked = FALSE
      `);
      
      const expiredTokens = await db.query(`
        SELECT COUNT(*) as count 
        FROM refresh_tokens 
        WHERE expires_at < NOW() AND is_revoked = FALSE
      `);
      
      checks.push({
        name: 'Refresh Token Management',
        status: expiredTokens.rows[0].count === 0 ? 'PASS' : 'WARN',
        message: `Active: ${activeTokens.rows[0].count}, Expired: ${expiredTokens.rows[0].count}`
      });
      
    } catch (error) {
      checks.push({
        name: 'Session Security Check',
        status: 'FAIL',
        message: `Session check failed: ${error.message}`
      });
    }
    
    this.report.checks.push(...checks);
  }

  /**
   * Verifica il rate limiting
   */
  async checkRateLimitingSecurity() {
    console.log('🚦 [SECURITY] Checking rate limiting security...');
    
    const checks = [];
    
    try {
      const rateLimitConfig = {
        general: {
          window: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
          maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
        },
        login: {
          window: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 900000,
          maxRequests: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS) || 5
        }
      };
      
      const generalOk = rateLimitConfig.general.maxRequests <= 1000 && rateLimitConfig.general.window >= 60000;
      const loginOk = rateLimitConfig.login.maxRequests <= 10 && rateLimitConfig.login.window >= 300000;
      
      checks.push({
        name: 'Rate Limiting Configuration',
        status: generalOk && loginOk ? 'PASS' : 'WARN',
        message: `General: ${rateLimitConfig.general.maxRequests}/${rateLimitConfig.general.window}ms, Login: ${rateLimitConfig.login.maxRequests}/${rateLimitConfig.login.window}ms`
      });
      
    } catch (error) {
      checks.push({
        name: 'Rate Limiting Security Check',
        status: 'FAIL',
        message: `Rate limiting check failed: ${error.message}`
      });
    }
    
    this.report.checks.push(...checks);
  }

  /**
   * Verifica la sicurezza delle dipendenze
   */
  async checkDependencySecurity() {
    console.log('📦 [SECURITY] Checking dependency security...');
    
    const checks = [];
    
    try {
      // Find the project root directory containing package.json
      const projectRoot = await this.findProjectRoot();
      
      // Esegui npm audit
      const { stdout, stderr } = await execAsync('npm audit --json', { 
        cwd: projectRoot,
        timeout: 30000 
      });
      
      const auditResult = JSON.parse(stdout);
      const vulnerabilities = auditResult.metadata?.vulnerabilities || {};
      
      const criticalCount = vulnerabilities.critical || 0;
      const highCount = vulnerabilities.high || 0;
      const moderateCount = vulnerabilities.moderate || 0;
      
      let status = 'PASS';
      if (criticalCount > 0) status = 'FAIL';
      else if (highCount > 0) status = 'WARN';
      
      checks.push({
        name: 'Dependency Vulnerabilities',
        status,
        message: `Critical: ${criticalCount}, High: ${highCount}, Moderate: ${moderateCount}`
      });
      
    } catch (error) {
      checks.push({
        name: 'Dependency Security Check',
        status: 'WARN',
        message: `Could not run npm audit: ${error.message}`
      });
    }
    
    this.report.checks.push(...checks);
  }

  /**
   * Verifica la configurazione dell'ambiente
   */
  async checkEnvironmentSecurity() {
    console.log('🌍 [SECURITY] Checking environment security...');
    
    const checks = [];
    
    const requiredEnvVars = [
      'JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY', 'DB_PASSWORD',
      'SESSION_SECRET', 'ENCRYPTION_KEY'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    checks.push({
      name: 'Environment Variables',
      status: missingEnvVars.length === 0 ? 'PASS' : 'FAIL',
      message: missingEnvVars.length === 0 
        ? 'All required environment variables set' 
        : `Missing: ${missingEnvVars.join(', ')}`
    });
    
    // Verifica NODE_ENV
    checks.push({
      name: 'Production Environment',
      status: process.env.NODE_ENV === 'production' ? 'PASS' : 'WARN',
      message: `NODE_ENV: ${process.env.NODE_ENV || 'not set'}`
    });
    
    this.report.checks.push(...checks);
  }

  /**
   * Verifica la conformità OWASP
   */
  async checkOWASPCompliance() {
    console.log('🛡️ [SECURITY] Checking OWASP compliance...');
    
    const checks = [];
    
    // OWASP Top 10 checks
    const owaspChecks = [
      {
        name: 'A01 Broken Access Control',
        check: () => this.hasRoleBasedAccess(),
        description: 'Role-based access control implemented'
      },
      {
        name: 'A02 Cryptographic Failures',
        check: () => this.hasStrongCryptography(),
        description: 'Strong cryptography in use'
      },
      {
        name: 'A03 Injection',
        check: () => this.hasInputValidation(),
        description: 'Input validation and sanitization'
      },
      {
        name: 'A07 Authentication Failures',
        check: () => this.hasSecureAuthentication(),
        description: 'Secure authentication implementation'
      },
      {
        name: 'A09 Security Logging',
        check: () => this.hasSecurityLogging(),
        description: 'Security logging and monitoring'
      }
    ];
    
    for (const owaspCheck of owaspChecks) {
      try {
        const result = await owaspCheck.check();
        checks.push({
          name: owaspCheck.name,
          status: result ? 'PASS' : 'WARN',
          message: owaspCheck.description
        });
      } catch (error) {
        checks.push({
          name: owaspCheck.name,
          status: 'FAIL',
          message: `Check failed: ${error.message}`
        });
      }
    }
    
    this.report.checks.push(...checks);
  }

  /**
   * Helper methods per OWASP checks
   */
  async hasRoleBasedAccess() {
    const roles = await db.query('SELECT COUNT(*) as count FROM roles');
    const permissions = await db.query('SELECT COUNT(*) as count FROM permissions');
    return roles.rows[0].count > 0 && permissions.rows[0].count > 0;
  }

  async hasStrongCryptography() {
    const keys = await db.query(`
      SELECT COUNT(*) as count 
      FROM crypto_keys 
      WHERE algorithm IN ('RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512')
      AND is_active = TRUE
    `);
    return keys.rows[0].count > 0;
  }

  async hasInputValidation() {
    return await this.checkFileExists('api/utils/authValidation.js');
  }

  async hasSecureAuthentication() {
    return parseInt(process.env.PASSWORD_MIN_LENGTH, 10) >= 8 && 
           parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS, 10) <= 5;
  }

  async hasSecurityLogging() {
    const auditLogs = await db.query('SELECT COUNT(*) as count FROM audit_logs');
    return auditLogs.rows[0].count > 0;
  }

  /**
   * Utility methods
   */
  async findProjectRoot(startDir = process.cwd()) {
    let currentDir = startDir;
    
    while (currentDir !== path.parse(currentDir).root) {
      try {
        await fs.access(path.join(currentDir, 'package.json'));
        return currentDir;
      } catch {
        currentDir = path.dirname(currentDir);
      }
    }
    
    // Fallback to current working directory if package.json not found
    return process.cwd();
  }

  async checkFileExists(filePath) {
    try {
      await fs.access(path.join(process.cwd(), filePath));
      return true;
    } catch {
      return false;
    }
  }

  async checkCodeForPatterns(files, patterns) {
    for (const file of files) {
      try {
        const content = await fs.readFile(path.join(process.cwd(), file), 'utf8');
        if (patterns.some(pattern => content.includes(pattern))) {
          return { found: true, file };
        }
      } catch {
        // File not found or not readable
      }
    }
    return { found: false };
  }

  /**
   * Escapes HTML characters to prevent XSS vulnerabilities
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text safe for HTML insertion
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return String(text || '');
    }
    
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'\/]/g, (match) => htmlEscapeMap[match]);
  }

  /**
   * Test method to verify HTML escaping functionality
   * @private
   */
  _testHtmlEscaping() {
    const testCases = [
      { input: '<script>alert("XSS")</script>', expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;' },
      { input: 'Safe text', expected: 'Safe text' },
      { input: '<img src="x" onerror="alert(1)">', expected: '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;' },
      { input: "It's a test & example", expected: 'It&#x27;s a test &amp; example' },
      { input: '', expected: '' },
      { input: null, expected: '' },
      { input: undefined, expected: '' },
      { input: 123, expected: '123' }
    ];

    console.log('\n🧪 [SECURITY] Testing HTML escaping function...');
    let passedTests = 0;
    
    testCases.forEach((testCase, index) => {
      const result = this.escapeHtml(testCase.input);
      const passed = result === testCase.expected;
      
      if (passed) {
        passedTests++;
        console.log(`✅ Test ${index + 1}: PASSED`);
      } else {
        console.log(`❌ Test ${index + 1}: FAILED`);
        console.log(`   Input: ${JSON.stringify(testCase.input)}`);
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Got: ${result}`);
      }
    });
    
    console.log(`\n🎯 [SECURITY] HTML Escaping Tests: ${passedTests}/${testCases.length} passed`);
    return passedTests === testCases.length;
  }

  /**
   * Genera il riepilogo finale
   */
  async generateSummary() {
    console.log('📊 [SECURITY] Generating summary...');
    
    this.report.summary.total = this.report.checks.length;
    this.report.summary.passed = this.report.checks.filter(c => c.status === 'PASS').length;
    this.report.summary.failed = this.report.checks.filter(c => c.status === 'FAIL').length;
    this.report.summary.warnings = this.report.checks.filter(c => c.status === 'WARN').length;
    
    // Genera raccomandazioni
    const failedChecks = this.report.checks.filter(c => c.status === 'FAIL');
    const warningChecks = this.report.checks.filter(c => c.status === 'WARN');
    
    this.report.recommendations = [
      ...failedChecks.map(c => ({
        priority: 'HIGH',
        check: c.name,
        message: c.message,
        action: 'Fix required for security compliance'
      })),
      ...warningChecks.map(c => ({
        priority: 'MEDIUM',
        check: c.name,
        message: c.message,
        action: 'Consider addressing for improved security'
      }))
    ];
  }

  /**
   * Salva il report
   */
  async saveReport() {
    const reportDir = path.join(process.cwd(), 'reports');
    const reportFile = path.join(reportDir, `security-report-${new Date().toISOString().split('T')[0]}.json`);
    
    try {
      await fs.mkdir(reportDir, { recursive: true });
      await fs.writeFile(reportFile, JSON.stringify(this.report, null, 2));
      
      console.log(`✅ [SECURITY] Report saved to: ${reportFile}`);
      
      // Genera anche un report HTML
      await this.generateHTMLReport(reportDir);
      
    } catch (error) {
      console.error('❌ [SECURITY] Failed to save report:', error.message);
    }
  }

  /**
   * Genera un report HTML user-friendly
   */
  async generateHTMLReport(reportDir) {
    const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Report - ${this.escapeHtml(this.report.timestamp)}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
        .pass { color: #28a745; }
        .warn { color: #ffc107; }
        .fail { color: #dc3545; }
        .check { padding: 10px; border-bottom: 1px solid #eee; }
        .check:last-child { border-bottom: none; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .recommendation { margin-bottom: 10px; padding: 10px; background: white; border-left: 4px solid #ffc107; }
        .high-priority { border-left-color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Report</h1>
        <p>Generated: ${this.escapeHtml(this.report.timestamp)}</p>
        <p>Version: ${this.escapeHtml(this.report.version)}</p>
    </div>

    <div class="summary">
        <div class="stat-card">
            <h3>${this.escapeHtml(this.report.summary.total)}</h3>
            <p>Total Checks</p>
        </div>
        <div class="stat-card pass">
            <h3>${this.escapeHtml(this.report.summary.passed)}</h3>
            <p>Passed</p>
        </div>
        <div class="stat-card warn">
            <h3>${this.escapeHtml(this.report.summary.warnings)}</h3>
            <p>Warnings</p>
        </div>
        <div class="stat-card fail">
            <h3>${this.escapeHtml(this.report.summary.failed)}</h3>
            <p>Failed</p>
        </div>
    </div>

    <h2>Security Checks</h2>
    <div>
        ${this.report.checks.map(check => `
            <div class="check">
                <h4 class="${this.escapeHtml(check.status.toLowerCase())}">${this.escapeHtml(check.name)} - ${this.escapeHtml(check.status)}</h4>
                <p>${this.escapeHtml(check.message)}</p>
            </div>
        `).join('')}
    </div>

    ${this.report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${this.report.recommendations.map(rec => `
            <div class="recommendation ${rec.priority === 'HIGH' ? 'high-priority' : ''}">
                <h4>${this.escapeHtml(rec.check)} (${this.escapeHtml(rec.priority)})</h4>
                <p>${this.escapeHtml(rec.message)}</p>
                <p><strong>Action:</strong> ${this.escapeHtml(rec.action)}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
    `;
    
    const htmlFile = path.join(reportDir, `security-report-${new Date().toISOString().split('T')[0]}.html`);
    await fs.writeFile(htmlFile, htmlReport);
    
    console.log(`✅ [SECURITY] HTML report saved to: ${htmlFile}`);
  }

  /**
   * Stampa il riepilogo nella console
   */
  printSummary() {
    console.log('\n🎉 [SECURITY] Security Report Summary:');
    console.log('=====================================');
    console.log(`Total Checks: ${this.report.summary.total}`);
    console.log(`✅ Passed: ${this.report.summary.passed}`);
    console.log(`⚠️ Warnings: ${this.report.summary.warnings}`);
    console.log(`❌ Failed: ${this.report.summary.failed}`);
    console.log('=====================================\n');
    
    if (this.report.summary.failed > 0) {
      console.log('⚠️ CRITICAL ISSUES FOUND - Please review the full report');
    } else if (this.report.summary.warnings > 0) {
      console.log('⚠️ Some warnings found - Consider reviewing recommendations');
    } else {
      console.log('✅ All security checks passed!');
    }
  }
}

// CLI Interface
async function main() {
  const generator = new SecurityReportGenerator();
  
  // Check for test command line argument
  if (process.argv.includes('--test-escaping')) {
    console.log('🧪 [SECURITY] Running HTML escaping tests...');
    const testsPassed = generator._testHtmlEscaping();
    process.exit(testsPassed ? 0 : 1);
  }
  
  try {
    await generator.generateReport();
    generator.printSummary();
    
  } catch (error) {
    console.error('❌ Security report generation failed:', error.message);
    process.exit(1);
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  main();
}

module.exports = {
  SecurityReportGenerator
};
