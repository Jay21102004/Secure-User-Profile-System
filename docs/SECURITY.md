# 🔐 Security Architecture & Implementation Guide

## 🛡️ Overview

The LenDen application implements **enterprise-grade security** practices suitable for handling sensitive user data, including government ID numbers (Aadhaar), passwords, and personal information. This document outlines the comprehensive security measures implemented throughout the system.

---

## 🏗️ Security Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side   │    │    Database     │
│                 │    │                 │    │                 │
│ • HTTPS         │────│ • JWT Auth      │────│ • Encrypted     │
│ • Input Valid   │    │ • Rate Limiting │    │   Sensitive     │
│ • XSS Protect   │    │ • CORS Policy   │    │   Data          │
│ • CSRF Token    │    │ • Helmet.js     │    │ • Secure        │
│ • Secure Store  │    │ • Input Valid   │    │   Connections   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🔑 Authentication & Authorization

### JSON Web Tokens (JWT)

**Implementation Details:**
- **Algorithm**: HMAC SHA256 (HS256)
- **Expiration**: 24 hours (configurable)
- **Refresh Tokens**: 7 days (configurable)
- **Issuer**: Application-specific identifier
- **Audience**: User role-based

**Token Structure:**
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "iat": 1640995200,
    "exp": 1641081600,
    "iss": "lenden-app",
    "aud": "lenden-users"
  }
}
```

**Security Features:**
- ✅ Secure secret key (32+ characters)
- ✅ Token expiration enforcement
- ✅ Refresh token rotation
- ✅ Logout token blacklisting
- ✅ Issuer and audience validation

### Password Security

**bcrypt Implementation:**
```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hashing
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Verification
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- No common passwords (dictionary check)

**Security Features:**
- ✅ Salt rounds: 12 (recommended for 2023+)
- ✅ Timing attack protection
- ✅ Password strength validation
- ✅ Password history (prevents reuse)

---

## 🔐 Data Encryption

### AES-256-CBC Encryption

**Implementation:**
```javascript
const crypto = require('crypto');

const encrypt = (text) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_SECRET, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};
```

**Encrypted Data Types:**
- Aadhaar/Government ID numbers
- Social Security numbers
- Bank account numbers
- Other PII as required

**Security Features:**
- ✅ AES-256-CBC algorithm (industry standard)
- ✅ Random initialization vectors (IV)
- ✅ Secure key generation and storage
- ✅ Constant-time comparison
- ✅ Key rotation support

---

## 🛡️ Application Security

### Input Validation & Sanitization

**Server-Side Validation:**
```javascript
const validator = require('validator');

const validateEmail = (email) => {
  return validator.isEmail(email) && 
         validator.isLength(email, { min: 5, max: 254 });
};

const validateAadhaar = (aadhaar) => {
  return /^[0-9]{12}$/.test(aadhaar);
};
```

**Protection Measures:**
- ✅ Input sanitization (XSS prevention)
- ✅ SQL/NoSQL injection prevention
- ✅ Parameter validation
- ✅ File upload restrictions
- ✅ Request size limits

### Cross-Site Scripting (XSS) Prevention

**Content Security Policy:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));
```

### Cross-Site Request Forgery (CSRF) Protection

**Implementation:**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ 
  cookie: true,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production'
});
```

---

## 🚫 Rate Limiting & DDoS Protection

### API Rate Limiting

**Implementation:**
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts',
  standardHeaders: true,
  legacyHeaders: false
});
```

**Rate Limit Configuration:**
- Login attempts: 5 per 15 minutes per IP
- Registration: 3 per hour per IP
- Password reset: 3 per hour per email
- API calls: 100 per minute per user

### Account Lockout

**Progressive Lockout:**
```javascript
const lockoutThreshold = 5;
const lockoutTime = 30 * 60 * 1000; // 30 minutes

if (user.loginAttempts >= lockoutThreshold) {
  user.lockUntil = Date.now() + lockoutTime;
  await user.save();
}
```

---

## 🔒 Database Security

### MongoDB Security Configuration

**Connection Security:**
```javascript
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: 'admin',
  ssl: true,
  sslValidate: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000
};
```

**Security Features:**
- ✅ Authentication enabled
- ✅ SSL/TLS connections
- ✅ Connection pooling
- ✅ Query timeout limits
- ✅ Index optimization

### Data Schema Security

**Encrypted Field Example:**
```javascript
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  aadhaarNumber: { type: String }, // Encrypted before save
  encryptionVersion: { type: Number, default: 1 }
});

// Pre-save middleware for encryption
userSchema.pre('save', async function(next) {
  if (this.isModified('aadhaarNumber')) {
    this.aadhaarNumber = encrypt(this.aadhaarNumber);
  }
  next();
});
```

---

## 🌐 Network Security

### HTTPS Configuration

**SSL/TLS Setup:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  ciphers: 'HIGH:!aNULL:!MD5',
  honorCipherOrder: true
};

https.createServer(options, app).listen(443);
```

