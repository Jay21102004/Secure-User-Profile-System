const mongoose = require('mongoose');
const { hashPassword } = require('../utils/password');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * User Schema for the LenDen application
 * Handles secure storage of user data with encrypted Aadhaar/ID
 */

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  
  // Encrypted Aadhaar/ID number - stored encrypted in database
  aadhaarNumber: {
    type: String,
    required: [true, 'Aadhaar/ID number is required'],
    validate: {
      validator: function(value) {
        // This validates the decrypted format, encryption happens in pre-save
        if (this.isNew || this.isModified('aadhaarNumber')) {
          // Basic Aadhaar format validation (12 digits)
          return /^\d{12}$/.test(value);
        }
        return true; // Skip validation for already encrypted values
      },
      message: 'Aadhaar number must be exactly 12 digits'
    }
  },
  
  // Profile Information
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [120, 'Age cannot exceed 120']
  },
  
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    lowercase: true
  },
  
  address: {
    type: String,
    maxlength: [500, 'Address cannot exceed 500 characters'],
    trim: true
  },
  
  profileImage: {
    type: String, // Base64 encoded image or file path
    default: null
  },
  
  // User account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  
  // Profile metadata
  profileComplete: {
    type: Boolean,
    default: true
  },
  
  // Security tracking
  lastLogin: {
    type: Date,
    default: null
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date
  },
  
  // Account verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: {
    type: String,
    select: false
  },
  
  // Password reset
  passwordResetToken: {
    type: String,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'users'
});

// Indexes for performance
userSchema.index({ status: 1 });
userSchema.index({ createdAt: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password and encrypt Aadhaar
userSchema.pre('save', async function(next) {
  try {
    // Hash password if it's new or modified
    if (this.isNew || this.isModified('password')) {
      this.password = await hashPassword(this.password);
    }
    
    // Encrypt Aadhaar number if it's new or modified
    if (this.isNew || this.isModified('aadhaarNumber')) {
      // Only encrypt if it's not already encrypted (doesn't contain ':')
      if (!this.aadhaarNumber.includes(':')) {
        this.aadhaarNumber = encrypt(this.aadhaarNumber);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to get decrypted Aadhaar number
userSchema.methods.getDecryptedAadhaar = function() {
  try {
    return decrypt(this.aadhaarNumber);
  } catch (error) {
    throw new Error('Failed to decrypt Aadhaar number');
  }
};

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcrypt');
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1
      },
      $unset: {
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have reached max attempts and it's not locked already, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Static method to find user by email with password
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Static method to find active users only
userSchema.statics.findActive = function(conditions = {}) {
  return this.find({ ...conditions, status: 'active' });
};

// Instance method to get safe user data (without sensitive info)
userSchema.methods.getSafeUserData = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields
  delete userObject.password;
  delete userObject.aadhaarNumber;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  
  return userObject;
};

// Instance method to get user profile with decrypted Aadhaar
userSchema.methods.getProfileData = function() {
  const userObject = this.toObject();
  
  // Remove sensitive fields except Aadhaar (which we'll decrypt)
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  
  // Replace encrypted Aadhaar with decrypted version
  try {
    userObject.aadhaarNumber = this.getDecryptedAadhaar();
  } catch (error) {
    console.error('Failed to decrypt Aadhaar for profile:', error.message);
    delete userObject.aadhaarNumber; // Remove if decryption fails
  }
  
  return userObject;
};

// Transform function to control JSON output
userSchema.set('toJSON', {
  transform: function(doc, ret, options) {
    delete ret.password;
    delete ret.aadhaarNumber; // Keep encrypted by default
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);