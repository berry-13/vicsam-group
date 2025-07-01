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
        get: {
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
    // Validate and sanitize the endpoint first
    let cleanEndpoint;
    try {
      cleanEndpoint = this.validateAndSanitizeEndpoint(endpoint);
    } catch (error) {
      console.warn(`Invalid endpoint rejected: ${endpoint} - ${error.message}`);
      return null;
    }
    
    if (cleanEndpoint === 'get' && this.config.files.get.file) {
      return {
        filePath: this.securePathResolve(this.config.baseDir, this.config.files.get.file),
        fileName: this.config.files.get.filename,
        mimeType: this.config.files.get.mimetype,
        description: this.config.files.get.description
      };
    }

    if (cleanEndpoint === 'app' && this.config.files.app.file) {
      return {
        filePath: this.securePathResolve(this.config.baseDir, this.config.files.app.file),
        fileName: this.config.files.app.filename,
        mimeType: this.config.files.app.mimetype,
        description: this.config.files.app.description
      };
    }

    // Check custom endpoints with enhanced security validation
    if (this.config.customEndpoints.includes(`/${cleanEndpoint}`)) {
      // Validate endpoint against configuration to prevent unauthorized access
      const endpointConfig = `/${cleanEndpoint}`;
      if (!this.config.customEndpoints.some(ep => ep === endpointConfig)) {
        console.warn(`Endpoint not found in configuration: ${cleanEndpoint}`);
        return null;
      }

      // Generate environment variable prefix with additional validation
      const envPrefix = `DOWNLOAD_${cleanEndpoint.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
      
      // Validate prefix length and format
      if (envPrefix.length > 100) {
        console.error(`Environment variable prefix too long: ${envPrefix}`);
        return null;
      }

      // Get and validate environment variables
      const file = process.env[`${envPrefix}_FILE`];
      const fileName = process.env[`${envPrefix}_FILENAME`];
      const mimeType = process.env[`${envPrefix}_MIMETYPE`];
      const description = process.env[`${envPrefix}_DESCRIPTION`];
      
      if (file) {
        try {
          // Validate all environment variables for security
          const validatedFile = this.validateEnvironmentValue(file, 'file');
          const validatedFileName = fileName ? 
            this.validateEnvironmentValue(fileName, 'filename') : 
            `${cleanEndpoint}.json`;
          const validatedMimeType = mimeType ? 
            this.validateEnvironmentValue(mimeType, 'mimetype') : 
            'application/json';
          const validatedDescription = description ? 
            this.validateEnvironmentValue(description, 'description') : 
            `Custom ${cleanEndpoint} file`;

          // Additional security check: ensure filename has a proper extension
          if (!validatedFileName.includes('.')) {
            console.warn(`Filename without extension detected: ${validatedFileName}`);
          }

          // Secure path resolution with validated file path
          const secureFilePath = this.securePathResolve(this.config.baseDir, validatedFile);

          return {
            filePath: secureFilePath,
            fileName: validatedFileName,
            mimeType: validatedMimeType,
            description: validatedDescription
          };
        } catch (validationError) {
          console.error(`Custom endpoint validation failed for ${cleanEndpoint}: ${validationError.message}`);
          return null;
        }
      } else {
        console.warn(`No file configured for custom endpoint: ${cleanEndpoint}`);
        return null;
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
    const getMapping = this.getFileMapping('/get');
    if (getMapping) {
      mappings['/get'] = getMapping;
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

  /**
   * Validates that a resolved file path is safe and doesn't escape the base directory
   * @param {string} resolvedPath - The resolved absolute file path
   * @param {string} basePath - The base directory path (absolute)
   * @returns {boolean} - True if the path is safe, false otherwise
   * @throws {Error} - If path traversal attack is detected
   */
  validateSecurePath(resolvedPath, basePath) {
    try {
      // Normalize both paths to handle different path separators and resolve any remaining .. segments
      const normalizedResolved = path.normalize(path.resolve(resolvedPath));
      const normalizedBase = path.normalize(path.resolve(basePath));
      
      // Check if the resolved path starts with the base path
      const isWithinBase = normalizedResolved.startsWith(normalizedBase + path.sep) || 
                          normalizedResolved === normalizedBase;
      
      if (!isWithinBase) {
        const error = new Error(`Path traversal attack detected: ${resolvedPath} attempts to escape base directory ${basePath}`);
        error.code = 'PATH_TRAVERSAL_DETECTED';
        throw error;
      }
      
      return true;
    } catch (error) {
      if (error.code === 'PATH_TRAVERSAL_DETECTED') {
        throw error;
      }
      // If path validation fails due to other reasons, be conservative and reject
      const securityError = new Error(`Invalid file path detected: ${resolvedPath}`);
      securityError.code = 'INVALID_PATH';
      throw securityError;
    }
  }

  /**
   * Securely resolves a file path and validates it against path traversal attacks
   * @param {string} basePath - The base directory path
   * @param {string} filePath - The relative file path to resolve
   * @returns {string} - The validated absolute file path
   * @throws {Error} - If path traversal attack is detected
   */
  securePathResolve(basePath, filePath) {
    // First resolve the path
    const resolvedPath = path.resolve(basePath, filePath);
    
    // Then validate it's secure
    this.validateSecurePath(resolvedPath, basePath);
    
    return resolvedPath;
  }

  /**
   * Validates and sanitizes an endpoint name to prevent injection attacks
   * @param {string} endpoint - The endpoint to validate
   * @returns {string} - The sanitized endpoint
   * @throws {Error} - If the endpoint is invalid or contains unsafe characters
   */
  validateAndSanitizeEndpoint(endpoint) {
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Endpoint must be a non-empty string');
    }

    // Remove leading/trailing slashes and whitespace
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '').trim();
    
    // Check for empty endpoint after cleaning
    if (!cleanEndpoint) {
      throw new Error('Endpoint cannot be empty after sanitization');
    }

    // Validate endpoint format - only allow alphanumeric, hyphens, underscores
    const endpointPattern = /^[a-zA-Z0-9_-]+$/;
    if (!endpointPattern.test(cleanEndpoint)) {
      throw new Error(`Invalid endpoint format: ${cleanEndpoint}. Only alphanumeric characters, hyphens, and underscores are allowed`);
    }

    // Prevent reserved/dangerous endpoint names
    const reservedEndpoints = [
      'admin', 'api', 'auth', 'config', 'system', 'root', 'bin', 'etc', 'var', 'tmp',
      'windows', 'program', 'users', 'documents', 'desktop', 'appdata',
      'con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
      'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'
    ];
    
    if (reservedEndpoints.includes(cleanEndpoint.toLowerCase())) {
      throw new Error(`Endpoint name '${cleanEndpoint}' is reserved and cannot be used`);
    }

    // Check length limits
    if (cleanEndpoint.length > 50) {
      throw new Error(`Endpoint name too long: ${cleanEndpoint.length} characters. Maximum allowed is 50`);
    }

    return cleanEndpoint;
  }

  /**
   * Validates environment variable values for security issues
   * @param {string} value - The environment variable value to validate
   * @param {string} type - The type of value ('file', 'filename', 'mimetype', 'description')
   * @returns {string} - The validated value
   * @throws {Error} - If the value contains unsafe patterns
   */
  validateEnvironmentValue(value, type) {
    if (!value || typeof value !== 'string') {
      throw new Error(`${type} must be a non-empty string`);
    }

    // Common security checks for all types
    const dangerousPatterns = [
      /\.\./,           // Path traversal
      /[<>"|*?]/,        // Invalid filename characters
      /[\u0000-\u001f]/, // Control characters
      /^-/,             // Leading dash (command injection)
      /\$\(/,           // Command substitution
      /`/,              // Backtick command execution
      /\${/,            // Variable substitution
      /\|\|/,           // Logical OR (potential injection)
      /&&/,             // Logical AND (potential injection)
      /;/,              // Command separator
      /\|/              // Pipe operator
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        throw new Error(`${type} contains unsafe pattern: ${value}`);
      }
    }

    // Type-specific validation
    switch (type) {
      case 'file':
        // File path validation
        if (value.length > 255) {
          throw new Error(`File path too long: ${value.length} characters`);
        }
        if (!/^[a-zA-Z0-9._/-]+$/.test(value)) {
          throw new Error(`File path contains invalid characters: ${value}`);
        }
        break;

      case 'filename':
        // Filename validation
        if (value.length > 255) {
          throw new Error(`Filename too long: ${value.length} characters`);
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
          throw new Error(`Filename contains invalid characters: ${value}`);
        }
        break;

      case 'mimetype':
        // MIME type validation
        if (!/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*$/.test(value)) {
          throw new Error(`Invalid MIME type format: ${value}`);
        }
        break;

      case 'description':
        // Description validation
        if (value.length > 500) {
          throw new Error(`Description too long: ${value.length} characters`);
        }
        // Allow most characters but block script tags and dangerous HTML
        if (/<script|javascript:|data:/i.test(value)) {
          throw new Error(`Description contains potentially dangerous content: ${value}`);
        }
        break;

      default:
        throw new Error(`Unknown validation type: ${type}`);
    }

    return value;
  }

}

module.exports = new DownloadConfig();
