const crypto = require('crypto');
const redis = require('../config/redis');
const { User } = require('../models');
const { sendOTP } = require('./smsService');
const { sendCustomMessage } = require('./notificationService');
const { sendPasswordChangedEmail } = require('./emailService');
const { checkOtpRateLimit } = require('../middleware/rateLimiter');

const OTP_TTL = 10 * 60; // 10 minutes

const otpKey = (phone) => `password_reset:${phone}`;

const generateOTP = () => String(crypto.randomInt(100000, 999999));

// Normalize phone to 10-digit format for consistent DB lookups
const normalizePhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits.slice(-10);
};

const sendPasswordResetOTP = async (phone) => {
  const normalized = normalizePhone(phone);

  // Rate limit: 3 requests per hour per phone
  await checkOtpRateLimit(normalized, 'password_reset', 3, 3600);

  const user = await User.findOne({
    where: { phone: normalized },
    attributes: ['id', 'fullName', 'phone']
  });

  // Always return success regardless of whether phone is registered (don't reveal registration status)
  if (!user) return;

  const otp = generateOTP();
  await redis.set(otpKey(normalized), otp, 'EX', OTP_TTL);

  // OTP goes via SMS — works on all phones, not just WhatsApp
  await sendOTP(normalized, otp);
};

const verifyOTP = async (phone, otp) => {
  const normalized = normalizePhone(phone);
  const stored = await redis.get(otpKey(normalized));
  if (!stored) return false;
  return stored === String(otp);
};

const resetPassword = async (phone, otp, newPassword) => {
  const normalized = normalizePhone(phone);

  const stored = await redis.get(otpKey(normalized));
  if (!stored || stored !== String(otp)) {
    const err = new Error('Invalid or expired OTP'); err.status = 400; throw err;
  }

  const user = await User.findOne({ where: { phone: normalized } });
  if (!user) {
    const err = new Error('User not found'); err.status = 404; throw err;
  }

  // Bump tokenVersion to invalidate all existing JWTs for this user
  await user.update({
    password: newPassword,
    tokenVersion: (user.tokenVersion || 0) + 1
  });

  // Delete OTP immediately after use
  await redis.del(otpKey(normalized));

  // Send confirmation via WhatsApp + email (fire and forget email)
  await sendCustomMessage(
    normalized,
    `Hi ${user.fullName}! Your MyMusic Tutor password has been successfully reset. If you did not do this, contact support immediately. MyMusic Tutor`
  );

  if (user.email) {
    sendPasswordChangedEmail(user.email, user.fullName).catch(err =>
      console.error('[PasswordReset] Email confirmation failed:', err.message)
    );
  }
};

module.exports = { generateOTP, sendPasswordResetOTP, verifyOTP, resetPassword };
