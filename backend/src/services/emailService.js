const nodemailer = require('nodemailer');

// Email configuration - In production, use environment variables
const transporter = nodemailer.createTransport({
  // For development, you can use a service like Gmail
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

/**
 * Send OTP verification email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} otp - 6-digit OTP
 */
const sendOTPEmail = async (email, name, otp) => {
  try {
    // For development, we'll just log the OTP instead of sending actual email
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n📧 OTP EMAIL FOR ${email}:`);
      console.log(`OTP Code: ${otp}`);
      console.log(`Expires in: 10 minutes\n`);
      return { success: true, messageId: 'dev-mode' };
    }

    const mailOptions = {
      from: {
        name: 'LenDen Security System',
        address: process.env.EMAIL_USER || 'your-email@gmail.com'
      },
      to: email,
      subject: 'Verify Your Email - LenDen Security System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3498db; color: white; text-align: center; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #3498db; padding: 20px; margin: 20px 0; text-align: center; border-radius: 10px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #3498db; letter-spacing: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
              <p>LenDen Security System</p>
            </div>
            
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for registering with LenDen Security System. To complete your account setup, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                <p>Your verification code is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p>This code will expire in <strong>10 minutes</strong>. Please enter this code in the verification page to activate your account.</p>
              
              <div class="warning">
                <strong>Security Note:</strong> If you didn't create an account with LenDen, please ignore this email. Never share this code with anyone.
              </div>
              
              <div class="footer">
                <p>© 2025 LenDen Security System</p>
                <p>This is an automated message, please do not reply.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send welcome email after successful verification
 * @param {string} email - Recipient email
 * @param {string} name - User name
 */
const sendWelcomeEmail = async (email, name) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n👋 Welcome email sent to ${email}\n`);
      return { success: true, messageId: 'dev-mode' };
    }

    const mailOptions = {
      from: {
        name: 'LenDen Security System',
        address: process.env.EMAIL_USER || 'your-email@gmail.com'
      },
      to: email,
      subject: 'Welcome to LenDen Security System!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; text-align: center; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .features { background: white; padding: 20px; margin: 20px 0; border-radius: 10px; }
            .feature { margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to LenDen!</h1>
              <p>Your account is now verified and ready to use</p>
            </div>
            
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Congratulations! Your email has been successfully verified and your LenDen Security System account is now active.</p>
              
              <div class="features">
                <h3>🚀 You can now access:</h3>
                <div class="feature">🔐 Secure profile management</div>
                <div class="feature">📷 Image upload with camera integration</div>
                <div class="feature">📄 Encrypted PDF document generation</div>
                <div class="feature">🛡️ Advanced security features</div>
              </div>
              
              <p>Thank you for choosing LenDen Security System for your secure profile management needs!</p>
              
              <div class="footer">
                <p>© 2025 LenDen Security System</p>
                <p>For support, contact us at support@lenden.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw error for welcome email failure
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail
};