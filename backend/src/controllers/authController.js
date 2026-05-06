const authService = require('../services/authService');
const passwordResetService = require('../services/passwordResetService');
const { generateToken, sanitizeUser } = authService;
const { User, TeacherProfile, StudentProfile } = require('../models');

const register = async (req, res, next) => {
  try {
    const { token, user } = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, user }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);
    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const includeOptions = [];
    if (req.user.role === 'teacher') {
      includeOptions.push({ model: TeacherProfile, as: 'teacherProfile' });
    } else if (req.user.role === 'student') {
      includeOptions.push({ model: StudentProfile, as: 'studentProfile' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: includeOptions
    });

    res.json({
      success: true,
      message: 'Profile retrieved',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

const refresh = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.refreshToken(token);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: result
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ─── Feature 1: Password Reset ────────────────────────────────────────────────

const forgotPassword = async (req, res, next) => {
  try {
    const { phone } = req.body;
    await passwordResetService.sendPasswordResetOTP(phone);
    res.json({
      success: true,
      message: "If this phone number is registered, you'll receive an OTP via WhatsApp"
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const verifyResetOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }
    const valid = await passwordResetService.verifyOTP(phone, otp);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    res.json({ success: true, message: 'OTP verified. You may now reset your password.' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { phone, otp, newPassword } = req.body;
    await passwordResetService.resetPassword(phone, otp, newPassword);
    res.json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// ─── Feature 2: Phone OTP Login ───────────────────────────────────────────────

const sendLoginOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    await authService.sendLoginOTP(phone);
    res.json({ success: true, message: 'OTP sent to your WhatsApp number' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const verifyLoginOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }
    const { token, user } = await authService.verifyLoginOTP(phone, otp);
    res.json({ success: true, message: 'Login successful', data: { token, user } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// ─── Feature 3: Google OAuth callback ────────────────────────────────────────

const googleCallback = async (req, res) => {
  try {
    const { user, isNew, requiresPhone } = req.user;
    const token = generateToken(user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(
      `${clientUrl}/auth/callback?token=${token}&newUser=${isNew}&requiresPhone=${requiresPhone}`
    );
  } catch (err) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/auth/failed`);
  }
};

// ─── Feature 4: Email Verification ───────────────────────────────────────────

const sendVerificationEmail = async (req, res, next) => {
  try {
    await authService.sendEmailVerification(req.user.id, req.user.email);
    res.json({ success: true, message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const verifyEmailToken = async (req, res, next) => {
  try {
    await authService.verifyEmail(req.params.token);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientUrl}/email-verified`);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

// ─── Feature 5: Phone Verification ───────────────────────────────────────────

const sendPhoneVerification = async (req, res, next) => {
  try {
    const phone = req.user.phone;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'No phone number on your account. Please add one first.' });
    }
    await authService.sendPhoneVerificationOTP(phone);
    res.json({ success: true, message: 'OTP sent to your WhatsApp number' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const verifyPhone = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const phone = req.user.phone;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }
    if (!phone) {
      return res.status(400).json({ success: false, message: 'No phone number on your account' });
    }
    const result = await authService.verifyPhoneOTP(req.user.id, phone, otp);
    res.json({ success: true, message: 'Phone number verified successfully', data: result });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  refresh,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  sendLoginOtp,
  verifyLoginOtp,
  googleCallback,
  sendVerificationEmail,
  verifyEmailToken,
  sendPhoneVerification,
  verifyPhone
};
