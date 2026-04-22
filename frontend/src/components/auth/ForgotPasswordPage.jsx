import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../api';
import styles from './LoginPage.module.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Forgot Password</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '2rem' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {message && (
          <div style={{
            backgroundColor: 'var(--primary-color)',
            filter: 'opacity(0.12)',
            color: 'var(--primary-color)',
            border: '1px solid var(--primary-color)',
            padding: '1rem',
            borderRadius: '0.95rem',
            marginBottom: '1.5rem',
            fontSize: '0.92rem',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

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

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>

        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/login')}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
