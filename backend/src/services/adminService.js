const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const {
  User, TeacherProfile, StudentProfile,
  Package, Session, ExamCenter, ActiveCity
} = require('../models');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const logAdminAction = (adminId, action, targetId, reason = null) => {
  console.log(`[AdminLog] admin=${adminId} action=${action} target=${targetId} reason=${reason || 'N/A'} at=${new Date().toISOString()}`);
};

const sendWhatsApp = (phone, message) => {
  // WhatsApp integration placeholder — replace with Twilio/WATI in production
  console.log(`[WhatsApp] to=${phone} msg="${message}"`);
};

const getGradeTier = (grade) => {
  if (grade === 0) return 'basics_initial';
  if (grade <= 2) return 'grade_1_2';
  if (grade <= 4) return 'grade_3_4';
  if (grade <= 6) return 'grade_5_6';
  return 'grade_7_8';
};

// ─── Dashboard & Stats ────────────────────────────────────────────────────────

const getDashboardStats = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [
    totalStudents,
    totalTeachers,
    totalActivePackages,
    revenueResult,
    totalSessionsCompleted,
    sessionsToday,
    newSignupsThisWeek,
    pendingTeacherApprovals,
    activeDisputes
  ] = await Promise.all([
    User.count({ where: { role: 'student', isActive: true } }),
    User.count({ where: { role: 'teacher', isActive: true } }),
    Package.count({ where: { status: 'active' } }),
    Package.findOne({
      where: { status: { [Op.in]: ['active', 'completed'] } },
      attributes: [[fn('SUM', col('totalAmount')), 'total']],
      raw: true
    }),
    Session.count({ where: { status: 'completed' } }),
    Session.count({
      where: { status: 'completed', completedAt: { [Op.gte]: todayStart } }
    }),
    User.count({ where: { createdAt: { [Op.gte]: weekAgo } } }),
    TeacherProfile.count({ where: { approvalStatus: 'pending' } }),
    Session.count({ where: { status: { [Op.in]: ['teacher_absent', 'student_absent'] } } })
  ]);

  const totalRevenue = parseFloat(revenueResult?.total || 0);
  const platformEarnings = parseFloat((totalRevenue * 0.25).toFixed(2));
  const teacherPayouts = parseFloat((totalRevenue * 0.75).toFixed(2));

  return {
    totalStudents,
    totalTeachers,
    totalActivePackages,
    totalRevenue,
    platformEarnings,
    teacherPayouts,
    totalSessionsCompleted,
    sessionsToday,
    newSignupsThisWeek,
    pendingTeacherApprovals,
    activeDisputes
  };
};

const getCityStats = async () => {
  const [studentsByCity, teachersByCity, revenueByCity] = await Promise.all([
    User.findAll({
      where: { role: 'student', isActive: true },
      attributes: ['city', [fn('COUNT', col('id')), 'studentCount']],
      group: ['city'],
      raw: true
    }),
    User.findAll({
      where: { role: 'teacher', isActive: true },
      attributes: ['city', [fn('COUNT', col('id')), 'teacherCount']],
      group: ['city'],
      raw: true
    }),
    Package.findAll({
      where: { status: { [Op.in]: ['active', 'completed'] } },
      attributes: [
        [fn('SUM', col('totalAmount')), 'revenue'],
        [literal('"student"."city"'), 'city']
      ],
      include: [{
        model: User,
        as: 'student',
        attributes: []
      }],
      group: [literal('"student"."city"')],
      raw: true
    })
  ]);

  // Merge into a unified city map
  const cityMap = {};
  for (const row of studentsByCity) {
    const city = row.city || 'Unknown';
    if (!cityMap[city]) cityMap[city] = { city, studentCount: 0, teacherCount: 0, revenue: 0 };
    cityMap[city].studentCount = parseInt(row.studentCount, 10);
  }
  for (const row of teachersByCity) {
    const city = row.city || 'Unknown';
    if (!cityMap[city]) cityMap[city] = { city, studentCount: 0, teacherCount: 0, revenue: 0 };
    cityMap[city].teacherCount = parseInt(row.teacherCount, 10);
  }
  for (const row of revenueByCity) {
    const city = row.city || 'Unknown';
    if (!cityMap[city]) cityMap[city] = { city, studentCount: 0, teacherCount: 0, revenue: 0 };
    cityMap[city].revenue = parseFloat(row.revenue || 0);
  }

  return Object.values(cityMap).sort((a, b) => b.revenue - a.revenue);
};