### CORS Policy

**Configuration:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 🔍 Security Headers

### Helmet.js Configuration

**Complete Security Headers:**
```javascript
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true
}));
```

---

## 📊 Logging & Monitoring

### Security Event Logging

**Log Categories:**
- Authentication events (login, logout, failures)
- Authorization failures
- Input validation errors
- Rate limit violations
- Account lockouts
- Password changes
- Data access patterns

**Example Implementation:**
```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log security events
securityLogger.info('Login attempt', {
  userId: user.id,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  success: true
});
```

### Intrusion Detection

**Monitoring Patterns:**
- Multiple failed login attempts
- Unusual access patterns
- Geographic anomalies
- Time-based anomalies
- Privilege escalation attempts

---

## 🧪 Security Testing

### Unit Tests

**Encryption Tests:**
```javascript
describe('Encryption Utils', () => {
  test('should encrypt and decrypt data correctly', () => {
    const plaintext = '123456789012';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    
    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });
});
```

**Password Tests:**
```javascript
describe('Password Utils', () => {
  test('should hash password securely', async () => {
    const password = 'SecurePassword123!';
    const hashed = await hashPassword(password);
    
    expect(hashed).not.toBe(password);
    expect(await comparePassword(password, hashed)).toBe(true);
  });
});
```

### Penetration Testing Checklist

- [ ] **SQL/NoSQL Injection Testing**
- [ ] **XSS Vulnerability Scanning**
- [ ] **CSRF Token Validation**
- [ ] **Authentication Bypass Testing**
- [ ] **Authorization Testing**
- [ ] **Session Management Testing**
- [ ] **Input Validation Testing**
- [ ] **Error Handling Testing**
- [ ] **SSL/TLS Configuration Testing**
- [ ] **Rate Limiting Testing**

---

## 🚀 Production Security Checklist

### Environment Configuration

- [ ] **Strong JWT secrets** (32+ characters, random)
- [ ] **Secure encryption keys** (256-bit, random)
- [ ] **Database authentication** enabled
- [ ] **HTTPS certificates** installed and configured
- [ ] **Environment variables** properly set
- [ ] **Debug mode** disabled
- [ ] **Error messages** sanitized

### Infrastructure Security

- [ ] **Firewall rules** configured
- [ ] **VPN access** for admin operations
- [ ] **Regular security updates** scheduled
- [ ] **Backup encryption** enabled
- [ ] **Access logging** configured
- [ ] **Monitoring alerts** set up
- [ ] **Incident response plan** documented

### Code Security

- [ ] **Dependency scanning** automated
- [ ] **Security linting** enabled
- [ ] **Code review** process
- [ ] **Static analysis** tools
- [ ] **Dynamic testing** integrated
- [ ] **Security headers** validated
- [ ] **Input validation** comprehensive

---

## 🔄 Security Maintenance

### Regular Tasks

**Daily:**
- Monitor security logs
- Check system alerts
- Review failed login attempts

**Weekly:**
- Update dependencies
- Review access logs
- Test backup systems

**Monthly:**
- Security audit
- Penetration testing
- Key rotation review
- Access permission audit

**Quarterly:**
- Full security assessment
- Update security policies
- Staff security training
- Disaster recovery testing

---

## 📚 Security Resources

### Standards & Frameworks

- **OWASP Top 10** - Web application security risks
- **NIST Cybersecurity Framework** - Comprehensive security guidance
- **ISO 27001** - Information security management
- **PCI DSS** - Payment card industry standards
- **GDPR** - Data protection regulation

### Tools & Libraries

**Security Libraries:**
- `helmet` - Security headers
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT implementation
- `express-rate-limit` - Rate limiting
- `validator` - Input validation

**Security Testing:**
- `jest` - Unit testing
- `supertest` - API testing
- `eslint-plugin-security` - Security linting
- `snyk` - Dependency scanning
- `nmap` - Network scanning

---

## 🆘 Incident Response

### Security Incident Workflow

1. **Detection** - Identify security incident
2. **Assessment** - Determine severity and impact
3. **Containment** - Limit damage and exposure
4. **Investigation** - Analyze attack vectors
5. **Recovery** - Restore normal operations
6. **Documentation** - Record lessons learned

### Contact Information

**Security Team:**
- Email: security@lenden.com
- Phone: +1-XXX-XXX-XXXX
- Emergency: +1-XXX-XXX-XXXX

**External Resources:**
- Legal counsel
- Security consultants
- Law enforcement
- Regulatory authorities

---

This security implementation provides **bank-level protection** for user data and follows industry best practices for handling sensitive information. Regular security audits and updates ensure continued protection against emerging threats.