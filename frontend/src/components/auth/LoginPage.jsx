import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToLegal, setAgreedToLegal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = () => {
      const hasTerms = localStorage.getItem('agreedToTerms') === 'true';
      const hasPrivacy = localStorage.getItem('agreedToPrivacy') === 'true';
      if (hasTerms && hasPrivacy) {
        setAgreedToLegal(true);
      }
    };

    checkStatus();
    window.addEventListener('storage', checkStatus);
    return () => window.removeEventListener('storage', checkStatus);
  }, []);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hasTerms = localStorage.getItem('agreedToTerms') === 'true';
    const hasPrivacy = localStorage.getItem('agreedToPrivacy') === 'true';

    if (!hasTerms || !hasPrivacy) {
      setError('You forgot to click and accept the Terms & Conditions and Privacy Policy links first.');
      return;
    }

    if (!agreedToLegal) {
      setError('You must have to accept the terms and conditions checkbox.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      // Redirect to dashboard automatically
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Login</h2>

        <div className={styles.demoBox}>
          <p><strong>Demo Credentials</strong></p>
          <p>Admin: admin@hirehub.com / Admin@123</p>
          <p>Manager: manager@hirehub.com / Manager12</p>
          <p>User: irfanshaikmohammad1@gmail.com / User@123</p>
        </div>
        
        {error && <div className={styles.alert}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => navigate('/forgot-password')}
              style={{ fontSize: '0.85rem', textDecoration: 'none' }}
            >
              Forgot Password?
            </button>
          </div>

          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="agreeLegal" 
              checked={agreedToLegal} 
              onChange={(e) => setAgreedToLegal(e.target.checked)} 
              onClick={(e) => {
                const hasTerms = localStorage.getItem('agreedToTerms') === 'true';
                const hasPrivacy = localStorage.getItem('agreedToPrivacy') === 'true';
                if (e.target.checked && (!hasTerms || !hasPrivacy)) {
                  e.preventDefault();
                  setError('Please open both the Terms & Conditions and Privacy Policy links and check the agreement boxes inside them first.');
                }
              }}
            />
            <label htmlFor="agreeLegal">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </label>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className={styles.footerText}>
          Don't have an account?
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate('/register')}
          >
            Register here
          </button>
        </p>

        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
