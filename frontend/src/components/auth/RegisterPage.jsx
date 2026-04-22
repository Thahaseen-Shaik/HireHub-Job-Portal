import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToLegal, setAgreedToLegal] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      navigate('/login', { state: { message: 'Registration successful. Please login.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h2 className={styles.title}>Register</h2>

        {error && <div className={styles.alert}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter a strong password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="company_manager">Company Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="agreeLegalReg" 
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
            <label htmlFor="agreeLegalReg">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </label>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account?
          <button type="button" className={styles.linkBtn} onClick={() => navigate('/login')}>
            Login here
          </button>
        </p>

        <button type="button" className={styles.backBtn} onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
