const path = require('path');
const fs = require('fs').promises;
const { createReadStream, existsSync } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const zlib = require('zlib');
const downloadConfig = require('../services/downloadConfig');

const pipelineAsync = promisify(pipeline);

/**
 * High-performance file download controller with caching and compression
 */
class DownloadController {
  constructor() {
    // Load configuration from downloadConfig service
    this.config = downloadConfig.config;
    
    // Build file mappings from configuration
    this.fileMap = downloadConfig.getAllFileMappings();

    // Cache for file stats to avoid repeated fs calls
    this.fileStatsCache = new Map();
    
    // Log initialization
    this.log('info', `Download service initialized with ${Object.keys(this.fileMap).length} endpoints`);
    this.log('debug', 'Available endpoints:', Object.keys(this.fileMap));
  }

  /**
   * Logger function with configurable levels
   */
  log(level, message, ...args) {
    if (!this.config.logEnabled) return;
    
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    const currentLevel = levels[this.config.logLevel] || 2;
    const messageLevel = levels[level] || 2;
    
    if (messageLevel <= currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = level.toUpperCase().padEnd(5);
      console.log(`[${timestamp}] ${prefix} [DOWNLOAD] ${message}`, ...args);
    }
  }

  /**
   * Get cached file stats or fetch new ones
   */
  async getFileStats(filePath) {
    const now = Date.now();
    const cached = this.fileStatsCache.get(filePath);
    
    if (cached && (now - cached.timestamp) < this.config.cacheTimeout) {
      return cached.stats;
    }

    try {
      const stats = await fs.stat(filePath);
      this.fileStatsCache.set(filePath, {
        stats,
        timestamp: now
      });
      return stats;
    } catch (error) {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  /**
   * Check if client accepts gzip compression
   */
  supportsGzip(req) {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    return acceptEncoding.includes('gzip');
  }

  /**
   * Set optimal caching headers
   */
  setCacheHeaders(res, stats) {
    const etag = `"${stats.size}-${stats.mtime.getTime()}"`;
    const lastModified = stats.mtime.toUTCString();
    
    res.set({
      'ETag': etag,
      'Last-Modified': lastModified,
      'Cache-Control': `public, max-age=${this.config.cacheMaxAge}, must-revalidate`,
      'Vary': 'Accept-Encoding'
    });

    return etag;
  }

  /**
   * Check if client has cached version
   */
  isClientCacheValid(req, etag, lastModified) {
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];
    
    if (ifNoneMatch && ifNoneMatch === etag) {
      return true;
    }
    
    if (ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified)) {
      return true;
    }
    
    return false;
  }

  /**
   * Stream file with optional compression
   */
  async streamFile(res, filePath, shouldCompress = false) {
    const readStream = createReadStream(filePath);
    
    if (shouldCompress) {
      const gzipStream = zlib.createGzip({
        level: zlib.constants.Z_BEST_SPEED, // Fast compression
        chunkSize: 16 * 1024 // 16KB chunks
      });
      
      res.set('Content-Encoding', 'gzip');
      await pipelineAsync(readStream, gzipStream, res);
    } else {
      await pipelineAsync(readStream, res);
    }
  }

