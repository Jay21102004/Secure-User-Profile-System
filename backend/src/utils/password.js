const bcrypt = require('bcrypt');

/**
 * Password hashing utilities for secure password storage
 * Uses bcrypt for industry-standard password hashing
 */

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Hashes a plain text password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  if (!password) {
    throw new Error('Password cannot be empty');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new Error('Failed to hash password: ' + error.message);
  }
};

/**
 * Compares a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false;
  }

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error.message);
    return false;
  }
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and errors
 */
const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = [
    'password', '123456', 'password123', 'admin', 'qwerty',
    '12345678', 'password1', 'welcome', 'letmein', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generates a secure random password
 * @param {number} length - Length of password to generate (default: 16)
 * @returns {string} - Generated secure password
 */
const generateSecurePassword = (length = 16) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  // Ensure at least one character from each required category
  const categories = [
    'abcdefghijklmnopqrstuvwxyz',      // lowercase
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ',      // uppercase
    '0123456789',                      // numbers
    '!@#$%^&*()'                       // special characters
  ];
  
  // Add one character from each category
  categories.forEach(category => {
    const randomIndex = Math.floor(Math.random() * category.length);
    password += category[randomIndex];
  });
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password to randomize the order
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generateSecurePassword
};