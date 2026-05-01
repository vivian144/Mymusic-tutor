const twilio = require('twilio');

const isDev = process.env.NODE_ENV !== 'production';

let client;
if (!isDev) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatWhatsAppNumber = (phone) => {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  // Strip leading 0 (Indian local format)
  if (digits.startsWith('0')) digits = digits.slice(1);
  // Strip country code if already present as 91 + 10 digits
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length !== 10) return null;
  return `whatsapp:+91${digits}`;
};

const formatDate = (dt) =>
  new Date(dt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

const formatDateOnly = (dt) =>
  new Date(dt).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric'
  });

const formatTimeOnly = (dt) =>
  new Date(dt).toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

// ─── Core Sender ─────────────────────────────────────────────────────────────

const sendMessage = async (toPhone, body) => {
  const to = formatWhatsAppNumber(toPhone);
  if (!to) {
    console.warn(`[WhatsApp] Invalid phone number, skipping: ${toPhone}`);
    return;
  }

  if (isDev) {
    console.log(`[WhatsApp DEV] to=${to}\n  msg=${body}\n`);
    return;
  }

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to,
      body
    });
  } catch (err) {
    console.error(`[WhatsApp] Failed to send to ${to}: ${err.message}`);
  }
};

// ─── Notification Functions ───────────────────────────────────────────────────

const sendBookingConfirmation = async (studentPhone, teacherPhone, sessionData) => {
  const { studentName, teacherName, instrument, scheduledAt, amount, studentAddress } = sessionData;
  const dateStr = formatDate(scheduledAt);

  await Promise.all([
    sendMessage(
      studentPhone,
      `Hi ${studentName}! 🎵 Your ${instrument} First Class with ${teacherName} is confirmed for ${dateStr} at your home. Amount paid: ₹${amount}. MyMusic Tutor`
    ),
    sendMessage(
      teacherPhone,
      `Hi ${teacherName}! 🎵 New booking! ${instrument} First Class with ${studentName} on ${dateStr}. Address: ${studentAddress || 'Shared separately'}. MyMusic Tutor`
    )
  ]);
};

const sendPackageConfirmation = async (studentPhone, teacherPhone, packageData) => {
  const { studentName, teacherName, instrument, duration, totalSessions, startDate, amount } = packageData;
  const startStr = formatDateOnly(startDate);

  await Promise.all([
    sendMessage(
      studentPhone,
      `Hi ${studentName}! 🎵 Your ${duration} ${instrument} package with ${teacherName} is confirmed! ${totalSessions} sessions starting ${startStr}. Amount paid: ₹${amount}. MyMusic Tutor`
    ),
    sendMessage(
      teacherPhone,
      `Hi ${teacherName}! 🎵 New package booking! ${studentName} has booked a ${duration} ${instrument} package. ${totalSessions} sessions starting ${startStr}. MyMusic Tutor`
    )
  ]);
};

const sendSessionReminder24hr = async (studentPhone, teacherPhone, sessionData) => {
  const { studentName, teacherName, instrument, scheduledAt, studentAddress } = sessionData;
  const timeStr = formatTimeOnly(scheduledAt);

  await Promise.all([
    sendMessage(
      studentPhone,
      `Hi ${studentName}! 🎸 Reminder: Your ${instrument} class with ${teacherName} is tomorrow at ${timeStr}. Get ready! MyMusic Tutor`
    ),
    sendMessage(
      teacherPhone,
      `Hi ${teacherName}! 🎸 Reminder: ${instrument} class with ${studentName} is tomorrow at ${timeStr}. Address: ${studentAddress || 'Shared separately'}. MyMusic Tutor`
    )
  ]);
};

const sendSessionReminder2hr = async (studentPhone, teacherPhone, sessionData) => {
  const { studentName, teacherName, instrument, scheduledAt, studentAddress } = sessionData;
  const timeStr = formatTimeOnly(scheduledAt);

  await Promise.all([
    sendMessage(
      studentPhone,
      `Hi ${studentName}! ⏰ Your ${instrument} class starts in 2 hours at ${timeStr}. Your teacher ${teacherName} is on the way! MyMusic Tutor`
    ),
    sendMessage(
      teacherPhone,
      `Hi ${teacherName}! ⏰ ${instrument} class with ${studentName} starts in 2 hours at ${timeStr}. Address: ${studentAddress || 'Shared separately'}. MyMusic Tutor`
    )
  ]);
};

