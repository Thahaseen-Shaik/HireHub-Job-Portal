import React, { useMemo, useState } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import styles from './Profile.module.css';

const PROFILE_STORAGE_KEY = 'super-admin-profile';

const createAvatarDataUrl = (fullName) => {
  const initials = String(fullName || 'SA')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'SA';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" fill="none">
      <defs>
        <linearGradient id="bg" x1="32" y1="20" x2="208" y2="220" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0f172a" />
          <stop offset="1" stop-color="#2563eb" />
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(78 58) rotate(57) scale(150 145)">
          <stop stop-color="#60a5fa" stop-opacity="0.4" />
          <stop offset="1" stop-color="#60a5fa" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="240" height="240" rx="120" fill="url(#bg)" />
      <circle cx="72" cy="68" r="96" fill="url(#glow)" />
      <circle cx="120" cy="102" r="50" fill="#dbeafe" fill-opacity="0.18" />
      <circle cx="120" cy="90" r="34" fill="#ffffff" fill-opacity="0.92" />
      <path d="M60 200C60 162.562 86.8629 132 120 132C153.137 132 180 162.562 180 200" stroke="#ffffff" stroke-opacity="0.22" stroke-width="14" stroke-linecap="round" />
      <text x="120" y="126" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700" text-anchor="middle" dominant-baseline="middle">${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const formatDateTime = (value) => new Date(value).toLocaleString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const initialProfile = {
  fullName: 'Super Admin',
  email: 'admin@hirehub.com',
  role: 'Super Admin',
  phone: '+91 98765 43210',
  location: 'Andhra Pradesh, India',
  designation: 'Platform Administrator',
  department: 'System Management',
  experience: '2',
  skills: 'Platform Operations, User Management, Security Reviews, System Monitoring',
  accountCreated: '2024-01-12T09:30:00.000Z',
  lastLogin: new Date().toISOString(),
};

const initialPasswordState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const readStoredProfile = () => {
  if (typeof window === 'undefined') return null;
  try {
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    return storedProfile ? JSON.parse(storedProfile) : null;
  } catch (error) {
    return null;
  }
};

const buildProfileState = () => {
  const storedProfile = readStoredProfile();
  const mergedProfile = { ...initialProfile, ...storedProfile };
  return {
    ...mergedProfile,
    image: storedProfile?.image || createAvatarDataUrl(mergedProfile.fullName),
  };
};

const persistProfile = (profile) => {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    // Local-only persistence.
  }
};

