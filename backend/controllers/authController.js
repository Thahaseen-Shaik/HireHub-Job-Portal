const User = require('../models/User');
const OTPVerification = require('../models/OTPVerification');
const { hashPassword, comparePassword, generateToken, generateOTP, sendOTP, sendResetEmail } = require('../utils/authUtils');
const crypto = require('crypto');

const ALLOWED_ROLES = ['admin', 'superadmin', 'manager', 'company_manager', 'user'];

// Register
const register = async (req, res) => {
  try {
    const { name, password, role = 'user' } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();
    const normalizedRole = ALLOWED_ROLES.includes(role) ? role : 'user';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create(name, email, hashedPassword, normalizedRole);

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.is_blocked) {
      return res.status(403).json({ message: 'User is blocked' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const otpRecord = await OTPVerification.findByUserIdAndOTP(userId, otp);
    if (!otpRecord) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = generateToken(user);
    await OTPVerification.markAsVerified(otpRecord.id);

    return res.status(200).json({
      message: 'OTP verified successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isBlocked: user.is_blocked }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // For security reasons, don't confirm if user exists
      return res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await User.updateResetToken(email, resetToken, resetExpires);
    await sendResetEmail(user.email, resetToken);

    return res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error in forgot password', error: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    const hashedPassword = await hashPassword(password);
    await User.updatePassword(user.id, hashedPassword);

    return res.status(200).json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error in reset password', error: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyOTP,
  getCurrentUser,
  forgotPassword,
  resetPassword
};
