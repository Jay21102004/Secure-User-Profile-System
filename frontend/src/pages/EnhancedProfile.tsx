import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { 
  formatDate, 
  formatRelativeTime, 
  maskAadhaar, 
  getErrorMessage,
  parseApiErrors
} from '../utils/helpers';
import { User, SecurityInfo } from '../types';
import '../styles/EnhancedProfile.css';

const EnhancedProfile: React.FC = () => {
  const { user: authUser, updateUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(authUser);
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    email: '',
    address: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadProfileData();
    
    // Cleanup camera stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age?.toString() || '',
        gender: user.gender || '',
        email: user.email || '',
        address: user.address || ''
      });
    }
  }, [user]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file too large. Maximum size is 5MB.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      const updateData = {
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender as 'male' | 'female' | 'other',
        email: formData.email,
        address: formData.address
      };

      const response = await apiService.updateProfileWithImage(updateData, imageFile || undefined);

      if (response.success && response.data) {
        setUser(response.data.user);
        updateUser(response.data.user);
        setIsEditing(false);
        setImageFile(null);
        setImagePreview('');
        setSuccess('Profile updated successfully!');
      }

    } catch (error: any) {
      console.error('Profile update error:', error);
      const apiErrors = parseApiErrors(error);
      setError(getErrorMessage(apiErrors));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!downloadPassword) {
      setError('Please enter your password to download the PDF');
      return;
    }

    try {
      setIsDownloading(true);
      setError('');

      const pdfBlob = await apiService.downloadProfilePDF(downloadPassword);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `LenDen_Profile_${user?.name?.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadPassword('');
      setSuccess('Profile PDF downloaded successfully!');

    } catch (error: any) {
      console.error('PDF download error:', error);
      const apiErrors = parseApiErrors(error);
      const errorMessage = getErrorMessage(apiErrors);
      
      // Show pop-up for incorrect password
      if (errorMessage.includes('Incorrect Password') || errorMessage.includes('Invalid password')) {
        setShowPasswordAlert(true);
        setTimeout(() => setShowPasswordAlert(false), 3000); // Hide after 3 seconds
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsDownloading(false);
    }
  };



  // Camera functions
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 300 }, 
          height: { ideal: 300 },
          facingMode: 'user' // Use front camera if available
        },
        audio: false
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for next tick to ensure modal is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error: any) {
      console.error('Camera access error:', error);
      if (error.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Please check permissions and try again.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        setError('Camera is still loading. Please wait a moment and try again.');
        return;
      }
      
      if (ctx) {
        // Set canvas dimensions to match video
        canvas.width = 300;
        canvas.height = 300;
        
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, 300, 300);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
            setImageFile(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            setSuccess('Photo captured successfully!');
          } else {
            setError('Failed to capture photo. Please try again.');
          }
        }, 'image/jpeg', 0.8);
        
        stopCamera();
      }
    } else {
      setError('Camera not ready. Please try again.');
    }
  };

  // Utility functions
  const handleRefresh = async () => {
    setSuccess('');
    setError('');
    await loadProfileData();
    setSuccess('Profile refreshed successfully!');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/'; // Redirect to landing page
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading profile...</p>
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
            <h3>Profile not found</h3>
            <p>Unable to load your profile information.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-profile-container">
      <div className="enhanced-profile-card">
        <div className="profile-header">
          <h2>My Profile</h2>
          <div className="header-buttons">
            {!isEditing && (
              <button 
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                ✏️ Edit Profile
              </button>
            )}
            <button 
              className="refresh-button"
              onClick={handleRefresh}
              title="Refresh Profile"
            >
              🔄 Refresh
            </button>
            <button 
              className="logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              🚪 Logout
            </button>
          </div>
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

        {/* Password Alert Modal */}
        {showPasswordAlert && (
          <div className="password-alert-overlay">
            <div className="password-alert-modal">
              <span className="alert-icon">🚫</span>
              <h3>Incorrect Password!</h3>
              <p>Please check your password and try again.</p>
              <button 
                onClick={() => setShowPasswordAlert(false)}
                className="alert-close-button"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleFormSubmit} className="profile-form">
            {/* Image Upload Section */}
            <div className="image-upload-section">
              <div className="image-preview">
                {imagePreview || user.profileImage ? (
                  <img 
                    src={imagePreview || user.profileImage} 
                    alt="Profile" 
                    className="profile-image" 
                  />
                ) : (
                  <div className="no-image">
                    <span>📷</span>
                    <p>No image</p>
                  </div>
                )}
              </div>
              
              <div className="image-upload-controls">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div className="upload-buttons">
                  <button
                    type="button"
                    className="upload-button"
                    onClick={handleFileSelect}
                  >
                    📁 Choose File
                  </button>
                  <button
                    type="button"
                    className="camera-button"
                    onClick={startCamera}
                  >
                    📷 Take Photo
                  </button>
                </div>
                <small>Max 5MB (JPG, PNG, GIF, WebP)</small>
              </div>
            </div>

            <div className="form-sections">
              {/* Non-editable fields */}
              <div className="form-section">
                <h3>Basic Information (Non-editable)</h3>
                
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      min="13"
                      max="120"
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div className="form-section">
                <h3>Contact Information (Editable)</h3>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    placeholder="Enter your full address"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsEditing(false);
                  setImageFile(null);
                  setImagePreview('');
                  setError('');
                  setSuccess('');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-display">
            {/* Display Section */}
            <div className="profile-main">
              {/* Profile Image */}
              <div className="profile-image-display">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt="Profile" 
                    className="profile-image" 
                  />
                ) : (
                  <div className="no-image-display">
                    <span>👤</span>
                    <p>No image</p>
                  </div>
                )}
              </div>

              {/* Profile Information */}
              <div className="profile-info">
                {/* Non-editable fields */}
                <div className="info-section non-editable">
                  <h3>Basic Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Name</label>
                      <span className="value">{user.name}</span>
                    </div>
                    <div className="info-item">
                      <label>Age</label>
                      <span className="value">{user.age || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Gender</label>
                      <span className="value">{user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Editable fields */}
                <div className="info-section editable">
                  <h3>Contact Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Email</label>
                      <span className="value">{user.email}</span>
                    </div>
                    <div className="info-item">
                      <label>Address</label>
                      <span className="value">{user.address || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Encrypted Aadhaar (Non-editable) */}
                <div className="info-section sensitive">
                  <h3>🔐 Sensitive Information</h3>
                  <div className="aadhaar-section">
                    <div className="info-item">
                      <label>Aadhaar Number</label>
                      <div className="aadhaar-display">
                        <span className="aadhaar-value">
                          {maskAadhaar(user.aadhaarNumber || '')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Download Section */}
            <div className="pdf-download-section">
              <h3>📄 Download Profile PDF</h3>
              <p>Download your complete profile as a PDF document. The PDF will contain all your information with secure Aadhaar masking.</p>
              
              <div className="download-form">
                <div className="form-group">
                  <label>Enter your password to encrypt the PDF</label>
                  <input
                    type="password"
                    value={downloadPassword}
                    onChange={(e) => setDownloadPassword(e.target.value)}
                    placeholder="Your account password"
                    className="password-input"
                  />
                </div>
                
                <button
                  onClick={handleDownloadPDF}
                  className="download-button"
                  disabled={!downloadPassword || isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <div className="spinner small"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      📥 Download PDF
                    </>
                  )}
                </button>
              </div>
              
              <div className="download-info">
                <small>
                  ⚠️ The downloaded PDF is encrypted with your password and contains sensitive information.
                  Keep it secure and do not share your password.
                </small>
              </div>
            </div>

            {/* Security Information */}
            {securityInfo && (
              <div className="security-section">
                <h3>🛡️ Account Security</h3>
                <div className="security-info">
                  <div className="security-item">
                    <label>Account Created</label>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="security-item">
                    <label>Last Login</label>
                    <span>{securityInfo.lastLogin ? formatRelativeTime(securityInfo.lastLogin) : 'Never'}</span>
                  </div>
                  <div className="security-item">
                    <label>Email Verified</label>
                    <span className={securityInfo.emailVerified ? 'verified' : 'unverified'}>
                      {securityInfo.emailVerified ? '✅ Verified' : '❌ Not Verified'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Camera Modal */}
      {showCamera && (
        <div className="camera-modal">
          <div className="camera-container">
            <div className="camera-header">
              <h3>Take a Photo</h3>
              <button className="close-button" onClick={stopCamera}>❌</button>
            </div>
            <div className="camera-content">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="camera-video"
                onLoadedMetadata={() => {
                  // Ensure video is ready for capture
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
              />
              <canvas 
                ref={canvasRef} 
                style={{ display: 'none' }}
              />
            </div>
            <div className="camera-controls">
              <button className="capture-button" onClick={capturePhoto}>
                📷 Capture Photo
              </button>
              <button className="cancel-button" onClick={stopCamera}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProfile;