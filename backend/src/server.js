const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
require('dotenv').config();

const { connectDB } = require('./config/database');
// Load all models (including AdminLog)
require('./models');
// Initialize passport strategies
require('./config/passport');

const authRoutes         = require('./routes/auth');
const teacherRoutes      = require('./routes/teachers');
const studentRoutes      = require('./routes/students');
const bookingRoutes      = require('./routes/bookings');
const adminRoutes        = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const onlineRoutes       = require('./routes/online');

// Security middleware
const { securityHeaders }    = require('./middleware/security');
const { xssClean, preventHPP, mongoSanitize, validateSpecificFields } = require('./middleware/sanitize');
const {
  generalLimiter, authLimiter, strictAuthLimiter,
  searchLimiter, bookingLimiter, notificationLimiter, adminLimiter,
  progressiveDelay
} = require('./middleware/rateLimiter');

// Start reminder queue processor
require('./jobs/reminderProcessor');

const app  = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// ─── FIX 6: CORS — prod allows only known origins, dev allows localhost ───────
const ALLOWED_ORIGINS_PROD = [
  'https://mymusictutor.in',
  'https://admin.mymusictutor.in'
];
const ALLOWED_ORIGINS_DEV = [
  'http://localhost:3000',
  'http://localhost:5173'
];

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.NODE_ENV === 'production'
      ? ALLOWED_ORIGINS_PROD
      : ALLOWED_ORIGINS_DEV;
    // Allow server-to-server requests (no origin header)
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    }
  },
  credentials: true,
  methods:  ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders:  ['Content-Type', 'Authorization'],
  exposedHeaders:  ['X-Total-Count']
};

// ─── Middleware stack — order matters ─────────────────────────────────────────

// 1. Security headers (helmet) — must be first
app.use(securityHeaders);

// 2. CORS
app.use(cors(corsOptions));

// 3. HTTP request logger
app.use(morgan('dev'));

// 4. General rate limiter (all routes) — before body parsing to reject early
app.use(generalLimiter);

// 5. FIX 7: Body parsers with 10kb size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 6. XSS sanitization (strips script tags from request body)
app.use(xssClean);

// 7. HTTP Parameter Pollution prevention
app.use(preventHPP);

// 8. NoSQL injection sanitization (useful for query params even on Postgres)
app.use(mongoSanitize);

// ─── Specific route-level limiters (applied before route handlers) ─────────────

// Auth routes — tighter limits with progressive delay
app.post('/api/auth/login',    progressiveDelay, authLimiter);
app.post('/api/auth/register', strictAuthLimiter);

// OTP routes — IP-level limiter as second layer (phone-based limits are in service layer)
app.post('/api/auth/forgot-password',         authLimiter);
app.post('/api/auth/reset-password',          authLimiter);
app.post('/api/auth/send-otp',                authLimiter);
app.post('/api/auth/send-phone-verification', authLimiter);

// Teacher search
app.get('/api/teachers/search', searchLimiter);

// Booking creation endpoints — 10 per hour
app.post('/api/bookings/first-class', bookingLimiter);
app.post('/api/bookings/package',     bookingLimiter);
app.post('/api/bookings/:id/confirm', bookingLimiter);

// Admin routes — 20 per 15 min
app.use('/api/admin', adminLimiter);

// Notifications — 5 per hour
app.post('/api/notifications/test',           notificationLimiter);
app.post('/api/notifications/bulk',           notificationLimiter);
app.post('/api/notifications/trigger/:id',    notificationLimiter);

// Field-level sanitization (phone, grade, role, instrument, etc.) before all routes
app.use(validateSpecificFields);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/teachers',      teacherRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/bookings',      bookingRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/online',        onlineRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MyMusic Tutor API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── FIX 7: 413 Payload Too Large handler ────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large. Maximum allowed size is 10kb.'
    });
  }
  next(err);
});

// ─── FIX 10: Global Error Handler — no stack traces in production ─────────────
app.use((err, req, res, next) => {
  // Always log full error server-side
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    status: err.status,
    url: req.originalUrl,
    method: req.method
  });

  const status = err.status || 500;

  if (process.env.NODE_ENV === 'production') {
    return res.status(status).json({
      success: false,
      // Expose message for 4xx (client errors), generic text for 5xx (server errors)
      message: status < 500 ? err.message : 'Something went wrong. Please try again later.'
    });
  }

  // Development: full error details
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    stack: err.stack
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  ================================
     MyMusic Tutor API Started
  ================================
  Server running on port ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  URL: http://localhost:${PORT}
  ================================
  `);
});

module.exports = app;
