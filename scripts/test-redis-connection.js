#!/usr/bin/env node

/**
 * Test Redis Connection for Token Rotation
 * This script tests the Redis connection and token rotation functionality
 */

require('dotenv').config();
const { createClient } = require('redis');

async function testRedisConnection() {
  console.log('🔗 Testing Redis connection for token rotation...');
  
  let client;
  try {
    // Create Redis client
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });
    
    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
    });
    
    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
    
    // Connect to Redis
    await client.connect();
    
    // Test basic operations
    console.log('\n📋 Testing basic Redis operations...');
    
    // Test SET operation
    const testKey = 'token:test_token_123';
    const testValue = JSON.stringify({
      timestamp: Date.now(),
      used: false
    });
    
    await client.setEx(testKey, 3600, testValue); // 1 hour TTL
    console.log('✅ SET operation successful');
    
    // Test GET operation
    const retrievedValue = await client.get(testKey);
    if (retrievedValue) {
      const parsed = JSON.parse(retrievedValue);
      console.log('✅ GET operation successful:', parsed);
    } else {
      console.log('❌ GET operation failed - no value retrieved');
    }
    
    // Test DEL operation
    await client.del(testKey);
    console.log('✅ DEL operation successful');
    
    // Test KEYS operation (for cleanup functionality)
    await client.set('token:test1', 'value1');
    await client.set('token:test2', 'value2');
    const keys = await client.keys('token:*');
    console.log('✅ KEYS operation successful, found keys:', keys);
    
    // Cleanup test keys
    if (keys.length > 0) {
      await client.del(keys);
      console.log('✅ Cleanup successful');
    }
    
    console.log('\n🎉 All Redis operations completed successfully!');
    console.log('✅ Redis is ready for token rotation storage');
    
  } catch (error) {
    console.error('\n❌ Redis connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure Redis server is running: `redis-server`');
    console.log('2. Check Redis URL in .env file: REDIS_URL=redis://localhost:6379');
    console.log('3. Verify Redis is accessible: `redis-cli ping`');
    console.log('4. Check firewall settings if using remote Redis');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Note: The application will fallback to in-memory storage if Redis is unavailable');
    }
    
    process.exit(1);
  } finally {
    if (client && client.isOpen) {
      await client.quit();
      console.log('\n🔌 Redis connection closed');
    }
  }
}

// Run the test
if (require.main === module) {
  testRedisConnection().catch(console.error);
}

module.exports = { testRedisConnection };
