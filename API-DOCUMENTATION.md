# API Documentation - Vicsam Group Authentication System v2

## Base URL
```
Development: http://localhost:3000/api/v2/auth
Production: https://your-domain.com/api/v2/auth
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": boolean,
  "data": object | null,
  "message": string,
  "timestamp": "ISO8601",
  "version": "2.0.0"
}
```

## Error Response Format
```json
{
  "success": false,
  "error": string,
  "code": string,
  "details": object | null,
  "timestamp": "ISO8601"
}
```

---

## Authentication Endpoints

### Register User
Create a new user account.

**POST** `/register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "Mario",
  "lastName": "Rossi",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "Mario Rossi",
      "roles": ["user"],
      "isVerified": false
    }
  },
  "message": "User registered successfully"
}
```

**Errors:**
- `400` - Invalid input data
- `409` - Email already exists

---

### Login
Authenticate user and receive tokens.

**POST** `/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "rt_abc123...",
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "Mario Rossi",
      "roles": ["user"],
      "permissions": ["data.read", "data.create"]
    },
    "expiresIn": "1h"
  },
  "message": "Login successful"
}
```

**Errors:**
- `400` - Invalid credentials
- `401` - Authentication failed
- `423` - Account locked
- `429` - Too many attempts

---

### Refresh Token
Renew access token using refresh token.

**POST** `/refresh`

**Request Body:**
```json
{
  "refreshToken": "rt_abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "rt_def456...",
    "expiresIn": "1h"
  },
  "message": "Token refreshed successfully"
}
```

**Errors:**
- `400` - Invalid refresh token
- `401` - Refresh token expired or revoked

---

### Logout
Invalidate current session and tokens.

**POST** `/logout`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Logout successful"
}
```

---

### Get Current User
Get information about the currently authenticated user.

**GET** `/me`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "Mario Rossi",
      "roles": ["user"],
      "permissions": ["data.read", "data.create"],
      "isVerified": true,
      "lastLoginAt": "2024-01-15T10:30:00Z"
    }
  },
  "message": "User information retrieved"
}
```

---

### Change Password
Change user's password.

**POST** `/change-password`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!",
  "confirmNewPassword": "NewPassword456!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "passwordChanged": true
  },
  "message": "Password changed successfully"
}
```

**Errors:**
- `400` - Invalid current password
- `400` - Weak new password

---

## User Management Endpoints

### List Users
Get paginated list of users (Admin/Manager only).

**GET** `/users`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string) - Search in email/name
- `role` (string) - Filter by role

**Example:**
```
GET /users?page=1&limit=10&search=mario&role=user
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-here",
        "email": "mario@example.com",
        "name": "Mario Rossi",
        "firstName": "Mario",
        "lastName": "Rossi",
        "isActive": true,
        "isVerified": true,
        "lastLoginAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "roles": ["user"],
        "roleNames": ["User"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  },
  "message": "Users retrieved successfully"
}
```

**Required Permissions:** `users.read`

---

### Assign Role
Assign a role to a user (Admin only).

**POST** `/assign-role`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "userId": "user-uuid-here",
  "role": "manager",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roleAssigned": true
  },
  "message": "Role assigned successfully"
}
```

**Required Permissions:** `users.update`, `roles.assign`

---

### List Roles
Get all available roles.

**GET** `/roles`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": 1,
        "name": "admin",
        "displayName": "Administrator",
        "description": "Full system access with all permissions",
        "permissions": ["*"],
        "isSystemRole": true,
        "userCount": 2,
        "createdAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "name": "manager",
        "displayName": "Manager",
        "description": "Management access with limited permissions",
        "permissions": ["users.read", "users.update", "data.*"],
        "isSystemRole": true,
        "userCount": 5,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "message": "Roles retrieved successfully"
}
```

**Required Permissions:** `roles.read`

---

### Get Authentication Info
Get information about the authentication system.

**GET** `/info`

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "2.0.0",
    "features": [
      "jwt_rs256",
      "refresh_tokens",
      "rbac",
      "audit_logging",
      "rate_limiting"
    ],
    "passwordPolicy": {
      "minLength": 8,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSpecial": true
    },
    "security": {
      "maxFailedAttempts": 5,
      "lockoutDuration": "30m",
      "sessionTimeout": "24h",
      "jwtExpiration": "1h"
    }
  },
  "message": "Authentication info retrieved"
}
```

