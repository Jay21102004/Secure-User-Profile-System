const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { validatePasswordStrength } = require('../utils/password');

/**
 * Authentication Controller
 * Handles user registration, login, and token management
 */

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, aadhaarNumber } = req.body;

    // Input validation
    if (!name || !email || !password || !aadhaarNumber) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, aadhaarNumber'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number must be exactly 12 digits'
      });
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please use a different email or try logging in.',
        field: 'email'
      });
    }

    // Additional email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address format (e.g., user@example.com)',
        field: 'email'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      aadhaarNumber,
      emailVerified: true // Set as verified by default
    });

    await user.save();

    // Generate tokens
    const token = generateToken({ 
      userId: user._id, 
      email: user.email 
    });
    
    const refreshToken = generateRefreshToken({ 
      userId: user._id 
    });

    // Get safe user data (without sensitive info)
    const userData = user.getSafeUserData();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userData,
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '24h'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email address is already registered',
        field: 'email'
      });
    }
    
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with password field
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Incorrect Password!'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken({ 
      userId: user._id, 
      email: user.email 
    });
    
    const refreshToken = generateRefreshToken({ 
      userId: user._id 
    });

    // Get safe user data
    const userData = user.getSafeUserData();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '24h'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * Refresh authentication token
 * @route POST /api/auth/refresh
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: providedRefreshToken } = req.body;

    if (!providedRefreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const { verifyRefreshToken } = require('../utils/jwt');
    const decoded = verifyRefreshToken(providedRefreshToken);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User not found or account inactive'
      });
    }

    // Generate new tokens
    const newToken = generateToken({ 
      userId: user._id, 
      email: user.email 
    });
    
    const newRefreshToken = generateRefreshToken({ 
      userId: user._id 
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRE || '24h'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.message.includes('expired') || error.message.includes('invalid')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token. Please login again.'
      });
    }
    
    next(error);
  }
};

/**
 * Logout user (client-side token invalidation)
 * @route POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // In a production app, you might want to maintain a blacklist of tokens
    // For now, we'll just send a success response as logout is handled client-side
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
};

/**
 * Get current user info from token
 * @route GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // User info is attached by authenticate middleware
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = user.getSafeUserData();

    res.status(200).json({
      success: true,
      data: {
        user: userData
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    next(error);
  }
};

/**
 * Verify email (placeholder for email verification feature)
 * @route POST /api/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // In a real implementation, you would:
    // 1. Find user by verification token
    // 2. Check if token is not expired
    // 3. Mark email as verified
    // 4. Clear verification token

    res.status(200).json({
      success: true,
      message: 'Email verification feature coming soon'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  verifyEmail
};