const Profile = () => {
  const [profile, setProfile] = useState(() => buildProfileState());
  const [draft, setDraft] = useState(() => buildProfileState());
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState(() => buildProfileState().image);
  const [passwordForm, setPasswordForm] = useState(initialPasswordState);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const skillTags = useMemo(() => (
    String(isEditing ? draft.skills : profile.skills)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  ), [draft.skills, isEditing, profile.skills]);

  React.useEffect(() => {
    const handleUIAction = (e) => {
      const { action, payload } = e.detail;
      if (action === 'UPDATE_PROFILE' && payload) {
        setProfile(prev => {
          const up = { ...prev };
          if (payload.fullName) up.fullName = payload.fullName;
          if (payload.phone) up.phone = payload.phone;
          if (payload.bio) up.designation = payload.bio; // mapping bio to designation for admin for now
          
          persistProfile(up);
          setFeedback({ type: 'success', message: 'Profile updated via AI assistant.' });
          return up;
        });
      }
    };
    window.addEventListener('hirehub-ui-action', handleUIAction);
    return () => window.removeEventListener('hirehub-ui-action', handleUIAction);
  }, []);

  const profileImage = previewImage || profile.image;

  const startEditing = () => {
    setDraft({ ...profile });
    setPreviewImage(profile.image);
    setIsEditing(true);
    setFeedback({ type: '', message: '' });
  };

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(String(reader.result || ''));
      setFeedback({ type: '', message: '' });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    const nextProfile = {
      ...profile,
      ...draft,
      image: previewImage || profile.image,
      lastLogin: new Date().toISOString(),
    };

    setProfile(nextProfile);
    setDraft(nextProfile);
    setPreviewImage(nextProfile.image);
    setIsEditing(false);
    persistProfile(nextProfile);
    setFeedback({ type: 'success', message: 'Profile updated successfully.' });
  };

  const handleCancelProfile = () => {
    setDraft({ ...profile });
    setPreviewImage(profile.image);
    setIsEditing(false);
    setFeedback({ type: '', message: '' });
  };

  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordSave = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'Please complete all password fields.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords must match.' });
      return;
    }

    setPasswordForm(initialPasswordState);
    setFeedback({ type: 'success', message: 'Password updated successfully.' });
  };

  return (
    <AdminLayout currentPage="/admin/profile" pageTitle="My Profile">
      <div className={styles.pageShell}>
        {feedback.message && (
          <div className={`${styles.feedback} ${feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess}`}>
            {feedback.message}
          </div>
        )}

        <div className={styles.heroCard}>
          <div className={styles.heroImageBlock}>
            <div className={styles.avatarFrame}>
              <img className={styles.avatarImage} src={profileImage} alt="Profile" />
            </div>
            <div className={styles.uploadBlock}>
              <label className={styles.fieldLabel}>Profile Image</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          <div className={styles.heroContent}>
            <div>
              <p className={styles.kicker}>Super Admin profile</p>
              <h2>{profile.fullName}</h2>
              <p className={styles.subtleText}>{profile.designation} · {profile.department}</p>
            </div>
            <div className={styles.heroMetaGrid}>
              <div className={styles.metaChip}><span>Role</span><strong>{profile.role}</strong></div>
              <div className={styles.metaChip}><span>Experience</span><strong>{profile.experience} years</strong></div>
            </div>
            <div className={styles.actionRow}>
              {!isEditing ? (
                <button type="button" className={styles.primaryBtn} onClick={startEditing}>Edit Profile</button>
              ) : (
                <>
                  <button type="button" className={styles.primaryBtn} onClick={handleSaveProfile}>Save</button>
                  <button type="button" className={styles.secondaryBtn} onClick={handleCancelProfile}>Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={styles.sectionGrid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Personal Information</h3>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Full Name</label>
                <input name="fullName" value={draft.fullName} onChange={handleDraftChange} disabled={!isEditing} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Email</label>
                <input value={profile.email} readOnly />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Phone</label>
                <input name="phone" value={draft.phone} onChange={handleDraftChange} disabled={!isEditing} />
              </div>
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>Location</label>
                <input name="location" value={draft.location} onChange={handleDraftChange} disabled={!isEditing} />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}><h3>Professional</h3></div>
            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Designation</label>
                <input name="designation" value={draft.designation} onChange={handleDraftChange} disabled={!isEditing} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Experience</label>
                <input name="experience" type="number" value={draft.experience} onChange={handleDraftChange} disabled={!isEditing} />
              </div>
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>Skills (comma separated)</label>
                <textarea name="skills" rows="3" value={draft.skills} onChange={handleDraftChange} disabled={!isEditing} />
                <div className={styles.tagRow}>
                  {skillTags.map(tag => <span key={tag} className={styles.skillTag}>{tag}</span>)}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}><h3>Security</h3></div>
            <div className={styles.securityGrid}>
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.fieldLabel}>Current Password</label>
                <input name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordFieldChange} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>New Password</label>
                <input name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordFieldChange} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Confirm Password</label>
                <input name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordFieldChange} />
              </div>
            </div>
            <div className={styles.actionRow}>
              <button type="button" className={styles.primaryBtn} onClick={handlePasswordSave}>Update Password</button>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}><h3>Account Info</h3></div>
            <div className={styles.infoList}>
              <div className={styles.infoRow}><span>Created</span><strong>{formatDateTime(profile.accountCreated)}</strong></div>
              <div className={styles.infoRow}><span>Last Login</span><strong>{formatDateTime(profile.lastLogin)}</strong></div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
