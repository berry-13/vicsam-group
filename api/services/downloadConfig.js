const path = require('path');
require('dotenv').config();

/**
 * Download service configuration manager
 * Validates and provides default values for environment variables
 */
class DownloadConfig {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      // Basic settings
      baseDir: process.env.DOWNLOAD_BASE_DIR || './',
      logEnabled: process.env.DOWNLOAD_LOG_ENABLED === 'true',
      logLevel: process.env.DOWNLOAD_LOG_LEVEL || 'info',

      // Performance settings
      cacheTimeout: this.parseNumber(process.env.DOWNLOAD_CACHE_TIMEOUT, 5 * 60 * 1000), // 5 minutes
      minCompressSize: this.parseNumber(process.env.DOWNLOAD_MIN_COMPRESS_SIZE, 1024), // 1KB
      cacheMaxAge: this.parseNumber(process.env.DOWNLOAD_CACHE_MAX_AGE, 3600), // 1 hour

      // Security settings
      rateLimit: this.parseNumber(process.env.DOWNLOAD_RATE_LIMIT, 100),
      rateWindow: this.parseNumber(process.env.DOWNLOAD_RATE_WINDOW, 15 * 60 * 1000), // 15 minutes

      // File mappings
      files: {
        download: {
          file: process.env.DOWNLOAD_DEFAULT_FILE,
          filename: process.env.DOWNLOAD_DEFAULT_FILENAME || 'download.json',
          mimetype: process.env.DOWNLOAD_DEFAULT_MIMETYPE || 'application/json',
          description: process.env.DOWNLOAD_DEFAULT_DESCRIPTION || 'Download file'
        },
        app: {
          file: process.env.DOWNLOAD_APP_FILE,
          filename: process.env.DOWNLOAD_APP_FILENAME || 'app.json',
          mimetype: process.env.DOWNLOAD_APP_MIMETYPE || 'application/json',
          description: process.env.DOWNLOAD_APP_DESCRIPTION || 'Application file'
        }
      },

      // Custom endpoints
      customEndpoints: process.env.DOWNLOAD_CUSTOM_ENDPOINTS ? 
        process.env.DOWNLOAD_CUSTOM_ENDPOINTS.split(',').map(e => e.trim()) : []
    };
  }

  parseNumber(value, defaultValue) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  validateConfig() {
    const errors = [];

    // Validate base directory
    if (!this.config.baseDir) {
      errors.push('DOWNLOAD_BASE_DIR is required');
    }

    // Validate log level
    const validLogLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLogLevels.includes(this.config.logLevel)) {
      errors.push(`Invalid DOWNLOAD_LOG_LEVEL: ${this.config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
    }

    // Validate numeric values
    if (this.config.cacheTimeout < 0) {
      errors.push('DOWNLOAD_CACHE_TIMEOUT must be a positive number');
    }

    if (this.config.minCompressSize < 0) {
      errors.push('DOWNLOAD_MIN_COMPRESS_SIZE must be a positive number');
    }

    if (this.config.cacheMaxAge < 0) {
      errors.push('DOWNLOAD_CACHE_MAX_AGE must be a positive number');
    }

    if (this.config.rateLimit < 1) {
      errors.push('DOWNLOAD_RATE_LIMIT must be at least 1');
    }

    if (this.config.rateWindow < 1000) {
      errors.push('DOWNLOAD_RATE_WINDOW must be at least 1000ms');
    }

    if (errors.length > 0) {
      console.error('Download service configuration errors:');
      errors.forEach(error => console.error(`  - ${error}`));
      throw new Error('Invalid download service configuration');
    }
  }

  /**
   * Get file mapping for a specific endpoint
   */
  getFileMapping(endpoint) {
    const cleanEndpoint = endpoint.replace('/', '');
    
    if (cleanEndpoint === 'download' && this.config.files.download.file) {
      return {
        filePath: path.resolve(this.config.baseDir, this.config.files.download.file),
        fileName: this.config.files.download.filename,
        mimeType: this.config.files.download.mimetype,
        description: this.config.files.download.description
      };
    }

    if (cleanEndpoint === 'app' && this.config.files.app.file) {
      return {
        filePath: path.resolve(this.config.baseDir, this.config.files.app.file),
        fileName: this.config.files.app.filename,
        mimeType: this.config.files.app.mimetype,
        description: this.config.files.app.description
      };
    }

    // Check custom endpoints
    if (this.config.customEndpoints.includes(`/${cleanEndpoint}`)) {
      const envPrefix = `DOWNLOAD_${cleanEndpoint.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
      const file = process.env[`${envPrefix}_FILE`];
      
      if (file) {
        return {
          filePath: path.resolve(this.config.baseDir, file),
          fileName: process.env[`${envPrefix}_FILENAME`] || `${cleanEndpoint}.json`,
          mimeType: process.env[`${envPrefix}_MIMETYPE`] || 'application/json',
          description: process.env[`${envPrefix}_DESCRIPTION`] || `Custom ${cleanEndpoint} file`
        };
      }
    }

    return null;
  }

  /**
   * Get all available file mappings
   */
  getAllFileMappings() {
    const mappings = {};

    // Standard endpoints
    const downloadMapping = this.getFileMapping('/download');
    if (downloadMapping) {
      mappings['/download'] = downloadMapping;
    }

    const appMapping = this.getFileMapping('/app');
    if (appMapping) {
      mappings['/app'] = appMapping;
    }

    // Custom endpoints
    this.config.customEndpoints.forEach(endpoint => {
      const mapping = this.getFileMapping(endpoint);
      if (mapping) {
        mappings[endpoint] = mapping;
      }
    });

    return mappings;
  }

  /**
   * Get configuration summary for health checks
   */
  getConfigSummary() {
    return {
      baseDir: this.config.baseDir,
      cacheTimeout: this.config.cacheTimeout,
      minCompressSize: this.config.minCompressSize,
      cacheMaxAge: this.config.cacheMaxAge,
      rateLimit: this.config.rateLimit,
      rateWindow: this.config.rateWindow,
      logEnabled: this.config.logEnabled,
      logLevel: this.config.logLevel,
      endpointCount: Object.keys(this.getAllFileMappings()).length
    };
  }
}

module.exports = new DownloadConfig();
