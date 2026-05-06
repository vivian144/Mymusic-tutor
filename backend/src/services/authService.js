const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User, TeacherProfile, StudentProfile } = require('../models');
const {
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins,
  checkOtpRateLimit
} = require('../middleware/rateLimiter');
const redis = require('../config/redis');
const { sendOTP } = require('./smsService');
const { sendVerificationEmail } = require('./emailService');

// ─── FIX 11: JWT secret strength check on startup ─────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('[SECURITY] JWT_SECRET must be at least 32 characters. Refusing to start.');
}
if (JWT_SECRET.length < 64) {
  console.warn('[SECURITY] JWT_SECRET is less than 64 characters. Consider using a longer secret in production.');
}

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion || 0 },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const sanitizeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  isVerified: user.isVerified,
  emailVerified: user.emailVerified,
  phoneVerified: user.phoneVerified,
  city: user.city,
  state: user.state,
  profilePhoto: user.profilePhoto
});

const register = async (userData) => {
  const {
    fullName, email, password, phone, role, city, state, address,
    bio, experience, instruments, highestGrade, hourlyRate, serviceRadiusKm,
    certificateType, experienceProofUrl, experienceProofType, teachingMode,
    age, parentName, parentPhone, instrument, currentGrade, targetGrade,
    hasInstrumentAtHome, notes, learningGoal, songsLearned
  } = userData;

  const existing = await User.findOne({
    where: { email: email.toLowerCase().trim() },
    attributes: ['id']
  });
  if (existing) {
    const err = new Error('Email already registered'); err.status = 409; throw err;
  }

  const existingPhone = await User.findOne({
    where: { phone: phone.trim() },
    attributes: ['id']
  });
  if (existingPhone) {
    const err = new Error('Phone number already registered'); err.status = 409; throw err;
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: phone.trim(),
    role,
    city: city || 'Hyderabad',
    state: state || 'Telangana',
    address: address || null
  });

  if (role === 'teacher') {
    const isExperienceBased = certificateType === 'experience_based';
    await TeacherProfile.create({
      userId: user.id,
      bio: bio || null,
      experience: experience || 0,
      instruments: Array.isArray(instruments) ? instruments : [instruments],
      highestGrade: isExperienceBased ? null : (highestGrade || null),
      canTeachUpToGrade: (!isExperienceBased && highestGrade) ? Math.max(0, highestGrade - 2) : null,
      hourlyRate: Number(hourlyRate),
      serviceRadiusKm: serviceRadiusKm || 15,
      teachingMode: teachingMode || 'offline',
      certificateType: certificateType || null,
      experienceProofUrl: isExperienceBased ? (experienceProofUrl || null) : null,
      experienceProofType: isExperienceBased ? (experienceProofType || null) : null,
      isPractitioner: false
    });
  } else {
    await StudentProfile.create({
      userId: user.id,
      age: age || null,
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      instrument: instrument || null,
      currentGrade: currentGrade || 0,
      targetGrade: learningGoal === 'hobby' ? null : (targetGrade || null),
      hasInstrumentAtHome: hasInstrumentAtHome !== undefined ? hasInstrumentAtHome : true,
      notes: notes || null,
      learningGoal: learningGoal || 'grades',
      songsLearned: Array.isArray(songsLearned) ? songsLearned : []
    });
  }

  // Auto-send phone verification OTP on registration (non-blocking)
  sendPhoneVerificationOTP(user.phone).catch(err =>
    console.error('[Auth] Phone verification OTP failed on register:', err.message)
  );

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
};

const login = async (email, password) => {
  // FIX 1: Check account lockout before attempting credential lookup
  const lockStatus = await checkAccountLockout(email);
  if (lockStatus.locked) {
    const err = new Error(lockStatus.message); err.status = 429; throw err;
  }

  // FIX 5: password excluded — we use comparePassword separately
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    await recordFailedLogin(email);
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account is deactivated. Please contact support.'); err.status = 403; throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await recordFailedLogin(email);
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }

  // Reset lockout counter on successful login
  await Promise.all([
    user.update({ lastLogin: new Date() }),
    resetFailedLogins(email)
  ]);

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
};

