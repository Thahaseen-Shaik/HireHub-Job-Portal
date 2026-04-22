const pool = require('../config/database');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const ManagerTestLink = require('../models/ManagerTestLink');
const ManagerWorkflow = require('../models/ManagerWorkflow');
const ActivityLog = require('../models/ActivityLog');
const emailService = require('../utils/emailService');
const { getPredefinedFormFields } = require('../utils/applicationFlowUtils');

const ALLOWED_APPLY_MODES = ['direct_profile', 'predefined_form', 'google_form', 'custom_form'];

const normalizeCustomFormFields = (fields) => {
  if (!Array.isArray(fields)) {
    return [];
  }

  return fields
    .map((field, index) => {
      if (!field || typeof field !== 'object') {
        return null;
      }

      const label = String(field.label || '').trim();
      const keySource = String(field.key || label || `field_${index + 1}`).trim().toLowerCase();
      const key = keySource.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
      const type = ['text', 'email', 'number', 'textarea', 'url', 'date'].includes(field.type) ? field.type : 'text';

      if (!label || !key) {
        return null;
      }

      return {
        key,
        label,
        type,
        required: Boolean(field.required)
      };
    })
    .filter(Boolean);
};

const toKeywordSet = (...parts) => {
  const text = parts
    .flat(Infinity)
    .filter(Boolean)
    .map((value) => (typeof value === 'string' ? value : JSON.stringify(value)))
    .join(' ')
    .toLowerCase();

  return new Set(
    text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2)
  );
};

