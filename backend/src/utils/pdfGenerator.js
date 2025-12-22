const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * PDF Generation utilities for encrypted user profile documents
 * Creates password-protected PDFs with user profile information
 */

/**
 * Generate a standard PDF with user profile information
 * @param {Object} user - User object with profile data
 * @param {string} password - Password for verification (not used for encryption)
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateEncryptedProfilePDF = async (user, password) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with password protection using PDFKit's built-in features
      const doc = new PDFDocument({
        margin: 50,
        userPassword: password,  // Built-in PDF password protection
        ownerPassword: password + '_owner',  // Owner password for full permissions
        permissions: {
          printing: 'highResolution',
          modifying: false,
          copying: false,
          annotating: false
        },
        info: {
          Title: 'LenDen Profile Document',
          Author: 'LenDen Security System',
          Subject: 'Secure User Profile',
          Keywords: 'profile, secure, protected'
        }
      });

      // Store PDF data in buffer
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('LenDen Security System', { align: 'center' });
      
      doc.moveDown(0.5);
      
      doc.fontSize(16)
         .font('Helvetica')
         .text('Encrypted Profile Document', { align: 'center' });
      
      doc.moveDown(1);

      // Security notice
      doc.fontSize(10)
         .fillColor('red')
         .text('CONFIDENTIAL DOCUMENT - AUTHORIZED PERSONNEL ONLY', { align: 'center' });
      
      doc.fillColor('black');
      doc.moveDown(1.5);

      // User profile section
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Profile Information', { underline: true });
      
      doc.moveDown(0.5);

      // Profile image section
      if (user.profileImage) {
        try {
          // Add user's uploaded profile image
          const imageBuffer = Buffer.from(user.profileImage.split(',')[1], 'base64');
          doc.image(imageBuffer, doc.page.width - 200, doc.y, {
            width: 120,
            height: 120,
            fit: [120, 120]
          });
        } catch (imageError) {
          console.warn('Could not add profile image to PDF:', imageError.message);
          // Fallback to default icon if image fails
          addDefaultUserIcon();
        }
      } else {
        // Add default user icon when no profile image exists
        addDefaultUserIcon();
      }

      // Function to add default user icon
      function addDefaultUserIcon() {
        try {
          // Create a simple circular background with user icon text
          const iconX = doc.page.width - 200;
          const iconY = doc.y;
          const iconSize = 120;
          
          // Draw circular background
          doc.circle(iconX + iconSize/2, iconY + iconSize/2, iconSize/2)
             .fillColor('#e9ecef')
             .fill();
          
          // Add user icon emoji/text
          doc.fillColor('#6c757d')
             .fontSize(48)
             .font('Helvetica')
             .text('👤', iconX + 35, iconY + 30, {
               width: 50,
               align: 'center'
             });
          
          // Add "No Image" text
          doc.fontSize(10)
             .text('No Image', iconX, iconY + iconSize + 5, {
               width: iconSize,
               align: 'center'
             });
          
          // Reset text color
          doc.fillColor('black');
        } catch (iconError) {
          console.warn('Could not add default user icon:', iconError.message);
          // Simple text fallback
          doc.fontSize(12)
             .fillColor('#6c757d')
             .text('[No Profile Image]', doc.page.width - 200, doc.y);
          doc.fillColor('black');
        }
      }

      doc.fontSize(12)
         .font('Helvetica');

      // Non-editable fields
      const yStart = doc.y;
      
      doc.text('Name:', 50, yStart)
         .font('Helvetica-Bold')
         .text(user.name || 'Not provided', 150, yStart);
      
      doc.font('Helvetica')
         .text('Age:', 50, yStart + 25)
         .font('Helvetica-Bold')
         .text(user.age ? user.age.toString() : 'Not provided', 150, yStart + 25);
      
      doc.font('Helvetica')
         .text('Gender:', 50, yStart + 50)
         .font('Helvetica-Bold')
         .text(user.gender || 'Not provided', 150, yStart + 50);

      // Editable fields section
      doc.y = yStart + 100;
      doc.moveDown(1);
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Contact Information', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(12)
         .font('Helvetica');

      doc.text('Email:', 50)
         .font('Helvetica-Bold')
         .text(user.email || 'Not provided', 150, doc.y - 12);
      
      doc.font('Helvetica')
         .text('Address:', 50)
         .font('Helvetica-Bold')
         .text(user.address || 'Not provided', 150, doc.y - 12, {
           width: 300,
           align: 'left'
         });

      // Sensitive information section
      doc.moveDown(2);
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('red')
         .text('Sensitive Information (Decrypted)', { underline: true });
      
      doc.fillColor('black')
         .moveDown(0.5);
      
      doc.fontSize(12)
         .font('Helvetica');

      // Show masked Aadhaar number for security
      doc.text('Aadhaar Number:', 50)
         .font('Helvetica-Bold')
         .text(user.maskedAadhaar || 'Not available', 150, doc.y - 12);

      // Security footer
      doc.moveDown(2);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('gray')
         .text('Generated on: ' + new Date().toLocaleString(), { align: 'center' });
      
      doc.text('This document contains encrypted sensitive information', { align: 'center' });
      doc.text('Unauthorized access or distribution is strictly prohibited', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.text('LenDen Security System © 2025', { align: 'center' });

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(new Error('Failed to generate PDF: ' + error.message));
    }
  });
};

module.exports = {
  generateEncryptedProfilePDF
};