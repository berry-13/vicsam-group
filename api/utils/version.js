const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Version utility that provides comprehensive versioning information
 * Supports multiple sources: package.json, git, environment variables
 */
class VersionManager {
  constructor() {
    this.packagePath = path.join(__dirname, '../../package.json');
    this.buildInfoPath = path.join(__dirname, '../../build-info.json');
    this._versionCache = null;
    this._buildTime = null;
  }

  /**
   * Get the complete version information
   * @returns {Object} Version object with all available information
   */
  getVersion() {
    if (this._versionCache) {
      return this._versionCache;
    }

    const version = {
      app: this._getAppVersion(),
      git: this._getGitInfo(),
      build: this._getBuildInfo(),
      environment: process.env.NODE_ENV || 'development',
      node: process.version,
      timestamp: new Date().toISOString()
    };

    // Create a semantic version string
    version.semantic = this._createSemanticVersion(version);
    version.display = this._createDisplayVersion(version);

    this._versionCache = version;
    return version;
  }

  /**
   * Get a simple version string for API responses
   * @returns {string} Simple version string
   */
  getSimpleVersion() {
    const version = this.getVersion();
    return version.display;
  }

  /**
   * Get the full version string for logging
   * @returns {string} Detailed version string
   */
  getFullVersion() {
    const version = this.getVersion();
    return `${version.display} (${version.git.commit ? version.git.commit.slice(0, 8) : 'no-git'}) [${version.environment}]`;
  }

  /**
   * Clear the version cache (useful for testing or dynamic updates)
   */
  clearCache() {
    this._versionCache = null;
  }

  /**
   * Get version from package.json
   * @private
   */
  _getAppVersion() {
    try {
      if (fs.existsSync(this.packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
        return {
          version: packageJson.version || '0.0.0',
          name: packageJson.name || 'unknown',
          source: 'package.json'
        };
      }
    } catch (error) {
      console.warn('⚠️ [VERSION] Could not read package.json:', error.message);
    }

    return {
      version: process.env.APP_VERSION || '0.0.0',
      name: 'vicsam-group-server',
      source: 'environment'
    };
  }

  /**
   * Get git information
   * @private
   */
  _getGitInfo() {
    const gitInfo = {
      commit: null,
      branch: null,
      tag: null,
      dirty: false,
      commitDate: null,
      commitMessage: null,
      source: 'git'
    };

    try {
      // Get commit hash
      gitInfo.commit = execSync('git rev-parse HEAD', { 
        encoding: 'utf8', 
        stdio: ['ignore', 'pipe', 'ignore'] 
      }).trim();

      // Get branch name
      gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD', { 
        encoding: 'utf8', 
        stdio: ['ignore', 'pipe', 'ignore'] 
      }).trim();

      // Get latest tag (if any)
      try {
        gitInfo.tag = execSync('git describe --tags --exact-match HEAD', { 
          encoding: 'utf8', 
          stdio: ['ignore', 'pipe', 'ignore'] 
        }).trim();
      } catch {
        // No exact tag on HEAD, try to get the latest tag
        try {
          gitInfo.tag = execSync('git describe --tags --abbrev=0', { 
            encoding: 'utf8', 
            stdio: ['ignore', 'pipe', 'ignore'] 
          }).trim();
        } catch {
          gitInfo.tag = null;
        }
      }

      // Check if working directory is dirty
      const status = execSync('git status --porcelain', { 
        encoding: 'utf8', 
        stdio: ['ignore', 'pipe', 'ignore'] 
      }).trim();
      gitInfo.dirty = status.length > 0;

      // Get commit date
      gitInfo.commitDate = execSync('git log -1 --format=%ci', { 
        encoding: 'utf8', 
        stdio: ['ignore', 'pipe', 'ignore'] 
      }).trim();

      // Get commit message
      gitInfo.commitMessage = execSync('git log -1 --format=%s', { 
        encoding: 'utf8', 
        stdio: ['ignore', 'pipe', 'ignore'] 
      }).trim();

    } catch (error) {
      console.warn('⚠️ [VERSION] Could not get git information:', error.message);
      gitInfo.source = 'unavailable';
    }

    return gitInfo;
  }

  /**
   * Get build information
   * @private
   */
  _getBuildInfo() {
    const buildInfo = {
      time: null,
      number: null,
      ci: false,
      source: 'runtime'
    };

    // Try to read build info from file (created during CI/CD)
    try {
      if (fs.existsSync(this.buildInfoPath)) {
        const buildData = JSON.parse(fs.readFileSync(this.buildInfoPath, 'utf8'));
        return { ...buildInfo, ...buildData, source: 'build-file' };
      }
    } catch (error) {
      console.warn('⚠️ [VERSION] Could not read build-info.json:', error.message);
    }

    // Get build info from environment variables
    buildInfo.time = process.env.BUILD_TIME || this._getBuildTime();
    buildInfo.number = process.env.BUILD_NUMBER || null;
    buildInfo.ci = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

    return buildInfo;
  }

  /**
   * Get or generate build time
   * @private
   */
  _getBuildTime() {
    if (!this._buildTime) {
      this._buildTime = new Date().toISOString();
    }
    return this._buildTime;
  }

  /**
   * Create semantic version string
   * @private
   */
  _createSemanticVersion(version) {
    let semantic = version.app.version;

    // Add pre-release identifier for non-production environments
    if (version.environment !== 'production') {
      semantic += `-${version.environment}`;
      
      if (version.git.commit) {
        semantic += `.${version.git.commit.slice(0, 8)}`;
      }
    }

    return semantic;
  }

  /**
   * Create display version string
   * @private
   */
  _createDisplayVersion(version) {
    let display = version.app.version;

    // Add git tag if available and different from app version
    if (version.git.tag && version.git.tag !== `v${version.app.version}`) {
      display = version.git.tag.replace(/^v/, '');
    }

    // Add environment suffix for non-production
    if (version.environment !== 'production') {
      display += `-${version.environment}`;
    }

    // Add dirty indicator
    if (version.git.dirty) {
      display += '-dirty';
    }

    return display;
  }
}

// Create singleton instance
const versionManager = new VersionManager();

module.exports = {
  VersionManager,
  getVersion: () => versionManager.getVersion(),
  getSimpleVersion: () => versionManager.getSimpleVersion(),
  getFullVersion: () => versionManager.getFullVersion(),
  clearCache: () => versionManager.clearCache()
};
