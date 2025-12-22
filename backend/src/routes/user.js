const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updateProfileWithImage,
  updateAadhaar,
  changePassword,
  deleteAccount,
  getSecurityInfo,
  downloadProfilePDF
} = require('../controllers/userController');
const { 
  uploadProfileImage, 
  processImageMiddleware, 
  handleUploadError 
} = require('../middleware/upload');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Input validation middleware
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const validateAadhaarUpdate = [
  body('aadhaarNumber')
    .matches(/^\d{12}$/)
    .withMessage('Aadhaar number must be exactly 12 digits'),
  
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required for security verification')
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

const validateAccountDeletion = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  body('confirmDeletion')
    .equals('DELETE_MY_ACCOUNT')
    .withMessage('Confirmation text must be exactly "DELETE_MY_ACCOUNT"')
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
 * @route GET /api/user/profile
 * @desc Get user profile with decrypted sensitive data
 * @access Private
 */
router.get('/profile', getProfile);

/**
 * @route PUT /api/user/profile
 * @desc Update user profile (name, email)
 * @access Private
 */
router.put('/profile', validateProfileUpdate, handleValidationErrors, updateProfile);

/**
 * @route PUT /api/user/aadhaar
 * @desc Update Aadhaar number (requires password verification)
 * @access Private
 */
router.put('/aadhaar', validateAadhaarUpdate, handleValidationErrors, updateAadhaar);

/**
 * @route PUT /api/user/password
 * @desc Change user password
 * @access Private
 */
router.put('/password', validatePasswordChange, handleValidationErrors, changePassword);

/**
 * @route DELETE /api/user/account
 * @desc Delete user account (soft delete)
 * @access Private
 */
router.delete('/account', validateAccountDeletion, handleValidationErrors, deleteAccount);

/**
 * @route GET /api/user/security
 * @desc Get account security information
 * @access Private
 */
router.get('/security', getSecurityInfo);

/**
 * @route PUT /api/user/profile-with-image
 * @desc Update user profile with image upload
 * @access Private
 */
const validateProfileWithImageUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('age')
    .optional()
    .isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

router.put('/profile-with-image', 
  uploadProfileImage,
  processImageMiddleware,
  validateProfileWithImageUpdate,
  handleValidationErrors,
  updateProfileWithImage,
  handleUploadError
);

/**
 * @route POST /api/user/download-pdf
 * @desc Download encrypted profile PDF
 * @access Private
 */
const validatePDFDownload = [
  body('password')
    .notEmpty()
    .withMessage('Password is required for PDF encryption')
];

router.post('/download-pdf', 
  validatePDFDownload,
  handleValidationErrors,
  downloadProfilePDF
);

// Health check for user service
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;