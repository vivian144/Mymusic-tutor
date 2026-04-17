const jwt = require('jsonwebtoken');
const { User, TeacherProfile, StudentProfile } = require('../models');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
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
    // teacher fields
    bio, experience, instruments, highestGrade, hourlyRate, serviceRadiusKm,
    // student fields
    age, parentName, parentPhone, instrument, currentGrade, targetGrade,
    hasInstrumentAtHome, notes
  } = userData;

  const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    const err = new Error('Email already registered'); err.status = 409; throw err;
  }

  const existingPhone = await User.findOne({ where: { phone: phone.trim() } });
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
    await TeacherProfile.create({
      userId: user.id,
      bio: bio || null,
      experience: experience || 0,
      instruments: Array.isArray(instruments) ? instruments : [instruments],
      highestGrade: highestGrade || null,
      canTeachUpToGrade: highestGrade ? Math.max(0, highestGrade - 2) : null,
      hourlyRate: Number(hourlyRate),
      serviceRadiusKm: serviceRadiusKm || 15
    });
  } else {
    await StudentProfile.create({
      userId: user.id,
      age: age || null,
      parentName: parentName || null,
      parentPhone: parentPhone || null,
      instrument: instrument || null,
      currentGrade: currentGrade || 0,
      targetGrade: targetGrade || null,
      hasInstrumentAtHome: hasInstrumentAtHome !== undefined ? hasInstrumentAtHome : true,
      notes: notes || null
    });
  }

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
};

const login = async (email, password) => {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account is deactivated. Please contact support.'); err.status = 403; throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password'); err.status = 401; throw err;
  }

  await user.update({ lastLogin: new Date() });

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
};

const refreshToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findByPk(decoded.id);
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