const sendSessionReminder15min = async (studentPhone, teacherPhone, sessionData) => {
  const { studentName, teacherName, instrument } = sessionData;

  await Promise.all([
    sendMessage(
      studentPhone,
      `Hi ${studentName}! 🎵 Your teacher ${teacherName} will arrive in about 15 minutes. Please be ready! MyMusic Tutor`
    ),
    sendMessage(
      teacherPhone,
      `Hi ${teacherName}! 🎵 You should be arriving at ${studentName}'s home in 15 minutes for the ${instrument} class. MyMusic Tutor`
    )
  ]);
};

const sendTeacherApproved = async (teacherPhone, teacherName) => {
  await sendMessage(
    teacherPhone,
    `Hi ${teacherName}! 🎉 Congratulations! Your MyMusic Tutor profile has been approved. You can now receive bookings. Start earning today! MyMusic Tutor`
  );
};

const sendTeacherRejected = async (teacherPhone, teacherName, reason) => {
  await sendMessage(
    teacherPhone,
    `Hi ${teacherName}, your MyMusic Tutor teacher application was not approved. Reason: ${reason}. Please contact support for help. MyMusic Tutor`
  );
};

const sendStudentAbsentAlert = async (studentPhone, sessionData) => {
  const { studentName, instrument, scheduledAt } = sessionData;
  const dateStr = formatDateOnly(scheduledAt);

  await sendMessage(
    studentPhone,
    `Hi ${studentName}, your teacher arrived for your ${instrument} class on ${dateStr} but you were not available. This session has been marked as missed. MyMusic Tutor`
  );
};

const sendTeacherAbsentAlert = async (studentPhone, adminPhone, sessionData) => {
  const { studentName, teacherName, teacherPhone, sessionId, scheduledAt } = sessionData;
  const dateStr = formatDateOnly(scheduledAt);

  await Promise.all([
    sendMessage(
      studentPhone,
      `Hi ${studentName}, we're sorry your teacher ${teacherName} was unable to make it today. A free reschedule has been added to your package. We apologize for the inconvenience. MyMusic Tutor`
    ),
    sendMessage(
      adminPhone || process.env.ADMIN_WHATSAPP_NUMBER,
      `⚠️ ALERT: Teacher ${teacherName} (${teacherPhone}) was marked absent for session ${sessionId} with student ${studentName} on ${dateStr}. Please follow up. MyMusic Tutor Admin`
    )
  ]);
};

const sendRescheduleConfirmation = async (studentPhone, teacherPhone, sessionData) => {
  const { studentName, teacherName, instrument, newScheduledAt, studentAddress } = sessionData;
  const dateStr = formatDate(newScheduledAt);

  await Promise.all([
    sendMessage(
      studentPhone,
      `Hi ${studentName}! ✅ Your ${instrument} class has been rescheduled to ${dateStr}. MyMusic Tutor`
    ),
    sendMessage(
      teacherPhone,
      `Hi ${teacherName}! ✅ Session with ${studentName} rescheduled to ${dateStr}. Address: ${studentAddress || 'Shared separately'}. MyMusic Tutor`
    )
  ]);
};

const sendDisputeRaised = async (adminPhone, disputeData) => {
  const { studentName, teacherName, sessionId, issue } = disputeData;

  await sendMessage(
    adminPhone || process.env.ADMIN_WHATSAPP_NUMBER,
    `⚠️ New dispute raised. Student: ${studentName}. Teacher: ${teacherName}. Session: ${sessionId}. Issue: ${issue}. Please review in admin dashboard. MyMusic Tutor`
  );
};

const sendCustomMessage = async (phone, message) => {
  await sendMessage(phone, message);
};

const sendBulkMessage = async (phones, message) => {
  await Promise.all(phones.map(phone => sendMessage(phone, message)));
};

module.exports = {
  sendBookingConfirmation,
  sendPackageConfirmation,
  sendSessionReminder24hr,
  sendSessionReminder2hr,
  sendSessionReminder15min,
  sendTeacherApproved,
  sendTeacherRejected,
  sendStudentAbsentAlert,
  sendTeacherAbsentAlert,
  sendRescheduleConfirmation,
  sendDisputeRaised,
  sendCustomMessage,
  sendBulkMessage
};
