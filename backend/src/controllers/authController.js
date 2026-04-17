const authService = require('../services/authService');
const { User, TeacherProfile, StudentProfile } = require('../models');

const register = async (req, res, next) => {
  try {
    const { token, user } = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { token, user }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login(email, password);
    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user }
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const includeOptions = [];
    if (req.user.role === 'teacher') {
      includeOptions.push({ model: TeacherProfile, as: 'teacherProfile' });
    } else if (req.user.role === 'student') {
      includeOptions.push({ model: StudentProfile, as: 'studentProfile' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: includeOptions
    });

    res.json({
      success: true,
      message: 'Profile retrieved',
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

const refresh = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.refreshToken(token);

    res.json({
      success: true,
      message: 'Token refreshed',
      data: result
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

module.exports = { register, login, getMe, logout, refresh };
