const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Session } = require('../models');
const onlineService = require('../services/onlineSessionService');

// Resolves the session and verifies the caller is a participant or admin.
// Returns the session instance, or writes a 403/404 response and returns null.
const resolveSession = async (req, res) => {
  const session = await Session.findByPk(req.params.id);
  if (!session) {
    res.status(404).json({ success: false, message: 'Session not found' });
    return null;
  }
  const { id: userId, role } = req.user;
  if (role !== 'admin' && session.studentId !== userId && session.teacherId !== userId) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return null;
  }
  return session;
};

// POST /api/online/session/:id/room — create Daily.co room
router.post('/session/:id/room', protect, async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;
    const room = await onlineService.createRoom(req.params.id);
    res.json({ success: true, message: 'Room created', data: { room } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
});

// GET /api/online/session/:id/room — get room details
router.get('/session/:id/room', protect, async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;
    res.json({
      success: true,
      message: 'Room details retrieved',
      data: {
        onlineRoomUrl: session.onlineRoomUrl,
        onlineRoomId: session.onlineRoomId
      }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
});

// POST /api/online/session/:id/chat — send chat message
router.post('/session/:id/chat', protect, async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const entry = await onlineService.logChatMessage(req.params.id, req.user.id, message.trim());
    res.json({ success: true, message: 'Message sent', data: { entry } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
});

// GET /api/online/session/:id/chat — get chat history
router.get('/session/:id/chat', protect, async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;
    res.json({
      success: true,
      message: 'Chat history retrieved',
      data: { chatLog: session.chatLog || [] }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
});

// POST /api/online/session/:id/end — close room and save recording URL
router.post('/session/:id/end', protect, async (req, res, next) => {
  try {
    const session = await resolveSession(req, res);
    if (!session) return;

    let sessionRecordingUrl = null;

    if (session.onlineRoomId) {
      await onlineService.closeRoom(session.onlineRoomId);
      try {
        const recording = await onlineService.getRecording(session.onlineRoomId);
        sessionRecordingUrl = recording.download_url || recording.s3key || null;
      } catch (recErr) {
        // Recording may not be ready immediately — log and continue
        console.warn('[Online] Recording not yet available:', recErr.message);
      }
    }

    await session.update({ sessionRecordingUrl });

    res.json({
      success: true,
      message: 'Session ended',
      data: { sessionRecordingUrl }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
});

// GET /api/online/session/:id/recording — admin only
router.get('/session/:id/recording', protect, authorize('admin'), async (req, res, next) => {
  try {
    const session = await Session.findByPk(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (!session.onlineRoomId) {
      return res.status(404).json({ success: false, message: 'No online room found for this session' });
    }
    const recording = await onlineService.getRecording(session.onlineRoomId);
    res.json({ success: true, message: 'Recording retrieved', data: { recording } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
});

module.exports = router;
