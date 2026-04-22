import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../api';
import AdminLayout from '../components/admin/AdminLayout';
import ActivityFeed from '../components/common/ActivityFeed';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await dashboardAPI.getStats();

      setStats(statsRes.data.data);
    } catch (err) {
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout currentPage="/admin/dashboard">
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="/admin/dashboard">
      {error && <div className={styles.alert}>{error}</div>}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}></div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Companies</p>
            <p className={styles.statValue}>{stats?.totalCompanies || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}></div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Users</p>
            <p className={styles.statValue}>{stats?.totalUsers || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}></div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Revenue</p>
            <p className={styles.statValue}>${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>


    </AdminLayout>
  );
};

export default Dashboard;
