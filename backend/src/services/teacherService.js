const { Op } = require('sequelize');
const { User, TeacherProfile, Package, Session } = require('../models');

const toRad = (value) => (value * Math.PI) / 180;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateBadgeLevel = (highestGrade, experience, isPractitioner = false) => {
  if (isPractitioner) return 'practitioner';
  if (!highestGrade) {
    return experience >= 3 ? 'experience_verified' : 'emerging';
  }
  if (highestGrade >= 8 && experience >= 3) return 'elite';
  if (highestGrade >= 7) return 'senior';
  if (highestGrade >= 5) return 'verified';
  if (highestGrade >= 3) return 'emerging';
  return experience >= 3 ? 'experience_verified' : 'emerging';
};

const getTeacherProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [{ model: TeacherProfile, as: 'teacherProfile' }]
  });
  if (!user) {
    const err = new Error('Teacher not found'); err.status = 404; throw err;
  }
  return { user, profile: user.teacherProfile };
};

const updateTeacherProfile = async (userId, data) => {
  const profile = await TeacherProfile.findOne({ where: { userId } });
  if (!profile) {
    const err = new Error('Teacher profile not found'); err.status = 404; throw err;
  }

  const allowedFields = [
    'bio', 'experience', 'instruments', 'highestGrade', 'hourlyRate',
    'serviceRadiusKm', 'syllabus', 'certificateUrl', 'aadhaarUrl', 'introVideoUrl',
    'teachingMode', 'certificateType', 'experienceProofUrl', 'experienceProofType', 'isPractitioner'
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) updates[field] = data[field];
  }

  if (updates.instruments !== undefined) {
    updates.instruments = Array.isArray(updates.instruments)
      ? updates.instruments
      : [updates.instruments];
  }

  // Bug 1: extract instruments from instrumentGrades keys
  if (data.instrumentGrades && typeof data.instrumentGrades === 'object') {
    updates.instruments = Object.keys(data.instrumentGrades);
    const grades = Object.values(data.instrumentGrades).filter(g => typeof g === 'number');
    if (grades.length > 0) {
      // Bug 2: use highest grade across ALL instruments, not just highestGrade field
      const maxGrade = Math.max(...grades);
      updates.highestGrade = maxGrade;
      updates.canTeachUpToGrade = Math.max(0, maxGrade - 2);
      const experience = updates.experience ?? profile.experience;
      const isPractitioner = updates.isPractitioner ?? profile.isPractitioner;
      updates.badgeLevel = calculateBadgeLevel(maxGrade, experience, isPractitioner);
    }
  } else if (updates.highestGrade !== undefined || updates.isPractitioner !== undefined) {
    const highestGrade = updates.highestGrade ?? profile.highestGrade;
    const experience = updates.experience ?? profile.experience;
    const isPractitioner = updates.isPractitioner ?? profile.isPractitioner;
    if (updates.highestGrade !== undefined) {
      updates.canTeachUpToGrade = Math.max(0, updates.highestGrade - 2);
    }
    updates.badgeLevel = calculateBadgeLevel(highestGrade, experience, isPractitioner);
  }

  await profile.update(updates);
  return profile;
};

const setAvailability = async (userId, availability) => {
  const profile = await TeacherProfile.findOne({ where: { userId } });
  if (!profile) {
    const err = new Error('Teacher profile not found'); err.status = 404; throw err;
  }
  await profile.update({ availability });
  return profile;
};

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const WEEKENDS = ['saturday', 'sunday'];

const matchesAvailability = (availability, dayType, timeOfDay) => {
  if (!availability || typeof availability !== 'object') return false;
  const days = dayType === 'weekdays' ? WEEKDAYS
             : dayType === 'weekends' ? WEEKENDS
             : [...WEEKDAYS, ...WEEKENDS];
  return days.some(day => {
    const slot = availability[day];
    if (!slot) return false;
    return timeOfDay ? slot[timeOfDay] === true : Object.values(slot).some(Boolean);
  });
};

