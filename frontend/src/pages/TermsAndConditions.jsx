import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handleAgree = (e) => {
    const checked = e.target.checked;
    setAgreed(checked);
    if (checked) {
      localStorage.setItem('agreedToTerms', 'true');
      setTimeout(() => window.close(), 700);
    } else {
      localStorage.setItem('agreedToTerms', 'false');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main)',
      padding: '4rem 2rem',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: 'var(--bg-card)',
        padding: '3rem',
        borderRadius: '1.6rem',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-main)',
        color: 'var(--text-main)'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', textAlign: 'center', color: 'var(--primary-color)' }}>Terms and Conditions</h1>
        
        <div style={{ lineHeight: '1.7', fontSize: '1.05rem', color: 'var(--text-dim)' }}>
          <p style={{ marginBottom: '1.5rem' }}>Effective Date: April 2026</p>
          
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '2rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
          <p style={{ marginBottom: '1.5rem' }}>By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
          
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '2rem', marginBottom: '1rem' }}>2. Provision of Services</h2>
          <p style={{ marginBottom: '1.5rem' }}>We reserve the right to modify, suspend or discontinue the Service with or without notice at any time and without any liability to you.</p>
          
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '2rem', marginBottom: '1rem' }}>3. User Conduct</h2>
          <p style={{ marginBottom: '1.5rem' }}>You agree to use our platform solely for lawful purposes. You must not use our service to engage in any unethical, prohibited, or illegal activity.</p>

          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '2rem', marginBottom: '1rem' }}>4. Termination</h2>
          <p style={{ marginBottom: '1.5rem' }}>We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-main)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input 
            type="checkbox" 
            id="agreeTerms" 
            checked={agreed} 
            onChange={handleAgree}
            style={{ width: '1.3rem', height: '1.3rem', marginRight: '0.8rem', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
          />
          <label htmlFor="agreeTerms" style={{ cursor: 'pointer', fontWeight: '600', color: 'var(--primary-color)', fontSize: '1.1rem' }}>
            I have read and agree to the Terms and Conditions
          </label>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            onClick={() => window.close()}
            style={{
              padding: '0.9rem 2rem',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-main)',
              borderRadius: '999px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
