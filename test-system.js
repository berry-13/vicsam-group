const http = require('http');

function testEndpoint(path, expectedStatus = 200, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {}
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const result = {
          path,
          status: res.statusCode,
          expected: expectedStatus,
          success: res.statusCode === expectedStatus,
          data: data
        };
        resolve(result);
      });
    });

    req.on('error', (error) => {
      reject({ path, error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ path, error: 'Request timeout' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing VicSam System...\n');

  const tests = [
    { path: '/api/auth/info', desc: 'Public API info' },
    { path: '/downloads/info', desc: 'Download info' },
    { path: '/api/auth/verify', desc: 'Auth verification (should fail)', expectedStatus: 401 },
    { path: '/api/auth/verify', desc: 'Auth with bearer token', token: 'test-bearer-token-12345' },
    { path: '/get', desc: 'Download ZIP file (may fail if file missing)', expectedStatus: 404 },
    { path: '/app', desc: 'Download app file (may fail if file missing)', expectedStatus: 404 }
  ];

  for (const test of tests) {
    try {
      const result = await testEndpoint(
        test.path, 
        test.expectedStatus || 200, 
        test.token
      );
      
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test.desc}`);
      console.log(`   Path: ${result.path}`);
      console.log(`   Status: ${result.status} (expected ${result.expected})`);
      
      if (!result.success) {
        console.log(`   Response: ${result.data.substring(0, 200)}...`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${test.desc}`);
      console.log(`   Error: ${error.error}`);
      console.log('');
    }
  }
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
