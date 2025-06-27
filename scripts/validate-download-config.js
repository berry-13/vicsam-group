#!/usr/bin/env node

/**
 * Download service configuration validation script
 * Run this to validate your .env configuration
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config();

console.log('🔍 Validating Download Service Configuration...\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
}

try {
  const downloadConfig = require('../api/services/downloadConfig');
  
  console.log('✅ Configuration loaded successfully');
  console.log('\n📋 Configuration Summary:');
  console.log('─'.repeat(50));
  
  const config = downloadConfig.getConfigSummary();
  Object.entries(config).forEach(([key, value]) => {
    console.log(`${key.padEnd(20)}: ${value}`);
  });
  
  console.log('\n📁 File Mappings:');
  console.log('─'.repeat(50));
  
  const mappings = downloadConfig.getAllFileMappings();
  
  if (Object.keys(mappings).length === 0) {
    console.log('⚠️  No file mappings configured');
  } else {
    Object.entries(mappings).forEach(([endpoint, config]) => {
      console.log(`\n${endpoint}:`);
      console.log(`  File: ${config.filePath}`);
      console.log(`  Name: ${config.fileName}`);
      console.log(`  Type: ${config.mimeType}`);
      console.log(`  Desc: ${config.description}`);
      
      // Check if file exists
      const exists = fs.existsSync(config.filePath);
      console.log(`  Exists: ${exists ? '✅' : '❌'}`);
      
      if (exists) {
        const stats = fs.statSync(config.filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  Size: ${sizeKB} KB`);
      }
    });
  }
  
  console.log('\n🔧 Environment Variables Used:');
  console.log('─'.repeat(50));
  
  const envVars = [
    'DOWNLOAD_BASE_DIR',
    'DOWNLOAD_CACHE_TIMEOUT',
    'DOWNLOAD_MIN_COMPRESS_SIZE',
    'DOWNLOAD_CACHE_MAX_AGE',
    'DOWNLOAD_RATE_LIMIT',
    'DOWNLOAD_RATE_WINDOW',
    'DOWNLOAD_LOG_ENABLED',
    'DOWNLOAD_LOG_LEVEL',
    'DOWNLOAD_DEFAULT_FILE',
    'DOWNLOAD_DEFAULT_FILENAME',
    'DOWNLOAD_DEFAULT_MIMETYPE',
    'DOWNLOAD_DEFAULT_DESCRIPTION',
    'DOWNLOAD_APP_FILE',
    'DOWNLOAD_APP_FILENAME',
    'DOWNLOAD_APP_MIMETYPE',
    'DOWNLOAD_APP_DESCRIPTION',
    'DOWNLOAD_CUSTOM_ENDPOINTS'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '⚪';
    console.log(`${status} ${varName.padEnd(30)}: ${value || '(not set)'}`);
  });
  
  console.log('\n✅ Configuration validation completed successfully!');
  console.log('\n💡 Tips:');
  console.log('  - Set DOWNLOAD_LOG_ENABLED=true to enable download logging');
  console.log('  - Adjust DOWNLOAD_RATE_LIMIT to control download frequency');
  console.log('  - Use DOWNLOAD_CUSTOM_ENDPOINTS to add more download endpoints');
  
} catch (error) {
  console.error('❌ Configuration validation failed:');
  console.error(error.message);
  process.exit(1);
}
