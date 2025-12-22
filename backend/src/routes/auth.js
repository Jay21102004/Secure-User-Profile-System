const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { 
  register, 
  login, 
  refreshToken, 
  logout, 
  getMe, 
  verifyEmail 
} = require('../controllers/authController');

const router = express.Router();

// Input validation middleware
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('aadhaarNumber')
    .matches(/^\d{12}$/)
    .withMessage('Aadhaar number must be exactly 12 digits')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegistration, handleValidationErrors, register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', validateLogin, handleValidationErrors, login);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh authentication token
 * @access Public
 */
router.post('/refresh', validateRefreshToken, handleValidationErrors, refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', authenticate, getMe);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify user email
 * @access Public
 */
router.post('/verify-email', verifyEmail);

// Health check for auth service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;