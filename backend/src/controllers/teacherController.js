const teacherService = require('../services/teacherService');

const getProfile = async (req, res, next) => {
  try {
    const data = await teacherService.getTeacherProfile(req.user.id);
    res.json({ success: true, message: 'Teacher profile retrieved', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await teacherService.updateTeacherProfile(req.user.id, req.body);
    res.json({ success: true, message: 'Profile updated successfully', data: { profile } });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const setAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body;
    if (!availability || typeof availability !== 'object' || Array.isArray(availability)) {
      return res.status(400).json({ success: false, message: 'Availability must be a valid object' });
    }
    const profile = await teacherService.setAvailability(req.user.id, availability);
    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: { availability: profile.availability }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const searchTeachers = async (req, res, next) => {
  try {
    const { instrument, grade, latitude, longitude } = req.query;
    const teachers = await teacherService.getAvailableTeachers(instrument, grade, latitude, longitude);
    res.json({
      success: true,
      message: 'Teachers retrieved successfully',
      data: { teachers, count: teachers.length }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const getPendingTeachers = async (req, res, next) => {
  try {
    const teachers = await teacherService.getPendingTeachers();
    res.json({
      success: true,
      message: 'Pending teachers retrieved',
      data: { teachers, count: teachers.length }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const approveTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const profile = await teacherService.approveTeacher(id, status, note);
    res.json({
      success: true,
      message: `Teacher ${status} successfully`,
      data: { profile }
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const getEarnings = async (req, res, next) => {
  try {
    const data = await teacherService.getTeacherEarnings(req.user.id);
    res.json({ success: true, message: 'Earnings retrieved successfully', data });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const sessions = await teacherService.getTeacherSessions(req.user.id);
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

module.exports = {
  getProfile,
  updateProfile,
  setAvailability,
  searchTeachers,
  getPendingTeachers,
  approveTeacher,
  getEarnings,
  getSessions
};
