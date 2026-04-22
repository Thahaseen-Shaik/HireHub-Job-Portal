import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handleAgree = (e) => {
    const checked = e.target.checked;
    setAgreed(checked);
    if (checked) {
      localStorage.setItem('agreedToPrivacy', 'true');
      setTimeout(() => window.close(), 700);
    } else {
      localStorage.setItem('agreedToPrivacy', 'false');
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
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '2rem', textAlign: 'center', color: 'var(--primary-color)' }}>Privacy Policy</h1>
        
        <div style={{ lineHeight: '1.7', fontSize: '1.05rem', color: 'var(--text-dim)' }}>
          <p style={{ marginBottom: '1.5rem' }}>Effective Date: April 2026</p>
          
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '2rem', marginBottom: '1rem' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: '1.5rem' }}>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
          
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '2rem', marginBottom: '1rem' }}>2. Use of Information</h2>
          <p style={{ marginBottom: '1.5rem' }}>We may use the information we collect about you to provide, maintain, and improve our services, including, for example, to facilitate payments, send receipts, provide products and services you request (and send related information), develop new features, provide customer support to Users and Drivers, develop safety features, authenticate users, and send product updates and administrative messages.</p>
          
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '2rem', marginBottom: '1rem' }}>3. Data Security</h2>
          <p style={{ marginBottom: '1.5rem' }}>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
          
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '2rem', marginBottom: '1rem' }}>4. Contact Us</h2>
          <p style={{ marginBottom: '1.5rem' }}>If you have any questions about this Privacy Policy, please contact us at support@hirehub.com.</p>
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-main)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input 
            type="checkbox" 
            id="agreePrivacy" 
            checked={agreed} 
            onChange={handleAgree}
            style={{ width: '1.3rem', height: '1.3rem', marginRight: '0.8rem', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
          />
          <label htmlFor="agreePrivacy" style={{ cursor: 'pointer', fontWeight: '600', color: 'var(--primary-color)', fontSize: '1.1rem' }}>
            I have read and agree to the Privacy Policy
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

export default PrivacyPolicy;