  /**
   * Main download handler
   */
  async handleDownload(req, res) {
    const requestPath = req.path;
    const fileConfig = this.fileMap[requestPath];
    
    if (!fileConfig) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        availableEndpoints: Object.keys(this.fileMap),
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Check if file exists
      if (!existsSync(fileConfig.filePath)) {
        return res.status(404).json({
          success: false,
          error: `File not found: ${fileConfig.fileName}`,
          timestamp: new Date().toISOString()
        });
      }

      // Get file stats
      const stats = await this.getFileStats(fileConfig.filePath);
      
      // Set content type and download headers
      res.set({
        'Content-Type': fileConfig.mimeType,
        'Content-Disposition': `attachment; filename="${fileConfig.fileName}"`,
        'Content-Length': stats.size,
        'X-File-Description': fileConfig.description
      });

      // Set cache headers and get ETag
      const etag = this.setCacheHeaders(res, stats);
      
      // Check if client has valid cache
      if (this.isClientCacheValid(req, etag, stats.mtime.toUTCString())) {
        return res.status(304).end();
      }

      // Determine if we should compress
      const shouldCompress = this.supportsGzip(req) && stats.size > this.config.minCompressSize;
      
      if (shouldCompress) {
        // Remove Content-Length header when compressing
        res.removeHeader('Content-Length');
      }

      // Log download attempt with anonymized IP for privacy compliance
      const anonymizedIP = this.anonymizeIP(req.ip);
      this.log('info', `${anonymizedIP} downloading ${fileConfig.fileName} (${(stats.size / 1024).toFixed(2)}KB)${shouldCompress ? ' [GZIPPED]' : ''}`);
      
      // Stream the file
      await this.streamFile(res, fileConfig.filePath, shouldCompress);
      
    } catch (error) {
      this.log('error', `Download error: ${error.message}`);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error during file download',
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Get download info without downloading
   */
  async getDownloadInfo(req, res) {
    const files = {};
    
    for (const [endpoint, config] of Object.entries(this.fileMap)) {
      try {
        const stats = await this.getFileStats(config.filePath);
        files[endpoint] = {
          fileName: config.fileName,
          description: config.description,
          mimeType: config.mimeType,
          size: stats.size,
          sizeFormatted: this.formatFileSize(stats.size),
          lastModified: stats.mtime.toISOString(),
          downloadUrl: `${req.protocol}://${req.get('host')}/${endpoint}`,
          shortUrl: `/${endpoint}`
        };
      } catch (error) {
        files[endpoint] = {
          fileName: config.fileName,
          description: config.description,
          error: 'File not available',
          downloadUrl: `${req.protocol}://${req.get('host')}/${endpoint}`,
          shortUrl: `/${endpoint}`
        };
      }
    }

    res.json({
      success: true,
      message: 'File hosting service - URL shortener for downloads',
      service: 'VicSam File Hosting',
      description: 'Simple URL shortener for file downloads',
      files,
      endpoints: {
        'GET /get': 'Download ZIP file',
        'GET /app': 'Download EXE file'
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Format file size in human readable format
   */
  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  }

  /**
   * Health check for download service
   */
  async getHealthStatus(req, res) {
    const status = {
      service: 'download-service',
      status: 'healthy',
      config: downloadConfig.getConfigSummary(),
      files: {},
      cache: {
        entries: this.fileStatsCache.size,
        timeout: this.config.cacheTimeout
      },
      timestamp: new Date().toISOString()
    };

    // Check each file
    for (const [endpoint, config] of Object.entries(this.fileMap)) {
      try {
        const exists = existsSync(config.filePath);
        const stats = exists ? await this.getFileStats(config.filePath) : null;
        
        status.files[endpoint] = {
          available: exists,
          size: stats ? stats.size : null,
          lastModified: stats ? stats.mtime.toISOString() : null
        };
      } catch (error) {
        status.files[endpoint] = {
          available: false,
          error: error.message
        };
        status.status = 'degraded';
      }
    }

    res.json(status);
  }

  /**
   * Anonymize IP address for privacy compliance
   * Masks the last octet for IPv4 and last 80 bits for IPv6
   * @param {string} ip - Original IP address
   * @returns {string} - Anonymized IP address
   */
  anonymizeIP(ip) {
    if (!ip) return 'unknown';
    
    // Check if IP logging is disabled via environment variable
    if (process.env.DOWNLOAD_LOG_IPS === 'false') {
      return '[IP_HIDDEN]';
    }
    
    // IPv4 anonymization (mask last octet)
    if (ip.includes('.') && !ip.includes(':')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }
    
    // IPv6 anonymization (mask last 80 bits, keep first 48 bits)
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 3) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:xxxx:xxxx:xxxx:xxxx:xxxx`;
      }
    }
    
    // Fallback for unknown format
    return '[IP_MASKED]';
  }
}

module.exports = new DownloadController();
