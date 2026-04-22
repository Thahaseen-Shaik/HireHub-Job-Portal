import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './ManagerLayout.module.css';

const menuItems = [
  { key: 'overview', label: 'Dashboard Overview' },
  { key: 'profile', label: 'Manager Profile' },
  { key: 'users', label: 'User Management' },
  { key: 'jobs', label: 'Job Updates' },
  { key: 'applications', label: 'Applications' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'test-links', label: 'Test Updates' },
  { key: 'offboarding', label: 'Offboarding Letters' },
  { key: 'updates', label: 'Recent Updates' }
];

const ManagerLayout = ({ activeSection, onChangeSection, children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.sidebarHeader}>
          {sidebarOpen && <h1 className={styles.logo}>Shnoor HireHub</h1>}
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            type="button"
          >
            {sidebarOpen ? 'X' : '='}
          </button>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`${styles.navItem} ${activeSection === item.key ? styles.active : ''}`}
              onClick={() => onChangeSection(item.key)}
              type="button"
            >
              {sidebarOpen && <span className={styles.label}>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          {sidebarOpen && (
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout} type="button">
            {sidebarOpen ? 'Logout' : 'L'}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.mobileToggle}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              type="button"
            >
              ☰
            </button>
            <h2>Manager Dashboard</h2>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.userBadge}>{user?.role?.toUpperCase() || 'MANAGER'}</span>
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
};

export default ManagerLayout;
