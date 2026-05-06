const jwt = require('jsonwebtoken');
const { User, TeacherProfile, StudentProfile } = require('../models');
const {
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins
} = require('../middleware/rateLimiter');

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
    { id: user.id, email: user.email, role: user.role },
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

module.exports = { register, login, refreshToken, generateToken, sanitizeUser };
