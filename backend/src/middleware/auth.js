const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens
 * Protects routes that require user authentication
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Attach user info to request object
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    let message = 'Token verification failed.';
    let statusCode = 401;

    if (error.message.includes('expired')) {
      message = 'Token has expired. Please login again.';
    } else if (error.message.includes('invalid')) {
      message = 'Invalid token. Please login again.';
    }

    return res.status(statusCode).json({
      success: false,
      message
    });
  }
};

/**
 * Optional authentication middleware
 * Sets user info if token is valid, but doesn't block access
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && user.status === 'active') {
      req.user = {
        userId: user._id.toString(),
        email: user.email,
        name: user.name
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token verification fails, continue without user info
    req.user = null;
    next();
  }
};

/**
 * Middleware to check if user owns the resource
 * Must be used after authenticate middleware
 */
const authorize = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId || req.query.userId;
  
  if (!resourceUserId) {
    return res.status(400).json({
      success: false,
      message: 'Resource user ID not provided.'
    });
  }

  if (req.user.userId !== resourceUserId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources.'
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize
};