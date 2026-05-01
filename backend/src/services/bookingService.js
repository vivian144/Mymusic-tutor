const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { User, TeacherProfile, StudentProfile, Package, Session } = require('../models');
const {
  sendBookingConfirmation,
  sendPackageConfirmation,
  sendStudentAbsentAlert,
  sendTeacherAbsentAlert,
  sendDisputeRaised,
  sendRescheduleConfirmation
} = require('./notificationService');
const { scheduleReminders, cancelReminders } = require('../jobs/reminderQueue');

// ─── Pricing Constants ────────────────────────────────────────────────────────

const getGradeTier = (grade) => {
  if (grade === 0) return 'basics_initial';
  if (grade <= 2) return 'grade_1_2';
  if (grade <= 4) return 'grade_3_4';
  if (grade <= 6) return 'grade_5_6';
  return 'grade_7_8';
};

const FIRST_CLASS_PRICES = {
  basics_initial: 583,
  grade_1_2:      708,
  grade_3_4:      875,
  grade_5_6:      1042,
  grade_7_8:      1208
};

const PACKAGE_PRICES = {
  '1_month':  { basics_initial: 5000,  grade_1_2: 6000,  grade_3_4: 7500,  grade_5_6: 9000,  grade_7_8: 10500  },
  '3_months': { basics_initial: 14000, grade_1_2: 17000, grade_3_4: 21000, grade_5_6: 25000, grade_7_8: 29000  },
  '6_months': { basics_initial: 26600, grade_1_2: 32300, grade_3_4: 39900, grade_5_6: 47500, grade_7_8: 55100  },
  '12_months':{ basics_initial: 50400, grade_1_2: 61200, grade_3_4: 75600, grade_5_6: 90000, grade_7_8: 104400 }
};

const SESSIONS_MULTIPLIER = {
  '1_month': 4, '3_months': 12, '6_months': 24, '12_months': 48
};

const RESCHEDULE_ALLOWANCES = {
  '1_month': 1, '3_months': 3, '6_months': 5, '12_months': 8
};

// ─── Internal Helpers ─────────────────────────────────────────────────────────

const validateTeacherForBooking = async (teacherId, instrument, grade) => {
  const teacher = await User.findByPk(teacherId);
  if (!teacher || teacher.role !== 'teacher') {
    const err = new Error('Teacher not found'); err.status = 404; throw err;
  }

  const teacherProfile = await TeacherProfile.findOne({ where: { userId: teacherId } });
  if (!teacherProfile) {
    const err = new Error('Teacher profile not found'); err.status = 404; throw err;
  }
  if (teacherProfile.approvalStatus !== 'approved') {
    const err = new Error('Teacher is not approved'); err.status = 400; throw err;
  }
  if (!teacherProfile.instruments.includes(instrument)) {
    const err = new Error(`Teacher does not teach ${instrument}`); err.status = 400; throw err;
  }
  // canTeachUpToGrade = highestGrade - 2, so this enforces highestGrade >= studentGrade + 2
  if (teacherProfile.canTeachUpToGrade === null || teacherProfile.canTeachUpToGrade < grade) {
    const err = new Error(
      `Teacher cannot teach grade ${grade}. Teacher's maximum grade: ${teacherProfile.canTeachUpToGrade}`
    );
    err.status = 400; throw err;
  }

  return { teacher, teacherProfile };
};

// ─── Core Service Functions ───────────────────────────────────────────────────

const createFirstClassBooking = async (studentId, teacherId, scheduledAt, instrument, grade) => {
  const studentProfile = await StudentProfile.findOne({ where: { userId: studentId } });
  if (!studentProfile) {
    const err = new Error('Student profile not found'); err.status = 404; throw err;
  }
  if (studentProfile.hasUsedFirstClass) {
    const err = new Error('First class has already been used'); err.status = 400; throw err;
  }

  // Prevent creating a second first-class booking if one already exists (even unpaid)
  const existingFirstClass = await Session.findOne({
    where: {
      studentId,
      isFirstClass: true,
      status: { [Op.notIn]: ['cancelled'] }
    }
  });
  if (existingFirstClass) {
    const err = new Error('You already have an active first class booking'); err.status = 400; throw err;
  }

  await validateTeacherForBooking(teacherId, instrument, grade);

  const gradeTier = getGradeTier(grade);
  const price = FIRST_CLASS_PRICES[gradeTier];

  const session = await Session.create({
    studentId,
    teacherId,
    scheduledAt: new Date(scheduledAt),
    isFirstClass: true,
    packageId: null,
    status: 'scheduled'
  });

  // Send booking confirmation WhatsApp (non-blocking)
  const [student, teacher] = await Promise.all([
    User.findByPk(studentId, { attributes: ['fullName', 'phone', 'whatsappNumber', 'address'] }),
    User.findByPk(teacherId, { attributes: ['fullName', 'phone', 'whatsappNumber'] })
  ]);
  sendBookingConfirmation(
    student.whatsappNumber || student.phone,
    teacher.whatsappNumber || teacher.phone,
    {
      studentName:    student.fullName,
      teacherName:    teacher.fullName,
      instrument,
      scheduledAt:    session.scheduledAt,
      amount:         price,
      studentAddress: student.address
    }
  ).catch(err => console.error('[Notification] sendBookingConfirmation failed:', err.message));

  return {
    session,
    pricing: {
      amount: price,
      gradeTier,
      currency: 'INR'
    }
  };
};

const createPackageBooking = async (studentId, teacherId, packageType, instrument, grade, sessionsPerWeek) => {
  const validPackageTypes = ['1_month', '3_months', '6_months', '12_months'];
  if (!validPackageTypes.includes(packageType)) {
    const err = new Error(`Invalid package type. Must be one of: ${validPackageTypes.join(', ')}`);
    err.status = 400; throw err;
  }

  const spw = Number(sessionsPerWeek);
  if (![2, 3].includes(spw)) {
    const err = new Error('Sessions per week must be 2 or 3'); err.status = 400; throw err;
  }

  await validateTeacherForBooking(teacherId, instrument, grade);

  const gradeTier = getGradeTier(grade);
  const totalAmount = PACKAGE_PRICES[packageType][gradeTier];
  const platformFee = totalAmount * 0.25;
  const teacherEarnings = totalAmount * 0.75;
  const totalSessions = SESSIONS_MULTIPLIER[packageType] * spw;
  const reschedulesAllowed = RESCHEDULE_ALLOWANCES[packageType];

  const pkg = await Package.create({
    studentId,
    teacherId,
    packageType,
    instrument,
    gradeTarget: grade,
    sessionsPerWeek: spw,
    totalSessions,
    completedSessions: 0,
    reschedulesAllowed,
    reschedulesUsed: 0,
    totalAmount,
    platformFee,
    teacherEarnings,
    status: 'pending_payment'
  });

  return {
    package: pkg,
    pricing: {
      totalAmount,
      platformFee,
      teacherEarnings,
      gradeTier,
      totalSessions,
      reschedulesAllowed,
      currency: 'INR'
    }
  };
};

const confirmBooking = async (bookingId, paymentId) => {
  // Try Package first
  const pkg = await Package.findByPk(bookingId);

  if (pkg) {
    if (pkg.status !== 'pending_payment') {
      const err = new Error('Package is not awaiting payment confirmation'); err.status = 400; throw err;
    }

    const t = await sequelize.transaction();
    try {
      pkg.status = 'active';
      pkg.paymentId = paymentId;
      await pkg.save({ transaction: t });

      const sessions = await generateSessionsForPackage(pkg.id, new Date(), pkg.sessionsPerWeek, t);

      await t.commit();

      const updatedPkg = await Package.findByPk(bookingId, {
        include: [{ model: Session, as: 'sessions', order: [['scheduledAt', 'ASC']] }]
      });

      // Schedule reminders for all generated sessions (non-blocking)
      Promise.all(sessions.map(s => scheduleReminders(s)))
        .catch(err => console.error('[ReminderQueue] Failed to schedule reminders:', err.message));

      // Send package confirmation WhatsApp (non-blocking)
      const [student, teacher] = await Promise.all([
        User.findByPk(pkg.studentId, { attributes: ['fullName', 'phone', 'whatsappNumber'] }),
        User.findByPk(pkg.teacherId, { attributes: ['fullName', 'phone', 'whatsappNumber'] })
      ]);
      const durationMap = { '1_month': '1-Month', '3_months': '3-Month', '6_months': '6-Month', '12_months': '12-Month' };
      sendPackageConfirmation(
        student.whatsappNumber || student.phone,
        teacher.whatsappNumber || teacher.phone,
        {
          studentName:   student.fullName,
          teacherName:   teacher.fullName,
          instrument:    pkg.instrument,
          duration:      durationMap[pkg.packageType] || pkg.packageType,
          totalSessions: sessions.length,
          startDate:     sessions[0].scheduledAt,
          amount:        pkg.totalAmount
        }
      ).catch(err => console.error('[Notification] sendPackageConfirmation failed:', err.message));

      return { booking: updatedPkg, sessionCount: sessions.length, type: 'package' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // Try first-class Session
  const session = await Session.findByPk(bookingId);
  if (session && session.isFirstClass) {
    const studentProfile = await StudentProfile.findOne({ where: { userId: session.studentId } });
    if (!studentProfile) {
      const err = new Error('Student profile not found'); err.status = 404; throw err;
    }

    studentProfile.hasUsedFirstClass = true;
    studentProfile.firstClassBookedAt = new Date();
    await studentProfile.save();

    // Schedule reminders for the first-class session (non-blocking)
    scheduleReminders(session)
      .catch(err => console.error('[ReminderQueue] Failed to schedule first-class reminders:', err.message));

    return { booking: session, type: 'first_class' };
  }

  const err = new Error('Booking not found'); err.status = 404; throw err;
};

const cancelBooking = async (bookingId, userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }

  // Try Package (admin-only full cancellation)
  const pkg = await Package.findByPk(bookingId);
  if (pkg) {
    if (user.role !== 'admin') {
      const err = new Error('Only admin can cancel an entire package'); err.status = 403; throw err;
    }
    if (pkg.status === 'cancelled') {
      const err = new Error('Package is already cancelled'); err.status = 400; throw err;
    }

    const t = await sequelize.transaction();
    try {
      pkg.status = 'cancelled';
      await pkg.save({ transaction: t });

      await Session.update(
        { status: 'cancelled' },
        { where: { packageId: bookingId, status: 'scheduled' }, transaction: t }
      );

      await t.commit();
      return { cancelled: pkg, type: 'package' };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  // Try Session (student can cancel individual session with 12h notice)
  const session = await Session.findByPk(bookingId);
  if (session) {
    if (session.status !== 'scheduled') {
      const err = new Error('Only scheduled sessions can be cancelled'); err.status = 400; throw err;
    }
    if (user.role !== 'admin' && session.studentId !== userId) {
      const err = new Error('You can only cancel your own sessions'); err.status = 403; throw err;
    }

    if (user.role !== 'admin') {
      const hoursUntilSession = (new Date(session.scheduledAt) - new Date()) / (1000 * 60 * 60);
      if (hoursUntilSession < 12) {
        const err = new Error('Cannot cancel within 12 hours of session. Contact support if needed.');
        err.status = 400; throw err;
      }
    }

    session.status = 'cancelled';
    await session.save();

    // Add back as makeup session
    if (session.packageId) {
      await Package.increment('reschedulesAllowed', { where: { id: session.packageId } });
    }

    return { cancelled: session, type: 'session' };
  }

  const err = new Error('Booking not found'); err.status = 404; throw err;
};

const rescheduleSession = async (sessionId, userId, newScheduledAt) => {
  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }

  if (!['scheduled', 'teacher_absent'].includes(session.status)) {
    const err = new Error('Only scheduled or teacher-absent sessions can be rescheduled'); err.status = 400; throw err;
  }

  const user = await User.findByPk(userId);
  const isStudent = user.role === 'student' && session.studentId === userId;
  const isTeacher = user.role === 'teacher' && session.teacherId === userId;
  const isAdmin = user.role === 'admin';

  if (!isStudent && !isTeacher && !isAdmin) {
    const err = new Error('You cannot reschedule this session'); err.status = 403; throw err;
  }

  // 12-hour check only applies to currently-scheduled sessions, not teacher_absent ones
  if (session.status === 'scheduled') {
    const hoursUntilSession = (new Date(session.scheduledAt) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilSession < 12) {
      const err = new Error(
        'Cannot reschedule within 12 hours of session. Session will count as used.'
      );
      err.status = 400; throw err;
    }
  }

  if (session.packageId) {
    const pkg = await Package.findByPk(session.packageId);
    if (pkg.reschedulesUsed >= pkg.reschedulesAllowed) {
      const err = new Error(
        `No reschedules remaining. Used ${pkg.reschedulesUsed} of ${pkg.reschedulesAllowed}`
      );
      err.status = 400; throw err;
    }

    const t = await sequelize.transaction();
    try {
      session.scheduledAt = new Date(newScheduledAt);
      session.status = 'scheduled';
      // Reset reminder flags so new reminders fire at the correct time
      session.reminder24Sent = false;
      session.reminder2Sent  = false;
      session.reminder15Sent = false;
      await session.save({ transaction: t });

      pkg.reschedulesUsed += 1;
      await pkg.save({ transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } else {
    // First-class session — reschedule freely
    session.scheduledAt    = new Date(newScheduledAt);
    session.reminder24Sent = false;
    session.reminder2Sent  = false;
    session.reminder15Sent = false;
    await session.save();
  }

  // Cancel old reminder jobs and schedule new ones (non-blocking)
  cancelReminders(session.id)
    .then(() => scheduleReminders(session))
    .catch(err => console.error('[ReminderQueue] Failed to reschedule reminders:', err.message));

  // Send reschedule confirmation (non-blocking)
  const [student, teacher] = await Promise.all([
    User.findByPk(session.studentId, { attributes: ['fullName', 'phone', 'whatsappNumber', 'address'] }),
    User.findByPk(session.teacherId, { attributes: ['fullName', 'phone', 'whatsappNumber'] })
  ]);
  sendRescheduleConfirmation(
    student.whatsappNumber || student.phone,
    teacher.whatsappNumber || teacher.phone,
    {
      studentName:    student.fullName,
      teacherName:    teacher.fullName,
      instrument:     session.package?.instrument || 'Music',
      newScheduledAt: session.scheduledAt,
      studentAddress: student.address
    }
  ).catch(err => console.error('[Notification] sendRescheduleConfirmation failed:', err.message));

  return { session };
};

const completeSession = async (sessionId, teacherId, notes, homework) => {
  if (!notes || !notes.trim()) {
    const err = new Error('Session notes are required to complete a session'); err.status = 400; throw err;
  }

  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }
  if (session.teacherId !== teacherId) {
    const err = new Error('You can only complete your own sessions'); err.status = 403; throw err;
  }
  if (session.status !== 'scheduled') {
    const err = new Error('Only scheduled sessions can be marked complete'); err.status = 400; throw err;
  }

  const t = await sequelize.transaction();
  try {
    session.status = 'completed';
    session.teacherNotes = notes.trim();
    session.homework = homework ? homework.trim() : null;
    session.completedAt = new Date();
    await session.save({ transaction: t });

    const teacherProfile = await TeacherProfile.findOne({ where: { userId: teacherId }, transaction: t });
    teacherProfile.totalSessions += 1;

    if (session.packageId) {
      const pkg = await Package.findByPk(session.packageId, { transaction: t });
      const perSessionEarnings = pkg.teacherEarnings / pkg.totalSessions;
      teacherProfile.totalEarnings += perSessionEarnings;
      await teacherProfile.save({ transaction: t });

      pkg.completedSessions += 1;
      if (pkg.completedSessions >= pkg.totalSessions) {
        pkg.status = 'completed';
      }
      await pkg.save({ transaction: t });
    } else if (session.isFirstClass) {
      // Credit teacher 75% of the first-class fee
      const studentProfile = await StudentProfile.findOne({
        where: { userId: session.studentId },
        transaction: t
      });
      const gradeTier = getGradeTier(studentProfile.currentGrade);
      teacherProfile.totalEarnings += FIRST_CLASS_PRICES[gradeTier] * 0.75;
      await teacherProfile.save({ transaction: t });
    } else {
      await teacherProfile.save({ transaction: t });
    }

    await t.commit();
    return { session };
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

const markStudentAbsent = async (sessionId, teacherId) => {
  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }
  if (session.teacherId !== teacherId) {
    const err = new Error('You can only manage your own sessions'); err.status = 403; throw err;
  }
  if (session.status !== 'scheduled') {
    const err = new Error('Only scheduled sessions can be updated'); err.status = 400; throw err;
  }

  session.status = 'student_absent';
  await session.save();

  // Session counts as used — increment completedSessions
  if (session.packageId) {
    const pkg = await Package.findByPk(session.packageId);
    pkg.completedSessions += 1;
    if (pkg.completedSessions >= pkg.totalSessions) {
      pkg.status = 'completed';
    }
    await pkg.save();
  }

  // Cancel pending reminders since session won't happen
  cancelReminders(sessionId)
    .catch(err => console.error('[ReminderQueue] Failed to cancel reminders:', err.message));

  const student = await User.findByPk(session.studentId, { attributes: ['fullName', 'phone', 'whatsappNumber'] });
  sendStudentAbsentAlert(
    student.whatsappNumber || student.phone,
    { studentName: student.fullName, instrument: 'Music', scheduledAt: session.scheduledAt }
  ).catch(err => console.error('[Notification] sendStudentAbsentAlert failed:', err.message));

  return { session };
};

const markTeacherAbsent = async (sessionId, studentId) => {
  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }
  if (session.studentId !== studentId) {
    const err = new Error('You can only manage your own sessions'); err.status = 403; throw err;
  }
  if (session.status !== 'scheduled') {
    const err = new Error('Only scheduled sessions can be updated'); err.status = 400; throw err;
  }

  session.status = 'teacher_absent';
  await session.save();

  // Add a free reschedule since teacher did not show — does not count against student's limit
  if (session.packageId) {
    await Package.increment('reschedulesAllowed', { where: { id: session.packageId } });
  }

  // Cancel pending reminders since session won't happen
  cancelReminders(sessionId)
    .catch(err => console.error('[ReminderQueue] Failed to cancel reminders:', err.message));

  const [student, teacher] = await Promise.all([
    User.findByPk(session.studentId, { attributes: ['fullName', 'phone', 'whatsappNumber'] }),
    User.findByPk(session.teacherId, { attributes: ['fullName', 'phone', 'whatsappNumber'] })
  ]);

  const teacherAbsenceCount = await Session.count({
    where: { teacherId: session.teacherId, status: 'teacher_absent' }
  });

  const issue = teacherAbsenceCount >= 3
    ? `Teacher absent (${teacherAbsenceCount} total absences — requires review)`
    : 'Teacher did not attend scheduled session';

  sendTeacherAbsentAlert(
    student.whatsappNumber || student.phone,
    process.env.ADMIN_WHATSAPP_NUMBER,
    {
      studentName:  student.fullName,
      teacherName:  teacher.fullName,
      teacherPhone: teacher.whatsappNumber || teacher.phone,
      sessionId,
      scheduledAt:  session.scheduledAt
    }
  ).catch(err => console.error('[Notification] sendTeacherAbsentAlert failed:', err.message));

  sendDisputeRaised(
    process.env.ADMIN_WHATSAPP_NUMBER,
    {
      studentName: student.fullName,
      teacherName: teacher.fullName,
      sessionId,
      issue
    }
  ).catch(err => console.error('[Notification] sendDisputeRaised failed:', err.message));

  return { session, freeRescheduleAdded: !!session.packageId };
};

const getUpcomingSessions = async (userId, role) => {
  const ownerField = role === 'student' ? 'studentId' : 'teacherId';

  const sessions = await Session.findAll({
    where: {
      [ownerField]: userId,
      status: 'scheduled',
      scheduledAt: { [Op.gt]: new Date() }
    },
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'fullName', 'phone', 'whatsappNumber', 'profilePhoto']
      },
      {
        model: User,
        as: 'teacher',
        attributes: ['id', 'fullName', 'phone', 'whatsappNumber', 'profilePhoto']
      },
      {
        model: Package,
        as: 'package',
        attributes: ['id', 'packageType', 'instrument', 'totalSessions', 'completedSessions', 'sessionsPerWeek', 'reschedulesUsed', 'reschedulesAllowed']
      }
    ],
    order: [['scheduledAt', 'ASC']]
  });

  return { sessions, count: sessions.length };
};

const generateSessionsForPackage = async (packageId, startDate, sessionsPerWeek, transaction = null) => {
  const options = transaction ? { transaction } : {};
  const pkg = await Package.findByPk(packageId, options);
  if (!pkg) {
    const err = new Error('Package not found'); err.status = 404; throw err;
  }

  const spw = Number(sessionsPerWeek);
  const sessions = [];

  // First session starts the day after booking at 10:00 AM
  const start = new Date(startDate);
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);

  // Day offsets within each week
  // 2/week → Mon & Thu pattern (0, 3); 3/week → Mon, Wed, Fri (0, 2, 4)
  const weeklyOffsets = spw === 2 ? [0, 3] : [0, 2, 4];

  let sessionCount = 0;
  let weekNumber = 0;

  while (sessionCount < pkg.totalSessions) {
    for (const offset of weeklyOffsets) {
      if (sessionCount >= pkg.totalSessions) break;

      const sessionDate = new Date(start);
      sessionDate.setDate(start.getDate() + weekNumber * 7 + offset);

      sessions.push({
        packageId: pkg.id,
        studentId: pkg.studentId,
        teacherId: pkg.teacherId,
        scheduledAt: sessionDate,
        status: 'scheduled',
        isFirstClass: false
      });
      sessionCount++;
    }
    weekNumber++;
  }

  const createdSessions = await Session.bulkCreate(sessions, options);

  // Set package start/end dates
  await Package.update(
    {
      startDate: sessions[0].scheduledAt,
      endDate: sessions[sessions.length - 1].scheduledAt
    },
    { where: { id: packageId }, ...options }
  );

  return createdSessions;
};

const getBookingDetails = async (bookingId, userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }

  // Try Package
  const pkg = await Package.findByPk(bookingId, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'fullName', 'email', 'phone', 'profilePhoto'] },
      { model: User, as: 'teacher', attributes: ['id', 'fullName', 'email', 'phone', 'profilePhoto'] },
      { model: Session, as: 'sessions', order: [['scheduledAt', 'ASC']] }
    ]
  });

  if (pkg) {
    if (user.role !== 'admin' && pkg.studentId !== userId && pkg.teacherId !== userId) {
      const err = new Error('Access denied'); err.status = 403; throw err;
    }
    return { booking: pkg, type: 'package' };
  }

  // Try Session
  const session = await Session.findByPk(bookingId, {
    include: [
      { model: User, as: 'student', attributes: ['id', 'fullName', 'email', 'phone', 'profilePhoto'] },
      { model: User, as: 'teacher', attributes: ['id', 'fullName', 'email', 'phone', 'profilePhoto'] },
      { model: Package, as: 'package' }
    ]
  });

  if (session) {
    if (user.role !== 'admin' && session.studentId !== userId && session.teacherId !== userId) {
      const err = new Error('Access denied'); err.status = 403; throw err;
    }
    return {
      booking: session,
      type: session.isFirstClass ? 'first_class' : 'session'
    };
  }

  const err = new Error('Booking not found'); err.status = 404; throw err;
};

module.exports = {
  createFirstClassBooking,
  createPackageBooking,
  confirmBooking,
  cancelBooking,
  rescheduleSession,
  completeSession,
  markStudentAbsent,
  markTeacherAbsent,
  getUpcomingSessions,
  generateSessionsForPackage,
  getBookingDetails
};
