# Authentication Security Upgrade

This document describes the security improvements made to the Bearer token authentication system.

## What Changed

The static Bearer token authentication has been replaced with JWT (JSON Web Token) authentication for enhanced security. The system now supports:

1. **JWT Authentication**: Secure tokens with expiration and signature validation
2. **Token Rotation**: Support for rotating static tokens with expiration
3. **Hybrid Authentication**: Backward compatibility with legacy static tokens

## Security Improvements

### Before (Static Token)
```javascript
// Old method - static token comparison
const expectedToken = process.env.BEARER_TOKEN;
if (token !== expectedToken) {
  return unauthorized();
}
```

### After (JWT + Fallback)
```javascript
// New method - JWT with signature and expiration validation
try {
  const decoded = verifyToken(token); // Validates signature, expiration, etc.
  req.user = decoded;
} catch (jwtError) {
  // Fallback to legacy token for backward compatibility
  if (token === process.env.BEARER_TOKEN) {
    req.authMethod = 'LEGACY';
  } else {
    return unauthorized();
  }
}
```

## Environment Variables

Make sure these environment variables are set:

```bash
# JWT Configuration (Required for new authentication)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Legacy Token (Optional for backward compatibility)
BEARER_TOKEN=your-legacy-static-token
```

## Authentication Methods Available

### 1. JWT Authentication (Recommended)
- **Function**: `authenticateBearer`
- **Security**: High (signature validation, expiration, revocation)
- **Usage**: Default for all Bearer token authentication

### 2. Hybrid Authentication
- **Function**: `authenticateBearerHybrid`
- **Security**: High with fallback
- **Usage**: For gradual migration from static tokens

### 3. Token Rotation
- **Function**: `authenticateBearerWithRotation`
- **Security**: Medium (static tokens with rotation)
- **Usage**: Enhanced static token security

## JWT Token Structure

```json
{
  "email": "user@example.com",
  "userId": "12345",
  "role": "admin",
  "iat": 1625097600,
  "exp": 1625184000
}
```

## Migration Guide

### For API Clients

1. **Immediate**: Existing static tokens continue to work
2. **Recommended**: Switch to JWT tokens for new integrations
3. **Future**: Static token support may be deprecated

### For Developers

1. **No code changes required**: Existing routes automatically use new authentication
2. **Enhanced security**: Tokens now have expiration and signature validation
3. **Better logging**: More detailed authentication logs

### Example Client Integration

```javascript
// Old way (still works)
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${staticToken}`
  }
});

// New way (recommended)
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
```

## Token Generation

To generate JWT tokens, use the auth service:

```javascript
const { authService } = require('./api/services/authService');

// Generate a JWT token
const token = authService.generateAccessToken({
  email: 'user@example.com',
  userId: '12345',
  role: 'user'
});
```

## Troubleshooting

### Common Issues

1. **"Token expired"**: JWT tokens have expiration dates
   - Solution: Generate a new token or increase `JWT_EXPIRES_IN`

2. **"Malformed token"**: Invalid JWT format
   - Solution: Ensure token is properly formatted JWT

3. **"Invalid signature"**: JWT signature doesn't match
   - Solution: Verify `JWT_SECRET` is consistent

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and debug logs.

## Security Best Practices

1. **Use JWT tokens** for new integrations
2. **Set appropriate expiration times** (1-24 hours recommended)
3. **Rotate JWT_SECRET regularly** in production
4. **Use HTTPS only** in production
5. **Monitor token usage** through audit logs

## Support

For questions about the authentication upgrade, check the usage examples in:
- `api/middleware/authMiddleware.js` (comprehensive documentation)
- `api/middleware/auth.js` (backward compatibility layer)
