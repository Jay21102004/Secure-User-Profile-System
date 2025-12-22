import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  validateAadhaar, 
  getErrorMessage,
  formatAadhaar 
} from '../utils/helpers';
import { RegisterRequest, FormErrors } from '../types';
import './Auth.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const validateForm = (values: RegisterRequest & { confirmPassword: string }): FormErrors => {
    const errors: FormErrors = {};

    // Name validation
    const nameValidation = validateName(values.name);
    if (!nameValidation.isValid) {
      errors.name = [nameValidation.error!];
    }

    // Email validation
    if (!values.email) {
      errors.email = ['Email is required'];
    } else if (!validateEmail(values.email)) {
      errors.email = ['Please enter a valid email address'];
    }

    // Password validation
    const passwordValidation = validatePassword(values.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors;
    }

    // Confirm password validation
    if (!values.confirmPassword) {
      errors.confirmPassword = ['Please confirm your password'];
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = ['Passwords do not match'];
    }

    // Aadhaar validation
    const aadhaarValidation = validateAadhaar(values.aadhaarNumber);
    if (!aadhaarValidation.isValid) {
      errors.aadhaarNumber = [aadhaarValidation.error!];
    }

    return errors;
  };

  const {
    values,
    errors,
    isSubmitting,
    setValue,
    handleSubmit,
    getFieldProps
  } = useForm<RegisterRequest & { confirmPassword: string }>({
    initialValues: { 
      name: '', 
      email: '', 
      password: '', 
      confirmPassword: '',
      aadhaarNumber: '' 
    },
    validate: validateForm,
    onSubmit: async (values) => {
      const { confirmPassword, ...registerData } = values;
      await register(registerData);
      navigate('/profile');
    }
  });

  useEffect(() => {
    // Only redirect authenticated users who are already verified
    if (isAuthenticated && !isLoading) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    try {
      await handleSubmit(e);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    if (value.length <= 12) {
      setValue('aadhaarNumber', value);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card large">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join LenDen for secure profile management</p>
        </div>

        {errors.general && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {getErrorMessage(errors)}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              {...getFieldProps('name')}
              type="text"
              id="name"
              placeholder="Enter your full name"
              className={errors.name ? 'error' : ''}
              disabled={isSubmitting}
              autoComplete="name"
            />
            {errors.name && (
              <span className="error-message">{errors.name[0]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              {...getFieldProps('email')}
              type="email"
              id="email"
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
              disabled={isSubmitting}
              autoComplete="email"
            />
            {errors.email && (
              <span className="error-message">{errors.email[0]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="aadhaarNumber">
              Aadhaar Number
              <span className="security-badge">🔐 Encrypted</span>
            </label>
            <input
              type="text"
              id="aadhaarNumber"
              value={formatAadhaar(values.aadhaarNumber)}
              onChange={handleAadhaarChange}
              placeholder="Enter 12-digit Aadhaar number"
              className={errors.aadhaarNumber ? 'error' : ''}
              disabled={isSubmitting}
              maxLength={14} // Account for spaces in formatted display
            />
            {errors.aadhaarNumber && (
              <span className="error-message">{errors.aadhaarNumber[0]}</span>
            )}
            <small className="form-help">
              Your Aadhaar number is encrypted and securely stored
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                {...getFieldProps('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Create a strong password"
                className={errors.password ? 'error' : ''}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            {errors.password && (
              <div className="error-messages">
                {errors.password.map((error: string, index: number) => (
                  <span key={index} className="error-message">{error}</span>
                ))}
              </div>
            )}
            <div className="password-requirements">
              <small>Password must contain:</small>
              <ul>
                <li className={/[a-z]/.test(values.password) ? 'valid' : ''}>
                  One lowercase letter
                </li>
                <li className={/[A-Z]/.test(values.password) ? 'valid' : ''}>
                  One uppercase letter
                </li>
                <li className={/\d/.test(values.password) ? 'valid' : ''}>
                  One number
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(values.password) ? 'valid' : ''}>
                  One special character
                </li>
                <li className={values.password.length >= 8 ? 'valid' : ''}>
                  At least 8 characters
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setValue('confirmPassword', e.target.value);
                }}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword[0]}</span>
            )}
          </div>

          <div className="terms-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                required
                disabled={isSubmitting}
              />
              <span className="checkmark"></span>
              I agree to the{' '}
              <Link to="/terms" className="auth-link" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="auth-link" target="_blank">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={
              isSubmitting || 
              !values.name || 
              !values.email || 
              !values.password || 
              !values.confirmPassword ||
              !values.aadhaarNumber
            }
          >
            {isSubmitting ? (
              <>
                <div className="spinner small"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="security-notice">
          <span className="security-icon">🔒</span>
          <small>
            Your data is protected with AES-256 encryption and JWT authentication
          </small>
        </div>
      </div>
    </div>
  );
};

export default Register;