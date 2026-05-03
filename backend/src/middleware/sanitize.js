const sanitizeHtml = require('sanitize-html');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

const sanitizeOptions = { allowedTags: [], allowedAttributes: {} };

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeHtml(obj[key], sanitizeOptions);
    } else if (obj[key] && typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
};

const xssClean = (req, res, next) => {
  sanitizeObject(req.body);
  sanitizeObject(req.query);
  sanitizeObject(req.params);
  next();
};

// ─── Specific Field Validators / Normalizers ──────────────────────────────────
// Applied before route handlers to normalise and reject obviously bad inputs.

const VALID_INSTRUMENTS = ['guitar', 'drums', 'keyboard'];

const validateSpecificFields = (req, res, next) => {
  const body = req.body;
  if (!body || typeof body !== 'object') return next();

  // email: force lowercase + trim (no rejection here — format validated in registerValidation)
  if (body.email !== undefined) {
    body.email = String(body.email).toLowerCase().trim();
  }

  // phone: strip formatting chars
  if (body.phone !== undefined) {
    body.phone = String(body.phone).replace(/[\s\-()]/g, '');
    if (!/^[6-9]\d{9}$/.test(body.phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Must be a 10-digit Indian mobile number starting with 6-9.'
      });
    }
  }

  // grade: integer 0–8
  if (body.grade !== undefined) {
    const grade = Number(body.grade);
    if (!Number.isInteger(grade) || grade < 0 || grade > 8) {
      return res.status(400).json({ success: false, message: 'grade must be an integer between 0 and 8.' });
    }
    body.grade = grade;
  }

  // rating: integer 1–5
  if (body.rating !== undefined) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'rating must be an integer between 1 and 5.' });
    }
    body.rating = rating;
  }

  // amount: positive number — server always recalculates; reject if negative/zero
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be a positive number.' });
    }
    body.amount = amount;
  }

  // role: never allow admin from API
  if (body.role !== undefined) {
    if (!['student', 'teacher'].includes(String(body.role))) {
      return res.status(400).json({ success: false, message: 'role must be student or teacher.' });
    }
  }

  // instrument: allow only defined values
  if (body.instrument !== undefined) {
    if (!VALID_INSTRUMENTS.includes(String(body.instrument))) {
      return res.status(400).json({
        success: false,
        message: `instrument must be one of: ${VALID_INSTRUMENTS.join(', ')}.`
      });
    }
  }

  next();
};

module.exports = {
  xssClean,
  preventHPP:            hpp(),
  mongoSanitize:         mongoSanitize(),
  validateSpecificFields
};