const calculateAtsScore = ({ job, application, profile }) => {
  const jobKeywords = toKeywordSet(
    job.title,
    job.description,
    job.location,
    job.manager_instructions,
    job.custom_form_fields,
    application.submitted_details?.labels
  );

  const candidateKeywords = toKeywordSet(
    profile.displayName,
    profile.headline,
    profile.basicDetails?.professionalSummary,
    profile.basicDetails?.currentLocation,
    profile.basicDetails?.preferredLocation,
    profile.skills,
    profile.subsets,
    profile.languages,
    profile.projects,
    profile.workExperience,
    profile.internships,
    application.submitted_details,
    application.user_resume_url
  );

  const overlap = [...jobKeywords].filter((keyword) => candidateKeywords.has(keyword));
  const overlapRatio = jobKeywords.size ? overlap.length / jobKeywords.size : 0;

  let score = Math.round(overlapRatio * 70);
  if (profile.resumeUrl || application.user_resume_url) {
    score += 15;
  }
  if ((profile.skills || []).length) {
    score += 10;
  }
  if ((profile.projects || []).length || (profile.workExperience || []).length || (profile.internships || []).length) {
    score += 5;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    matchedKeywords: overlap.slice(0, 8),
    hasResume: Boolean(profile.resumeUrl || application.user_resume_url)
  };
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = await ManagerWorkflow.getManagerProfile(user);
    return res.status(200).json({
      message: 'Manager profile fetched successfully',
      data: profile
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching manager profile', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, department, bio, photo_url } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name && name.trim()) {
      await pool.query('UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [name.trim(), req.user.id]);
    }

    await ManagerWorkflow.updateManagerProfile(req.user.id, {
      phone,
      department,
      bio,
      photo_url
    });

    const updatedUser = await User.findById(req.user.id);
    const updatedProfile = await ManagerWorkflow.getManagerProfile(updatedUser);
    await ActivityLog.record('Manager Updated Profile', 'user', req.user.id);

    return res.status(200).json({
      message: 'Manager profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating manager profile', error: error.message });
  }
};

const getManagerUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    return res.status(200).json({
      message: 'Users fetched successfully',
      data: users
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

const updateUserBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot block or unblock your own account' });
    }

    const updatedUser = await User.updateBlockStatus(id, Boolean(isBlocked));
    await ActivityLog.record(
      Boolean(isBlocked) ? 'Manager Blocked User' : 'Manager Unblocked User',
      'user',
      id
    );

    const { password, ...safeUser } = updatedUser;
    return res.status(200).json({
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: safeUser
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating user block status', error: error.message });
  }
};

const deleteManagerUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await User.delete(id);
    await ActivityLog.record('Manager Deleted User', 'user', id);

    return res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

const getManagerJobs = async (req, res) => {
  try {
    const jobs = await Job.getAll();
    return res.status(200).json({
      message: 'Jobs fetched successfully',
      data: jobs
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching jobs', error: error.message });
  }
};

const createManagerJob = async (req, res) => {
  try {
    const {
      companyId,
      title,
      description,
      location,
      salaryMin,
      salaryMax,
      applyMode = 'direct_profile',
      predefinedFormKey = 'basic_screening',
      customFormFields = [],
      googleFormUrl = '',
      managerInstructions = ''
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    if (!ALLOWED_APPLY_MODES.includes(applyMode)) {
      return res.status(400).json({ message: 'Invalid apply mode selected' });
    }

    let selectedCompanyId = companyId ? Number(companyId) : null;

    if (selectedCompanyId && Number.isNaN(selectedCompanyId)) {
      return res.status(400).json({ message: 'Invalid company id' });
    }

    if (selectedCompanyId) {
      const selectedCompany = await Company.getById(selectedCompanyId);
      if (!selectedCompany) {
        return res.status(404).json({ message: 'Company not found for the provided company id' });
      }
    }

    if (!selectedCompanyId) {
      const companies = await Company.getAll();
      selectedCompanyId = companies[0]?.id || null;
    }

    if (!selectedCompanyId) {
      return res.status(400).json({ message: 'No company available. Create company first.' });
    }

    if (applyMode === 'google_form' && !String(googleFormUrl || '').trim()) {
      return res.status(400).json({ message: 'Google form link is required for google_form mode' });
    }

    const normalizedCustomFields = normalizeCustomFormFields(customFormFields);
    if (applyMode === 'custom_form' && !normalizedCustomFields.length) {
      return res.status(400).json({ message: 'At least one custom field is required for custom_form mode' });
    }

    const finalCustomFields = applyMode === 'predefined_form'
      ? getPredefinedFormFields(predefinedFormKey)
      : (applyMode === 'custom_form' ? normalizedCustomFields : []);

    const job = await Job.create(
      selectedCompanyId,
      title,
      description || '',
      salaryMin || null,
      salaryMax || null,
      location || 'Remote',
      {
        applyMode,
        predefinedFormKey: applyMode === 'predefined_form' ? predefinedFormKey : null,
        customFormFields: finalCustomFields,
        googleFormUrl: applyMode === 'google_form' ? String(googleFormUrl).trim() : null,
        managerInstructions: managerInstructions ? String(managerInstructions).trim() : null,
        createdBy: req.user.id
      }
    );

    await ActivityLog.record('Manager Created Job', 'job', job.id, {
      managerId: req.user.id,
      managerEmail: req.user.email,
      title: job.title,
      companyId: job.company_id,
      companyName: job.company_name || null,
      location: job.location,
      applyMode: job.apply_mode,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      managerInstructions: job.manager_instructions || null
    });

    return res.status(201).json({
      message: 'Job created successfully',
      data: job
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating job', error: error.message });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updatedJob = await Job.updateStatus(id, status);
    if (!updatedJob) {
      return res.status(404).json({ message: 'Job not found' });
    }

    await ActivityLog.record('Manager Updated Job Status', 'job', id);

    return res.status(200).json({
      message: 'Job status updated successfully',
      data: updatedJob
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating job status', error: error.message });
  }
};

const getManagerApplications = async (req, res) => {
  try {
    const applications = await Application.getAll();
    return res.status(200).json({
      message: 'Applications fetched successfully',
      data: applications
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
};

const updateManagerApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['applied', 'selected', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const current = await Application.getById(id);
    if (!current) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const updatedApplication = await Application.updateStatus(id, status);
    await ActivityLog.record('Manager Updated Application Status', 'application', id);

    return res.status(200).json({
      message: 'Application status updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating application status', error: error.message });
  }
};

const shortlistAndSendTestLink = async (req, res) => {
  try {
    const applicationId = Number(req.params.id);
    const { linkUrl, notes, linkStatus = 'sent', passPercentage = 75, quizQuestionCount = 10 } = req.body;

    if (Number.isNaN(applicationId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    if (!linkUrl || !String(linkUrl).trim()) {
      return res.status(400).json({ message: 'linkUrl is required' });
    }

    if (!['pending', 'sent', 'completed', 'expired'].includes(linkStatus)) {
      return res.status(400).json({ message: 'Invalid link status' });
    }

    const normalizedPassPercentage = Number(passPercentage) || 75;
    if (normalizedPassPercentage <= 0 || normalizedPassPercentage > 100) {
      return res.status(400).json({ message: 'Pass percentage should be between 1 and 100' });
    }

    const normalizedQuizQuestionCount = Number(quizQuestionCount) || 10;
    if (normalizedQuizQuestionCount < 1) {
      return res.status(400).json({ message: 'Quiz question count should be at least 1' });
    }

    const application = await Application.getById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    let updatedApplication = application;
    if (application.status !== 'selected') {
      updatedApplication = await Application.updateStatus(applicationId, 'selected');
      await ActivityLog.record('Manager Shortlisted Candidate', 'application', applicationId);
    }

    const payload = {
      applicationId: applicationId,
      jobId: application.job_id,
      candidateEmail: application.user_email,
      linkUrl: String(linkUrl).trim(),
      notes: notes || `Assessment link shared for ${application.job_title || 'job application'}`,
      linkStatus,
      passPercentage: normalizedPassPercentage,
      quizQuestionCount: normalizedQuizQuestionCount
    };

    const existingLink = await ManagerTestLink.getLatestByApplicationId(applicationId);
    let testLink;

    if (existingLink) {
      testLink = await ManagerTestLink.update(existingLink.id, payload, req.user.id);
      await ManagerTestLink.createUpdateLog(existingLink.id, existingLink, testLink, req.user.id);
    } else {
      testLink = await ManagerTestLink.create(payload, req.user.id);
    }

    await ActivityLog.record('Manager Sent Test Link', 'manager_test_link', testLink.id);

    return res.status(200).json({
      message: 'Candidate shortlisted and test link sent successfully',
      data: {
        application: updatedApplication,
        testLink
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error shortlisting candidate and sending test link', error: error.message });
  }
};

const atsShortlistApplications = async (req, res) => {
  try {
    const jobId = Number(req.params.id);
    const shortlistCount = Math.max(1, Number(req.body.shortlistCount) || 2);

    if (Number.isNaN(jobId)) {
      return res.status(400).json({ message: 'Invalid job id' });
    }

    const jobs = await Job.getAll();
    const job = jobs.find((item) => Number(item.id) === jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const applications = (await Application.getAll()).filter((item) => Number(item.job_id) === jobId);
    if (!applications.length) {
      return res.status(404).json({ message: 'No applications found for this job' });
    }

    const rankedApplications = [];
    for (const application of applications) {
      const user = await User.findById(application.user_id);
      if (!user) {
        rankedApplications.push({
          ...application,
          atsScore: 0,
          atsMatchedKeywords: [],
          atsReason: 'User profile not available'
        });
        continue;
      }

      const profile = await UserProfile.getByUserId(user);
      const ats = calculateAtsScore({ job, application, profile });
      rankedApplications.push({
        ...application,
        atsScore: ats.score,
        atsMatchedKeywords: ats.matchedKeywords,
        atsReason: ats.matchedKeywords.length
          ? `Matched: ${ats.matchedKeywords.join(', ')}`
          : (ats.hasResume ? 'Resume available, limited keyword match' : 'Limited match found')
      });
    }

    rankedApplications.sort((left, right) => right.atsScore - left.atsScore || new Date(left.applied_at) - new Date(right.applied_at));

    const shortlisted = [];
    for (const application of rankedApplications.slice(0, shortlistCount)) {
      const updatedApplication = application.status === 'selected'
        ? application
        : await Application.updateStatus(application.id, 'selected');

      shortlisted.push({
        ...application,
        status: updatedApplication.status
      });

      await ActivityLog.record('Manager ATS Shortlisted Candidate', 'application', application.id);
    }

    return res.status(200).json({
      message: `ATS shortlisted top ${shortlisted.length} application(s) successfully`,
      data: {
        jobId,
        shortlistCount: shortlisted.length,
        shortlisted,
        rankedApplications
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error running ATS shortlist', error: error.message });
  }
};

const getTestLinks = async (req, res) => {
  try {
    const testLinks = await ManagerTestLink.getAll();
    return res.status(200).json({
      message: 'Test links fetched successfully',
      data: testLinks
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching test links', error: error.message });
  }
};

const createTestLink = async (req, res) => {
  try {
    const { linkUrl, linkStatus, passPercentage = 75, quizQuestionCount = 10 } = req.body;

    if (!linkUrl) {
      return res.status(400).json({ message: 'linkUrl is required' });
    }

    if (linkStatus && !['pending', 'sent', 'completed', 'expired'].includes(linkStatus)) {
      return res.status(400).json({ message: 'Invalid link status' });
    }

    const normalizedPassPercentage = Number(passPercentage) || 75;
    if (normalizedPassPercentage <= 0 || normalizedPassPercentage > 100) {
      return res.status(400).json({ message: 'Pass percentage should be between 1 and 100' });
    }

    const normalizedQuizQuestionCount = Number(quizQuestionCount) || 10;
    if (normalizedQuizQuestionCount < 1) {
      return res.status(400).json({ message: 'Quiz question count should be at least 1' });
    }

    const testLink = await ManagerTestLink.create(
      {
        ...req.body,
        passPercentage: normalizedPassPercentage,
        quizQuestionCount: normalizedQuizQuestionCount
      },
      req.user.id
    );
    await ActivityLog.record('Manager Created Test Link', 'manager_test_link', testLink.id);

    return res.status(201).json({
      message: 'Test link created successfully',
      data: testLink
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating test link', error: error.message });
  }
};

const updateTestLink = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await ManagerTestLink.getById(id);

    if (!current) {
      return res.status(404).json({ message: 'Test link not found' });
    }

    if (req.body.linkStatus && !['pending', 'sent', 'completed', 'expired'].includes(req.body.linkStatus)) {
      return res.status(400).json({ message: 'Invalid link status' });
    }

    if (req.body.passPercentage !== undefined) {
      const normalizedPassPercentage = Number(req.body.passPercentage);
      if (!normalizedPassPercentage || normalizedPassPercentage <= 0 || normalizedPassPercentage > 100) {
        return res.status(400).json({ message: 'Pass percentage should be between 1 and 100' });
      }
    }

    if (req.body.quizQuestionCount !== undefined) {
      const normalizedQuizQuestionCount = Number(req.body.quizQuestionCount);
      if (!normalizedQuizQuestionCount || normalizedQuizQuestionCount < 1) {
        return res.status(400).json({ message: 'Quiz question count should be at least 1' });
      }
    }

    const updated = await ManagerTestLink.update(id, req.body, req.user.id);
    await ManagerTestLink.createUpdateLog(id, current, updated, req.user.id);
    await ActivityLog.record('Manager Updated Test Link', 'manager_test_link', id);

    return res.status(200).json({
      message: 'Test link updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating test link', error: error.message });
  }
};

const callCandidateForInterviewFromTest = async (req, res) => {
  try {
    const testLinkId = Number(req.params.id);
    if (Number.isNaN(testLinkId)) {
      return res.status(400).json({ message: 'Invalid test link id' });
    }

    const testLink = await ManagerTestLink.getById(testLinkId);
    if (!testLink) {
      return res.status(404).json({ message: 'Test link not found' });
    }

    if (!testLink.is_passed) {
      return res.status(400).json({ message: 'Candidate has not passed the test yet' });
    }

    if (!testLink.candidate_email) {
      return res.status(400).json({ message: 'Candidate email missing for this test link' });
    }

    const scheduledAt = req.body.scheduledAt
      ? new Date(req.body.scheduledAt)
      : new Date(Date.now() + (24 * 60 * 60 * 1000));

    if (Number.isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ message: 'Invalid interview schedule time' });
    }

    const interviewPayload = {
      jobId: testLink.job_id || null,
      candidateEmail: testLink.candidate_email,
      interviewType: req.body.interviewType || 'Technical',
      interviewerName: req.body.interviewerName || '',
      scheduledAt: scheduledAt.toISOString(),
      mode: req.body.mode || 'Online',
      meetingLink: req.body.meetingLink || '',
      notes: req.body.notes || 'Interview call sent after test qualification'
    };

    const interview = await ManagerWorkflow.createInterview(interviewPayload, req.user.id);

    await ManagerWorkflow.createInterviewUpdate({
      interviewId: interview.id,
      updatedBy: req.user.id,
      candidateEmail: interview.candidate_email,
      previousStatus: null,
      newStatus: 'scheduled',
      message: `Interview call sent for ${interview.candidate_email}`
    });

    // Send Email Invitation
    await emailService.sendInterviewInvitation({
      candidateEmail: interview.candidate_email,
      interviewType: interview.interview_type,
      scheduledAt: interview.scheduled_at,
      message: req.body.notes || 'Interview call sent after test qualification'
    });

    await ManagerTestLink.update(
      testLinkId,
      {
        interviewCalled: true,
        interviewCalledAt: new Date().toISOString(),
        notes: testLink.notes
          ? `${testLink.notes} | Interview call sent`
          : 'Interview call sent'
      },
      req.user.id
    );

    if (testLink.application_id) {
      await Application.markInterviewCalled(testLink.application_id);
    }

    await ActivityLog.record('Manager Called Candidate For Interview', 'interview', interview.id);

    return res.status(201).json({
      message: 'Interview call sent successfully',
      data: interview
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error sending interview call', error: error.message });
  }
};

const getTestLinkUpdates = async (req, res) => {
  try {
    const updates = await ManagerTestLink.getUpdates();
    return res.status(200).json({
      message: 'Test link updates fetched successfully',
      data: updates
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching test link updates', error: error.message });
  }
};

const createInterview = async (req, res) => {
  try {
    const { candidateEmail, interviewType, scheduledAt, jobId } = req.body;

    if (!candidateEmail || !interviewType || !scheduledAt) {
      return res.status(400).json({ message: 'candidateEmail, interviewType and scheduledAt are required' });
    }

    if (jobId !== undefined && jobId !== null && String(jobId).trim() !== '') {
      const normalizedJobId = Number(jobId);
      if (Number.isNaN(normalizedJobId)) {
        return res.status(400).json({ message: 'Invalid job id' });
      }

      const job = await Job.getById(normalizedJobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found for the provided job id' });
      }

      req.body.jobId = normalizedJobId;
    } else {
      req.body.jobId = null;
    }

    const interview = await ManagerWorkflow.createInterview(req.body, req.user.id);

    await ManagerWorkflow.createInterviewUpdate({
      interviewId: interview.id,
      updatedBy: req.user.id,
      candidateEmail: interview.candidate_email,
      previousStatus: null,
      newStatus: 'scheduled',
      message: `Interview scheduled for ${interview.candidate_email}`
    });

    // Send Email Invitation
    await emailService.sendInterviewInvitation({
      candidateEmail: interview.candidate_email,
      interviewType: interview.interview_type,
      scheduledAt: interview.scheduled_at,
      message: req.body.notes || ''
    });

    await ActivityLog.record('Manager Scheduled Interview', 'interview', interview.id);

    return res.status(201).json({
      message: 'Interview scheduled successfully',
      data: interview
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating interview', error: error.message });
  }
};

const getInterviews = async (req, res) => {
  try {
    const interviews = await ManagerWorkflow.getInterviews();
    return res.status(200).json({
      message: 'Interviews fetched successfully',
      data: interviews
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching interviews', error: error.message });
  }
};

const updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'completed', 'rescheduled', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid interview status' });
    }

    const current = await ManagerWorkflow.getInterviewById(id);
    if (!current) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const updated = await ManagerWorkflow.updateInterviewStatus(id, status, req.user.id);

    await ManagerWorkflow.createInterviewUpdate({
      interviewId: updated.id,
      updatedBy: req.user.id,
      candidateEmail: updated.candidate_email,
      previousStatus: current.status,
      newStatus: status,
      message: `Status changed from ${current.status} to ${status}`
    });

    await ActivityLog.record('Manager Updated Interview Status', 'interview', id);

    return res.status(200).json({
      message: 'Interview status updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating interview status', error: error.message });
  }
};

const getInterviewUpdates = async (req, res) => {
  try {
    const updates = await ManagerWorkflow.getInterviewUpdates();
    return res.status(200).json({
      message: 'Interview updates fetched successfully',
      data: updates
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching interview updates', error: error.message });
  }
};

const sendOffboardingLetter = async (req, res) => {
  try {
    const { candidateEmail, jobId } = req.body;

    if (!candidateEmail) {
      return res.status(400).json({ message: 'candidateEmail is required' });
    }

    if (jobId !== undefined && jobId !== null && String(jobId).trim() !== '') {
      const normalizedJobId = Number(jobId);
      if (Number.isNaN(normalizedJobId)) {
        return res.status(400).json({ message: 'Invalid job id' });
      }

      const job = await Job.getById(normalizedJobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found for the provided job id' });
      }

      req.body.jobId = normalizedJobId;
    } else {
      req.body.jobId = null;
    }

    const letter = await ManagerWorkflow.createOffboardingLetter(req.body, req.user.id);
    await ActivityLog.record('Manager Sent Offboarding Letter', 'offboarding_letter', letter.id);

    return res.status(201).json({
      message: 'Offboarding letter sent successfully',
      data: letter
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error sending offboarding letter', error: error.message });
  }
};

const getOffboardingLetters = async (req, res) => {
  try {
    const letters = await ManagerWorkflow.getOffboardingLetters();
    return res.status(200).json({
      message: 'Offboarding letters fetched successfully',
      data: letters
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching offboarding letters', error: error.message });
  }
};

const getManagerStats = async (req, res) => {
  try {
    const applications = await Application.getAll();
    const jobs = await Job.getAll();
    const testLinks = await ManagerTestLink.getAll();
    const interviews = await ManagerWorkflow.getInterviews();
    const offboardingLetters = await ManagerWorkflow.getOffboardingLetters();

    const completedTests = testLinks.filter((item) => item.is_passed || item.link_status === 'completed');
    const completedInterviews = interviews.filter((item) => item.status === 'completed');

    const testCandidates = new Set(
      completedTests
        .map((item) => (item.candidate_email || '').toLowerCase())
        .filter(Boolean)
    );

    const interviewCandidates = new Set(
      completedInterviews
        .map((item) => (item.candidate_email || '').toLowerCase())
        .filter(Boolean)
    );

    let clearedBoth = 0;
    testCandidates.forEach((email) => {
      if (interviewCandidates.has(email)) {
        clearedBoth += 1;
      }
    });

    return res.status(200).json({
      message: 'Manager stats fetched successfully',
      data: {
        totalApplications: applications.length,
        totalOpenings: jobs.filter((item) => item.status === 'open').length,
        clearedTests: completedTests.length,
        clearedInterviews: completedInterviews.length,
        clearedBoth,
        offboardingLettersSent: offboardingLetters.filter((item) => item.status === 'sent').length
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching manager stats', error: error.message });
  }
};

const getRecentUpdates = async (req, res) => {
  try {
    const testUpdates = await ManagerTestLink.getUpdates();
    const interviewUpdates = await ManagerWorkflow.getInterviewUpdates();
    const offboardingLetters = await ManagerWorkflow.getOffboardingLetters();

    const testItems = testUpdates.map((item) => ({
      id: `test-${item.id}`,
      type: 'Test',
      candidate_email: item.candidate_email || 'candidate@hirehub.com',
      message: item.new_status === 'completed'
        ? 'Candidate completed test update'
        : `Candidate test update changed to ${item.new_status || 'N/A'}`,
      updated_at: item.updated_at
    }));

    const interviewItems = interviewUpdates.map((item) => ({
      id: `interview-${item.id}`,
      type: 'Interview',
      candidate_email: item.candidate_email || 'candidate@hirehub.com',
      message: item.message || `Interview status changed to ${item.new_status}`,
      updated_at: item.updated_at
    }));

    const offboardingItems = offboardingLetters.map((item) => ({
      id: `offboarding-${item.id}`,
      type: 'Offboarding',
      candidate_email: item.candidate_email,
      message: 'Offboarding letter sent',
      updated_at: item.sent_at
    }));

    const data = [...testItems, ...interviewItems, ...offboardingItems]
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 20);

    return res.status(200).json({
      message: 'Recent updates fetched successfully',
      data
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching recent updates', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getManagerUsers,
  updateUserBlockStatus,
  getManagerJobs,
  createManagerJob,
  updateJobStatus,
  getManagerApplications,
  updateManagerApplicationStatus,
  shortlistAndSendTestLink,
  atsShortlistApplications,
  getTestLinks,
  createTestLink,
  updateTestLink,
  callCandidateForInterviewFromTest,
  getTestLinkUpdates,
  getInterviews,
  createInterview,
  updateInterviewStatus,
  getInterviewUpdates,
  getOffboardingLetters,
  sendOffboardingLetter,
  getManagerStats,
  getRecentUpdates,
  deleteManagerUser
};
