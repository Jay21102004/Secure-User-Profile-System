const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

/**
 * File upload middleware for profile images
 * Handles image validation, compression, and conversion to base64
 */

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file
  }
});

/**
 * Process uploaded image: resize, compress, and convert to base64
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} mimetype - Original image mimetype
 * @returns {Promise<string>} - Base64 encoded image with data URL prefix
 */
const processProfileImage = async (buffer, mimetype) => {
  try {
    // Process image with Sharp
    const processedBuffer = await sharp(buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer();

    // Convert to base64 with data URL prefix
    const base64Image = processedBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64Image}`;
    
  } catch (error) {
    throw new Error('Failed to process image: ' + error.message);
  }
};

/**
 * Middleware to handle profile image upload
 */
const uploadProfileImage = upload.single('profileImage');

/**
 * Middleware to process uploaded image after multer
 */
const processImageMiddleware = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(); // No file uploaded, continue
    }

    // Validate file size (additional check)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image file too large. Maximum size is 5MB.'
      });
    }

    // Process the image
    const processedImage = await processProfileImage(req.file.buffer, req.file.mimetype);
    
    // Add processed image to request body
    req.body.profileImage = processedImage;
    
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to process image: ' + error.message
    });
  }
};

/**
 * Error handler for multer errors
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one image allowed.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "profileImage" as field name.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  }
  
  // Handle other errors
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only image files (PNG, JPG, JPEG, GIF, WebP) are allowed.'
    });
  }
  
  next(error);
};

module.exports = {
  uploadProfileImage,
  processImageMiddleware,
  handleUploadError,
  processProfileImage
};