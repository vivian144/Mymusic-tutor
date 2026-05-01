const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { User, Session } = require('../models');
const { Op } = require('sequelize');
const { sendCustomMessage, sendBulkMessage } = require('../services/notificationService');
const { reminderQueue, scheduleReminders } = require('../jobs/reminderQueue');

// POST /api/notifications/test
// Send a test WhatsApp to verify Twilio setup
router.post('/test', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'phone and message are required' });
    }
    await sendCustomMessage(phone, message);
    res.json({ success: true, message: 'Test message sent', to: phone });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/bulk
// Send a message to all students or all teachers
router.post('/bulk', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { role, message } = req.body;
    const validRoles = ['student', 'teacher', 'all'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `role must be one of: ${validRoles.join(', ')}` });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const where = { isActive: true };
    if (role !== 'all') where.role = role;

    const users = await User.findAll({
      where,
      attributes: ['id', 'fullName', 'phone', 'whatsappNumber']
    });

    const phones = users.map(u => u.whatsappNumber || u.phone).filter(Boolean);
    await sendBulkMessage(phones, message.trim());

    res.json({ success: true, message: 'Bulk message sent', sent: phones.length, role });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/pending-reminders
// Sessions in next 24hrs that haven't had their 24hr reminder sent yet
router.get('/pending-reminders', protect, authorize('admin'), async (req, res, next) => {
  try {
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

    res.json({ success: true, data: { sessions, count: sessions.length } });
  } catch (err) {
    next(err);
  }
});

// POST /api/notifications/trigger/:sessionId
// Manually trigger all pending reminders for a specific session
router.post('/trigger/:sessionId', protect, authorize('admin'), async (req, res, next) => {
  try {
    const session = await Session.findByPk(req.params.sessionId, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'fullName', 'phone', 'whatsappNumber'] },
        { model: User, as: 'teacher', attributes: ['id', 'fullName', 'phone', 'whatsappNumber'] }
      ]
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'Reminders can only be triggered for scheduled sessions' });
    }

    // Cancel existing queued jobs and reschedule fresh
    await scheduleReminders(session);

    res.json({
      success: true,
      message: 'Reminders rescheduled in queue',
      sessionId: session.id,
      scheduledAt: session.scheduledAt
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