const getRevenueReport = async (startDate, endDate) => {
  const dateFilter = {};
  if (startDate) dateFilter[Op.gte] = new Date(startDate);
  if (endDate) dateFilter[Op.lte] = new Date(endDate);

  const whereClause = {
    status: { [Op.in]: ['active', 'completed'] },
    ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
  };

  const [totals, byGrade, byInstrument, byPackageType] = await Promise.all([
    Package.findOne({
      where: whereClause,
      attributes: [
        [fn('SUM', col('totalAmount')), 'totalRevenue'],
        [fn('SUM', col('platformFee')), 'platformCommission'],
        [fn('SUM', col('teacherEarnings')), 'teacherEarningsTotal']
      ],
      raw: true
    }),
    Package.findAll({
      where: whereClause,
      attributes: ['gradeTarget', [fn('SUM', col('totalAmount')), 'revenue']],
      group: ['gradeTarget'],
      order: [['gradeTarget', 'ASC']],
      raw: true
    }),
    Package.findAll({
      where: whereClause,
      attributes: ['instrument', [fn('SUM', col('totalAmount')), 'revenue']],
      group: ['instrument'],
      raw: true
    }),
    Package.findAll({
      where: whereClause,
      attributes: ['packageType', [fn('SUM', col('totalAmount')), 'revenue'], [fn('COUNT', col('id')), 'count']],
      group: ['packageType'],
      raw: true
    })
  ]);

  return {
    period: { startDate: startDate || null, endDate: endDate || null },
    totalRevenue: parseFloat(totals?.totalRevenue || 0),
    platformCommission: parseFloat(totals?.platformCommission || 0),
    teacherEarningsTotal: parseFloat(totals?.teacherEarningsTotal || 0),
    byGrade: byGrade.map(r => ({
      grade: r.gradeTarget,
      tier: getGradeTier(r.gradeTarget),
      revenue: parseFloat(r.revenue)
    })),
    byInstrument: byInstrument.map(r => ({
      instrument: r.instrument,
      revenue: parseFloat(r.revenue)
    })),
    byPackageType: byPackageType.map(r => ({
      packageType: r.packageType,
      count: parseInt(r.count, 10),
      revenue: parseFloat(r.revenue)
    }))
  };
};

// ─── Teacher Management ───────────────────────────────────────────────────────

const getAllTeachers = async (filters = {}) => {
  const profileWhere = {};
  if (filters.instrument) profileWhere.instruments = { [Op.contains]: [filters.instrument] };
  if (filters.approvalStatus) profileWhere.approvalStatus = filters.approvalStatus;
  if (filters.badgeLevel) profileWhere.badgeLevel = filters.badgeLevel;

  const userWhere = { role: 'teacher' };
  if (filters.city) userWhere.city = filters.city;

  const teachers = await User.findAll({
    where: userWhere,
    attributes: { exclude: ['password'] },
    include: [{
      model: TeacherProfile,
      as: 'teacherProfile',
      where: Object.keys(profileWhere).length ? profileWhere : undefined
    }],
    order: [['createdAt', 'DESC']]
  });

  return { teachers, count: teachers.length };
};

const getPendingTeachers = async () => {
  const teachers = await User.findAll({
    where: { role: 'teacher' },
    attributes: { exclude: ['password'] },
    include: [{
      model: TeacherProfile,
      as: 'teacherProfile',
      where: { approvalStatus: 'pending' }
    }],
    order: [['createdAt', 'ASC']]
  });

  return { teachers, count: teachers.length };
};

