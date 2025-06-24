# CI/CD Documentation

## Overview

This project includes a comprehensive CI/CD pipeline using GitHub Actions with multiple workflows for different stages of development and deployment.

## Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Test Suite**: Runs on Node.js 18.x and 20.x
  - Installs dependencies
  - Runs linting (if present)
  - Executes test suite with coverage
  - Uploads coverage to Codecov
  
- **Security Audit**: 
  - Runs `npm audit` for vulnerability checks
  - Uses `audit-ci` for dependency checking
  
- **Build Application**:
  - Creates deployment package
  - Uploads build artifacts
  
- **Deploy to Staging** (develop branch):
  - Downloads build artifacts
  - Deploys to staging environment
  - Runs smoke tests
  
- **Deploy to Production** (main branch):
  - Downloads build artifacts  
  - Deploys to production environment
  - Runs smoke tests
  - Sends deployment notifications

### 2. Nightly Tests (`.github/workflows/nightly.yml`)

**Triggers:**
- Scheduled daily at 2:00 UTC
- Manual trigger via workflow_dispatch

**Jobs:**
- **Extended Test Suite**:
  - Comprehensive test coverage
  - Performance tests
  - Memory leak detection
  
- **Dependency Updates**:
  - Checks for outdated packages
  - Creates GitHub issues for updates
  
- **Security Scan**:
  - Deep security analysis
  - Generates security reports

### 3. Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Git tags matching `v*.*.*`
- Manual trigger with version selection

**Jobs:**
- **Create Release**:
  - Runs full test suite
  - Generates changelog
  - Creates GitHub release
  - Uploads release assets
  
- **Docker Build**:
  - Builds multi-platform Docker images
  - Pushes to Docker registry (optional)

## Environment Setup

### Required Secrets

Add these secrets to your GitHub repository:

```bash
# Required for releases
GITHUB_TOKEN=<automatic-token>

# Optional for Docker builds
DOCKER_USERNAME=<docker-hub-username>
DOCKER_PASSWORD=<docker-hub-password>

# Optional for Codecov
CODECOV_TOKEN=<codecov-token>
```

### Environment Variables

The workflows use these environment variables:

```yaml
# Test Environment
NODE_ENV: test
PORT: 3001
JWT_SECRET: test-jwt-secret
BEARER_TOKEN: test-bearer-token-123
API_PASSWORD: test-password
```

## Local Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run CI Tests Locally
```bash
npm run test:ci
```

## API Testing

### Automated Test Script
```bash
./test-api.sh [BASE_URL] [BEARER_TOKEN]
```

### Manual Testing
```bash
# Health check
curl http://localhost:3000/health

# Authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"supersegreta"}'

# Save data
curl -X POST http://localhost:3000/api/data/save \
  -H "Authorization: Bearer your-bearer-token" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test","email":"test@example.com"}'
```

## Deployment

### Docker Deployment

#### Production
```bash
docker-compose up -d
```

#### Development
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Manual Deployment

1. **Build the application**:
   ```bash
   npm ci --only=production
   ```

2. **Set environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

## Monitoring and Health Checks

### Health Check Endpoint
```bash
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-06-24T...",
  "uptime": 1234.56,
  "version": "2.0.0"
}
```

### API Documentation
```bash
GET /api/auth/info
```

## Security Considerations

### Secrets Management
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use different secrets for different environments

### Environment Configuration
- Never commit `.env` files
- Use `.env.example` as template
- Validate all environment variables on startup

### Rate Limiting
- API rate limits: 100 requests per 15 minutes
- Health check endpoint: No rate limiting
- Authentication endpoint: Standard rate limiting

## Troubleshooting

### Common Issues

1. **Tests failing locally**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm test
   ```

2. **Docker build issues**:
   ```bash
   docker system prune -f
   docker-compose build --no-cache
   ```

3. **Permission issues**:
   ```bash
   chmod +x test-api.sh
   ```

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development npm start
```

### Log Files

Application logs are written to:
- Console output (development)
- File system (production): `/app/logs/`

## Performance

### Test Performance
- Average test execution: < 2 seconds
- Coverage generation: < 5 seconds
- Full CI pipeline: < 10 minutes

### API Performance
- Health check: < 10ms
- Authentication: < 50ms
- Data operations: < 100ms
- File operations: < 200ms

## Contributing

### Before Submitting PRs

1. Run the full test suite:
   ```bash
   npm run test:coverage
   ```

2. Test the API manually:
   ```bash
   ./test-api.sh
   ```

3. Check for security issues:
   ```bash
   npm audit
   ```

4. Ensure code formatting:
   ```bash
   npm run lint --if-present
   ```

### PR Checklist

- [ ] All tests pass
- [ ] Code coverage maintained
- [ ] API tests pass
- [ ] Documentation updated
- [ ] Security scan clean
- [ ] Environment variables documented
