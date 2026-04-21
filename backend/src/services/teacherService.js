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

const calculateBadgeLevel = (highestGrade, experience) => {
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
    'serviceRadiusKm', 'syllabus', 'certificateUrl', 'aadhaarUrl', 'introVideoUrl'
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
      updates.badgeLevel = calculateBadgeLevel(maxGrade, experience);
    }
  } else if (updates.highestGrade !== undefined) {
    updates.canTeachUpToGrade = Math.max(0, updates.highestGrade - 2);
    const experience = updates.experience ?? profile.experience;
    updates.badgeLevel = calculateBadgeLevel(updates.highestGrade, experience);
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

const getAvailableTeachers = async (instrument, grade, latitude, longitude) => {
  if (!instrument) {
    const err = new Error('Instrument is required for search'); err.status = 400; throw err;
  }

  const profileWhere = {
    approvalStatus: 'approved',
    instruments: { [Op.contains]: [instrument] }
  };

  if (grade !== undefined && grade !== null) {
    const studentGrade = parseInt(grade, 10);
    // canTeachUpToGrade = highestGrade - 2; teacher must be able to teach student's grade
    profileWhere.canTeachUpToGrade = { [Op.gte]: studentGrade };
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

  // Distance filter: only if caller provided location
  if (latitude !== undefined && longitude !== undefined) {
    const callerLat = parseFloat(latitude);
    const callerLon = parseFloat(longitude);

    teachers = teachers.filter(profile => {
      const { latitude: tLat, longitude: tLon } = profile.user;
      if (tLat == null || tLon == null) return false;
      const dist = calculateDistance(callerLat, callerLon, tLat, tLon);
      return dist <= profile.serviceRadiusKm;
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

  teachers.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return a.hourlyRate - b.hourlyRate;
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
