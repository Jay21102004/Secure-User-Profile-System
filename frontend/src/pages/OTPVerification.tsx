import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import './Auth.css';
import '../styles/OTP.css';

interface OTPVerificationProps {
  userId?: string;
  email?: string;
}

const OTPVerification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { userId?: string; email?: string } || {};
  
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [userId] = useState(state.userId || '');
  const [email] = useState(state.email || '');

  useEffect(() => {
    // Redirect if no user data
    if (!userId || !email) {
      navigate('/register', { replace: true });
      return;
    }

    // Start countdown for resend button
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userId, email, navigate]);

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 6) {
      setOtp(value);
      setError('');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const response = await apiService.verifyOTP(userId, otp);
      
      if (response.success && response.data) {
        // Store tokens
        apiService.setTokens(response.data.token, response.data.refreshToken);
        
        setSuccess('Email verified successfully! Redirecting to your profile...');
        
        // Redirect to profile after success
        setTimeout(() => {
          navigate('/profile', { replace: true });
        }, 2000);
      } else {
        setError(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setError(error.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const response = await apiService.resendOTP(userId);
      
      if (response.success) {
        setSuccess('New OTP has been sent to your email');
        setCanResend(false);
        setCountdown(60);
        setOtp(''); // Clear current OTP
        
        // Restart countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      setError(error.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>📧 Verify Your Email</h1>
          <p>We've sent a 6-digit verification code to:</p>
          <strong>{email}</strong>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="success-banner">
            <span className="success-icon">✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="auth-form">
          <div className="form-group">
            <label htmlFor="otp">Verification Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={handleOTPChange}
              placeholder="Enter 6-digit code"
              className={`otp-input ${error ? 'error' : ''}`}
              disabled={isLoading}
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
            />
            <small className="input-help">
              Enter the 6-digit code sent to your email
            </small>
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <div className="spinner"></div>
                Verifying...
              </>
            ) : (
              '✅ Verify Email'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <div className="resend-section">
            <p>Didn't receive the code?</p>
            {canResend ? (
              <button
                type="button"
                className="link-button"
                onClick={handleResendOTP}
                disabled={isLoading}
              >
                📤 Resend Code
              </button>
            ) : (
              <span className="countdown">
                Resend in {countdown} seconds
              </span>
            )}
          </div>
          
          <div className="back-to-register">
            <button
              type="button"
              className="link-button"
              onClick={() => navigate('/register')}
              disabled={isLoading}
            >
              ← Back to Registration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;