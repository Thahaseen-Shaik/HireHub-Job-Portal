import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../api';
import styles from './LoginPage.module.css';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from query params
  const token = new URLSearchParams(location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({ token, password });
      setMessage(response.data.message);
      // Automatically redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Reset Password</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', marginBottom: '2rem' }}>
          Enter your new password below.
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
            <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Redirecting to login in 3 seconds...</div>
          </div>
        )}

        {error && <div className={styles.alert}>{error}</div>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Update Password'}
            </button>
          </form>
        )}

        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate('/login')}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
