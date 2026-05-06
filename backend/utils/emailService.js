const nodemailer = require('nodemailer');

// Setup reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Handle generic email sending with consistent logging
 */
const sendMail = async (options) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    ...options
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Mail Error for ${options.to}:`, error);
    throw error;
  }
};

/**
 * Send Interview Invitation
 */
const sendInterviewInvitation = async ({ candidateEmail, interviewType, scheduledAt, message }) => {
  const formattedDate = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return sendMail({
    to: candidateEmail,
    subject: `🗓️ Interview Invitation: ${interviewType}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eef2f6; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Interview Invitation</h1>
          <p style="color: #64748b; font-size: 16px;">Exciting news! Your interview has been scheduled.</p>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Interview Type:</td>
              <td style="color: #0f172a; padding: 8px 0; font-size: 14px; font-weight: 600; text-align: right;">${interviewType}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 8px 0; font-size: 14px;">Scheduled At:</td>
              <td style="color: #0f172a; padding: 8px 0; font-size: 14px; font-weight: 600; text-align: right;">${formattedDate}</td>
            </tr>
          </table>
        </div>

        ${message ? `
        <div style="margin-bottom: 25px;">
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">${message}</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px;">
          <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from the JOB PORTAL system.</p>
        </div>
      </div>
    `
  });
};

/**
 * Send Password Reset Email
 */
const sendResetEmail = async (email, resetToken) => {
  const frontendBaseUrl = String(process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}`;

  return sendMail({
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #1a202c; text-align: center;">Password Reset Request</h2>
        <p style="color: #4a5568; font-size: 16px;">Hello,</p>
        <p style="color: #4a5568; font-size: 16px;">You requested a password reset. Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #4a5568; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #edf2f7; padding-top: 10px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendInterviewInvitation,
  sendResetEmail
};
