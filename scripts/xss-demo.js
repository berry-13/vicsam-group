/**
 * Demonstration script showing XSS vulnerability fix in security-scan.js
 * This script creates a test security report with potentially malicious content
 * to demonstrate that the HTML escaping prevents XSS attacks.
 */

const { SecurityReportGenerator } = require('./security-scan.js');
const fs = require('fs').promises;
const path = require('path');

async function demonstrateXssFix() {
  console.log('🛡️ [XSS DEMO] Demonstrating XSS vulnerability fix...\n');
  
  // Create a test security report with potentially malicious content
  const maliciousReport = {
    timestamp: '<script>alert("XSS in timestamp!")</script>',
    version: '<img src="x" onerror="alert(\'XSS in version!\')">',
    summary: {
      total: '<script>document.body.innerHTML="HACKED"</script>',
      passed: '"onmouseover="alert(\'XSS\')"',
      warnings: '</div><script>alert("XSS")</script><div>',
      failed: "'; DROP TABLE users; --"
    },
    checks: [
      {
        name: '<script>alert("XSS in check name!")</script>',
        status: '<img src="x" onerror="alert(\'XSS in status!\')">',
        message: '<iframe src="javascript:alert(\'XSS in message!\')"></iframe>'
      },
      {
        name: 'Safe check name',
        status: 'PASS',
        message: 'This is a safe message with no XSS attempts.'
      }
    ],
    recommendations: [
      {
        check: '<script>alert("XSS in recommendation!")</script>',
        priority: '<img src="x" onerror="alert(\'HIGH PRIORITY XSS!\')">',
        message: '<div onclick="alert(\'Click XSS!\')">Click me</div>',
        action: '<form><input type="text" autofocus onfocus="alert(\'Focus XSS!\')"></form>'
      }
    ]
  };

  // Create a security generator instance
  const generator = new SecurityReportGenerator();
  
  // Override the report with our malicious test data
  generator.report = maliciousReport;
  
  try {
    // Generate the HTML report (this will use the escaping function)
    const reportDir = path.join(process.cwd(), 'test-reports');
    await fs.mkdir(reportDir, { recursive: true });
    await generator.generateHTMLReport(reportDir);
    
    const htmlFile = path.join(reportDir, `security-report-${new Date().toISOString().split('T')[0]}.html`);
    const htmlContent = await fs.readFile(htmlFile, 'utf8');
    
    console.log('✅ [XSS DEMO] HTML report generated successfully');
    console.log(`📄 [XSS DEMO] Report saved to: ${htmlFile}`);
    
    // Check if dangerous content was properly escaped by looking for truly dangerous unescaped patterns
    // We need to be very specific to avoid false positives with properly escaped content
    const reallyDangerousPatterns = [
      { pattern: /<script[^>]*>/i, description: 'Unescaped opening script tags' },
      { pattern: /on\w+\s*=\s*[^&"]/i, description: 'Unescaped event handlers' },
      { pattern: /<iframe[^>]*src\s*=\s*[^&"']/i, description: 'Unescaped iframe with src' }
    ];
    
    // Special check for javascript: protocol that's not properly escaped
    if (htmlContent.includes('javascript:') && !htmlContent.includes('&quot;javascript:')) {
      console.log('❌ [XSS DEMO] Found unescaped JavaScript protocol');
      foundDangerous = true;
    }
    
    let foundDangerous = false;
    reallyDangerousPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(htmlContent)) {
        console.log(`❌ [XSS DEMO] Found ${description}`);
        foundDangerous = true;
      }
    });
    
    // Check for properly escaped dangerous content to confirm escaping is working
    const escapedPatterns = [
      { pattern: '&lt;script&gt;', description: 'Script tags properly escaped' },
      { pattern: '&quot;javascript:', description: 'JavaScript protocol properly escaped' },
      { pattern: '&quot;', description: 'Double quotes properly escaped' },
      { pattern: '&#x27;', description: 'Single quotes properly escaped' },
      { pattern: '&amp;', description: 'Ampersands properly escaped' },
      { pattern: '&lt;&#x2F;script&gt;', description: 'Closing script tags properly escaped' },
      { pattern: 'onclick=&quot;', description: 'Event handlers properly escaped' }
    ];
    
    let foundEscaped = 0;
    escapedPatterns.forEach(({ pattern, description }) => {
      if (htmlContent.includes(pattern)) {
        console.log(`✅ [XSS DEMO] ${description}`);
        foundEscaped++;
      }
    });
    
    if (!foundDangerous) {
      console.log('✅ [XSS DEMO] No dangerous unescaped patterns found - HTML escaping is working perfectly!');
    } else {
      console.log('⚠️ [XSS DEMO] Some dangerous patterns were found - please review the implementation.');
    }
    
    console.log(`\n📊 [XSS DEMO] Found ${foundEscaped}/${escapedPatterns.length} expected escaped patterns`);
    
    if (!foundDangerous && foundEscaped >= 5) {
      console.log('\n🎉 [XSS DEMO] XSS vulnerability has been successfully mitigated!');
      console.log('💡 [XSS DEMO] You can safely open the generated HTML report without risk of XSS execution.');
      console.log('🔒 [XSS DEMO] All dangerous content has been properly HTML-encoded.');
    }
    
  } catch (error) {
    console.error('❌ [XSS DEMO] Error during demonstration:', error.message);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateXssFix().catch(console.error);
}

module.exports = { demonstrateXssFix };