const getAvailableTeachers = async (instrument, grade, latitude, longitude, filters = {}) => {
  if (!instrument) {
    const err = new Error('Instrument is required for search'); err.status = 400; throw err;
  }

  const {
    teachingMode, learningGoal, dayType, timeOfDay,
    badgeLevels, minRating, priceMin, priceMax, sort
  } = filters;

  const profileWhere = {
    approvalStatus: 'approved',
    instruments: { [Op.contains]: [instrument] }
  };

  // Grade filter: skip for hobby learners
  if (grade !== undefined && grade !== null && learningGoal !== 'hobby') {
    const studentGrade = parseInt(grade, 10);
    profileWhere.canTeachUpToGrade = { [Op.gte]: studentGrade };
  }

  // Teaching mode filter
  if (teachingMode === 'online') {
    profileWhere.teachingMode = { [Op.in]: ['online', 'both'] };
  } else if (teachingMode === 'offline') {
    profileWhere.teachingMode = { [Op.in]: ['offline', 'both'] };
  } else if (teachingMode === 'both') {
    profileWhere.teachingMode = 'both';
  }

  // Badge level filter
  if (badgeLevels && badgeLevels.length > 0) {
    profileWhere.badgeLevel = { [Op.in]: badgeLevels };
  }

  // Rating filter
  if (minRating !== undefined && minRating !== null) {
    profileWhere.rating = { [Op.gte]: parseFloat(minRating) };
  }

  // Price range filter
  if (priceMin !== undefined || priceMax !== undefined) {
    profileWhere.hourlyRate = {};
    if (priceMin !== undefined) profileWhere.hourlyRate[Op.gte] = parseFloat(priceMin);
    if (priceMax !== undefined) profileWhere.hourlyRate[Op.lte] = parseFloat(priceMax);
  }

  const profiles = await TeacherProfile.findAll({
    where: profileWhere,
    include: [{
      model: User,
      as: 'user',
      attributes: { exclude: ['password'] },
      where: { isActive: true }
    }]
  });

  let teachers = profiles;

  // Availability filter (post-query, operates on JSONB)
  if (dayType || timeOfDay) {
    teachers = teachers.filter(p => matchesAvailability(p.availability, dayType, timeOfDay));
  }

  const hasLocation = latitude !== undefined && longitude !== undefined;

  // Distance filter and annotation
  if (hasLocation) {
    const callerLat = parseFloat(latitude);
    const callerLon = parseFloat(longitude);

    teachers = teachers.filter(profile => {
      const { latitude: tLat, longitude: tLon } = profile.user;
      if (tLat == null || tLon == null) return false;
      return calculateDistance(callerLat, callerLon, tLat, tLon) <= profile.serviceRadiusKm;
    });

    teachers = teachers.map(profile => {
      const plain = profile.toJSON();
      plain.distanceKm = Math.round(
        calculateDistance(callerLat, callerLon, profile.user.latitude, profile.user.longitude) * 10
      ) / 10;
      return plain;
    });
  } else {
    teachers = teachers.map(p => p.toJSON());
  }

  // Sort
  teachers.sort((a, b) => {
    switch (sort) {
      case 'price':    return a.hourlyRate - b.hourlyRate;
      case 'distance': return hasLocation ? (a.distanceKm || 0) - (b.distanceKm || 0) : 0;
      case 'sessions': return b.totalSessions - a.totalSessions;
      case 'rating':
      default:
        if (b.rating !== a.rating) return b.rating - a.rating;
        return a.hourlyRate - b.hourlyRate;
    }
  });

  return teachers;
};

const getPendingTeachers = async () => {
  const profiles = await TeacherProfile.findAll({
    where: { approvalStatus: 'pending' },
    include: [{
      model: User,
      as: 'user',
      attributes: { exclude: ['password'] }
    }],
    order: [['createdAt', 'ASC']]
  });
  return profiles;
};

const approveTeacher = async (teacherId, status, note) => {
  const validStatuses = ['approved', 'rejected', 'suspended'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    err.status = 400; throw err;
  }

  const profile = await TeacherProfile.findOne({ where: { userId: teacherId } });
  if (!profile) {
    const err = new Error('Teacher profile not found'); err.status = 404; throw err;
  }

  await profile.update({ approvalStatus: status, approvalNote: note || null });
  return profile;
};

const getTeacherEarnings = async (userId) => {
  const profile = await TeacherProfile.findOne({ where: { userId } });
  if (!profile) {
    const err = new Error('Teacher profile not found'); err.status = 404; throw err;
  }

  const packages = await Package.findAll({
    where: { teacherId: userId },
    attributes: [
      'id', 'instrument', 'packageType', 'totalAmount', 'platformFee',
      'teacherEarnings', 'completedSessions', 'totalSessions', 'status', 'createdAt'
    ],
    include: [{
      model: User,
      as: 'student',
      attributes: ['id', 'fullName', 'email']
    }],
    order: [['createdAt', 'DESC']]
  });

  // Earnings from fully completed packages
  const completedEarnings = packages
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.teacherEarnings, 0);

  // Pro-rated earnings from in-progress packages based on completed sessions
  const pendingEarnings = packages
    .filter(p => p.status === 'active')
    .reduce((sum, p) => {
      const ratio = p.totalSessions > 0 ? p.completedSessions / p.totalSessions : 0;
      return sum + p.teacherEarnings * ratio;
    }, 0);

  return {
    totalEarnings: profile.totalEarnings,
    completedEarnings: Math.round(completedEarnings * 100) / 100,
    pendingEarnings: Math.round(pendingEarnings * 100) / 100,
    totalSessions: profile.totalSessions,
    rating: profile.rating,
    totalReviews: profile.totalReviews,
    packages
  };
};

const getTeacherSessions = async (userId) => {
  const sessions = await Session.findAll({
    where: { teacherId: userId },
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'fullName', 'email', 'phone']
      },
      {
        model: Package,
        as: 'package',
        attributes: ['id', 'instrument', 'gradeTarget', 'packageType', 'status']
      }
    ],
    order: [['scheduledAt', 'DESC']]
  });
  return sessions;
};

module.exports = {
  calculateDistance,
  getTeacherProfile,
  updateTeacherProfile,
  setAvailability,
  getAvailableTeachers,
  getPendingTeachers,
  approveTeacher,
  getTeacherEarnings,
  getTeacherSessions
};
