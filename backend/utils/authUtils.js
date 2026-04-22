const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('./emailService');

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate OTP
const generateOTP = () => {
  if (process.env.NODE_ENV !== 'production') {
    return '123456';
  }

  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (Mock - Console log)
const sendOTP = (email, otp) => {
  console.log(`\n📧 OTP sent to ${email}: ${otp}\n`);
  // In production: use nodemailer or any email service
};

// Send Reset Email
const sendResetEmail = async (email, resetToken) => {
  return await emailService.sendResetEmail(email, resetToken);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateOTP,
  sendOTP,
  sendResetEmail,
};
