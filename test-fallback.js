// Test fallback behavior when build cache is unavailable
const { VersionManager } = require('./api/utils/version');

async function testFallbackBehavior() {
  console.log('🧪 Testing fallback behavior without build cache...\n');
  
  try {
    // Create new instance to avoid cached results
    const versionManager = new VersionManager();
    
    console.log('⏳ Getting version info (should fallback to runtime git)...');
    const start = Date.now();
    const version = await versionManager.getVersion();
    const duration = Date.now() - start;
    
    console.log('✅ Version info retrieved in', duration, 'ms');
    console.log('📄 Git source:', version.git.source);
    
    if (version.git.source === 'git') {
      console.log('✅ SUCCESS: Fallback to runtime git commands working correctly');
      console.log('⚠️ PERFORMANCE NOTE: Runtime git commands took', duration, 'ms');
    } else {
      console.log('❌ ERROR: Expected fallback to runtime git commands');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFallbackBehavior();
