#!/usr/bin/env node
/**
 * Build information generator
 * Creates build-info.json with build metadata
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateBuildInfo() {
  const buildInfo = {
    time: new Date().toISOString(),
    number: process.env.BUILD_NUMBER || process.env.GITHUB_RUN_NUMBER || null,
    ci: process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true',
    runner: process.env.RUNNER_OS || process.env.CI_RUNNER_TAGS || 'local',
    triggeredBy: process.env.GITHUB_ACTOR || process.env.CI_COMMIT_AUTHOR || process.env.USER || 'unknown'
  };

  // Add git information
  try {
    buildInfo.git = {
      commit: execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(),
      commitMessage: execSync('git log -1 --format=%s', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(),
      commitDate: execSync('git log -1 --format=%ci', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    };

    // Check for tags
    try {
      buildInfo.git.tag = execSync('git describe --tags --exact-match HEAD', { 
        encoding: 'utf8', 
        stdio: ['ignore', 'pipe', 'ignore'] 
      }).trim();
    } catch {
      buildInfo.git.tag = null;
    }
  } catch (error) {
    console.warn('⚠️ Could not get git information:', error.message);
    buildInfo.git = null;
  }

  // Add package information
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    buildInfo.package = {
      name: packageJson.name,
      version: packageJson.version
    };
  } catch (error) {
    console.warn('⚠️ Could not read package.json:', error.message);
    buildInfo.package = null;
  }

  // Add Node.js version
  buildInfo.node = {
    version: process.version,
    platform: process.platform,
    arch: process.arch
  };

  // Write build info
  const buildInfoPath = path.join(__dirname, '../build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

  console.log('✅ Build information generated:');
  console.log(`   📦 Package: ${buildInfo.package?.name}@${buildInfo.package?.version}`);
  console.log(`   🏗️  Build: ${buildInfo.number || 'local'} (${buildInfo.ci ? 'CI' : 'local'})`);
  console.log(`   🌿 Branch: ${buildInfo.git?.branch || 'unknown'}`);
  console.log(`   📝 Commit: ${buildInfo.git?.commit?.slice(0, 8) || 'unknown'}`);
  console.log(`   ⏰ Time: ${buildInfo.time}`);
  
  return buildInfo;
}

// Run if called directly
if (require.main === module) {
  try {
    generateBuildInfo();
  } catch (error) {
    console.error('❌ Failed to generate build info:', error);
    process.exit(1);
  }
}

module.exports = { generateBuildInfo };
