// Test to verify optimized version performance with build-time caching
const { getVersion } = require('./api/utils/version');

async function testOptimizedVersion() {
  console.log('🧪 Testing optimized version with build-time caching...\n');
  
  try {
    console.log('⏳ Getting version info (should use cached data)...');
    const start = Date.now();
    const version = await getVersion();
    const duration = Date.now() - start;
    
    console.log('✅ Version info retrieved in', duration, 'ms');
    console.log('📄 Git source:', version.git.source);
    console.log('📄 Git info:', {
      commit: version.git.commit?.slice(0, 8),
      branch: version.git.branch,
      commitDate: version.git.commitDate,
      commitMessage: version.git.commitMessage?.slice(0, 50) + '...',
      dirty: version.git.dirty
    });
    
    if (version.git.source === 'build-cache') {
      console.log('🚀 SUCCESS: Using build-time cached git information (optimal performance)');
    } else if (version.git.source === 'git') {
      console.log('⚠️ WARNING: Using runtime git commands (performance impact)');
    } else {
      console.log('❌ ERROR: Git information unavailable');
    }
    
    // Test caching - second call should be even faster
    console.log('\n⏳ Testing in-memory cache (second call)...');
    const cacheStart = Date.now();
    const cachedVersion = await getVersion();
    const cacheDuration = Date.now() - cacheStart;
    console.log('✅ Cached version retrieved in', cacheDuration, 'ms (should be instantaneous)');
    
    console.log('\n🎉 Performance test completed!');
    console.log('📊 Performance summary:');
    console.log('   - First call (build cache):', duration + 'ms');
    console.log('   - Second call (memory cache):', cacheDuration + 'ms');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testOptimizedVersion();
