const { User, StudentProfile, Package, Session, TeacherProfile } = require('../models');

const getGradeTier = (grade) => {
  if (grade <= 0) return 'basics_initial';
  if (grade <= 2) return 'grade_1_2';
  if (grade <= 4) return 'grade_3_4';
  if (grade <= 6) return 'grade_5_6';
  return 'grade_7_8';
};

const FIRST_CLASS_PRICES = {
  basics_initial: 583,
  grade_1_2: 708,
  grade_3_4: 875,
  grade_5_6: 1042,
  grade_7_8: 1208
};

const PACKAGE_CONFIG = {
  '1_month': {
    sessions: 8,
    reschedules: 1,
    prices: { basics_initial: 5000, grade_1_2: 6000, grade_3_4: 7500, grade_5_6: 9000, grade_7_8: 10500 }
  },
  '3_months': {
    sessions: 24,
    reschedules: 3,
    prices: { basics_initial: 14000, grade_1_2: 17000, grade_3_4: 21000, grade_5_6: 25000, grade_7_8: 29000 }
  },
  '6_months': {
    sessions: 48,
    reschedules: 5,
    prices: { basics_initial: 26600, grade_1_2: 32300, grade_3_4: 39900, grade_5_6: 47500, grade_7_8: 55100 }
  },
  '12_months': {
    sessions: 96,
    reschedules: 8,
    prices: { basics_initial: 50400, grade_1_2: 61200, grade_3_4: 75600, grade_5_6: 90000, grade_7_8: 104400 }
  }
};

const getStudentProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] },
    include: [{ model: StudentProfile, as: 'studentProfile' }]
  });
  if (!user) {
    const err = new Error('Student not found'); err.status = 404; throw err;
  }
  return { user, profile: user.studentProfile };
};

const updateStudentProfile = async (userId, data) => {
  const profile = await StudentProfile.findOne({ where: { userId } });
  if (!profile) {
    const err = new Error('Student profile not found'); err.status = 404; throw err;
  }

  const allowedFields = [
    'age', 'parentName', 'parentPhone', 'instrument',
    'currentGrade', 'targetGrade', 'syllabus', 'hasInstrumentAtHome', 'notes'
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) updates[field] = data[field];
  }

  await profile.update(updates);
  return profile;
};

const getStudentProgress = async (userId) => {
  const profile = await StudentProfile.findOne({ where: { userId } });
  if (!profile) {
    const err = new Error('Student profile not found'); err.status = 404; throw err;
  }

  const [activePackages, totalCompletedSessions, upcomingSessions] = await Promise.all([
    Package.findAll({
      where: { studentId: userId, status: 'active' },
      attributes: ['id', 'instrument', 'gradeTarget', 'packageType', 'totalSessions', 'completedSessions', 'reschedulesAllowed', 'reschedulesUsed']
    }),
    Session.count({ where: { studentId: userId, status: 'completed' } }),
    Session.count({ where: { studentId: userId, status: 'scheduled' } })
  ]);

  const grade = profile.currentGrade;
  const tier = getGradeTier(grade);

  return {
    currentGrade: grade,
    targetGrade: profile.targetGrade,
    instrument: profile.instrument,
    syllabus: profile.syllabus,
    hasUsedFirstClass: profile.hasUsedFirstClass,
    firstClassBookedAt: profile.firstClassBookedAt,
    totalCompletedSessions,
    upcomingSessions,
    activePackages,
    gradeTier: tier,
    firstClassPrice: FIRST_CLASS_PRICES[tier]
  };
};

const getStudentSessions = async (userId) => {
  const sessions = await Session.findAll({
    where: { studentId: userId },
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'fullName', 'email', 'phone']
      },
      {
        model: Package,
        as: 'package',
        required: false,
        attributes: ['id', 'instrument', 'gradeTarget', 'packageType', 'status']
      }
    ],
    order: [['scheduledAt', 'DESC']]
  });
  return sessions;
};

const getStudentPackages = async (userId) => {
  const [packages, profile] = await Promise.all([
    Package.findAll({
      where: { studentId: userId },
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'fullName', 'email', 'phone']
      }],
      order: [['createdAt', 'DESC']]
    }),
    StudentProfile.findOne({ where: { userId } })
  ]);

  const grade = profile ? profile.currentGrade : 0;
  const tier = getGradeTier(grade);

  const pricingOptions = Object.entries(PACKAGE_CONFIG).map(([type, config]) => {
    const totalAmount = config.prices[tier];
    return {
      packageType: type,
      sessions: config.sessions,
      reschedules: config.reschedules,
      totalAmount,
      teacherEarnings: Math.round(totalAmount * 0.75 * 100) / 100,
      platformFee: Math.round(totalAmount * 0.25 * 100) / 100
    };
  });

  return { packages, pricingOptions, gradeTier: tier };
};

const canBookFirstClass = async (userId) => {
  const profile = await StudentProfile.findOne({ where: { userId } });
  if (!profile) {
    const err = new Error('Student profile not found'); err.status = 404; throw err;
  }
  return !profile.hasUsedFirstClass;
};

const bookFirstClass = async (userId, data) => {
  const { teacherId, instrument, grade, scheduledAt } = data;

  if (!teacherId || !instrument || !scheduledAt) {
    const err = new Error('teacherId, instrument, and scheduledAt are required');
    err.status = 400; throw err;
  }

  const [profile, teacher] = await Promise.all([
    StudentProfile.findOne({ where: { userId } }),
    User.findByPk(teacherId, { attributes: ['id', 'fullName', 'email'] })
  ]);

  if (!profile) {
    const err = new Error('Student profile not found'); err.status = 404; throw err;
  }
  if (!teacher) {
    const err = new Error('Teacher not found'); err.status = 404; throw err;
  }
  if (profile.hasUsedFirstClass) {
    const err = new Error('You have already used your first class. Please purchase a package to continue.');
    err.status = 400; throw err;
  }

  const effectiveGrade = grade !== undefined ? parseInt(grade, 10) : profile.currentGrade;
  const tier = getGradeTier(effectiveGrade);
  const price = FIRST_CLASS_PRICES[tier];
  const teacherEarnings = Math.round(price * 0.75 * 100) / 100;
  const platformFee = Math.round(price * 0.25 * 100) / 100;

  const session = await Session.create({
    packageId: null,
    studentId: userId,
    teacherId,
    scheduledAt: new Date(scheduledAt),
    isFirstClass: true,
    durationMinutes: 60,
    status: 'scheduled'
  });

  await profile.update({
    hasUsedFirstClass: true,
    firstClassBookedAt: new Date(),
    ...(instrument && { instrument }),
    ...(grade !== undefined && { currentGrade: effectiveGrade })
  });

  return {
    session,
    teacher,
    price,
    teacherEarnings,
    platformFee,
    gradeTier: tier,
    message: 'First class booked successfully. After your session, purchase a package to continue lessons.'
  };
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getStudentProgress,
  getStudentSessions,
  getStudentPackages,
  canBookFirstClass,
  bookFirstClass,
  PACKAGE_CONFIG,
  FIRST_CLASS_PRICES,
  getGradeTier
};
