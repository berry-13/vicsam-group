const axios = require('axios');
const { performance } = require('perf_hooks');

/**
 * Test di performance per il sistema di autenticazione
 * 
 * Configuration:
 * - Environment variables: TEST_EMAIL, TEST_PASSWORD
 * - Constructor config object: { email: 'user@example.com', password: 'password' }
 * - Defaults: admin@vicsam.com / VicsAm2025!
 * 
 * Usage examples:
 * - Default: node performance-test.js
 * - With env vars: TEST_EMAIL=test@example.com TEST_PASSWORD=mypass node performance-test.js
 * - With custom URL: node performance-test.js http://production-server:3000
 */
class AuthPerformanceTester {
  constructor(baseUrl = 'http://localhost:3000', config = {}) {
    this.baseUrl = baseUrl;
    this.config = {
      email: process.env.TEST_EMAIL || config.email || 'admin@vicsam.com',
      password: process.env.TEST_PASSWORD || config.password || 'VicsAm2025!',
      ...config
    };
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl,
      tests: []
    };
  }

  /**
   * Get test credentials from configuration
   */
  getTestCredentials() {
    return {
      email: this.config.email,
      password: this.config.password
    };
  }

  /**
   * Esegue tutti i test di performance
   */
  async runAllTests() {
    console.log('⚡ [PERFORMANCE] Starting authentication performance tests...');
    
    try {
      await this.testAuthenticationLatency();
      await this.testLoginThroughput();
      await this.testJWTValidation();
      await this.testSessionManagement();
      await this.testConcurrentLogins();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ [PERFORMANCE] Performance testing failed:', error.message);
      throw error;
    }
  }

  /**
   * Test della latenza di autenticazione
   */
  async testAuthenticationLatency() {
    console.log('🔐 [PERFORMANCE] Testing authentication latency...');
    
    const testData = this.getTestCredentials();
    
    const iterations = 10;
    const latencies = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();
        
        const response = await axios.post(`${this.baseUrl}/api/v2/auth/login`, testData, {
          timeout: 5000
        });
        
        const end = performance.now();
        const latency = end - start;
        latencies.push(latency);
        
        console.log(`  Login ${i + 1}: ${latency.toFixed(2)}ms`);
        
        // Cleanup - logout if login successful
        if (response.data.success && response.data.data.token) {
          try {
            await axios.post(`${this.baseUrl}/api/v2/auth/logout`, {}, {
              headers: {
                'Authorization': `Bearer ${response.data.data.token}`
              },
              timeout: 2000
            });
          } catch {
            // Ignore logout errors
          }
        }
        
        // Wait between requests
        await this.sleep(100);
        
      } catch (error) {
        console.log(`  Login ${i + 1}: FAILED (${error.message})`);
        latencies.push(null);
      }
    }
    
    const validLatencies = latencies.filter(l => l !== null);
    const avgLatency = validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length;
    const minLatency = Math.min(...validLatencies);
    const maxLatency = Math.max(...validLatencies);
    
    const testResult = {
      name: 'Authentication Latency',
      iterations,
      successRate: (validLatencies.length / iterations) * 100,
      avgLatency: avgLatency.toFixed(2),
      minLatency: minLatency.toFixed(2),
      maxLatency: maxLatency.toFixed(2),
      requirement: '<200ms',
      passed: avgLatency < 200
    };
    
    this.results.tests.push(testResult);
    
    console.log(`✅ [PERFORMANCE] Authentication latency: ${avgLatency.toFixed(2)}ms (avg)`);
  }

  /**
   * Test del throughput di login
   */
  async testLoginThroughput() {
    console.log('🚀 [PERFORMANCE] Testing login throughput...');
    
    const testData = this.getTestCredentials();
    
    const duration = 10000; // 10 seconds
    const startTime = performance.now();
    let requests = 0;
    let successfulRequests = 0;
    
    const promises = [];
    
    while (performance.now() - startTime < duration) {
      promises.push(
        axios.post(`${this.baseUrl}/api/v2/auth/login`, testData, {
          timeout: 3000
        }).then(response => {
          if (response.data.success) {
            successfulRequests++;
          }
          return response;
        }).catch(() => {
          // Count failed requests too
        })
      );
      
      requests++;
      await this.sleep(50); // Small delay to prevent overwhelming
    }
    
    await Promise.allSettled(promises);
    
    const actualDuration = performance.now() - startTime;
    const throughput = (requests / actualDuration) * 1000; // requests per second
    
    const testResult = {
      name: 'Login Throughput',
      duration: actualDuration.toFixed(2),
      totalRequests: requests,
      successfulRequests,
      throughput: throughput.toFixed(2),
      successRate: ((successfulRequests / requests) * 100).toFixed(2),
      requirement: '>10 req/s',
      passed: throughput > 10
    };
    
    this.results.tests.push(testResult);
    
    console.log(`✅ [PERFORMANCE] Login throughput: ${throughput.toFixed(2)} req/s`);
  }

  /**
   * Test della validazione JWT
   */
  async testJWTValidation() {
    console.log('🎫 [PERFORMANCE] Testing JWT validation performance...');
    
    // First, get a token
    let token;
    try {
      const loginResponse = await axios.post(`${this.baseUrl}/api/v2/auth/login`, this.getTestCredentials());
      
      if (!loginResponse.data.success) {
        throw new Error('Failed to get token for JWT validation test');
      }
      
      token = loginResponse.data.data.token;
    } catch (error) {
      console.log(`❌ [PERFORMANCE] Could not get token for JWT test: ${error.message}`);
      return;
    }
    
    const iterations = 50;
    const validationTimes = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();
        
        await axios.get(`${this.baseUrl}/api/v2/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 2000
        });
        
        const end = performance.now();
        validationTimes.push(end - start);
        
      } catch (error) {
        validationTimes.push(null);
      }
    }
    
    const validTimes = validationTimes.filter(t => t !== null);
    const avgValidation = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    
    const testResult = {
      name: 'JWT Validation',
      iterations,
      successRate: ((validTimes.length / iterations) * 100).toFixed(2),
      avgValidationTime: avgValidation.toFixed(2),
      requirement: '<50ms',
      passed: avgValidation < 50
    };
    
    this.results.tests.push(testResult);
    
    // Cleanup
    try {
      await axios.post(`${this.baseUrl}/api/v2/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {
      // Ignore cleanup errors
    }
    
    console.log(`✅ [PERFORMANCE] JWT validation: ${avgValidation.toFixed(2)}ms (avg)`);
  }

  /**
   * Test della gestione sessioni
   */
  async testSessionManagement() {
    console.log('🎭 [PERFORMANCE] Testing session management performance...');
    
    const sessionCount = 20;
    const sessions = [];
    
    // Create multiple sessions
    const startCreate = performance.now();
    
    for (let i = 0; i < sessionCount; i++) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/v2/auth/login`, this.getTestCredentials());
        
        if (response.data.success) {
          sessions.push(response.data.data.token);
        }
        
        await this.sleep(10);
        
      } catch (error) {
        console.log(`  Session ${i + 1} creation failed: ${error.message}`);
      }
    }
    
    const endCreate = performance.now();
    const creationTime = endCreate - startCreate;
    
    // Test concurrent access
    const startAccess = performance.now();
    const accessPromises = sessions.map(token => 
      axios.get(`${this.baseUrl}/api/v2/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 2000
      }).catch(() => null)
    );
    
    const accessResults = await Promise.allSettled(accessPromises);
    const endAccess = performance.now();
    const accessTime = endAccess - startAccess;
    
    const successfulAccess = accessResults.filter(r => r.status === 'fulfilled' && r.value).length;
    
    // Cleanup sessions
    const cleanupPromises = sessions.map(token =>
      axios.post(`${this.baseUrl}/api/v2/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null)
    );
    
    await Promise.allSettled(cleanupPromises);
    
    const testResult = {
      name: 'Session Management',
      sessionCount,
      creationTime: creationTime.toFixed(2),
      accessTime: accessTime.toFixed(2),
      successfulAccess,
      avgCreationTime: (creationTime / sessionCount).toFixed(2),
      avgAccessTime: (accessTime / sessionCount).toFixed(2),
      requirement: '<100ms per session',
      passed: (creationTime / sessionCount) < 100 && (accessTime / sessionCount) < 100
    };
    
    this.results.tests.push(testResult);
    
    console.log(`✅ [PERFORMANCE] Session management: ${(creationTime / sessionCount).toFixed(2)}ms/session creation`);
  }

  /**
   * Test di login concorrenti
   */
  async testConcurrentLogins() {
    console.log('⚡ [PERFORMANCE] Testing concurrent logins...');
    
    const concurrentUsers = 10;
    const testData = this.getTestCredentials();
    
    const start = performance.now();
    
    const loginPromises = Array.from({ length: concurrentUsers }, (_, i) =>
      axios.post(`${this.baseUrl}/api/v2/auth/login`, testData, {
        timeout: 5000
      }).then(response => ({
        success: response.data.success,
        token: response.data.data?.token,
        index: i
      })).catch(error => ({
        success: false,
        error: error.message,
        index: i
      }))
    );
    
    const results = await Promise.allSettled(loginPromises);
    const end = performance.now();
    
    const successfulLogins = results.filter(r => 
      r.status === 'fulfilled' && r.value.success
    ).length;
    
    const totalTime = end - start;
    const avgTimePerLogin = totalTime / concurrentUsers;
    
    // Cleanup tokens
    const tokens = results
      .filter(r => r.status === 'fulfilled' && r.value.token)
      .map(r => r.value.token);
    
    const cleanupPromises = tokens.map(token =>
      axios.post(`${this.baseUrl}/api/v2/auth/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => null)
    );
    
    await Promise.allSettled(cleanupPromises);
    
    const testResult = {
      name: 'Concurrent Logins',
      concurrentUsers,
      successfulLogins,
      totalTime: totalTime.toFixed(2),
      avgTimePerLogin: avgTimePerLogin.toFixed(2),
      successRate: ((successfulLogins / concurrentUsers) * 100).toFixed(2),
      requirement: '>80% success rate',
      passed: (successfulLogins / concurrentUsers) > 0.8
    };
    
    this.results.tests.push(testResult);
    
    console.log(`✅ [PERFORMANCE] Concurrent logins: ${successfulLogins}/${concurrentUsers} successful`);
  }

  /**
   * Genera il report di performance
   */
  async generateReport() {
    console.log('📊 [PERFORMANCE] Generating performance report...');
    
    const fs = require('fs').promises;
    const path = require('path');
    
    // Calculate summary
    const totalTests = this.results.tests.length;
    const passedTests = this.results.tests.filter(t => t.passed).length;
    const passRate = ((passedTests / totalTests) * 100).toFixed(2);
    
    this.results.summary = {
      totalTests,
      passedTests,
      passRate,
      overallResult: passRate >= 80 ? 'PASS' : 'FAIL'
    };
    
    // Save JSON report
    const reportDir = path.join(process.cwd(), 'reports');
    await fs.mkdir(reportDir, { recursive: true });
    
    const jsonFile = path.join(reportDir, `performance-report-${new Date().toISOString().split('T')[0]}.json`);
    await fs.writeFile(jsonFile, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    const htmlFile = path.join(reportDir, `performance-report-${new Date().toISOString().split('T')[0]}.html`);
    await fs.writeFile(htmlFile, htmlReport);
    
    console.log(`✅ [PERFORMANCE] Reports saved:`);
    console.log(`  JSON: ${jsonFile}`);
    console.log(`  HTML: ${htmlFile}`);
    
    this.printSummary();
  }

  /**
   * Genera il report HTML
   */
  generateHTMLReport() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Performance Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .test-result { border: 1px solid #ddd; margin-bottom: 15px; border-radius: 8px; }
        .test-header { padding: 15px; background: #f8f9fa; border-bottom: 1px solid #ddd; }
        .test-content { padding: 15px; }
        .pass { color: #28a745; font-weight: bold; }
        .fail { color: #dc3545; font-weight: bold; }
        .metric { display: inline-block; margin-right: 20px; }
        .metric-value { font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Authentication Performance Report</h1>
        <p><strong>Generated:</strong> ${this.results.timestamp}</p>
        <p><strong>Base URL:</strong> ${this.results.baseUrl}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${this.results.summary.totalTests}</p>
        <p><strong>Passed Tests:</strong> ${this.results.summary.passedTests}</p>
        <p><strong>Pass Rate:</strong> ${this.results.summary.passRate}%</p>
        <p><strong>Overall Result:</strong> <span class="${this.results.summary.overallResult.toLowerCase()}">${this.results.summary.overallResult}</span></p>
    </div>

    <h2>Test Results</h2>
    ${this.results.tests.map(test => `
        <div class="test-result">
            <div class="test-header">
                <h3>${test.name} - <span class="${test.passed ? 'pass' : 'fail'}">${test.passed ? 'PASS' : 'FAIL'}</span></h3>
                <p><strong>Requirement:</strong> ${test.requirement}</p>
            </div>
            <div class="test-content">
                ${Object.entries(test).map(([key, value]) => {
                  if (key === 'name' || key === 'requirement' || key === 'passed') return '';
                  return `<div class="metric"><strong>${key}:</strong> <span class="metric-value">${value}</span></div>`;
                }).join('')}
            </div>
        </div>
    `).join('')}
</body>
</html>
    `;
  }

  /**
   * Stampa il riepilogo nella console
   */
  printSummary() {
    console.log('\n⚡ [PERFORMANCE] Performance Test Summary:');
    console.log('==========================================');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passedTests}`);
    console.log(`Pass Rate: ${this.results.summary.passRate}%`);
    console.log(`Overall Result: ${this.results.summary.overallResult}`);
    console.log('==========================================\n');
    
    this.results.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.passed ? 'PASS' : 'FAIL'}`);
    });
    
    if (this.results.summary.overallResult === 'PASS') {
      console.log('\n🎉 All performance requirements met!');
    } else {
      console.log('\n⚠️ Some performance requirements not met. Review the detailed report.');
    }
  }

  /**
   * Utility function for sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Interface
async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  // Configuration can be passed via environment variables or constructor config
  // Environment variables: TEST_EMAIL, TEST_PASSWORD
  // Example: TEST_EMAIL=test@example.com TEST_PASSWORD=mypassword node performance-test.js
  const config = {
    // Additional config options can be added here if needed
  };
  
  const tester = new AuthPerformanceTester(baseUrl, config);
  
  console.log('🔧 [CONFIG] Using test credentials:');
  console.log(`   Email: ${tester.config.email}`);
  console.log(`   Password: ${'*'.repeat(tester.config.password.length)}`);
  console.log('');
  
  try {
    await tester.runAllTests();
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error.message);
    process.exit(1);
  }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
  main();
}

module.exports = {
  AuthPerformanceTester
};
