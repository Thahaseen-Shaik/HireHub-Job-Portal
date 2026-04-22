import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userPortalAPI } from '../../api';
import UserLayout from '../../components/user/UserLayout';
import styles from './UserProfile.module.css';

const createEducation = () => ({
  degree: '',
  institution: '',
  startYear: '',
  endYear: '',
  grade: ''
});

const createInternship = () => ({
  company: '',
  role: '',
  duration: '',
  description: ''
});

const createExperience = () => ({
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  description: ''
});

const createProject = () => ({
  title: '',
  technologies: '',
  description: '',
  link: ''
});

const initialProfile = {
  profilePhotoUrl: '',
  displayName: '',
  headline: '',
  basicDetails: {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    currentLocation: '',
    preferredLocation: '',
    professionalSummary: ''
  },
  educationDetails: [createEducation()],
  internships: [createInternship()],
  workExperience: [createExperience()],
  skills: [],
  subsets: [],
  languages: [],
  projects: [createProject()],
  accomplishments: {
    certifications: [],
    patents: [],
    awards: [],
    achievements: [],
    scholarships: []
  },
  extraCurricularActivities: [],
  resumeUrl: ''
};

const cleanArray = (value) => value.map((item) => item.trim()).filter(Boolean);

const UserProfile = () => {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'profile-header';
  const validSections = [
    'profile-header',
    'basic',
    'education',
    'internships-work',
    'skills',
    'projects',
    'accomplishments',
    'extracurricular',
    'resume',
    'view-saved'
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userPortalAPI.getProfile();
        const data = response.data.data || {};
        setProfile({
          ...initialProfile,
          ...data,
          educationDetails: data.educationDetails?.length ? data.educationDetails : [createEducation()],
          internships: data.internships?.length ? data.internships : [createInternship()],
          workExperience: data.workExperience?.length ? data.workExperience : [createExperience()],
          projects: data.projects?.length ? data.projects : [createProject()]
        });
      } catch (err) {
        setError('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const handleUIAction = async (e) => {
      const { action, payload } = e.detail;
      if (action === 'UPDATE_PROFILE' && payload) {
        setProfile(prev => {
          const up = { ...prev };
          let targetSection = null;

          // Header fields
          if (payload.displayName) { up.displayName = payload.displayName; targetSection = 'profile-header'; }
          if (payload.headline) { up.headline = payload.headline; targetSection = 'profile-header'; }

          // Basic Details
          if (payload.fullName) { up.basicDetails.fullName = payload.fullName; targetSection = 'basic'; }
          if (payload.phone) { up.basicDetails.phone = payload.phone; targetSection = 'basic'; }
          if (payload.bio) { up.basicDetails.professionalSummary = payload.bio; targetSection = 'basic'; }
          if (payload.currentLocation) { up.basicDetails.currentLocation = payload.currentLocation; targetSection = 'basic'; }
          if (payload.preferredLocation) { up.basicDetails.preferredLocation = payload.preferredLocation; targetSection = 'basic'; }
          if (payload.gender) { up.basicDetails.gender = payload.gender; targetSection = 'basic'; }
          if (payload.dob) { up.basicDetails.dateOfBirth = payload.dob; targetSection = 'basic'; }

          // Skills & Languages
          if (payload.skills) {
            targetSection = 'skills';
            if (payload.skills_append) {
              up.skills = Array.from(new Set([...(up.skills || []), ...payload.skills]));
            } else {
              up.skills = payload.skills;
            }
          }
          if (payload.languages) {
            targetSection = 'skills';
            if (payload.languages_append) {
              up.languages = Array.from(new Set([...(up.languages || []), ...payload.languages]));
            } else {
              up.languages = payload.languages;
            }
          }

          // Phase 2: Complex Entities
          if (payload.education) {
            up.educationDetails = [payload.education, ...(up.educationDetails || [])];
            targetSection = 'education';
          }
          if (payload.experience) {
            up.workExperience = [payload.experience, ...(up.workExperience || [])];
            targetSection = 'internships-work';
          }
          if (payload.internship) {
            up.internships = [payload.internship, ...(up.internships || [])];
            targetSection = 'internships-work';
          }
          if (payload.project) {
            up.projects = [payload.project, ...(up.projects || [])];
            targetSection = 'projects';
          }
          if (payload.extraCurricular) {
            up.extraCurricularActivities = Array.from(new Set([...(up.extraCurricularActivities || []), ...payload.extraCurricular]));
            targetSection = 'extracurricular';
          }
          if (payload.certification) {
            const certs = up.accomplishments.certifications || [];
            up.accomplishments.certifications = Array.from(new Set([...certs, payload.certification]));
            targetSection = 'accomplishments';
          }
          if (payload.resumeUrl) {
            up.resumeUrl = payload.resumeUrl;
            targetSection = 'resume';
          }

          // Trigger auto-navigation if a section was identified
          if (targetSection) setSearchParams({ section: targetSection }, { replace: true });
          
          // Auto-save logic
          const submitUpdate = async () => {
            setSaving(true);
            try {
               await userPortalAPI.updateProfile(up);
               setSuccess('Profile updated via AI assistant.');
            } catch (err) {
               setError('AI update failed to save.');
            } finally {
               setSaving(false);
            }
          };
          submitUpdate();
          return up;
        });
      }
    };
    window.addEventListener('hirehub-ui-action', handleUIAction);
    return () => window.removeEventListener('hirehub-ui-action', handleUIAction);
  }, [setSearchParams]);

  useEffect(() => {
    if (!validSections.includes(activeSection)) {
      setSearchParams({ section: 'profile-header' }, { replace: true });
    }
  }, [activeSection, setSearchParams]);

  const showSection = (sectionKey) => activeSection === sectionKey;

  const handleFieldChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleFieldChange('profilePhotoUrl', String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleFieldChange('resumeUrl', String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleBasicChange = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      basicDetails: {
        ...prev.basicDetails,
        [field]: value
      }
    }));
  };

  const updateArrayItem = (section, index, field, value) => {
    setProfile((prev) => ({
      ...prev,
      [section]: prev[section].map((item, idx) => (
        idx === index ? { ...item, [field]: value } : item
      ))
    }));
  };

  const addArrayItem = (section, factory) => {
    setProfile((prev) => ({
      ...prev,
      [section]: [...prev[section], factory()]
    }));
  };

  const removeArrayItem = (section, index) => {
    setProfile((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, idx) => idx !== index)
    }));
  };

  const handleSimpleArrayText = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: cleanArray(value.split(','))
    }));
  };

  const handleAccomplishmentText = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      accomplishments: {
        ...prev.accomplishments,
        [field]: cleanArray(value.split(','))
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        ...profile,
        educationDetails: profile.educationDetails.filter((item) => item.degree || item.institution),
        internships: profile.internships.filter((item) => item.company || item.role),
        workExperience: profile.workExperience.filter((item) => item.company || item.role),
        projects: profile.projects.filter((item) => item.title || item.description)
      };

      const response = await userPortalAPI.updateProfile(payload);
      setProfile((prev) => ({ ...prev, ...response.data.data }));
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <UserLayout currentPage="/user/my-profile" pageTitle="My Profile" currentSubSection={activeSection}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout currentPage="/user/my-profile" pageTitle="My Profile" currentSubSection={activeSection}>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        {showSection('profile-header') && (
        <section className={styles.card}>
          <h3>Profile Header</h3>
          <div className={styles.profileHeader}>
            <div className={styles.photoWrap}>
              {profile.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt="Profile" className={styles.photo} />
              ) : (
                <div className={styles.photoPlaceholder}>Photo</div>
              )}
            </div>
            <div className={styles.gridTwo}>
              <div>
                <label>Profile Photo Upload</label>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                <p className={styles.helperText}>Upload image from your device to update profile photo.</p>
              </div>
              <div>
                <label>Photo Preview Source</label>
                <input
                  type="text"
                  value={profile.profilePhotoUrl || ''}
                  readOnly
                  placeholder="Uploaded image data"
                />
              </div>
              <div className={styles.fullWidth}>
                <label>Display Name</label>
                <input
                  type="text"
                  value={profile.displayName || ''}
                  onChange={(e) => handleFieldChange('displayName', e.target.value)}
                  placeholder="Display name shown to recruiters"
                />
              </div>
              <div className={styles.fullWidth}>
                <label>Headline</label>
                <input
                  type="text"
                  value={profile.headline || ''}
                  onChange={(e) => handleFieldChange('headline', e.target.value)}
                  placeholder="Ex: Full Stack Developer | JavaScript | React"
                />
              </div>
            </div>
          </div>
        </section>
        )}

        {showSection('basic') && (
        <section className={styles.card}>
          <h3>Basic Details</h3>
          <div className={styles.gridTwo}>
            <div>
              <label>Full Name</label>
              <input
                type="text"
                value={profile.basicDetails.fullName || ''}
                onChange={(e) => handleBasicChange('fullName', e.target.value)}
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={profile.basicDetails.email || ''}
                onChange={(e) => handleBasicChange('email', e.target.value)}
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                type="text"
                value={profile.basicDetails.phone || ''}
                onChange={(e) => handleBasicChange('phone', e.target.value)}
              />
            </div>
            <div>
              <label>Date of Birth</label>
              <input
                type="date"
                value={profile.basicDetails.dateOfBirth || ''}
                onChange={(e) => handleBasicChange('dateOfBirth', e.target.value)}
              />
            </div>
            <div>
              <label>Gender</label>
              <input
                type="text"
                value={profile.basicDetails.gender || ''}
                onChange={(e) => handleBasicChange('gender', e.target.value)}
              />
            </div>
            <div>
              <label>Current Location</label>
              <input
                type="text"
                value={profile.basicDetails.currentLocation || ''}
                onChange={(e) => handleBasicChange('currentLocation', e.target.value)}
              />
            </div>
            <div>
              <label>Preferred Location</label>
              <input
                type="text"
                value={profile.basicDetails.preferredLocation || ''}
                onChange={(e) => handleBasicChange('preferredLocation', e.target.value)}
              />
            </div>
            <div className={styles.fullWidth}>
              <label>Professional Summary</label>
              <textarea
                rows="4"
                value={profile.basicDetails.professionalSummary || ''}
                onChange={(e) => handleBasicChange('professionalSummary', e.target.value)}
              />
            </div>
          </div>
        </section>
        )}

        {showSection('education') && (
        <section className={styles.card}>
          <h3>Education Details</h3>
          <div className={styles.stack}>
            {profile.educationDetails.map((item, index) => (
              <div key={`education-${index}`} className={styles.subCard}>
                <div className={styles.gridTwo}>
                  <input
                    type="text"
                    placeholder="Degree"
                    value={item.degree || ''}
                    onChange={(e) => updateArrayItem('educationDetails', index, 'degree', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={item.institution || ''}
                    onChange={(e) => updateArrayItem('educationDetails', index, 'institution', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Start Year"
                    value={item.startYear || ''}
                    onChange={(e) => updateArrayItem('educationDetails', index, 'startYear', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="End Year"
                    value={item.endYear || ''}
                    onChange={(e) => updateArrayItem('educationDetails', index, 'endYear', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Grade / CGPA"
                    value={item.grade || ''}
                    onChange={(e) => updateArrayItem('educationDetails', index, 'grade', e.target.value)}
                  />
                </div>
                {profile.educationDetails.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeArrayItem('educationDetails', index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={() => addArrayItem('educationDetails', createEducation)}>
              Add Education
            </button>
          </div>
        </section>
        )}

        {showSection('internships-work') && (
        <section className={styles.card}>
          <h3>Internships</h3>
          <div className={styles.stack}>
            {profile.internships.map((item, index) => (
              <div key={`internship-${index}`} className={styles.subCard}>
                <div className={styles.gridTwo}>
                  <input
                    type="text"
                    placeholder="Company"
                    value={item.company || ''}
                    onChange={(e) => updateArrayItem('internships', index, 'company', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={item.role || ''}
                    onChange={(e) => updateArrayItem('internships', index, 'role', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={item.duration || ''}
                    onChange={(e) => updateArrayItem('internships', index, 'duration', e.target.value)}
                  />
                  <textarea
                    rows="2"
                    placeholder="Description"
                    value={item.description || ''}
                    onChange={(e) => updateArrayItem('internships', index, 'description', e.target.value)}
                  />
                </div>
                {profile.internships.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeArrayItem('internships', index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={() => addArrayItem('internships', createInternship)}>
              Add Internship
            </button>
          </div>
        </section>
        )}

        {showSection('internships-work') && (
        <section className={styles.card}>
          <h3>Work Experience</h3>
          <div className={styles.stack}>
            {profile.workExperience.map((item, index) => (
              <div key={`work-${index}`} className={styles.subCard}>
                <div className={styles.gridTwo}>
                  <input
                    type="text"
                    placeholder="Company"
                    value={item.company || ''}
                    onChange={(e) => updateArrayItem('workExperience', index, 'company', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={item.role || ''}
                    onChange={(e) => updateArrayItem('workExperience', index, 'role', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={item.startDate || ''}
                    onChange={(e) => updateArrayItem('workExperience', index, 'startDate', e.target.value)}
                  />
                  <input
                    type="date"
                    placeholder="End Date"
                    value={item.endDate || ''}
                    onChange={(e) => updateArrayItem('workExperience', index, 'endDate', e.target.value)}
                  />
                  <textarea
                    rows="2"
                    placeholder="Description"
                    value={item.description || ''}
                    onChange={(e) => updateArrayItem('workExperience', index, 'description', e.target.value)}
                  />
                </div>
                {profile.workExperience.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeArrayItem('workExperience', index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={() => addArrayItem('workExperience', createExperience)}>
              Add Work Experience
            </button>
          </div>
        </section>
        )}

        {showSection('skills') && (
        <section className={styles.card}>
          <h3>Skills, Subsets, Languages</h3>
          <div className={styles.gridTwo}>
            <div>
              <label>Skills (comma separated)</label>
              <textarea
                rows="3"
                value={(profile.skills || []).join(', ')}
                onChange={(e) => handleSimpleArrayText('skills', e.target.value)}
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>
            <div>
              <label>Subsets / Subjects (comma separated)</label>
              <textarea
                rows="3"
                value={(profile.subsets || []).join(', ')}
                onChange={(e) => handleSimpleArrayText('subsets', e.target.value)}
                placeholder="Data Structures, DBMS, OOP"
              />
            </div>
            <div className={styles.fullWidth}>
              <label>Languages (comma separated)</label>
              <textarea
                rows="2"
                value={(profile.languages || []).join(', ')}
                onChange={(e) => handleSimpleArrayText('languages', e.target.value)}
                placeholder="English, Hindi, Telugu"
              />
            </div>
          </div>
        </section>
        )}

        {showSection('projects') && (
        <section className={styles.card}>
          <h3>Projects</h3>
          <div className={styles.stack}>
            {profile.projects.map((item, index) => (
              <div key={`project-${index}`} className={styles.subCard}>
                <div className={styles.gridTwo}>
                  <input
                    type="text"
                    placeholder="Project Title"
                    value={item.title || ''}
                    onChange={(e) => updateArrayItem('projects', index, 'title', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Tech Stack"
                    value={item.technologies || ''}
                    onChange={(e) => updateArrayItem('projects', index, 'technologies', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Project Link"
                    value={item.link || ''}
                    onChange={(e) => updateArrayItem('projects', index, 'link', e.target.value)}
                  />
                  <textarea
                    rows="2"
                    placeholder="Project Description"
                    value={item.description || ''}
                    onChange={(e) => updateArrayItem('projects', index, 'description', e.target.value)}
                  />
                </div>
                {profile.projects.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeArrayItem('projects', index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={() => addArrayItem('projects', createProject)}>
              Add Project
            </button>
          </div>
        </section>
        )}

        {showSection('accomplishments') && (
        <section className={styles.card}>
          <h3>Accomplishments</h3>
          <div className={styles.gridTwo}>
            <div>
              <label>Certifications (comma separated)</label>
              <textarea
                rows="3"
                value={(profile.accomplishments.certifications || []).join(', ')}
                onChange={(e) => handleAccomplishmentText('certifications', e.target.value)}
              />
            </div>
            <div>
              <label>Patents (comma separated)</label>
              <textarea
                rows="3"
                value={(profile.accomplishments.patents || []).join(', ')}
                onChange={(e) => handleAccomplishmentText('patents', e.target.value)}
              />
            </div>
            <div>
              <label>Awards (comma separated)</label>
              <textarea
                rows="3"
                value={(profile.accomplishments.awards || []).join(', ')}
                onChange={(e) => handleAccomplishmentText('awards', e.target.value)}
              />
            </div>
            <div>
              <label>Achievements (comma separated)</label>
              <textarea
                rows="3"
                value={(profile.accomplishments.achievements || []).join(', ')}
                onChange={(e) => handleAccomplishmentText('achievements', e.target.value)}
              />
            </div>
            <div className={styles.fullWidth}>
              <label>Scholarships (comma separated)</label>
              <textarea
                rows="3"
                value={(profile.accomplishments.scholarships || []).join(', ')}
                onChange={(e) => handleAccomplishmentText('scholarships', e.target.value)}
              />
            </div>
          </div>
        </section>
        )}

        {showSection('extracurricular') && (
        <section className={styles.card}>
          <h3>Extra Curricular Activities</h3>
          <textarea
            rows="3"
            value={(profile.extraCurricularActivities || []).join(', ')}
            onChange={(e) => handleSimpleArrayText('extraCurricularActivities', e.target.value)}
            placeholder="Hackathons, Sports captain, NSS volunteer"
          />
        </section>
        )}

        {showSection('resume') && (
        <section className={styles.card}>
          <h3>Resume</h3>
          <label>Resume Upload</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
          <p className={styles.helperText}>Upload your latest resume file. It will be saved in your profile.</p>
          {profile.resumeUrl ? (
            <a className={styles.resumeLink} href={profile.resumeUrl} download="resume">
              Download Current Resume
            </a>
          ) : (
            <p className={styles.helperText}>No resume uploaded yet.</p>
          )}
        </section>
        )}

        {showSection('view-saved') && (
        <section className={styles.card}>
          <h3>Saved Profile Data (View Only)</h3>
          <div className={styles.viewGrid}>
            <div>
              <p className={styles.viewLabel}>Display Name</p>
              <p className={styles.viewValue}>{profile.displayName || 'N/A'}</p>
            </div>
            <div>
              <p className={styles.viewLabel}>Headline</p>
              <p className={styles.viewValue}>{profile.headline || 'N/A'}</p>
            </div>
            <div className={styles.fullWidth}>
              <p className={styles.viewLabel}>Basic Details</p>
              <div className={styles.viewBlock}>
                {Object.entries(profile.basicDetails || {}).map(([key, value]) => (
                  <p key={key} className={styles.viewLine}><strong>{key}:</strong> {value || 'N/A'}</p>
                ))}
              </div>
            </div>
            <div className={styles.fullWidth}>
              <p className={styles.viewLabel}>Education</p>
              <div className={styles.viewBlock}>
                {(profile.educationDetails || []).length === 0 ? (
                  <p className={styles.viewLine}>No education records</p>
                ) : (
                  profile.educationDetails.map((item, index) => (
                    <p key={`edu-${index}`} className={styles.viewLine}>
                      <strong>{item.degree || 'Degree'}:</strong> {item.institution || 'N/A'} ({item.startYear || 'N/A'} - {item.endYear || 'N/A'}) {item.grade ? `| Grade: ${item.grade}` : ''}
                    </p>
                  ))
                )}
              </div>
            </div>
            <div className={styles.fullWidth}>
              <p className={styles.viewLabel}>Internships</p>
              <div className={styles.viewBlock}>
                {(profile.internships || []).length === 0 ? (
                  <p className={styles.viewLine}>No internship records</p>
                ) : (
                  profile.internships.map((item, index) => (
                    <p key={`intern-${index}`} className={styles.viewLine}>
                      <strong>{item.company || 'Company'}:</strong> {item.role || 'N/A'} {item.duration ? `| ${item.duration}` : ''}
                    </p>
                  ))
                )}
              </div>
            </div>
            <div className={styles.fullWidth}>
              <p className={styles.viewLabel}>Work Experience</p>
              <div className={styles.viewBlock}>
                {(profile.workExperience || []).length === 0 ? (
                  <p className={styles.viewLine}>No work experience records</p>
                ) : (
                  profile.workExperience.map((item, index) => (
                    <p key={`work-${index}`} className={styles.viewLine}>
                      <strong>{item.company || 'Company'}:</strong> {item.role || 'N/A'} ({item.startDate || 'N/A'} - {item.endDate || 'N/A'})
                    </p>
                  ))
                )}
              </div>
            </div>
            <div className={styles.fullWidth}>
              <p className={styles.viewLabel}>Skills / Subsets / Languages</p>
              <div className={styles.viewBlock}>
                <p className={styles.viewLine}><strong>Skills:</strong> {(profile.skills || []).join(', ') || 'N/A'}</p>
                <p className={styles.viewLine}><strong>Subsets:</strong> {(profile.subsets || []).join(', ') || 'N/A'}</p>
                <p className={styles.viewLine}><strong>Languages:</strong> {(profile.languages || []).join(', ') || 'N/A'}</p>
              </div>
            </div>
            <div className={styles.fullWidth}>
              <p className={styles.viewLabel}>Projects</p>
              <div className={styles.viewBlock}>
                {(profile.projects || []).length === 0 ? (
                  <p className={styles.viewLine}>No projects added</p>
                ) : (
                  profile.projects.map((item, index) => (
                    <p key={`project-${index}`} className={styles.viewLine}>
                      <strong>{item.title || 'Project'}:</strong> {item.technologies || 'N/A'} {item.link ? `| ${item.link}` : ''}
                    </p>
                  ))
                )}
              </div>
            </div>
            <div className={styles.fullWidth}>
              <p className={styles.viewLabel}>Accomplishments</p>
              <div className={styles.viewBlock}>
                <p className={styles.viewLine}><strong>Certifications:</strong> {(profile.accomplishments?.certifications || []).join(', ') || 'N/A'}</p>
                <p className={styles.viewLine}><strong>Patents:</strong> {(profile.accomplishments?.patents || []).join(', ') || 'N/A'}</p>
                <p className={styles.viewLine}><strong>Awards:</strong> {(profile.accomplishments?.awards || []).join(', ') || 'N/A'}</p>
                <p className={styles.viewLine}><strong>Achievements:</strong> {(profile.accomplishments?.achievements || []).join(', ') || 'N/A'}</p>
                <p className={styles.viewLine}><strong>Scholarships:</strong> {(profile.accomplishments?.scholarships || []).join(', ') || 'N/A'}</p>
              </div>
            </div>
            <div className={styles.fullWidth}>
              <p className={styles.viewLabel}>Extra Curricular Activities</p>
              <div className={styles.viewBlock}>
                <p className={styles.viewLine}>{(profile.extraCurricularActivities || []).join(', ') || 'N/A'}</p>
              </div>
            </div>
            <div>
              <p className={styles.viewLabel}>Profile Photo Uploaded</p>
              <p className={styles.viewValue}>{profile.profilePhotoUrl ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className={styles.viewLabel}>Resume Uploaded</p>
              <p className={styles.viewValue}>{profile.resumeUrl ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </section>
        )}

        <div className={styles.actions}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </UserLayout>
  );
};

export default UserProfile;
