const Bull = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const reminderQueue = new Bull('session-reminders', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false
  }
});

reminderQueue.on('error', (err) => {
  console.error('[ReminderQueue] Queue error:', err.message);
});

// ─── Schedule Reminders for a Session ────────────────────────────────────────

const scheduleReminders = async (session) => {
  const sessionTime = new Date(session.scheduledAt).getTime();
  const now = Date.now();

  const jobs = [
    { type: 'reminder_24hr', offset: 24 * 60 * 60 * 1000 },
    { type: 'reminder_2hr',  offset: 2  * 60 * 60 * 1000 },
    { type: 'reminder_15min',offset: 15 * 60 * 1000 }
  ];

  for (const { type, offset } of jobs) {
    const fireAt = sessionTime - offset;
    const delay = fireAt - now;

    if (delay <= 0) {
      // Session is too close or already passed for this reminder
      continue;
    }

    const jobId = `${session.id}-${type}`;

    // Remove existing job with same ID before adding (handles reschedule case)
    const existing = await reminderQueue.getJob(jobId);
    if (existing) await existing.remove();

    await reminderQueue.add(
      { sessionId: session.id, type },
      { jobId, delay }
    );
  }
};

// ─── Cancel All Reminders for a Session ──────────────────────────────────────

const cancelReminders = async (sessionId) => {
  const types = ['reminder_24hr', 'reminder_2hr', 'reminder_15min'];

  for (const type of types) {
    const jobId = `${sessionId}-${type}`;
    try {
      const job = await reminderQueue.getJob(jobId);
      if (job) await job.remove();
    } catch (err) {
      console.error(`[ReminderQueue] Failed to cancel job ${jobId}: ${err.message}`);
    }
  }
};

module.exports = { reminderQueue, scheduleReminders, cancelReminders };
