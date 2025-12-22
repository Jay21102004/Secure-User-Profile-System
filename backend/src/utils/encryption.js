const crypto = require('crypto');

/**
 * Encryption utilities for securing sensitive data (Aadhaar/ID numbers)
 * Uses AES-256-CBC algorithm for strong encryption
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'default-32-char-key-change-this!!';
const ALGORITHM = 'aes-256-cbc';

// Ensure the encryption key is exactly 32 characters for AES-256
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('Encryption key must be exactly 32 characters long');
}

/**
 * Encrypts sensitive text using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData
 */
const encrypt = (text) => {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  // Generate random initialization vector (IV)
  const iv = crypto.randomBytes(16);
  
  // Create cipher with IV
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV and encrypted data separated by colon
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypts encrypted text using AES-256-CBC
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData
 * @returns {string} - Decrypted original text
 */
const decrypt = (encryptedText) => {
  if (!encryptedText || !encryptedText.includes(':')) {
    throw new Error('Invalid encrypted text format');
  }

  try {
    // Split IV and encrypted data
    const [ivHex, encrypted] = encryptedText.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }
    
    // Convert IV from hex to buffer
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher with IV
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt data: ' + error.message);
  }
};

/**
 * Validates if a string is a valid encrypted format
 * @param {string} encryptedText - Text to validate
 * @returns {boolean} - True if valid format
 */
const isValidEncryptedFormat = (encryptedText) => {
  return typeof encryptedText === 'string' && 
         encryptedText.includes(':') && 
         encryptedText.split(':').length === 2;
};

/**
 * Securely compares two strings to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings match
 */
const secureCompare = (a, b) => {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

module.exports = {
  encrypt,
  decrypt,
  isValidEncryptedFormat,
  secureCompare
};