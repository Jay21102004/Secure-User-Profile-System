import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { 
  formatDate, 
  formatRelativeTime, 
  maskAadhaar, 
  copyToClipboard,
  getErrorMessage,
  parseApiErrors
} from '../utils/helpers';
import { User, SecurityInfo } from '../types';
import './Profile.css';

const Profile: React.FC = () => {
  const { user: authUser, updateUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showFullAadhaar, setShowFullAadhaar] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string>('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Load profile with decrypted data
      const profileResponse = await apiService.getProfile();
      if (profileResponse.success && profileResponse.data) {
        setUser(profileResponse.data.user);
        updateUser(profileResponse.data.user);
      }

      // Load security information
      const securityResponse = await apiService.getSecurityInfo();
      if (securityResponse.success && securityResponse.data) {
        setSecurityInfo(securityResponse.data);
      }

    } catch (error: any) {
      console.error('Profile loading error:', error);
      const apiErrors = parseApiErrors(error);
      setError(getErrorMessage(apiErrors));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAadhaar = async () => {
    if (user?.aadhaarNumber) {
      const success = await copyToClipboard(user.aadhaarNumber);
      if (success) {
        setCopyMessage('Aadhaar number copied to clipboard');
        setTimeout(() => setCopyMessage(''), 3000);
      } else {
        setCopyMessage('Failed to copy to clipboard');
        setTimeout(() => setCopyMessage(''), 3000);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshProfile = async () => {
    await loadProfileData();
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Loading your secure profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <h3>Failed to Load Profile</h3>
            <p>{error}</p>
            <button 
              onClick={refreshProfile}
              className="button secondary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="error-state">
            <span className="error-icon">👤</span>
            <h3>Profile Not Found</h3>
            <p>Unable to load user profile data.</p>
            <button 
              onClick={handleLogout}
              className="button secondary"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <div className="header-content">
          <div className="user-greeting">
            <h1>Welcome, {user.name}</h1>
            <p>Secure Profile Dashboard</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={refreshProfile}
              className="button icon-button"
              title="Refresh Profile"
            >
              🔄
            </button>
            <button 
              onClick={handleLogout}
              className="button secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="profile-content">
        {/* Profile Information Card */}
        <div className="profile-card main-info">
          <div className="card-header">
            <h2>Profile Information</h2>
            <div className="security-badge">
              <span className="badge-icon">🔐</span>
              <span>Encrypted Data</span>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <div className="info-value">
                <span>{user.name}</span>
              </div>
            </div>

            <div className="info-item">
              <label>Email Address</label>
              <div className="info-value">
                <span>{user.email}</span>
                <div className="verification-status">
                  {user.emailVerified ? (
                    <span className="verified">✅ Verified</span>
                  ) : (
                    <span className="unverified">⚠️ Unverified</span>
                  )}
                </div>
              </div>
            </div>

            <div className="info-item sensitive">
              <label>Aadhaar Number</label>
              <div className="info-value aadhaar-section">
                <span className="aadhaar-display">
                  {showFullAadhaar && user.aadhaarNumber 
                    ? user.aadhaarNumber.replace(/(\\d{4})/g, '$1 ').trim()
                    : maskAadhaar(user.aadhaarNumber || '')
                  }
                </span>
                <div className="aadhaar-controls">
                  <button
                    onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                    className="button icon-button small"
                    title={showFullAadhaar ? 'Hide Aadhaar' : 'Show Aadhaar'}
                  >
                    {showFullAadhaar ? '🙈' : '👁️'}
                  </button>
                  {showFullAadhaar && (
                    <button
                      onClick={handleCopyAadhaar}
                      className="button icon-button small"
                      title="Copy Aadhaar Number"
                    >
                      📋
                    </button>
                  )}
                </div>
              </div>
              {copyMessage && (
                <div className="copy-message">{copyMessage}</div>
              )}
              <small className="encryption-notice">
                🔒 This data is encrypted in our database using AES-256
              </small>
            </div>

            <div className="info-item">
              <label>Account Status</label>
              <div className="info-value">
                <span className={`status-badge ${user.status}`}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Information Card */}
        {securityInfo && (
          <div className="profile-card security-info">
            <div className="card-header">
              <h2>Account Security</h2>
              <span className="security-icon">🛡️</span>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <label>Account Created</label>
                <div className="info-value">
                  <span>{formatDate(securityInfo.accountCreated)}</span>
                </div>
              </div>

              <div className="info-item">
                <label>Last Login</label>
                <div className="info-value">
                  <span>
                    {securityInfo.lastLogin 
                      ? formatRelativeTime(securityInfo.lastLogin)
                      : 'Never'
                    }
                  </span>
                  {securityInfo.lastLogin && (
                    <small>{formatDate(securityInfo.lastLogin)}</small>
                  )}
                </div>
              </div>

              <div className="info-item">
                <label>Account Security</label>
                <div className="info-value">
                  {securityInfo.isLocked ? (
                    <span className="status-badge locked">🔒 Locked</span>
                  ) : (
                    <span className="status-badge secure">✅ Secure</span>
                  )}
                  {securityInfo.loginAttempts > 0 && (
                    <small>
                      {securityInfo.loginAttempts} failed attempt(s)
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Card */}
        <div className="profile-card actions">
          <div className="card-header">
            <h2>Account Management</h2>
          </div>

          <div className="action-buttons">
            <button className="button primary">
              <span className="button-icon">✏️</span>
              Edit Profile
            </button>
            <button className="button secondary">
              <span className="button-icon">🔑</span>
              Change Password
            </button>
            <button className="button secondary">
              <span className="button-icon">🆔</span>
              Update Aadhaar
            </button>
            <button className="button danger">
              <span className="button-icon">🗑️</span>
              Delete Account
            </button>
          </div>
        </div>

        {/* Security Features Card */}
        <div className="profile-card features">
          <div className="card-header">
            <h2>Security Features</h2>
            <span className="feature-icon">🔐</span>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-check">✅</span>
              <div className="feature-details">
                <strong>JWT Authentication</strong>
                <p>Stateless token-based authentication for secure API access</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-check">✅</span>
              <div className="feature-details">
                <strong>AES-256 Encryption</strong>
                <p>Your Aadhaar number is encrypted using industry-standard AES-256</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-check">✅</span>
              <div className="feature-details">
                <strong>Bcrypt Password Hashing</strong>
                <p>Passwords are securely hashed and never stored in plain text</p>
              </div>
            </div>

            <div className="feature-item">
              <span className="feature-check">✅</span>
              <div className="feature-details">
                <strong>Account Lockout Protection</strong>
                <p>Automatic lockout after multiple failed login attempts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;