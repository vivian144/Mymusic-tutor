const studentService = require('../services/studentService');

const getProfile = async (req, res, next) => {
  try {
    const data = await studentService.getStudentProfile(req.user.id);
    res.json({ success: true, message: 'Student profile retrieved', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await studentService.updateStudentProfile(req.user.id, req.body);
    res.json({ success: true, message: 'Profile updated successfully', data: { profile } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const getProgress = async (req, res, next) => {
  try {
    const data = await studentService.getStudentProgress(req.user.id);
    res.json({ success: true, message: 'Progress retrieved successfully', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await studentService.getStudentSessions(req.user.id);
    res.json({
      success: true,
      message: 'Sessions retrieved successfully',
      data: { sessions, count: sessions.length }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const getPackages = async (req, res, next) => {
  try {
    const data = await studentService.getStudentPackages(req.user.id);
    res.json({ success: true, message: 'Packages retrieved successfully', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const bookFirstClass = async (req, res, next) => {
  try {
    const canBook = await studentService.canBookFirstClass(req.user.id);
    if (!canBook) {
      return res.status(400).json({
        success: false,
        message: 'You have already used your first class. Please purchase a package to continue.'
      });
    }
    const data = await studentService.bookFirstClass(req.user.id, req.body);
    res.status(201).json({ success: true, message: data.message, data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getProgress, getSessions, getPackages, bookFirstClass };
