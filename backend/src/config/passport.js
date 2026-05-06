const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, StudentProfile } = require('../models');

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('[Auth] Google OAuth not configured — set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.');
} else {
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      if (!email) {
        return done(new Error('No email returned from Google. Please ensure email access is granted.'));
      }

      // 1. Already linked via googleId
      let user = await User.findOne({ where: { googleId: profile.id } });
      if (user) {
        return done(null, { user, isNew: false, requiresPhone: !user.phone });
      }

      // 2. Email exists — link Google account to existing user
      user = await User.findOne({ where: { email } });
      if (user) {
        await user.update({ googleId: profile.id, emailVerified: true });
        return done(null, { user, isNew: false, requiresPhone: !user.phone });
      }

      // 3. Brand new user — create account with defaults
      user = await User.create({
        fullName:      profile.displayName || email.split('@')[0],
        email,
        googleId:      profile.id,
        role:          'student',
        emailVerified: true,
        isActive:      true
      });

      // Create minimal student profile; user will complete it later
      await StudentProfile.create({
        userId:      user.id,
        learningGoal: 'hobby'
      });

      return done(null, { user, isNew: true, requiresPhone: true });
    } catch (err) {
      return done(err);
    }
  }
));

// No serializeUser/deserializeUser — we use JWT only (session: false)
} // end Google OAuth conditional

module.exports = passport;
