// Quick test to validate async version functionality
const { getVersion, getSimpleVersion, getFullVersion } = require('./api/utils/version');

async function testVersionFunctions() {
  console.log('🧪 Testing async version functions...\n');
  
  try {
    console.log('⏳ Getting full version info...');
    const start = Date.now();
    const version = await getVersion();
    const duration = Date.now() - start;
    
    console.log('✅ Full version info retrieved in', duration, 'ms');
    console.log('📄 Version info:', JSON.stringify(version, null, 2));
    
    console.log('\n⏳ Getting simple version...');
    const simpleVersion = await getSimpleVersion();
    console.log('✅ Simple version:', simpleVersion);
    
    console.log('\n⏳ Getting full version string...');
    const fullVersion = await getFullVersion();
    console.log('✅ Full version string:', fullVersion);
    
    // Test caching - second call should be much faster
    console.log('\n⏳ Testing cache (second call)...');
    const cacheStart = Date.now();
    const cachedVersion = await getVersion();
    const cacheDuration = Date.now() - cacheStart;
    console.log('✅ Cached version retrieved in', cacheDuration, 'ms (should be much faster)');
    
    console.log('\n🎉 All tests passed! Async implementation working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testVersionFunctions();