---

## Permission System

### Available Permissions

**User Management:**
- `users.create` - Create new users
- `users.read` - View user information
- `users.update` - Modify user data
- `users.delete` - Delete users

**Role Management:**
- `roles.create` - Create new roles
- `roles.read` - View roles
- `roles.update` - Modify roles
- `roles.delete` - Delete roles
- `roles.assign` - Assign roles to users

**Data Management:**
- `data.create` - Create data
- `data.read` - Read data
- `data.update` - Update data
- `data.delete` - Delete data

**System Administration:**
- `system.admin` - Full system access
- `audit.read` - View audit logs
- `sessions.manage` - Manage user sessions

### Role Definitions

**Admin Role:**
- All permissions (`*`)
- System management
- User and role management

**Manager Role:**
- `users.read`, `users.update`
- `data.*` (all data permissions)
- `roles.read`

**User Role:**
- `data.create`, `data.read`
- Own profile management

---

## Rate Limiting

### Default Limits

**General API:**
- Window: 15 minutes
- Requests: 100 per window

**Authentication:**
- Window: 15 minutes  
- Requests: 5 per window
- Strict mode: 3 per window after failures

### Headers
Rate limit information is returned in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642265400
```

---

## Error Codes

### Authentication Errors
- `INVALID_CREDENTIALS` - Wrong email/password
- `ACCOUNT_LOCKED` - Too many failed attempts
- `TOKEN_EXPIRED` - JWT token expired
- `TOKEN_INVALID` - Invalid JWT token
- `REFRESH_TOKEN_EXPIRED` - Refresh token expired

### Authorization Errors
- `INSUFFICIENT_PERMISSIONS` - Missing required permissions
- `ROLE_REQUIRED` - Specific role required
- `OWNERSHIP_REQUIRED` - Resource ownership required

### Validation Errors
- `INVALID_EMAIL` - Email format invalid
- `WEAK_PASSWORD` - Password doesn't meet policy
- `MISSING_FIELDS` - Required fields missing

### System Errors
- `DATABASE_ERROR` - Database operation failed
- `CRYPTO_ERROR` - Cryptographic operation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## Examples

### Complete Authentication Flow

```javascript
// 1. Register
const registerResponse = await fetch('/api/v2/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!',
    firstName: 'Mario',
    lastName: 'Rossi'
  })
});

// 2. Login
const loginResponse = await fetch('/api/v2/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!'
  })
});

const { token, refreshToken } = (await loginResponse.json()).data;

// 3. Access protected resource
const userResponse = await fetch('/api/v2/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 4. Refresh token when needed
const refreshResponse = await fetch('/api/v2/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

// 5. Logout
await fetch('/api/v2/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Admin Operations

```javascript
// List users with filtering
const usersResponse = await fetch('/api/v2/auth/users?role=user&search=mario', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Assign role
await fetch('/api/v2/auth/assign-role', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    role: 'manager'
  })
});

// List all roles
const rolesResponse = await fetch('/api/v2/auth/roles', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
```

---

## Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get user info
curl -X GET http://localhost:3000/api/v2/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Postman

Import the following collection for comprehensive API testing:

```json
{
  "info": {
    "name": "Vicsam Auth API v2",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/v2/auth"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

---

## Security Considerations

### JWT Token Security
- Tokens are signed with RS256 algorithm
- Short expiration time (1 hour default)
- Refresh tokens for long-term access
- Automatic token rotation on refresh

### Password Security
- Minimum 8 characters
- Must contain uppercase, lowercase, numbers, special characters
- Hashed with Argon2id or bcrypt
- Unique salt per user

### Session Security
- Session tracking in database
- Automatic cleanup of expired sessions
- IP and User-Agent logging
- Session revocation on password change

### Audit Logging
- All authentication events logged
- Failed login attempts tracked
- Role changes audited
- IP address and timestamp recording

---

This API documentation covers all endpoints and features of the Vicsam Group Authentication System v2. For additional information, refer to the main README-AUTH.md file.
