const { Session } = require('../models');

const DAILY_API_BASE = 'https://api.daily.co/v1';

const SUSPICIOUS_PATTERNS = [
  { pattern: /[6-9]\d{9}/, reason: 'phone number' },
  { pattern: /(http|www|\.com|\.in|whatsapp)/i, reason: 'external link or platform' },
  { pattern: /\S+@\S+\.\S+/, reason: 'email address' }
];

const dailyRequest = async (method, path, body = null) => {
  const apiKey = process.env.DAILY_CO_API_KEY;
  if (!apiKey) {
    const err = new Error('Daily.co API key is not configured'); err.status = 503; throw err;
  }
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    }
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${DAILY_API_BASE}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    const err = new Error(`Daily.co API error (${response.status}): ${text}`);
    err.status = response.status >= 500 ? 502 : response.status;
    throw err;
  }
  if (response.status === 204) return null;
  return response.json();
};

const createRoom = async (sessionId) => {
  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }
  if (!session.isOnline) {
    const err = new Error('Session is not marked as an online session'); err.status = 400; throw err;
  }

  const roomName = `mmt-${sessionId}`;
  // Room expires 30 min after the scheduled session ends
  const expiryEpoch = Math.floor(new Date(session.scheduledAt).getTime() / 1000)
    + (session.durationMinutes + 30) * 60;

  const room = await dailyRequest('POST', '/rooms', {
    name: roomName,
    privacy: 'private',
    properties: {
      exp: expiryEpoch,
      max_participants: 2,
      enable_chat: false,
      enable_recording: 'cloud'
    }
  });

  await session.update({
    onlineRoomUrl: room.url,
    onlineRoomId: room.name
  });

  return room;
};

const closeRoom = async (roomId) => {
  await dailyRequest('DELETE', `/rooms/${roomId}`);
  return { closed: true };
};

const getRecording = async (roomId) => {
  const data = await dailyRequest('GET', `/recordings?room_name=${encodeURIComponent(roomId)}`);
  const recording = data?.data?.[0];
  if (!recording) {
    const err = new Error('No recording found for this session'); err.status = 404; throw err;
  }
  return recording;
};

const flagSuspiciousContent = (message) => {
  for (const { pattern, reason } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(message)) {
      return { flagged: true, reason };
    }
  }
  return { flagged: false, reason: null };
};

const logChatMessage = async (sessionId, userId, message) => {
  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('Session not found'); err.status = 404; throw err;
  }

  const suspicion = flagSuspiciousContent(message);

  const entry = {
    userId,
    message,
    timestamp: new Date().toISOString(),
    flagged: suspicion.flagged,
    ...(suspicion.reason && { flagReason: suspicion.reason })
  };

  const updatedLog = [...(session.chatLog || []), entry];
  await session.update({ chatLog: updatedLog });

  if (suspicion.flagged) {
    console.warn(
      `[CHAT] Suspicious content in session ${sessionId} from user ${userId}: ${suspicion.reason}`
    );
  }

  return entry;
};

module.exports = { createRoom, closeRoom, getRecording, logChatMessage, flagSuspiciousContent };
