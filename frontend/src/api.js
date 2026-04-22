import axios from 'axios';

const normalizeApiBaseUrl = (value) => {
  const fallback = 'http://localhost:5000/api';
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return fallback;
  }

  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  getCurrentUser: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

export const companyAPI = {
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  getDetails: (id) => api.get(`/companies/${id}/details`),
  create: (data) => api.post('/companies', data),
  updateStatus: (id, status) => api.put(`/companies/${id}/status`, { status }),
  approve: (id) => api.put(`/companies/${id}/approve`),
  reject: (id) => api.put(`/companies/${id}/reject`),
  block: (id) => api.put(`/companies/${id}/block`)
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  block: (id) => api.put(`/users/${id}/block`),
  unblock: (id) => api.put(`/users/${id}/unblock`),
  delete: (id) => api.delete(`/users/${id}`)
};

export const jobAPI = {
  getAll: () => api.get('/jobs'),
  getById: (id) => api.get(`/jobs/${id}`),
  updateStatus: (id, status) => api.put(`/jobs/${id}/status`, { status }),
  delete: (id) => api.delete(`/jobs/${id}`)
};

export const applicationAPI = {
  getAll: () => api.get('/applications'),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
  delete: (id) => api.delete(`/applications/${id}`)
};

export const subscriptionAPI = {
  getAll: () => api.get('/subscriptions'),
  getById: (id) => api.get(`/subscriptions/${id}`),
  updateStatus: (id, status) => api.put(`/subscriptions/${id}/status`, { status })
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: () => api.get('/dashboard/charts')
};

export const logsAPI = {
  getAll: (filters = {}) => api.get('/logs', { params: filters })
};

export const contactAPI = {
  sendMessage: (data) => api.post('/contact', data)
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (payload) => api.put('/settings', payload),
};

export const managerAPI = {
  getProfile: () => api.get('/manager/profile'),
  updateProfile: (data) => api.put('/manager/profile', data),

  getUsers: () => api.get('/manager/users'),
  updateUserBlockStatus: (id, isBlocked) => api.put(`/manager/users/${id}/block-status`, { isBlocked }),
  deleteUser: (id) => api.delete(`/manager/users/${id}`),

  getJobs: () => api.get('/manager/jobs'),
  createJob: (data) => api.post('/manager/jobs', data),
  updateJobStatus: (id, status) => api.put(`/manager/jobs/${id}/status`, { status }),

  getApplications: () => api.get('/manager/applications'),
  updateApplicationStatus: (id, status) => api.put(`/manager/applications/${id}/status`, { status }),
  shortlistAndSendTestLink: (id, data) => api.post(`/manager/applications/${id}/shortlist-test`, data),
  atsShortlistApplications: (jobId, data) => api.post(`/manager/jobs/${jobId}/ats-shortlist`, data),

  getTestLinks: () => api.get('/manager/test-links'),
  createTestLink: (data) => api.post('/manager/test-links', data),
  updateTestLink: (id, data) => api.put(`/manager/test-links/${id}`, data),
  callCandidateForInterview: (id, data) => api.post(`/manager/test-links/${id}/call-interview`, data),
  getTestLinkUpdates: () => api.get('/manager/test-link-updates'),

  getInterviews: () => api.get('/manager/interviews'),
  createInterview: (data) => api.post('/manager/interviews', data),
  updateInterviewStatus: (id, status) => api.put(`/manager/interviews/${id}/status`, { status }),
  getInterviewUpdates: () => api.get('/manager/interview-updates'),

  getOffboardingLetters: () => api.get('/manager/offboarding-letters'),
  sendOffboardingLetter: (data) => api.post('/manager/offboarding-letters', data),

  getStats: () => api.get('/manager/stats'),
  getRecentUpdates: () => api.get('/manager/recent-updates')
};

export const userPortalAPI = {
  getHome: () => api.get('/user-portal/home'),
  getProfile: () => api.get('/user-portal/profile'),
  updateProfile: (data) => api.put('/user-portal/profile', data),
  getJobs: () => api.get('/user-portal/jobs'),
  getJobApplicationForm: (jobId) => api.get(`/user-portal/jobs/${jobId}/application-form`),
  applyToJob: (jobId, data) => api.post(`/user-portal/jobs/${jobId}/apply`, data),
  getApplications: () => api.get('/user-portal/applications'),
  getNotifications: () => api.get('/user-portal/notifications'),
  getInterviews: () => api.get('/user-portal/interviews'),
  getAssessments: () => api.get('/user-portal/assessments'),
  submitAssessmentQuiz: (applicationId, data) => api.post(`/user-portal/assessments/${applicationId}/submit`, data)
};

export default api;
