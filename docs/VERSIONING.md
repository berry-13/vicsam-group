# 📦 Versioning System

This project implements a comprehensive versioning system that provides detailed version information from multiple sources.

## 🎯 Features

- **Multi-source versioning**: Combines information from package.json, git, and build metadata
- **Environment-aware**: Different detail levels for production vs development
- **Automatic build info**: Generates build metadata during CI/CD and manual builds
- **Git integration**: Includes commit hash, branch, tags, and dirty working directory detection
- **API endpoints**: Provides version information via REST API

## 📋 Version Information Sources

### 1. Package.json
- Application name and version
- Used as the base version number

### 2. Git Information
- Latest commit hash
- Current branch name
- Git tags (used for display version when available)
- Dirty working directory detection
- Commit date and message

### 3. Build Metadata
- Build timestamp
- Build number (from CI/CD environment)
- CI/CD environment detection
- Node.js version and platform information

## 🔧 Usage

### Command Line
```bash
# Get full version information
npm run version:info

# Get simple version string
npm run version:simple

# Generate build information
npm run build:info
```

### API Endpoints
```bash
# Full version information (development only)
GET /api/version

# Simple version information
GET /api/version/simple

# Full version string (development only)
GET /api/version/full

# Health check with version
GET /health
```

### Programmatic Usage
```javascript
const { getVersion, getSimpleVersion, getFullVersion } = require('./api/utils/version');

// Get complete version object
const version = getVersion();

// Get simple version string
const simple = getSimpleVersion(); // "1.1.0-development-dirty"

// Get full version string
const full = getFullVersion(); // "1.1.0-development-dirty (9f5028bd) [development]"
```

## 📊 Version Format

### Display Version
- **Production**: `1.0.0` or `1.0.0` (from git tag if available)
- **Development**: `1.0.0-development` or `1.0.0-development-dirty`

### Semantic Version
- **Production**: `1.0.0`
- **Development**: `1.0.0-development.9f5028bd`

### Full Version
- **Format**: `{display} ({commit}) [{environment}]`
- **Example**: `1.1.0-development-dirty (9f5028bd) [development]`

## 🏗️ Build Integration

The versioning system is integrated into build processes:

```bash
# Manual build (includes version generation)
npm run build

# PowerShell build script
npm run build:ps

# Bash build script
npm run build:bash
```

Build scripts automatically:
1. Generate build information (`build-info.json`)
2. Display version information
3. Include version in build artifacts

## 🔒 Security Considerations

- **Production mode**: Limits exposed version information
- **Git information**: Full git details only in development
- **Build metadata**: Sensitive CI/CD information filtered in production

## 📁 Files

- `api/utils/version.js` - Main version utility
- `scripts/generate-build-info.js` - Build information generator
- `build-info.json` - Generated build metadata (gitignored)
- `api/routes/versionRoutes.js` - Version API endpoints

## 🌍 Environment Variables

Optional environment variables for customization:

```bash
# Override app version
APP_VERSION=1.0.0

# Build metadata (usually set by CI/CD)
BUILD_TIME=2023-12-01T10:00:00Z
BUILD_NUMBER=123
CI=true
GITHUB_ACTIONS=true
GITHUB_RUN_NUMBER=456
GITHUB_ACTOR=username
```

## 🔄 Cache Management

The version system includes intelligent caching:
- Version information cached after first read
- Cache cleared automatically on file changes in development
- Manual cache clearing available via `clearCache()` method

## 📈 Examples

### Development Environment
```json
{
  "success": true,
  "app": {
    "version": "1.0.0",
    "name": "vicsam-group-server",
    "source": "package.json"
  },
  "git": {
    "commit": "9f5028bd24f09e49c385a6facc37ce43b4388040",
    "branch": "feat/ui-improvements",
    "tag": "v1.1.0",
    "dirty": true,
    "commitDate": "2025-06-27 17:15:13 +0200",
    "commitMessage": "feat: Add activity logging...",
    "source": "git"
  },
  "build": {
    "time": "2025-06-30T07:49:39.352Z",
    "number": null,
    "ci": false,
    "source": "build-file"
  },
  "environment": "development",
  "node": "v22.16.0",
  "semantic": "1.0.0-development.9f5028bd",
  "display": "1.1.0-development-dirty"
}
```

### Production Environment
```json
{
  "success": true,
  "version": "1.1.0",
  "environment": "production",
  "timestamp": "2025-06-30T07:50:05.802Z"
}
```
