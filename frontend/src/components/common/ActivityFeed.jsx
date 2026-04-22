import React, { useState, useEffect } from 'react';
import { managerAPI, userPortalAPI } from '../../api';
import styles from './ActivityFeed.module.css';

const ActivityFeed = ({ role = 'manager' }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    try {
      let res;
      if (role === 'manager' || role === 'admin') {
        res = await managerAPI.getRecentUpdates();
      } else {
        // For users, we might use a different endpoint or filter
        res = await userPortalAPI.getHome();
        // Extract recent applications as activity if it's the user
        if (res.data?.data?.recentApplications) {
            const mapped = res.data.data.recentApplications.map(app => ({
                id: `u-app-${app.id}`,
                type: 'Application',
                message: `Status updated to ${app.status}`,
                candidate_email: app.job_title, // Using title as header
                updated_at: app.applied_at
            }));
            setActivities(mapped);
            setLoading(false);
            return;
        }
      }
      
      setActivities(res.data?.data || []);
      setError(null);
    } catch (err) {
      console.error('Activity Feed Fetch Error:', err);
      setError('Live feed unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [role]);

  if (loading && activities.length === 0) {
    return <div className={styles.loading}>Connecting to live stream...</div>;
  }

  return (
    <div className={styles.feedContainer}>
      <div className={styles.feedHeader}>
        <div className={styles.livePulse}></div>
        <h4>Live Activity Feed</h4>
      </div>
      
      {error && <div className={styles.feedError}>{error}</div>}
      
      <div className={styles.timeline}>
        {activities.length === 0 ? (
          <div className={styles.emptyFeed}>No recent activity detected</div>
        ) : (
          activities.map((item, index) => (
            <div key={item.id || index} className={styles.activityCard}>
              <div className={styles.cardHeader}>
                <span className={`${styles.badge} ${styles[item.type?.toLowerCase()] || ''}`}>
                  {item.type}
                </span>
                <span className={styles.timeStamp}>
                  {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.subject}>{item.candidate_email || item.job_title}</p>
                <p className={styles.description}>{item.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
