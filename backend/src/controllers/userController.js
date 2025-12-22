const User = require('../models/User');
const { validatePasswordStrength } = require('../utils/password');

/**
 * User Controller
 * Handles user profile operations with secure data decryption
 */

/**
 * Get user profile with decrypted sensitive data
 * @route GET /api/user/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Get profile data with decrypted Aadhaar
    const profileData = user.getProfileData();

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: profileData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    
    if (error.message.includes('decrypt')) {
      return res.status(500).json({
        success: false,
        message: 'Failed to decrypt sensitive data. Please contact support.'
      });
    }
    
    next(error);
  }
};

/**
 * Update user profile
 * @route PUT /api/user/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare updates
    const updates = {};
    
    if (name && name.trim() !== user.name) {
      if (name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 2 and 50 characters'
        });
      }
      updates.name = name.trim();
    }

    if (email && email.toLowerCase() !== user.email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Check if email is already taken
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }

      updates.email = email.toLowerCase();
      updates.emailVerified = false; // Reset verification if email changes
    }

    // If no updates, return current profile
    if (Object.keys(updates).length === 0) {
      const profileData = user.getProfileData();
      return res.status(200).json({
        success: true,
        message: 'No changes detected',
        data: {
          user: profileData
        }
      });
    }

    // Apply updates
    Object.assign(user, updates);
    await user.save();

    // Return updated profile
    const profileData = user.getProfileData();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: profileData,
        updatedFields: Object.keys(updates)
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    next(error);
  }
};

/**
 * Update Aadhaar number (sensitive operation)
 * @route PUT /api/user/aadhaar
 */
const updateAadhaar = async (req, res, next) => {
  try {
    const { aadhaarNumber, currentPassword } = req.body;
    
    if (!aadhaarNumber || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number and current password are required'
      });
    }

    // Validate Aadhaar format
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number must be exactly 12 digits'
      });
    }

    // Find user with password field
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password for security
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect Password!'
      });
    }

    // Check if Aadhaar is the same as current
    try {
      const currentAadhaar = user.getDecryptedAadhaar();
      if (currentAadhaar === aadhaarNumber) {
        return res.status(400).json({
          success: false,
          message: 'New Aadhaar number is the same as current one'
        });
      }
    } catch (error) {
      console.error('Failed to decrypt current Aadhaar for comparison:', error.message);
      // Continue with update if decryption fails
    }

    // Update Aadhaar number (will be encrypted in pre-save hook)
    user.aadhaarNumber = aadhaarNumber;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Aadhaar number updated successfully',
      data: {
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Update Aadhaar error:', error);
    next(error);
  }
};

/**
 * Change password
 * @route PUT /api/user/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Find user with password field
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect Password!'
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password (will be hashed in pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Change password error:', error);
    next(error);
  }
};

/**
 * Delete user account (soft delete by deactivating)
 * @route DELETE /api/user/account
 */
const deleteAccount = async (req, res, next) => {
  try {
    const { password, confirmDeletion } = req.body;

    if (!password || confirmDeletion !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmation text "DELETE_MY_ACCOUNT" are required'
      });
    }

    // Find user with password field
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }

    // Soft delete by changing status
    user.status = 'inactive';
    user.email = `deleted_${Date.now()}_${user.email}`; // Prevent email conflicts
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    next(error);
  }
};

/**
 * Get account security info
 * @route GET /api/user/security
 */
const getSecurityInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('lastLogin loginAttempts lockUntil emailVerified createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const securityInfo = {
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified,
      accountCreated: user.createdAt,
      isLocked: user.isLocked,
      loginAttempts: user.loginAttempts || 0,
      lockUntil: user.lockUntil
    };

    res.status(200).json({
      success: true,
      message: 'Security information retrieved successfully',
      data: securityInfo
    });

  } catch (error) {
    console.error('Get security info error:', error);
    next(error);
  }
};

/**
 * Update profile with image upload
 * @route PUT /api/user/profile-with-image
 */
const updateProfileWithImage = async (req, res, next) => {
  try {
    const { name, age, gender, address, email, profileImage } = req.body;
    
    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = parseInt(age);
    if (gender !== undefined) updateData.gender = gender;
    if (address !== undefined) updateData.address = address;
    if (email !== undefined) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    // Update user
    Object.assign(user, updateData);
    await user.save();

    // Get updated profile data
    const profileData = user.getProfileData();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: profileData
      }
    });

  } catch (error) {
    console.error('Update profile with image error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    next(error);
  }
};

/**
 * Download encrypted profile PDF
 * @route POST /api/user/download-pdf
 */
const downloadProfilePDF = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required for PDF encryption'
      });
    }

    // Find user with password to verify
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect Password!'
      });
    }

    // Get profile data
    const profileData = user.getProfileData();
    
    // Create masked Aadhaar for PDF (show only last 4 digits for security)
    const maskAadhaar = (aadhaar) => {
      if (aadhaar && aadhaar.length >= 4) {
        const lastFour = aadhaar.slice(-4);
        return `XXXX XXXX ${lastFour}`;
      }
      return 'XXXX XXXX XXXX';
    };
    
    // Replace decrypted Aadhaar with masked version for PDF
    profileData.maskedAadhaar = maskAadhaar(profileData.aadhaarNumber);
    delete profileData.aadhaarNumber; // Remove the decrypted version

    // Generate PDF with masked data
    const { generateEncryptedProfilePDF } = require('../utils/pdfGenerator');
    const pdfBuffer = await generateEncryptedProfilePDF(profileData, password);

    // Set response headers for PDF download
    const filename = `LenDen_Profile_${user.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Download PDF error:', error);
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfileWithImage,
  updateAadhaar,
  changePassword,
  deleteAccount,
  getSecurityInfo,
  downloadProfilePDF
};