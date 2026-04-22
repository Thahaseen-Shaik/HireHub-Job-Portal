import React, { useEffect, useMemo, useState } from 'react';
import { managerAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import ManagerLayout from '../components/manager/ManagerLayout';
import ActivityFeed from '../components/common/ActivityFeed';
import styles from './ManagerDashboard.module.css';

const APPLY_MODE_OPTIONS = [
  { value: 'direct_profile', label: 'Send Directly (Profile + Resume)' },
  { value: 'predefined_form', label: 'Add Form (Predefined)' },
  { value: 'google_form', label: 'Google Form Link' },
  { value: 'custom_form', label: 'Website Custom Form' }
];

const APPLY_MODE_LABELS = {
  direct_profile: 'Send Directly',
  predefined_form: 'Add Form',
  google_form: 'Google Form',
  custom_form: 'Website Custom Form'
};

const buildAtsFallbackScore = (application) => {
  const values = application?.submitted_details?.values || {};
  const joinedValues = Object.values(values)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .map((value) => String(value).trim())
    .join(' ');

  let score = 35;
  if (application.user_resume_url) score += 30;
  if (joinedValues) score += Math.min(25, joinedValues.length / 8);
  if (application.user_display_name || application.user_name) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
};

const emptyJobForm = () => ({
  companyId: '',
  title: '',
  description: '',
  location: 'Remote',
  applyMode: 'direct_profile',
  predefinedFormKey: 'basic_screening',
  googleFormUrl: '',
  managerInstructions: '',
  customFormFields: [{ label: '', key: '', type: 'text', required: false }]
});

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [testLinks, setTestLinks] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offboardingLetters, setOffboardingLetters] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [atsJobId, setAtsJobId] = useState('');
  const [atsShortlistCount, setAtsShortlistCount] = useState(2);
  const [atsScores, setAtsScores] = useState({});

  const [profileForm, setProfileForm] = useState({ name: '', phone: '', department: '', bio: '', photo_url: '' });
  const [newJobForm, setNewJobForm] = useState(emptyJobForm);
  const [newInterviewForm, setNewInterviewForm] = useState({
    jobId: '', candidateEmail: '', interviewType: 'Technical', interviewerName: '', scheduledAt: '', mode: 'Google Meet', meetingLink: '', notes: ''
  });
  const [newOffboardingForm, setNewOffboardingForm] = useState({ candidateEmail: '', jobId: '', notes: '' });

  const visibleUsers = useMemo(() => users.filter((u) => u.role !== 'superadmin'), [users]);
  const applicationJobs = useMemo(() => {
    const seen = new Set();
    return applications.filter((application) => {
      const key = Number(application.job_id);
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [applications]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const requests = [
        { key: 'profile', call: managerAPI.getProfile },
        { key: 'stats', call: managerAPI.getStats },
        { key: 'users', call: managerAPI.getUsers },
        { key: 'jobs', call: managerAPI.getJobs },
        { key: 'applications', call: managerAPI.getApplications },
        { key: 'testLinks', call: managerAPI.getTestLinks },
        { key: 'interviews', call: managerAPI.getInterviews },
        { key: 'offboardingLetters', call: managerAPI.getOffboardingLetters },
        { key: 'recentUpdates', call: managerAPI.getRecentUpdates }
      ];

      const settled = await Promise.allSettled(requests.map((entry) => entry.call()));
      const responseMap = requests.reduce((acc, entry, index) => {
        acc[entry.key] = settled[index];
        return acc;
      }, {});

      const profileState = responseMap.profile;
      if (profileState?.status === 'fulfilled') {
        const profile = profileState.value?.data?.data || {};
        setProfileForm({
          name: profile.name || '',
          phone: profile.phone || '',
          department: profile.department || '',
          bio: profile.bio || '',
          photo_url: profile.photo_url || ''
        });
      }

      setStats(responseMap.stats?.status === 'fulfilled' ? (responseMap.stats.value?.data?.data || null) : null);
      setUsers(responseMap.users?.status === 'fulfilled' ? (responseMap.users.value?.data?.data || []) : []);
      setJobs(responseMap.jobs?.status === 'fulfilled' ? (responseMap.jobs.value?.data?.data || []) : []);
      setApplications(responseMap.applications?.status === 'fulfilled' ? (responseMap.applications.value?.data?.data || []) : []);
      setTestLinks(responseMap.testLinks?.status === 'fulfilled' ? (responseMap.testLinks.value?.data?.data || []) : []);
      setInterviews(responseMap.interviews?.status === 'fulfilled' ? (responseMap.interviews.value?.data?.data || []) : []);
      setOffboardingLetters(responseMap.offboardingLetters?.status === 'fulfilled' ? (responseMap.offboardingLetters.value?.data?.data || []) : []);
      setRecentUpdates(responseMap.recentUpdates?.status === 'fulfilled' ? (responseMap.recentUpdates.value?.data?.data || []) : []);

      const failed = settled.filter((item) => item.status === 'rejected');
      if (failed.length) {
        const firstError = failed[0].reason?.response?.data?.message || failed[0].reason?.message || 'Some manager data could not be loaded';
        setError(`${firstError}. Loaded available manager sections.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load manager dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleScheduleConfirm = async (formData = null) => {
      const dataToSubmit = formData || { ...newInterviewForm, jobId: newInterviewForm.jobId ? Number(newInterviewForm.jobId) : null };
      return withSave(() => managerAPI.createInterview(dataToSubmit), 'Failed to schedule interview');
    };

    const handleUIAction = (e) => {
      const { action, entities } = e.detail;
      if (action === 'OPEN_INTERVIEWS') {
        setActiveSection('interviews');
        
        if (entities) {
          setNewInterviewForm(prev => {
            const update = { ...prev };
            if (entities.email) update.candidateEmail = entities.email;
            if (entities.interviewType) update.interviewType = entities.interviewType;
            
            if (entities.time_info) {
              const date = new Date();
              const info = entities.time_info.toLowerCase();
              
              // Smart Date Parsing (Day & Month)
              const monthMap = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
              const monthMatch = info.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
              const dayMatch = info.match(/(\d{1,2})(?:st|nd|rd|th)?(?!\d|:|\.)/); // Avoid matching times like 7:00
              
              if (monthMatch && dayMatch) {
                const monthStr = monthMatch[1].substring(0, 3);
                const day = parseInt(dayMatch[1]);
                date.setMonth(monthMap[monthStr]);
                date.setDate(day);
              } else if (info.includes('tomorrow')) {
                date.setDate(date.getDate() + 1);
              }
              
              const timeMatch = info.match(/(\d{1,2})[:.]?(\d{2})?\s?(pm|am)?/i);
              if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const mins = timeMatch[2] || "00";
                const ampm = timeMatch[3]?.toLowerCase();
                
                if (ampm === 'pm' && hours < 12) hours += 12;
                if (ampm === 'am' && hours === 12) hours = 0;
                
                date.setHours(hours, parseInt(mins), 0, 0);
              } else {
                date.setHours(10, 0, 0, 0);
              }
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const h = String(date.getHours()).padStart(2, '0');
              const m = String(date.getMinutes()).padStart(2, '0');
              update.scheduledAt = `${year}-${month}-${day}T${h}:${m}`;
            }
            return update;
          });
        }
      } else if (action === 'CONFIRM_SCHEDULE') {
        handleScheduleConfirm();
      } else if (action === 'CREATE_JOB' && e.detail.payload) {
        const { title, description, location } = e.detail.payload;
        const autoFilledData = {
            ...emptyJobForm(),
            title: title || 'New Opening',
            description: description || 'No description provided',
            location: location || 'Remote'
        };
        
        setNewJobForm(autoFilledData);
        setActiveSection('jobs');
        
        withSave(() => managerAPI.createJob(autoFilledData), 'Failed to auto-create job from chat')
          .then(() => loadData());
      } else if (action === 'UPDATE_PROFILE' && e.detail.payload) {
        const p = e.detail.payload;
        setProfileForm(prev => {
            const up = { ...prev };
            if (p.fullName) up.name = p.fullName;
            if (p.phone) up.phone = p.phone;
            if (p.department) up.department = p.department;
            if (p.bio) up.bio = p.bio;
            
            // Execute the background save outside the return block using the constructed object
            managerAPI.updateProfile(up).catch(console.error);
            return up;
        });
        setActiveSection('profile');
      } else if (action === 'NAVIGATE_SECTION' && e.detail.payload?.section) {
        setActiveSection(e.detail.payload.section);
      }
    };

    window.addEventListener('hirehub-ui-action', handleUIAction);
    return () => window.removeEventListener('hirehub-ui-action', handleUIAction);
  }, []);

  const withSave = async (fn, fallback) => {
    setSaving(true);
    setError('');
    try {
      await fn();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || fallback);
    } finally {
      setSaving(false);
    }
  };

  const createJob = async (e) => {
    e.preventDefault();
    await withSave(async () => {
      await managerAPI.createJob({
        companyId: newJobForm.companyId ? Number(newJobForm.companyId) : null,
        title: newJobForm.title,
        description: newJobForm.description,
        location: newJobForm.location,
        applyMode: newJobForm.applyMode,
        predefinedFormKey: newJobForm.applyMode === 'predefined_form' ? newJobForm.predefinedFormKey : null,
        googleFormUrl: newJobForm.applyMode === 'google_form' ? newJobForm.googleFormUrl : null,
        managerInstructions: newJobForm.managerInstructions,
        customFormFields: newJobForm.applyMode === 'custom_form' ? newJobForm.customFormFields : []
      });
      setNewJobForm(emptyJobForm());
    }, 'Failed to create job');
  };

  const sendTestLink = async (application) => {
    const linkUrl = window.prompt(`Enter test link URL for ${application.user_email}:`);
    if (!linkUrl) return;
    const notes = window.prompt('Optional notes for candidate:') || '';
    const passPercentage = Number(window.prompt('Pass percentage (default 75):', '75')) || 75;
    const quizQuestionCount = Number(window.prompt('Question count (default 10):', '10')) || 10;
    await withSave(() => managerAPI.shortlistAndSendTestLink(application.id, {
      linkUrl, notes, linkStatus: 'sent', passPercentage, quizQuestionCount
    }), 'Failed to send test link');
  };

  const callInterview = async (link) => {
    const suggested = new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString().slice(0, 16);
    const scheduledAt = window.prompt('Interview schedule (YYYY-MM-DDTHH:mm):', suggested);
    if (!scheduledAt) return;
    const meetingLink = window.prompt('Meeting link (optional):') || '';
    await withSave(() => managerAPI.callCandidateForInterview(link.id, { scheduledAt, meetingLink }), 'Failed to send interview call');
  };

  const runAtsShortlist = async () => {
    if (!atsJobId) {
      setError('Select a job before running ATS shortlist');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await managerAPI.atsShortlistApplications(atsJobId, { shortlistCount: atsShortlistCount });
      const ranked = response.data?.data?.rankedApplications || [];
      const nextScores = {};
      ranked.forEach((application) => {
        nextScores[application.id] = {
          score: application.atsScore,
          reason: application.atsReason
        };
      });
      setAtsScores(nextScores);
      await loadData();
    } catch (err) {
      const routeMissing = err.response?.status === 404 && err.response?.data?.message === 'Route not found';
      if (!routeMissing) {
        setError(err.response?.data?.message || 'Failed to run ATS shortlist');
        setSaving(false);
        return;
      }

      const ranked = applications
        .filter((application) => Number(application.job_id) === Number(atsJobId))
        .map((application) => ({
          ...application,
          atsScore: buildAtsFallbackScore(application),
          atsReason: application.user_resume_url
            ? 'Resume and submitted details matched in fallback ATS'
            : 'Submitted details matched in fallback ATS'
        }))
        .sort((left, right) => right.atsScore - left.atsScore || new Date(left.applied_at) - new Date(right.applied_at));

      const nextScores = {};
      ranked.forEach((application) => {
        nextScores[application.id] = {
          score: application.atsScore,
          reason: application.atsReason
        };
      });

      for (const application of ranked.slice(0, atsShortlistCount)) {
        if (application.status !== 'selected') {
          await managerAPI.updateApplicationStatus(application.id, 'selected');
        }
      }

      setAtsScores(nextScores);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const renderApplicationDetails = (application) => {
    const data = application.submitted_details;
    if (!data || typeof data !== 'object') return <span className={styles.mutedText}>No details</span>;
    const values = data.values && typeof data.values === 'object' ? data.values : {};
    const keys = Object.keys(values).slice(0, 4);
    return (
      <details className={styles.inlineDetails}>
        <summary>View Submitted Data</summary>
        <div className={styles.detailsBody}>
          <p><strong>Type:</strong> {data.applyModeLabel || APPLY_MODE_LABELS[data.applyMode] || 'N/A'}</p>
          {keys.map((key) => <p key={`${application.id}-${key}`}><strong>{key}:</strong> {String(values[key] || 'N/A')}</p>)}
          {(data.profileSnapshot?.resumeUrl || application.user_resume_url) && (
            <a href={data.profileSnapshot?.resumeUrl || application.user_resume_url} target="_blank" rel="noreferrer" className={styles.inlineLink}>View Resume</a>
          )}
        </div>
      </details>
    );
  };

  const getApplicationCandidateName = (application) => {
    const values = application?.submitted_details?.values || {};
    return values.fullName || values.displayName || application.user_display_name || application.user_name || 'N/A';
  };

  const tableLoading = loading ? <div className={styles.loading}><div className={styles.spinner}></div></div> : null;

  const renderSection = () => {
    if (loading) return tableLoading;

    if (activeSection === 'overview') {
      return (
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Dashboard Stats</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}><p className={styles.mutedText}>Users</p> <p className={styles.bigNumber}>{users.length}</p></div>
              <div className={styles.statItem}><p className={styles.mutedText}>Active Jobs</p> <p className={styles.bigNumber}>{jobs.filter(j=>j.status==='open').length}</p></div>
              <div className={styles.statItem}><p className={styles.mutedText}>Pending Apps</p> <p className={styles.bigNumber}>{applications.filter(a=>a.status==='applied').length}</p></div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'profile') {
      return (
        <div className={styles.card}>
          <h3>👤 Manager Profile</h3>
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} placeholder="Enter your full name" />
            </div>
            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} placeholder="e.g. +1 234 567 890" />
            </div>
            <div className={styles.formGroup}>
              <label>Department</label>
              <input value={profileForm.department} onChange={(e) => setProfileForm((p) => ({ ...p, department: e.target.value }))} placeholder="e.g. Engineering, HR" />
            </div>
            <div className={styles.formGroup}>
              <label>Bio</label>
              <textarea value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Briefly describe your role and experience" />
            </div>
            <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => withSave(() => managerAPI.updateProfile(profileForm), 'Failed to update profile')}>
              {saving ? 'Saving...' : 'Save Profile Settings'}
            </button>
          </div>
        </div>
      );
    }

    if (activeSection === 'users') {
      return (
        <div className={styles.card}>
          <h3>👥 User Management</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{visibleUsers.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={styles.userBadge}>{u.role}</span></td>
                  <td>{u.is_blocked ? <span className={styles.failTag}>Blocked</span> : <span className={styles.passTag}>Active</span>}</td>
                  <td>
                    <div className={styles.actionsRow}>
                      <button type="button" className={u.is_blocked ? styles.btnSuccess : styles.btnDanger} disabled={saving || u.id === user?.id} onClick={() => withSave(() => managerAPI.updateUserBlockStatus(u.id, !u.is_blocked), 'Failed to update user status')}>
                        {u.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button type="button" className={styles.btnDanger} disabled={saving || u.id === user?.id} onClick={() => { if (window.confirm('Are you sure you want to delete this user?')) withSave(() => managerAPI.deleteUser(u.id), 'Failed to delete user'); }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeSection === 'jobs') {
      return (
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>🆕 Create Job Opening</h3>
            <form onSubmit={createJob} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Company ID (Optional)</label>
                <input type="number" placeholder="Leave blank if not applicable" value={newJobForm.companyId} onChange={(e) => setNewJobForm((p) => ({ ...p, companyId: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label>Job Title</label>
                <input type="text" placeholder="e.g. Software Engineer" value={newJobForm.title} onChange={(e) => setNewJobForm((p) => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className={styles.formGroup}>
                <label>Job Description</label>
                <textarea placeholder="Outline requirements and responsibilities" value={newJobForm.description} onChange={(e) => setNewJobForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label>Location</label>
                <input type="text" placeholder="e.g. Remote, New York" value={newJobForm.location} onChange={(e) => setNewJobForm((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label>Application Mode</label>
                <select value={newJobForm.applyMode} onChange={(e) => setNewJobForm((p) => ({ ...p, applyMode: e.target.value }))}>{APPLY_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
              </div>
              {newJobForm.applyMode === 'predefined_form' && (
                <div className={styles.formGroup}>
                  <label>Select Predefined Form</label>
                  <select value={newJobForm.predefinedFormKey} onChange={(e) => setNewJobForm((p) => ({ ...p, predefinedFormKey: e.target.value }))}><option value="basic_screening">Basic Screening</option><option value="developer_screening">Developer Screening</option></select>
                </div>
              )}
              {newJobForm.applyMode === 'google_form' && (
                <div className={styles.formGroup}>
                  <label>Google Form URL</label>
                  <input type="url" placeholder="https://docs.google.com/forms/..." value={newJobForm.googleFormUrl} onChange={(e) => setNewJobForm((p) => ({ ...p, googleFormUrl: e.target.value }))} required />
                </div>
              )}
              {newJobForm.applyMode === 'custom_form' && (
                <div className={styles.formGroup}>
                  <label>Custom Field Labels (comma separated)</label>
                  <textarea
                    placeholder="e.g. Portfolio URL, Current CTC, Notice Period"
                    value={newJobForm.customFormFields.map((field) => field.label).filter(Boolean).join(', ')}
                    onChange={(e) => {
                      const fields = e.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)
                        .map((label) => ({ label, key: '', type: 'text', required: true }));
                      setNewJobForm((p) => ({ ...p, customFormFields: fields.length ? fields : [{ label: '', key: '', type: 'text', required: false }] }));
                    }}
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Manager Instructions (Internal Only)</label>
                <textarea placeholder="e.g. Priority hire" value={newJobForm.managerInstructions} onChange={(e) => setNewJobForm((p) => ({ ...p, managerInstructions: e.target.value }))} />
              </div>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Processing...' : '🚀 Create Opening'}</button>
            </form>
          </div>
          <div className={styles.card}>
            <h3>📂 Active Openings</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead><tr><th>Title</th><th>Company</th><th>Apply Type</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{jobs.map((job) => (
                  <tr key={job.id}>
                    <td><strong>{job.title}</strong></td>
                    <td>{job.company_name}</td>
                    <td>{APPLY_MODE_LABELS[job.apply_mode] || 'Send Directly'}</td>
                    <td>{job.status === 'open' ? <span className={styles.passTag}>Open</span> : <span className={styles.failTag}>Closed</span>}</td>
                    <td><button type="button" className={job.status === 'open' ? styles.btnWarning : styles.btnSuccess} disabled={saving} onClick={() => withSave(() => managerAPI.updateJobStatus(job.id, job.status === 'open' ? 'closed' : 'open'), 'Failed to update job status')}>{job.status === 'open' ? 'Close' : 'Open'}</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'applications') {
      return (
        <div className={styles.card}>
          <h3>📄 Applications Management</h3>
          <div className={styles.toolbarRow}>
            <select value={atsJobId} onChange={(e) => setAtsJobId(e.target.value)}>
              <option value="">Select Job For ATS Scan</option>
              {applicationJobs.map((job) => (
                <option key={job.job_id} value={job.job_id}>{job.job_title}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={atsShortlistCount}
              onChange={(e) => setAtsShortlistCount(Math.max(1, Number(e.target.value) || 2))}
              placeholder="Shortlist Count"
            />
            <button type="button" className={styles.btnPrimary} disabled={saving || !atsJobId} onClick={runAtsShortlist}>
              🤖 Run ATS Filter (Top {atsShortlistCount})
            </button>
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th>Job Opening</th><th>Candidate</th><th>Email</th><th>ATS Score</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{applications.length === 0 ? <tr><td colSpan="6" className={styles.empty}>No applications found</td></tr> : applications.map((a) => (
                <tr key={a.id}>
                  <td><strong>{a.job_title}</strong></td>
                  <td>
                    <div><strong>{getApplicationCandidateName(a)}</strong></div>
                    {renderApplicationDetails(a)}
                  </td>
                  <td>{a.user_email}</td>
                  <td>
                    {atsScores[a.id] ? (
                      <div>
                        <span className={styles.bigNumber}>{atsScores[a.id].score}%</span>
                        <p className={styles.mutedText}>{atsScores[a.id].reason}</p>
                      </div>
                    ) : <span className={styles.mutedText}>Not Scanned</span>}
                  </td>
                  <td><span className={a.status === 'selected' ? styles.passTag : a.status === 'rejected' ? styles.failTag : styles.pendingTag}>{a.status}</span></td>
                  <td><div className={styles.actionsRow}>
                    <button type="button" className={styles.btnSuccess} disabled={saving || a.status === 'selected'} onClick={() => withSave(() => managerAPI.updateApplicationStatus(a.id, 'selected'), 'Failed to shortlist')}>Shortlist</button>
                    <button type="button" className={styles.btnPrimary} style={{ padding: '8px 12px' }} disabled={saving} onClick={() => sendTestLink(a)}>Test Link</button>
                    <button type="button" className={styles.btnDanger} disabled={saving || a.status === 'rejected'} onClick={() => withSave(() => managerAPI.updateApplicationStatus(a.id, 'rejected'), 'Failed to reject')}>Reject</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeSection === 'test-links') {
      return (
        <div className={styles.card}>
          <h3>🧪 Test Status Updates</h3>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Candidate</th><th>Status</th><th>Score</th><th>Result</th><th>Updated</th><th>Action</th></tr></thead>
              <tbody>{testLinks.length === 0 ? <tr><td colSpan="7" className={styles.empty}>No test updates yet</td></tr> : testLinks.map((link) => (
                <tr key={link.id}>
                  <td>{link.id}</td>
                  <td>{link.candidate_email || 'N/A'}</td>
                  <td>{link.link_status}</td>
                  <td>{link.latest_score ?? 'N/A'}{link.latest_score !== null && link.latest_score !== undefined ? '%' : ''}</td>
                  <td>{link.is_passed ? <span className={styles.passTag}>Passed</span> : link.attempted_at ? <span className={styles.failTag}>Not Cleared</span> : <span className={styles.pendingTag}>Pending</span>}</td>
                  <td>{formatDateTime(link.updated_at)}</td>
                  <td><div className={styles.actionsRow}>
                    <button type="button" className={styles.btnSuccess} disabled={saving || link.link_status === 'completed'} onClick={() => withSave(() => managerAPI.updateTestLink(link.id, { linkStatus: 'completed' }), 'Failed to update test link')}>Finish</button>
                    <button type="button" className={styles.btnPrimary} disabled={saving || !link.is_passed || link.interview_called} onClick={() => callInterview(link)}>{link.interview_called ? 'Scheduled' : 'Call Candidate'}</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeSection === 'interviews') {
      return (
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>🗓️ Schedule Interview</h3>
            <form onSubmit={(e) => { e.preventDefault(); withSave(() => managerAPI.createInterview({ ...newInterviewForm, jobId: newInterviewForm.jobId ? Number(newInterviewForm.jobId) : null }), 'Failed to schedule interview'); }} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Job ID (optional)</label>
                <input type="number" placeholder="Enter Job ID" value={newInterviewForm.jobId} onChange={(e) => setNewInterviewForm((p) => ({ ...p, jobId: e.target.value }))} />
              </div>
              <div className={styles.formGroup}>
                <label>Candidate Email</label>
                <input type="email" placeholder="email@example.com" value={newInterviewForm.candidateEmail} onChange={(e) => setNewInterviewForm((p) => ({ ...p, candidateEmail: e.target.value }))} required />
              </div>
              <div className={styles.formGroup}>
                <label>Interview Date & Time</label>
                <input type="datetime-local" value={newInterviewForm.scheduledAt} onChange={(e) => setNewInterviewForm((p) => ({ ...p, scheduledAt: e.target.value }))} required />
              </div>
              <div className={styles.formGroup}>
                <label>Interview Type</label>
                <select 
                  value={newInterviewForm.interviewType} 
                  onChange={(e) => setNewInterviewForm((p) => ({ ...p, interviewType: e.target.value }))}
                  className={styles.select}
                  required
                >
                  <option value="Technical">Technical</option>
                  <option value="HR">HR</option>
                  <option value="Cultural">Cultural</option>
                  <option value="System Design">System Design</option>
                  <option value="General">General</option>
                </select>
              </div>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>Confirm Schedule</button>
            </form>
          </div>
          <div className={styles.card}>
            <h3>📜 Upcoming Interviews</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead><tr><th>Candidate</th><th>Type</th><th>Schedule</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>{interviews.map((i) => <tr key={i.id}><td><strong>{i.candidate_email}</strong></td><td>{i.interview_type}</td><td>{formatDateTime(i.scheduled_at)}</td><td><span className={i.status === 'completed' ? styles.passTag : styles.pendingTag}>{i.status}</span></td><td><button type="button" className={styles.btnSuccess} disabled={saving || i.status === 'completed'} onClick={() => withSave(() => managerAPI.updateInterviewStatus(i.id, 'completed'), 'Failed to update interview status')}>Pass</button></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }


    if (activeSection === 'offboarding') {
      return (
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Send Offboarding Letter</h3>
            <form onSubmit={(e) => { e.preventDefault(); withSave(() => managerAPI.sendOffboardingLetter({ candidateEmail: newOffboardingForm.candidateEmail, jobId: newOffboardingForm.jobId ? Number(newOffboardingForm.jobId) : null, notes: newOffboardingForm.notes }), 'Failed to send offboarding letter'); }} className={styles.form}>
              <input type="email" placeholder="Candidate Email" value={newOffboardingForm.candidateEmail} onChange={(e) => setNewOffboardingForm((p) => ({ ...p, candidateEmail: e.target.value }))} required />
              <select value={newOffboardingForm.jobId} onChange={(e) => setNewOffboardingForm((p) => ({ ...p, jobId: e.target.value }))} className={styles.select}>
                <option value="">-- Select Job (Optional) --</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.id} - {job.title}</option>
                ))}
              </select>
              <textarea placeholder="Letter notes" value={newOffboardingForm.notes} onChange={(e) => setNewOffboardingForm((p) => ({ ...p, notes: e.target.value }))} />
              <button type="submit" className={styles.btnPrimary} disabled={saving}>Send Letter</button>
            </form>
          </div>
          <div className={styles.card}>
            <h3>Offboarding Letters</h3>
            <table className={styles.table}><thead><tr><th>Candidate</th><th>Job ID</th><th>Job Title</th><th>Status</th><th>Sent At</th></tr></thead>
              <tbody>{offboardingLetters.map((o) => <tr key={o.id}><td>{o.candidate_email}</td><td>{o.job_id || 'N/A'}</td><td>{o.job_title || 'N/A'}</td><td>{o.status}</td><td>{formatDateTime(o.sent_at)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <ManagerLayout activeSection={activeSection} onChangeSection={setActiveSection}>
      {error && <div className={styles.alert}>{error}</div>}
      {renderSection()}
    </ManagerLayout>
  );
};

export default ManagerDashboard;
