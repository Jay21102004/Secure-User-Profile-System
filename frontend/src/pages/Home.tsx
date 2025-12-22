import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>
            <span className="brand-name">LenDen</span>
            <span className="brand-subtitle">Secure Profile System</span>
          </h1>
          
          <p className="hero-description">
            Experience industry-grade security with our advanced user identity management system. 
            Built with JWT authentication, AES-256 encryption, and enterprise-level security practices.
          </p>

          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary">
              Create Account
            </Link>
            <Link to="/login" className="cta-button secondary">
              Sign In
            </Link>
          </div>

          <div className="security-highlights">
            <div className="highlight-item">
              <span className="highlight-icon">🔐</span>
              <span>AES-256 Encryption</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🛡️</span>
              <span>JWT Authentication</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🔒</span>
              <span>Secure Data Storage</span>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="features-container">
          <h2>Enterprise-Grade Security Features</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔑</div>
              <h3>JWT Authentication</h3>
              <p>
                Stateless token-based authentication ensures secure API access 
                without storing sensitive session data on the server.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>AES-256 Encryption</h3>
              <p>
                Your Aadhaar and sensitive identity data is encrypted using 
                military-grade AES-256 encryption before storage.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Password Security</h3>
              <p>
                Passwords are hashed using bcrypt with salt rounds, 
                ensuring they're never stored in plain text.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚫</div>
              <h3>Account Protection</h3>
              <p>
                Automatic account lockout after failed login attempts 
                prevents unauthorized access attempts.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Validation</h3>
              <p>
                Client and server-side validation ensures data integrity 
                and provides immediate feedback to users.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Responsive Design</h3>
              <p>
                Modern, accessible interface that works seamlessly 
                across desktop, tablet, and mobile devices.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="tech-stack-section">
        <div className="tech-container">
          <h2>Built with Modern Technologies</h2>
          
          <div className="tech-categories">
            <div className="tech-category">
              <h4>Backend</h4>
              <div className="tech-list">
                <span className="tech-item">Node.js + Express</span>
                <span className="tech-item">MongoDB + Mongoose</span>
                <span className="tech-item">JWT + bcrypt</span>
                <span className="tech-item">AES-256 Crypto</span>
              </div>
            </div>

            <div className="tech-category">
              <h4>Frontend</h4>
              <div className="tech-list">
                <span className="tech-item">React + TypeScript</span>
                <span className="tech-item">React Router</span>
                <span className="tech-item">Axios + Context API</span>
                <span className="tech-item">Responsive CSS</span>
              </div>
            </div>

            <div className="tech-category">
              <h4>Security</h4>
              <div className="tech-list">
                <span className="tech-item">JWT Tokens</span>
                <span className="tech-item">Password Hashing</span>
                <span className="tech-item">Data Encryption</span>
                <span className="tech-item">Rate Limiting</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-section">
        <div className="footer-content">
          <p>
            © 2025 LenDen. Built for secure user identity management. 
            This is a demonstration project showcasing enterprise-grade security practices.
          </p>
          
          <div className="footer-links">
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <Link to="/security" className="footer-link">Security</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;