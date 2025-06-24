# VicSam Group

> Enterprise-grade Node.js REST API for data management

## Quick Start

```bash
git clone <repository-url>
cd vicsam-group
npm install
cp .env.example .env
npm run dev
```

## Features

- **Secure Authentication** - Bearer token & password-based auth
- **Data Validation** - Joi schema validation
- **Rate Limiting** - 100 req/15min protection
- **Health Monitoring** - Built-in health checks
- **File Management** - JSON data storage & retrieval
- **Test Coverage** - Comprehensive Jest test suite

## Prerequisites

- Node.js 18+
- npm 8+

## Configuration

Set environment variables in `.env`:

```bash
PORT=3000
JWT_SECRET=your-jwt-secret-key
BEARER_TOKEN=your-bearer-token
API_PASSWORD=your-api-password
```

## Scripts

```bash
npm run dev        # Development server
npm start          # Production server
npm test           # Run test suite
npm run test:coverage  # Coverage report
./test-api.sh      # Live API testing
```

## API Reference

### Authentication

Protected endpoints require Bearer token authentication:

```bash
Authorization: Bearer <token>
```

Get token via login:

```bash
POST /api/auth/login
{
  "password": "your-password"
}
```

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | ❌ | Health check |
| `/api/auth/info` | GET | ❌ | API info |
| `/api/auth/login` | POST | ❌ | Authenticate |
| `/api/auth/verify` | GET | ✅ | Verify token |
| `/api/data/save` | POST | ✅ | Save data |
| `/api/data/files` | GET | ✅ | List files |
| `/api/data/file/:filename` | GET | ✅ | Get file |
| `/api/data/download/:filename` | GET | ✅ | Download file |
| `/api/data/file/:filename` | DELETE | ✅ | Delete file |
| `/api/data/stats` | GET | ✅ | Statistics |

### Examples

**Authentication:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "your-password"}'
```

**Save data:**
```bash
curl -X POST http://localhost:3000/api/data/save \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Mario Rossi",
    "email": "mario@example.com",
    "telefono": "123456789"
  }'
```

## Response Format

All responses follow a consistent structure:

```json
// Success
{
  "success": true,
  "message": "Operation completed",
  "data": {},
  "timestamp": "2025-01-24T..."
}

// Error
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-01-24T..."
}
```

## Docker

```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

## Security

- **Helmet.js** - Security headers
- **Rate Limiting** - 100 requests per 15 minutes
- **Input Validation** - Joi schema validation
- **CORS** - Cross-origin request protection
- **Authentication** - Bearer token system

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Test live API
./test-api.sh

# Check coverage
npm run test:coverage
```

## Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [CI/CD Documentation](./CI_CD_DOCUMENTATION.md)
- [Testing Summary](./TESTING_SUMMARY.md)

## License

MIT © VicSam Group