const refreshToken = async (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);

  const user = await User.findByPk(decoded.id, {
    attributes: { exclude: ['password'] }
  });
  if (!user) {
    const err = new Error('User not found'); err.status = 401; throw err;
  }
  if (!user.isActive) {
    const err = new Error('Account is deactivated'); err.status = 403; throw err;
  }

  const newToken = generateToken(user);
  return { token: newToken, user: sanitizeUser(user) };
};

// ─── Feature 2: Phone OTP Login ───────────────────────────────────────────────

const sendLoginOTP = async (phone) => {
  const user = await User.findOne({ where: { phone: phone.trim() }, attributes: ['id'] });
  if (!user) {
    const err = new Error('Phone number not registered. Please sign up first.');
    err.status = 404; throw err;
  }

  // Rate limit: 5 per 15 minutes per phone
  await checkOtpRateLimit(phone.trim(), 'login_otp', 5, 15 * 60);

  const otp = String(crypto.randomInt(100000, 999999));
  await redis.set(`login_otp:${phone.trim()}`, otp, 'EX', 5 * 60);

  // OTP goes via SMS — works on all phones, not just WhatsApp
  await sendOTP(phone.trim(), otp);
};

const verifyLoginOTP = async (phone, otp) => {
  const normalized = phone.trim();
  const stored = await redis.get(`login_otp:${normalized}`);

  if (!stored || stored !== String(otp)) {
    const err = new Error('Invalid or expired OTP'); err.status = 400; throw err;
  }

  const user = await User.findOne({ where: { phone: normalized } });
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  if (!user.isActive) {
    const err = new Error('Account is deactivated. Please contact support.'); err.status = 403; throw err;
  }

  // Delete OTP immediately after successful use
  await redis.del(`login_otp:${normalized}`);
  await user.update({ lastLogin: new Date() });

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
};

// ─── Feature 4: Email Verification ────────────────────────────────────────────

const sendEmailVerification = async (userId, email) => {
  const token = crypto.randomBytes(32).toString('hex');

  await User.update({ emailVerificationToken: token }, { where: { id: userId } });

  const apiBase = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
  const verifyUrl = `${apiBase}/api/auth/verify-email/${token}`;

  await sendVerificationEmail(email, verifyUrl);
};

const verifyEmail = async (token) => {
  const user = await User.findOne({ where: { emailVerificationToken: token } });
  if (!user) {
    const err = new Error('Invalid or expired verification link'); err.status = 400; throw err;
  }

  await user.update({ emailVerified: true, emailVerificationToken: null });
  return { emailVerified: true };
};

// ─── Feature 5: Phone Verification ────────────────────────────────────────────

const OTP_TTL = 10 * 60; // 10 minutes

const sendPhoneVerificationOTP = async (phone) => {
  const normalized = phone.trim();

  // Rate limit: 5 per hour per phone
  await checkOtpRateLimit(normalized, 'phone_verify', 5, 3600);

  const otp = String(crypto.randomInt(100000, 999999));
  await redis.set(`phone_verify:${normalized}`, otp, 'EX', OTP_TTL);

  // OTP goes via SMS — works on all phones, not just WhatsApp
  await sendOTP(normalized, otp);
};

const verifyPhoneOTP = async (userId, phone, otp) => {
  const normalized = phone.trim();
  const stored = await redis.get(`phone_verify:${normalized}`);

  if (!stored || stored !== String(otp)) {
    const err = new Error('Invalid or expired OTP'); err.status = 400; throw err;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  if (user.phone !== normalized) {
    const err = new Error('Phone number does not match your account'); err.status = 400; throw err;
  }

  await user.update({ phoneVerified: true });
  // Delete OTP immediately after successful use
  await redis.del(`phone_verify:${normalized}`);

  return { phoneVerified: true };
};

module.exports = {
  register,
  login,
  refreshToken,
  generateToken,
  sanitizeUser,
  sendLoginOTP,
  verifyLoginOTP,
  sendEmailVerification,
  verifyEmail,
  sendPhoneVerificationOTP,
  verifyPhoneOTP
};