const approveTeacher = async (teacherId, status, note, adminId) => {
  const validStatuses = ['approved', 'rejected', 'suspended'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    err.status = 400; throw err;
  }

  const teacher = await User.findByPk(teacherId, {
    include: [{ model: TeacherProfile, as: 'teacherProfile' }]
  });
  if (!teacher || teacher.role !== 'teacher') {
    const err = new Error('Teacher not found'); err.status = 404; throw err;
  }

  const profile = teacher.teacherProfile;
  profile.approvalStatus = status;
  if (note) profile.approvalNote = note;
  await profile.save();

  if (status === 'suspended') {
    teacher.isActive = false;
    await teacher.save();
  } else if (status === 'approved') {
    teacher.isActive = true;
    await teacher.save();
  }

  logAdminAction(adminId, `teacher_${status}`, teacherId, note);
  sendWhatsApp(teacher.whatsappNumber || teacher.phone,
    `Your MyMusic Tutor teacher application has been ${status}. ${note ? 'Note: ' + note : ''}`);

  return { teacher, status };
};

const flagTeacher = async (teacherId, reason, adminId) => {
  if (!reason || !reason.trim()) {
    const err = new Error('Reason is required to flag a teacher'); err.status = 400; throw err;
  }

  const profile = await TeacherProfile.findOne({ where: { userId: teacherId } });
  if (!profile) {
    const err = new Error('Teacher not found'); err.status = 404; throw err;
  }

  profile.approvalStatus = 'suspended';
  profile.approvalNote = `[FLAGGED] ${reason.trim()}`;
  await profile.save();

  logAdminAction(adminId, 'teacher_flagged', teacherId, reason);

  return { teacherId, flagged: true, reason: reason.trim() };
};

const removeTeacher = async (teacherId, reason, adminId) => {
  if (!reason || !reason.trim()) {
    const err = new Error('Reason is required to remove a teacher'); err.status = 400; throw err;
  }

  const teacher = await User.findByPk(teacherId, {
    include: [{ model: TeacherProfile, as: 'teacherProfile' }]
  });
  if (!teacher || teacher.role !== 'teacher') {
    const err = new Error('Teacher not found'); err.status = 404; throw err;
  }

  // Soft delete
  teacher.isActive = false;
  await teacher.save();

  if (teacher.teacherProfile) {
    teacher.teacherProfile.approvalStatus = 'suspended';
    teacher.teacherProfile.approvalNote = `[REMOVED] ${reason.trim()}`;
    await teacher.teacherProfile.save();
  }

  // Notify affected students with active packages
  const activePackages = await Package.findAll({
    where: { teacherId, status: 'active' },
    include: [{
      model: User,
      as: 'student',
      attributes: ['fullName', 'phone', 'whatsappNumber']
    }]
  });

  for (const pkg of activePackages) {
    const student = pkg.student;
    sendWhatsApp(
      student.whatsappNumber || student.phone,
      `Your teacher is no longer available on MyMusic Tutor. Our team will contact you to reassign your package or arrange a refund discussion.`
    );
  }

  logAdminAction(adminId, 'teacher_removed', teacherId, reason);

  return { teacherId, removed: true, affectedPackages: activePackages.length };
};

const getTeacherPayouts = async (status = 'all') => {
  const teachers = await User.findAll({
    where: { role: 'teacher', isActive: true },
    attributes: { exclude: ['password'] },
    include: [{
      model: TeacherProfile,
      as: 'teacherProfile',
      attributes: ['totalEarnings', 'totalSessions', 'rating', 'approvalStatus']
    }],
    order: [[{ model: TeacherProfile, as: 'teacherProfile' }, 'totalEarnings', 'DESC']]
  });

  return {
    teachers: teachers.map(t => ({
      id: t.id,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      city: t.city,
      totalEarnings: t.teacherProfile?.totalEarnings || 0,
      totalSessions: t.teacherProfile?.totalSessions || 0,
      rating: t.teacherProfile?.rating || 0,
      approvalStatus: t.teacherProfile?.approvalStatus
    })),
    count: teachers.length
  };
};

