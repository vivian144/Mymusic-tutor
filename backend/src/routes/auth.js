const express = require('express');
const router = express.Router();
const passport = require('../config/passport');

const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  phoneValidation,
  newPasswordValidation
} = require('../middleware/validate');

// ─── Existing Routes ──────────────────────────────────────────────────────────
router.post('/register', registerValidation, authController.register);
router.post('/login',    loginValidation,    authController.login);
router.post('/refresh',                      authController.refresh);
router.get('/me',        protect,            authController.getMe);
router.post('/logout',   protect,            authController.logout);

// ─── Feature 1: Password Reset ────────────────────────────────────────────────
// Rate limit (3/hr per phone) is enforced inside passwordResetService
router.post('/forgot-password',   phoneValidation,                       authController.forgotPassword);
router.post('/verify-reset-otp',                                         authController.verifyResetOtp);
router.post('/reset-password',    phoneValidation, newPasswordValidation, authController.resetPassword);

// ─── Feature 2: Phone OTP Login ───────────────────────────────────────────────
// Rate limit (5/15 min per phone) is enforced inside authService.sendLoginOTP
router.post('/send-otp',   phoneValidation, authController.sendLoginOtp);
router.post('/verify-otp',                  authController.verifyLoginOtp);

// ─── Feature 3: Google OAuth ──────────────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/failed`
  }),
  authController.googleCallback
);

// ─── Feature 4: Email Verification ───────────────────────────────────────────
router.post('/send-verification-email', protect, authController.sendVerificationEmail);
router.get('/verify-email/:token',               authController.verifyEmailToken);

// ─── Feature 5: Phone Verification ───────────────────────────────────────────
// Rate limit (5/hr per phone) is enforced inside authService.sendPhoneVerificationOTP
router.post('/send-phone-verification', protect, authController.sendPhoneVerification);
router.post('/verify-phone',            protect, authController.verifyPhone);

module.exports = router;
