import React, { useEffect, useState } from 'react';
import { userPortalAPI } from '../../api';
import UserLayout from '../../components/user/UserLayout';
import ActivityFeed from '../../components/common/ActivityFeed';
import styles from './UserHome.module.css';

const UserHome = () => {
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeRes, notificationsRes] = await Promise.all([
          userPortalAPI.getHome(),
          userPortalAPI.getNotifications()
        ]);
        setData(homeRes.data.data);
        setNotifications(notificationsRes.data.data || []);
      } catch (err) {
        setError('Unable to load user dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <UserLayout currentPage="/user/home" pageTitle="Home">
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout currentPage="/user/home" pageTitle="Home">
      {error && <div className={styles.alert}>{error}</div>}

      <section className={styles.statsGrid}>
        <article className={styles.statCard}>
          <p className={styles.statTitle}>Open Jobs</p>
          <p className={styles.statValue}>{data?.stats?.openJobs || 0}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statTitle}>Applied Jobs</p>
          <p className={styles.statValue}>{data?.stats?.appliedJobs || 0}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statTitle}>Shortlisted</p>
          <p className={styles.statValue}>{data?.stats?.shortlisted || 0}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statTitle}>Rejected</p>
          <p className={styles.statValue}>{data?.stats?.rejected || 0}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.statTitle}>Tests Passed</p>
          <p className={styles.statValue}>{data?.stats?.testPassed || 0}</p>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h3>Recent Applications</h3>
          {!data?.recentApplications?.length ? (
            <p className={styles.empty}>You have not applied for jobs yet.</p>
          ) : (
            <div className={styles.list}>
              {data.recentApplications.map((item) => (
                <div className={styles.listItem} key={item.id}>
                  <div>
                    <p className={styles.itemTitle}>{item.job_title}</p>
                    <p className={styles.itemSub}>{item.company_name}</p>
                  </div>
                  <span className={`${styles.badge} ${styles[item.status] || ''}`}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.card}>
          <h3>Notifications</h3>
          {!notifications.length ? (
            <p className={styles.empty}>No notifications yet.</p>
          ) : (
            <div className={styles.list}>
              {notifications.slice(0, 6).map((item) => (
                <div className={styles.notification} key={item.id}>
                  <p className={styles.noteTitle}>{item.title}</p>
                  <p className={styles.noteText}>{item.description}</p>
                  <p className={styles.noteDate}>{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </article>


      </section>
    </UserLayout>
  );
};

export default UserHome;
