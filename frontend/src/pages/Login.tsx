import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { validateEmail, validatePassword, getErrorMessage } from '../utils/helpers';
import { LoginRequest, FormErrors } from '../types';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const from = location.state?.from?.pathname || '/profile';

  const validateForm = (values: LoginRequest): FormErrors => {
    const errors: FormErrors = {};

    if (!values.email) {
      errors.email = ['Email is required'];
    } else if (!validateEmail(values.email)) {
      errors.email = ['Please enter a valid email address'];
    }

    if (!values.password) {
      errors.password = ['Password is required'];
    }

    return errors;
  };

  const {
    values,
    errors,
    isSubmitting,
    handleSubmit,
    getFieldProps,
    clearErrors
  } = useForm<LoginRequest>({
    initialValues: { email: '', password: '' },
    validate: validateForm,
    onSubmit: async (values) => {
      await login(values);
      navigate(from, { replace: true });
    }
  });

  useEffect(() => {
    // Only redirect after successful login, not on component mount
    // This prevents auto-redirect when user explicitly visits /login
    if (isAuthenticated && !isLoading && values.email) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    try {
      await handleSubmit(e);
    } catch (error) {
      // Error is handled by useForm hook
      console.error('Login error:', error);
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
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access your secure profile</p>
        </div>

        {errors.general && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {getErrorMessage(errors)}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="auth-form">
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
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                {...getFieldProps('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
                disabled={isSubmitting}
                autoComplete="current-password"
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
              <span className="error-message">{errors.password[0]}</span>
            )}
          </div>

          <button
            type="submit"
            className="auth-button primary"
            disabled={isSubmitting || !values.email || !values.password}
          >
            {isSubmitting ? (
              <>
                <div className="spinner small"></div>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up here
            </Link>
          </p>
          <div className="auth-help">
            <Link to="/forgot-password" className="auth-link secondary">
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="security-notice">
          <span className="security-icon">🔒</span>
          <small>
            Your login is secured with industry-standard encryption
          </small>
        </div>
      </div>
    </div>
  );
};

export default Login;