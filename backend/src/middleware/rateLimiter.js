const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

const createStore = (prefix) =>
  new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: `rateLimit:${prefix}:`
  });

const makeHandler = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

// ─── Route-Specific Limiters ──────────────────────────────────────────────────

// POST /api/auth/login — 5 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  store: createStore('auth'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many attempts. Please try again in 15 minutes.')
});

// POST /api/auth/register — 3 accounts per hour
const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  store: createStore('register'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many accounts created. Try again in 1 hour.')
});

// GET /api/teachers/search — 30 per minute
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  store: createStore('search'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many search requests. Please slow down.')
});

// POST /api/bookings/* — 10 per hour
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  store: createStore('booking'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many booking requests. Please try again later.')
});

// POST /api/payments/* — 5 per hour
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  store: createStore('payment'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many payment requests. Please try again later.')
});

// POST /api/notifications/* — 5 per hour
const notificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  store: createStore('notification'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many notification requests. Please try again later.')
});

// All /api/admin/* — 20 per 15 min
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  store: createStore('admin'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many admin requests. Please slow down.')
});

// All other routes — 100 per 15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  store: createStore('general'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Too many requests. Please try again later.')
});

// ─── Progressive Delay ─────────────────────────────────────────────────────────
// Adds a short artificial delay after repeated failed login attempts by email

const progressiveDelay = async (req, res, next) => {
  const email = req.body?.email;
  if (!email) return next();

  try {
    const key = `login_attempts:${email.toLowerCase().trim()}`;
    const attempts = parseInt(await redis.get(key) || '0', 10);

    if (attempts >= 5) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else if (attempts >= 3) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (err) {
    console.error('[RateLimit] progressiveDelay Redis error:', err.message);
  }

  next();
};

// ─── Account Lockout Helpers ──────────────────────────────────────────────────
// Tracks failed login attempts per email in Redis (separate from IP-based limits)

const checkAccountLockout = async (email) => {
  if (!email) return { locked: false };

  try {
    const normEmail = email.toLowerCase().trim();
    const lockKey = `account_lock:${normEmail}`;
    const lockTtl = await redis.ttl(lockKey);

    if (lockTtl > 0) {
      const minutesRemaining = Math.ceil(lockTtl / 60);
      return {
        locked: true,
        minutesRemaining,
        message: `Account temporarily locked. Try again in ${minutesRemaining} minute(s).`
      };
    }
  } catch (err) {
    console.error('[RateLimit] checkAccountLockout Redis error:', err.message);
  }

  return { locked: false };
};

const recordFailedLogin = async (email) => {
  if (!email) return;

  try {
    const normEmail = email.toLowerCase().trim();
    const key = `login_attempts:${normEmail}`;
    const lockKey = `account_lock:${normEmail}`;

    const attempts = await redis.incr(key);
    await redis.expire(key, 24 * 60 * 60); // 24-hour TTL on counter

    if (attempts >= 20) {
      console.warn(`[SECURITY] Account ${normEmail} has ${attempts} failed logins — flagged for admin review`);
      await redis.set(lockKey, '1', 'EX', 24 * 60 * 60); // 24-hour lock
    } else if (attempts >= 10) {
      await redis.set(lockKey, '1', 'EX', 24 * 60 * 60); // 24-hour lock
    } else if (attempts >= 5) {
      await redis.set(lockKey, '1', 'EX', 15 * 60); // 15-minute lock
    }
  } catch (err) {
    console.error('[RateLimit] recordFailedLogin Redis error:', err.message);
  }
};

const resetFailedLogins = async (email) => {
  if (!email) return;

  try {
    const normEmail = email.toLowerCase().trim();
    await Promise.all([
      redis.del(`login_attempts:${normEmail}`),
      redis.del(`account_lock:${normEmail}`)
    ]);
  } catch (err) {
    console.error('[RateLimit] resetFailedLogins Redis error:', err.message);
  }
};

module.exports = {
  authLimiter,
  strictAuthLimiter,
  searchLimiter,
  bookingLimiter,
  paymentLimiter,
  notificationLimiter,
  adminLimiter,
  generalLimiter,
  progressiveDelay,
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins
};