const processTeacherPayout = async (teacherId, adminId) => {
  const teacher = await User.findByPk(teacherId, {
    attributes: { exclude: ['password'] },
    include: [{ model: TeacherProfile, as: 'teacherProfile' }]
  });
  if (!teacher || teacher.role !== 'teacher') {
    const err = new Error('Teacher not found'); err.status = 404; throw err;
  }

  const amount = teacher.teacherProfile?.totalEarnings || 0;

  // Placeholder: actual bank transfer handled via Razorpay or manual process
  logAdminAction(adminId, 'teacher_payout_processed', teacherId, `Amount: ₹${amount}`);
  sendWhatsApp(
    teacher.whatsappNumber || teacher.phone,
    `Your earnings of ₹${amount} have been processed for payout. It will reflect in your bank account within 2-3 business days.`
  );

  return {
    teacherId,
    fullName: teacher.fullName,
    amount,
    payoutDate: new Date(),
    status: 'processing',
    note: 'Actual bank transfer to be completed via Razorpay or manual process'
  };
};

// ─── Student Management ───────────────────────────────────────────────────────

const getAllStudents = async (filters = {}) => {
  const profileWhere = {};
  if (filters.instrument) profileWhere.instrument = filters.instrument;
  if (filters.currentGrade !== undefined) profileWhere.currentGrade = filters.currentGrade;

  const userWhere = { role: 'student' };
  if (filters.city) userWhere.city = filters.city;

  const students = await User.findAll({
    where: userWhere,
    attributes: { exclude: ['password'] },
    include: [
      {
        model: StudentProfile,
        as: 'studentProfile',
        where: Object.keys(profileWhere).length ? profileWhere : undefined
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Attach active package flag if requested
  let results = students;
  if (filters.hasActivePackage !== undefined) {
    const hasPackage = filters.hasActivePackage === 'true' || filters.hasActivePackage === true;
    const packagesMap = {};
    const pkgs = await Package.findAll({
      where: { status: 'active' },
      attributes: ['studentId']
    });
    for (const p of pkgs) packagesMap[p.studentId] = true;

    results = students.filter(s => !!packagesMap[s.id] === hasPackage);
  }

  return { students: results, count: results.length };
};

const suspendUser = async (userId, reason, adminId) => {
  if (!reason || !reason.trim()) {
    const err = new Error('Reason is required to suspend a user'); err.status = 400; throw err;
  }
  if (userId === adminId) {
    const err = new Error('Admin cannot suspend their own account'); err.status = 403; throw err;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  if (!user.isActive) {
    const err = new Error('User is already suspended'); err.status = 400; throw err;
  }

  user.isActive = false;
  await user.save();

  if (user.role === 'teacher') {
    await TeacherProfile.update(
      { approvalStatus: 'suspended', approvalNote: `[SUSPENDED] ${reason.trim()}` },
      { where: { userId } }
    );
  }

  sendWhatsApp(
    user.whatsappNumber || user.phone,
    `Your MyMusic Tutor account has been suspended. Reason: ${reason.trim()}. Contact support for assistance.`
  );
  logAdminAction(adminId, 'user_suspended', userId, reason);

  return { userId, suspended: true, reason: reason.trim() };
};

const reactivateUser = async (userId, adminId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }
  if (user.isActive) {
    const err = new Error('User is already active'); err.status = 400; throw err;
  }

  user.isActive = true;
  await user.save();

  if (user.role === 'teacher') {
    await TeacherProfile.update(
      { approvalStatus: 'approved' },
      { where: { userId } }
    );
  }

  sendWhatsApp(
    user.whatsappNumber || user.phone,
    `Welcome back to MyMusic Tutor! Your account has been reactivated.`
  );
  logAdminAction(adminId, 'user_reactivated', userId);

  return { userId, reactivated: true };
};

// ─── Booking & Session Management ─────────────────────────────────────────────

const getAllBookings = async (filters = {}) => {
  const pkgWhere = {};
  if (filters.status) pkgWhere.status = filters.status;
  if (filters.packageType) pkgWhere.packageType = filters.packageType;
  if (filters.instrument) pkgWhere.instrument = filters.instrument;

  if (filters.startDate || filters.endDate) {
    pkgWhere.createdAt = {};
    if (filters.startDate) pkgWhere.createdAt[Op.gte] = new Date(filters.startDate);
    if (filters.endDate) pkgWhere.createdAt[Op.lte] = new Date(filters.endDate);
  }

  const studentInclude = {
    model: User,
    as: 'student',
    attributes: ['id', 'fullName', 'email', 'phone', 'city']
  };
  const teacherInclude = {
    model: User,
    as: 'teacher',
    attributes: ['id', 'fullName', 'email', 'phone', 'city']
  };

  if (filters.city) {
    studentInclude.where = { city: filters.city };
    studentInclude.required = true;
  }

  const packages = await Package.findAll({
    where: pkgWhere,
    include: [
      studentInclude,
      teacherInclude,
      { model: Session, as: 'sessions', attributes: ['id', 'scheduledAt', 'status'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  return { bookings: packages, count: packages.length };
};

const overrideReschedule = async (sessionId, newDate, adminId) => {
  const session = await Session.findByPk(sessionId, {
    include: [
      { model: User, as: 'student', attributes: ['fullName', 'phone', 'whatsappNumber'] },
      { model: User, as: 'teacher', attributes: ['fullName', 'phone', 'whatsappNumber'] }
    ]
  });
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }
  if (['completed', 'cancelled'].includes(session.status)) {
    const err = new Error('Cannot reschedule a completed or cancelled session'); err.status = 400; throw err;
  }

  const previousDate = session.scheduledAt;
  session.scheduledAt = new Date(newDate);
  session.status = 'scheduled';
  await session.save();

  const newDateStr = new Date(newDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  sendWhatsApp(
    session.student?.whatsappNumber || session.student?.phone,
    `Admin has rescheduled your session to ${newDateStr}. No reschedule count deducted.`
  );
  sendWhatsApp(
    session.teacher?.whatsappNumber || session.teacher?.phone,
    `Admin has rescheduled a session with ${session.student?.fullName} to ${newDateStr}.`
  );

  logAdminAction(adminId, 'session_rescheduled', sessionId, `from ${previousDate} to ${newDate}`);

  return { session };
};

const forceCompleteSession = async (sessionId, adminId) => {
  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }
  if (session.status === 'completed') {
    const err = new Error('Session is already completed'); err.status = 400; throw err;
  }
  if (session.status === 'cancelled') {
    const err = new Error('Cannot complete a cancelled session'); err.status = 400; throw err;
  }

  const t = await sequelize.transaction();
  try {
    session.status = 'completed';
    session.teacherNotes = session.teacherNotes || '[Admin force-completed for dispute resolution]';
    session.completedAt = new Date();
    await session.save({ transaction: t });

    if (session.packageId) {
      const pkg = await Package.findByPk(session.packageId, { transaction: t });
      pkg.completedSessions += 1;
      if (pkg.completedSessions >= pkg.totalSessions) pkg.status = 'completed';
      await pkg.save({ transaction: t });

      const teacherProfile = await TeacherProfile.findOne({
        where: { userId: session.teacherId }, transaction: t
      });
      if (teacherProfile) {
        const perSessionEarnings = pkg.teacherEarnings / pkg.totalSessions;
        teacherProfile.totalEarnings += perSessionEarnings;
        teacherProfile.totalSessions += 1;
        await teacherProfile.save({ transaction: t });
      }
    }

    await t.commit();
    logAdminAction(adminId, 'session_force_completed', sessionId);
    return { session };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const getAllDisputes = async () => {
  const disputes = await Session.findAll({
    where: {
      status: { [Op.in]: ['teacher_absent', 'student_absent'] }
    },
    include: [
      { model: User, as: 'student', attributes: ['id', 'fullName', 'email', 'phone'] },
      { model: User, as: 'teacher', attributes: ['id', 'fullName', 'email', 'phone'] },
      { model: Package, as: 'package', attributes: ['id', 'packageType', 'instrument', 'status'] }
    ],
    order: [['scheduledAt', 'DESC']]
  });

  return { disputes, count: disputes.length };
};

const resolveDispute = async (disputeId, resolution, adminId) => {
  if (!resolution || !resolution.trim()) {
    const err = new Error('Resolution note is required'); err.status = 400; throw err;
  }

  const session = await Session.findByPk(disputeId, {
    include: [
      { model: User, as: 'student', attributes: ['fullName', 'phone', 'whatsappNumber'] },
      { model: User, as: 'teacher', attributes: ['fullName', 'phone', 'whatsappNumber'] }
    ]
  });
  if (!session) {
    const err = new Error('Dispute session not found'); err.status = 404; throw err;
  }
  if (!['teacher_absent', 'student_absent'].includes(session.status)) {
    const err = new Error('This session is not in a dispute state'); err.status = 400; throw err;
  }

  // Mark as completed with admin resolution note
  session.status = 'completed';
  session.teacherNotes = `[Dispute resolved by admin] ${resolution.trim()}`;
  session.completedAt = new Date();
  await session.save();

  const resolutionMsg = `Your dispute (session on ${new Date(session.scheduledAt).toLocaleDateString('en-IN')}) has been resolved. Admin note: ${resolution.trim()}`;
  sendWhatsApp(session.student?.whatsappNumber || session.student?.phone, resolutionMsg);
  sendWhatsApp(session.teacher?.whatsappNumber || session.teacher?.phone, resolutionMsg);

  logAdminAction(adminId, 'dispute_resolved', disputeId, resolution);

  return { session, resolved: true, resolution: resolution.trim() };
};

// ─── WhatsApp Management ───────────────────────────────────────────────────────

const sendPlatformNotification = async (userIds, message, adminId) => {
  if (!message || !message.trim()) {
    const err = new Error('Message is required'); err.status = 400; throw err;
  }
  if (!userIds || !userIds.length) {
    const err = new Error('At least one userId is required'); err.status = 400; throw err;
  }

  const users = await User.findAll({
    where: { id: { [Op.in]: userIds } },
    attributes: ['id', 'fullName', 'phone', 'whatsappNumber']
  });

  let sent = 0;
  for (const user of users) {
    sendWhatsApp(user.whatsappNumber || user.phone, message.trim());
    sent++;
  }

  logAdminAction(adminId, 'platform_notification_sent', userIds.join(','), `msg: ${message.substring(0, 50)}`);
  return { sent, total: userIds.length };
};

const sendBulkNotification = async (role, message, adminId) => {
  if (!message || !message.trim()) {
    const err = new Error('Message is required'); err.status = 400; throw err;
  }

  const validRoles = ['student', 'teacher', 'all'];
  if (!validRoles.includes(role)) {
    const err = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    err.status = 400; throw err;
  }

  const userWhere = { isActive: true };
  if (role !== 'all') userWhere.role = role;

  const users = await User.findAll({
    where: userWhere,
    attributes: ['id', 'fullName', 'phone', 'whatsappNumber']
  });

  let sent = 0;
  for (const user of users) {
    sendWhatsApp(user.whatsappNumber || user.phone, message.trim());
    sent++;
  }

  logAdminAction(adminId, 'bulk_notification_sent', role, `msg: ${message.substring(0, 50)}`);
  return { sent, role };
};

// ─── First Class & Package Oversight ─────────────────────────────────────────

const viewFirstClassUsage = async () => {
  const [total, used, converted] = await Promise.all([
    Session.count({ where: { isFirstClass: true } }),
    Session.count({ where: { isFirstClass: true, status: 'completed' } }),
    StudentProfile.count({ where: { hasUsedFirstClass: true } })
  ]);

  const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';

  const recentFirstClasses = await Session.findAll({
    where: { isFirstClass: true },
    include: [
      { model: User, as: 'student', attributes: ['id', 'fullName', 'email', 'city'] },
      { model: User, as: 'teacher', attributes: ['id', 'fullName'] }
    ],
    order: [['scheduledAt', 'DESC']],
    limit: 50
  });

  return {
    total,
    used,
    pending: total - used,
    converted,
    conversionRate: `${conversionRate}%`,
    recentFirstClasses
  };
};

const viewPackageConversions = async () => {
  const studentsWithFirstClass = await StudentProfile.count({ where: { hasUsedFirstClass: true } });
  const studentsWithPackage = await Package.count({
    distinct: true,
    col: 'studentId',
    where: { status: { [Op.in]: ['active', 'completed'] } }
  });

  const conversionRate = studentsWithFirstClass > 0
    ? ((studentsWithPackage / studentsWithFirstClass) * 100).toFixed(1)
    : '0.0';

  const revenueResult = await Package.findOne({
    where: { status: { [Op.in]: ['active', 'completed'] } },
    attributes: [[fn('SUM', col('totalAmount')), 'total']],
    raw: true
  });

  const byPackageType = await Package.findAll({
    where: { status: { [Op.in]: ['active', 'completed'] } },
    attributes: [
      'packageType',
      [fn('COUNT', col('id')), 'count'],
      [fn('SUM', col('totalAmount')), 'revenue']
    ],
    group: ['packageType'],
    raw: true
  });

  return {
    studentsWithFirstClass,
    studentsWhoConvertedToPackage: studentsWithPackage,
    conversionRate: `${conversionRate}%`,
    totalRevenueFromPackages: parseFloat(revenueResult?.total || 0),
    byPackageType: byPackageType.map(r => ({
      packageType: r.packageType,
      count: parseInt(r.count, 10),
      revenue: parseFloat(r.revenue)
    }))
  };
};

// ─── Reminder System ───────────────────────────────────────────────────────────

const viewPendingReminders = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const sessions = await Session.findAll({
    where: {
      status: 'scheduled',
      scheduledAt: { [Op.between]: [now, in24h] },
      reminder24Sent: false
    },
    include: [
      { model: User, as: 'student', attributes: ['id', 'fullName', 'phone', 'whatsappNumber'] },
      { model: User, as: 'teacher', attributes: ['id', 'fullName', 'phone', 'whatsappNumber'] }
    ],
    order: [['scheduledAt', 'ASC']]
  });

  return { sessions, count: sessions.length };
};

const triggerReminder = async (sessionId, adminId) => {
  const session = await Session.findByPk(sessionId, {
    include: [
      { model: User, as: 'student', attributes: ['fullName', 'phone', 'whatsappNumber'] },
      { model: User, as: 'teacher', attributes: ['fullName', 'phone', 'whatsappNumber'] }
    ]
  });
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }
  if (session.status !== 'scheduled') {
    const err = new Error('Reminders can only be sent for scheduled sessions'); err.status = 400; throw err;
  }

  const sessionTime = new Date(session.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const reminderMsg = `Reminder: You have a music session scheduled at ${sessionTime}. Please be ready!`;

  sendWhatsApp(session.student?.whatsappNumber || session.student?.phone, reminderMsg);
  sendWhatsApp(session.teacher?.whatsappNumber || session.teacher?.phone,
    `Reminder: Session with ${session.student?.fullName} at ${sessionTime}.`);

  session.reminder24Sent = true;
  await session.save();

  logAdminAction(adminId, 'reminder_triggered', sessionId);

  return { sessionId, reminderSent: true };
};

// ─── Exam Center Management ────────────────────────────────────────────────────

const addExamCenter = async (data, adminId) => {
  const { name, address, city, state, phone, availableDates, examTypes } = data;
  if (!name || !address || !city || !state) {
    const err = new Error('name, address, city, and state are required'); err.status = 400; throw err;
  }

  const validExamTypes = ['trinity', 'rockschool'];
  if (examTypes && examTypes.some(t => !validExamTypes.includes(t))) {
    const err = new Error(`Invalid exam type. Must be: ${validExamTypes.join(', ')}`);
    err.status = 400; throw err;
  }

  const center = await ExamCenter.create({
    name: name.trim(),
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    phone: phone || null,
    availableDates: availableDates || [],
    examTypes: examTypes || []
  });

  logAdminAction(adminId, 'exam_center_added', center.id);
  return { center };
};

const updateExamCenter = async (centerId, data, adminId) => {
  const center = await ExamCenter.findByPk(centerId);
  if (!center) {
    const err = new Error('Exam center not found'); err.status = 404; throw err;
  }

  const allowed = ['name', 'address', 'city', 'state', 'phone', 'availableDates', 'examTypes', 'isActive'];
  for (const key of allowed) {
    if (data[key] !== undefined) center[key] = data[key];
  }
  await center.save();

  logAdminAction(adminId, 'exam_center_updated', centerId);
  return { center };
};

const removeExamCenter = async (centerId, adminId) => {
  const center = await ExamCenter.findByPk(centerId);
  if (!center) {
    const err = new Error('Exam center not found'); err.status = 404; throw err;
  }

  center.isActive = false;
  await center.save();

  logAdminAction(adminId, 'exam_center_removed', centerId);
  return { centerId, removed: true };
};

const getAllExamCenters = async (city) => {
  const where = { isActive: true };
  if (city) where.city = city;

  const centers = await ExamCenter.findAll({ where, order: [['city', 'ASC'], ['name', 'ASC']] });
  return { centers, count: centers.length };
};

// ─── Expansion Management ─────────────────────────────────────────────────────

const addCity = async (cityName, state, adminId) => {
  if (!cityName || !state) {
    const err = new Error('cityName and state are required'); err.status = 400; throw err;
  }

  const existing = await ActiveCity.findOne({ where: { cityName: cityName.trim() } });
  if (existing) {
    if (existing.isActive) {
      const err = new Error('City is already active'); err.status = 409; throw err;
    }
    existing.isActive = true;
    existing.state = state.trim();
    await existing.save();
    logAdminAction(adminId, 'city_reactivated', existing.id);
    return { city: existing, reactivated: true };
  }

  const city = await ActiveCity.create({ cityName: cityName.trim(), state: state.trim() });
  logAdminAction(adminId, 'city_added', city.id);
  return { city, reactivated: false };
};

const getActiveCities = async () => {
  const cities = await ActiveCity.findAll({
    where: { isActive: true },
    order: [['cityName', 'ASC']]
  });
  return { cities, count: cities.length };
};

const getCityExpansionReadiness = async (city) => {
  const [teachers, students, revenueResult] = await Promise.all([
    User.count({ where: { role: 'teacher', city, isActive: true } }),
    User.count({ where: { role: 'student', city, isActive: true } }),
    Package.findOne({
      where: { status: { [Op.in]: ['active', 'completed'] } },
      attributes: [[fn('SUM', col('totalAmount')), 'total']],
      include: [{ model: User, as: 'student', where: { city }, attributes: [] }],
      raw: true
    })
  ]);

  const revenue = parseFloat(revenueResult?.total || 0);

  // Readiness thresholds (configurable)
  const READY_TEACHERS = 5;
  const READY_STUDENTS = 20;
  const READY_REVENUE = 50000;

  const readiness = {
    city,
    teachers,
    students,
    revenue,
    isReady: teachers >= READY_TEACHERS && students >= READY_STUDENTS,
    thresholds: { teachers: READY_TEACHERS, students: READY_STUDENTS, revenue: READY_REVENUE },
    gaps: {
      teachers: Math.max(0, READY_TEACHERS - teachers),
      students: Math.max(0, READY_STUDENTS - students)
    }
  };

  return readiness;
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getDashboardStats,
  getCityStats,
  getRevenueReport,
  getAllTeachers,
  getPendingTeachers,
  approveTeacher,
  flagTeacher,
  removeTeacher,
  getTeacherPayouts,
  processTeacherPayout,
  getAllStudents,
  suspendUser,
  reactivateUser,
  getAllBookings,
  overrideReschedule,
  forceCompleteSession,
  getAllDisputes,
  resolveDispute,
  sendPlatformNotification,
  sendBulkNotification,
  viewFirstClassUsage,
  viewPackageConversions,
  viewPendingReminders,
  triggerReminder,
  addExamCenter,
  updateExamCenter,
  removeExamCenter,
  getAllExamCenters,
  addCity,
  getActiveCities,
  getCityExpansionReadiness
};
