const jwt = require('jsonwebtoken');

/**
 * JWT utilities for token-based authentication
 * Handles token generation, verification, and management
 */

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

/**
 * Generates a JWT token for a user
 * @param {Object} payload - User data to encode in token
 * @param {string} expiresIn - Token expiration time (optional)
 * @returns {string} - Generated JWT token
 */
const generateToken = (payload, expiresIn = JWT_EXPIRE) => {
  if (!payload || !payload.userId) {
    throw new Error('Payload must contain userId');
  }

  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    iat: Math.floor(Date.now() / 1000), // issued at
  };

  try {
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn,
      issuer: 'lenden-app',
      audience: 'lenden-users'
    });

    return token;
  } catch (error) {
    throw new Error('Failed to generate token: ' + error.message);
  }
};

/**
 * Verifies a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'lenden-app',
      audience: 'lenden-users'
    });

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active yet');
    } else {
      throw new Error('Token verification failed: ' + error.message);
    }
  }
};

/**
 * Extracts token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Generates a refresh token
 * @param {Object} payload - User data to encode
 * @returns {string} - Generated refresh token (valid for 7 days)
 */
const generateRefreshToken = (payload) => {
  if (!payload || !payload.userId) {
    throw new Error('Payload must contain userId');
  }

  const refreshPayload = {
    userId: payload.userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };

  try {
    const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, {
      expiresIn: '7d', // Refresh tokens last longer
      issuer: 'lenden-app',
      audience: 'lenden-refresh'
    });

    return refreshToken;
  } catch (error) {
    throw new Error('Failed to generate refresh token: ' + error.message);
  }
};

/**
 * Verifies a refresh token
 * @param {string} refreshToken - Refresh token to verify
 * @returns {Object} - Decoded refresh token payload
 */
const verifyRefreshToken = (refreshToken) => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET, {
      issuer: 'lenden-app',
      audience: 'lenden-refresh'
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed: ' + error.message);
    }
  }
};

/**
 * Decodes a token without verification (for development/debugging)
 * @param {string} token - Token to decode
 * @returns {Object} - Decoded token payload
 */
const decodeToken = (token) => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Failed to decode token: ' + error.message);
  }
};

/**
 * Checks if a token is expired without throwing an error
 * @param {string} token - Token to check
 * @returns {boolean} - True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  extractTokenFromHeader,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired
};