# 📚 LenDen API Documentation

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this standard format:

```json
{
  "success": true|false,
  "message": "Descriptive message",
  "data": { ... }, // Response data (on success)
  "error": { ... } // Error details (on failure)
}
```

---

## 🔐 Authentication Endpoints

### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "aadhaarNumber": "123456789012"
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `email`: Required, valid email format
- `password`: Required, 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
- `aadhaarNumber`: Required, exactly 12 digits

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "emailVerified": false,
      "createdAt": "2023-12-19T10:30:00.000Z",
      "updatedAt": "2023-12-19T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "type": "ValidationError",
    "fields": {
      "email": "Email already exists",
      "password": "Password must contain at least one uppercase letter"
    }
  }
}
```

---

### POST `/auth/login`
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "lastLogin": "2023-12-19T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials",
  "error": {
    "type": "AuthenticationError"
  }
}
```

**Error Response (423) - Account Locked:**
```json
{
  "success": false,
  "message": "Account locked due to too many failed login attempts",
  "error": {
    "type": "AccountLockedError",
    "lockedUntil": "2023-12-19T11:30:00.000Z"
  }
}
```

---

### POST `/auth/refresh`
Refresh JWT token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

---

### POST `/auth/logout`
Logout user and invalidate tokens.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET `/auth/me`
Get current user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active",
      "emailVerified": false,
      "createdAt": "2023-12-19T10:30:00.000Z",
      "lastLogin": "2023-12-19T10:30:00.000Z"
    }
  }
}
```

---

## 👤 User Profile Endpoints

### GET `/user/profile`
Get complete user profile with decrypted sensitive data.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "aadhaarNumber": "123456789012",
      "status": "active",
      "emailVerified": false,
      "loginAttempts": 0,
      "createdAt": "2023-12-19T10:30:00.000Z",
      "updatedAt": "2023-12-19T10:30:00.000Z",
      "lastLogin": "2023-12-19T10:30:00.000Z"
    }
  }
}
```

---

### PUT `/user/profile`
Update user profile information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "John Smith"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Smith",
      "email": "john@example.com",
      "status": "active",
      "updatedAt": "2023-12-19T11:30:00.000Z"
    }
  }
}
```

---

### PUT `/user/password`
Change user password.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "currentPassword": "CurrentPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Current password is incorrect",
  "error": {
    "type": "ValidationError"
  }
}
```

---

### PUT `/user/aadhaar`
Update Aadhaar number (requires current password for security).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "aadhaarNumber": "987654321012",
  "currentPassword": "CurrentPassword123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Aadhaar number updated successfully"
}
```

---

### GET `/user/security`
Get account security information and activity.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "security": {
      "loginAttempts": 0,
      "accountLocked": false,
      "lastLogin": "2023-12-19T10:30:00.000Z",
      "passwordLastChanged": "2023-12-19T09:00:00.000Z",
      "emailVerified": false
    }
  }
}
```

---

## 🏥 Health Check Endpoint

### GET `/health`
Check API server health status.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2023-12-19T10:30:00.000Z",
    "uptime": 3600,
    "version": "1.0.0",
    "database": "connected",
    "memory": {
      "used": "50.2 MB",
      "total": "100.0 MB"
    }
  }
}
```

---

## 🚨 Error Responses

### Common Error Types

#### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation error",
  "error": {
    "type": "ValidationError",
    "fields": {
      "fieldName": "Error message"
    }
  }
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "type": "AuthenticationError"
  }
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "message": "Access denied",
  "error": {
    "type": "AuthorizationError"
  }
}
```

#### 404 - Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error": {
    "type": "NotFoundError"
  }
}
```

#### 422 - Unprocessable Entity
```json
{
  "success": false,
  "message": "Invalid input data",
  "error": {
    "type": "ValidationError",
    "details": "Specific validation message"
  }
}
```

#### 423 - Locked
```json
{
  "success": false,
  "message": "Account locked due to security reasons",
  "error": {
    "type": "AccountLockedError",
    "lockedUntil": "2023-12-19T11:30:00.000Z"
  }
}
```

#### 429 - Too Many Requests
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "error": {
    "type": "RateLimitError",
    "retryAfter": 300
  }
}
```

#### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": {
    "type": "InternalError"
  }
}
```

---

## 🔧 Request/Response Examples

### cURL Examples

#### Register a new user:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "aadhaarNumber": "123456789012"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }'
```

#### Get user profile:
```bash
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update profile:
```bash
curl -X PUT http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith"
  }'
```

### JavaScript Fetch Examples

#### Register:
```javascript
const response = await fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePassword123!',
    aadhaarNumber: '123456789012'
  })
});

const data = await response.json();
console.log(data);
```

#### Login:
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePassword123!'
  })
});

const data = await response.json();
const token = data.data.token;
```

#### Get Profile:
```javascript
const response = await fetch('http://localhost:3001/api/user/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data.user);
```

---

## 🔒 Security Considerations

### Rate Limiting
- `/auth/login`: 5 requests per minute per IP
- `/auth/register`: 3 requests per minute per IP
- Other endpoints: 100 requests per minute per user

### Input Validation
- All inputs are sanitized and validated
- XSS protection through input encoding
- SQL injection prevention (MongoDB)
- Password strength requirements enforced

### Data Protection
- Sensitive data (Aadhaar numbers) encrypted with AES-256
- Passwords hashed with bcrypt (12 salt rounds)
- JWTs signed with HMAC SHA256
- HTTPS enforced in production

### Account Security
- Account lockout after 5 failed login attempts
- Password change requires current password
- Sensitive operations require re-authentication
- JWT tokens have expiration times

---

## 📊 Status Codes Summary

| Code | Status | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error |
| 423 | Locked | Account locked |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |