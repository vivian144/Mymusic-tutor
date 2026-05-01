const { reminderQueue } = require('./reminderQueue');
const { User, Session, Package } = require('../models');
const {
  sendSessionReminder24hr,
  sendSessionReminder2hr,
  sendSessionReminder15min
} = require('../services/notificationService');

const REMINDER_HANDLERS = {
  reminder_24hr: sendSessionReminder24hr,
  reminder_2hr:  sendSessionReminder2hr,
  reminder_15min: sendSessionReminder15min
};

const REMINDER_FLAGS = {
  reminder_24hr:  'reminder24Sent',
  reminder_2hr:   'reminder2Sent',
  reminder_15min: 'reminder15Sent'
};

const buildSessionData = (session) => ({
  sessionId:    session.id,
  instrument:   session.package?.instrument || session.isFirstClass ? 'Music' : 'Music',
  scheduledAt:  session.scheduledAt,
  studentName:  session.student?.fullName,
  teacherName:  session.teacher?.fullName,
  teacherPhone: session.teacher?.whatsappNumber || session.teacher?.phone,
  studentAddress: session.student?.address
});

reminderQueue.process(async (job) => {
  const { sessionId, type } = job.data;

  const session = await Session.findByPk(sessionId, {
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['fullName', 'phone', 'whatsappNumber', 'address']
      },
      {
        model: User,
        as: 'teacher',
        attributes: ['fullName', 'phone', 'whatsappNumber']
      },
      {
        model: Package,
        as: 'package',
        attributes: ['instrument']
      }
    ]
  });

  if (!session) {
    console.warn(`[ReminderProcessor] Session ${sessionId} not found, skipping`);
    return;
  }

  if (session.status !== 'scheduled') {
    console.log(`[ReminderProcessor] Session ${sessionId} is ${session.status}, skipping reminder`);
    return;
  }

  const flagField = REMINDER_FLAGS[type];
  if (session[flagField]) {
    console.log(`[ReminderProcessor] ${type} already sent for session ${sessionId}, skipping`);
    return;
  }

  const handler = REMINDER_HANDLERS[type];
  if (!handler) {
    console.error(`[ReminderProcessor] Unknown reminder type: ${type}`);
    return;
  }

  const studentPhone = session.student?.whatsappNumber || session.student?.phone;
  const teacherPhone = session.teacher?.whatsappNumber || session.teacher?.phone;
  const sessionData  = buildSessionData(session);

  await handler(studentPhone, teacherPhone, sessionData);

  // Mark flag on session
  session[flagField] = true;
  await session.save();

  console.log(`[ReminderProcessor] ${type} sent for session ${sessionId}`);
});

reminderQueue.on('failed', (job, err) => {
  console.error(`[ReminderProcessor] Job ${job.id} failed (attempt ${job.attemptsMade}): ${err.message}`);
});

reminderQueue.on('completed', (job) => {
  console.log(`[ReminderProcessor] Job ${job.id} completed`);
});

console.log('[ReminderProcessor] Session reminder processor started');

module.exports = reminderQueue;
