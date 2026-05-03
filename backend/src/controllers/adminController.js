const adminService = require('../services/adminService');

// ─── Helper ───────────────────────────────────────────────────────────────────

const handle = (serviceFn) => async (req, res, next) => {
  try {
    const data = await serviceFn(req, res);
    if (!res.headersSent) {
      res.json({ success: true, data });
    }
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ─── Dashboard & Stats ────────────────────────────────────────────────────────

const getDashboard = handle(async () => {
  return adminService.getDashboardStats();
});

const getCityStats = handle(async () => {
  return adminService.getCityStats();
});

const getRevenueReport = handle(async (req) => {
  const { startDate, endDate } = req.query;
  return adminService.getRevenueReport(startDate, endDate);
});

// ─── Teacher Management ───────────────────────────────────────────────────────

const getAllTeachers = handle(async (req) => {
  return adminService.getAllTeachers(req.query);
});

const getPendingTeachers = handle(async () => {
  return adminService.getPendingTeachers();
});

const approveTeacher = handle(async (req) => {
  const { id } = req.params;
  const { status, note } = req.body;
  if (!status) {
    const err = new Error('status is required'); err.status = 400; throw err;
  }
  return adminService.approveTeacher(id, status, note, req.user.id, req.ip);
});

const flagTeacher = handle(async (req) => {
  const { id } = req.params;
  const { reason } = req.body;
  return adminService.flagTeacher(id, reason, req.user.id, req.ip);
});

const removeTeacher = handle(async (req) => {
  const { id } = req.params;
  const { reason } = req.body;
  if (id === req.user.id) {
    const err = new Error('Admin cannot remove their own account'); err.status = 403; throw err;
  }
  return adminService.removeTeacher(id, reason, req.user.id, req.ip);
});

const getTeacherPayouts = handle(async (req) => {
  return adminService.getTeacherPayouts(req.query.status);
});

const processTeacherPayout = handle(async (req) => {
  return adminService.processTeacherPayout(req.params.id, req.user.id, req.ip);
});

// ─── Student Management ───────────────────────────────────────────────────────

const getAllStudents = handle(async (req) => {
  return adminService.getAllStudents(req.query);
});

const suspendUser = handle(async (req) => {
  const { id } = req.params;
  const { reason } = req.body;
  return adminService.suspendUser(id, reason, req.user.id, req.ip);
});

const reactivateUser = handle(async (req) => {
  return adminService.reactivateUser(req.params.id, req.user.id, req.ip);
});

// ─── Booking & Session Management ─────────────────────────────────────────────

const getAllBookings = handle(async (req) => {
  return adminService.getAllBookings(req.query);
});

const overrideReschedule = handle(async (req) => {
  const { id } = req.params;
  const { newDate } = req.body;
  if (!newDate) {
    const err = new Error('newDate is required'); err.status = 400; throw err;
  }
  return adminService.overrideReschedule(id, newDate, req.user.id, req.ip);
});

const forceCompleteSession = handle(async (req) => {
  return adminService.forceCompleteSession(req.params.id, req.user.id, req.ip);
});

const getAllDisputes = handle(async () => {
  return adminService.getAllDisputes();
});

const resolveDispute = handle(async (req) => {
  const { id } = req.params;
  const { resolution } = req.body;
  return adminService.resolveDispute(id, resolution, req.user.id, req.ip);
});

// ─── WhatsApp Management ───────────────────────────────────────────────────────

const sendPlatformNotification = handle(async (req) => {
  const { userIds, message } = req.body;
  return adminService.sendPlatformNotification(userIds, message, req.user.id, req.ip);
});

const sendBulkNotification = handle(async (req) => {
  const { role, message } = req.body;
  return adminService.sendBulkNotification(role, message, req.user.id, req.ip);
});

// ─── First Class & Package Oversight ─────────────────────────────────────────

const viewFirstClassUsage = handle(async () => {
  return adminService.viewFirstClassUsage();
});

const viewPackageConversions = handle(async () => {
  return adminService.viewPackageConversions();
});

// ─── Reminder System ───────────────────────────────────────────────────────────

const viewPendingReminders = handle(async () => {
  return adminService.viewPendingReminders();
});

const triggerReminder = handle(async (req) => {
  return adminService.triggerReminder(req.params.id, req.user.id, req.ip);
});

// ─── Exam Center Management ────────────────────────────────────────────────────

const getAllExamCenters = handle(async (req) => {
  return adminService.getAllExamCenters(req.query.city);
});

const addExamCenter = handle(async (req) => {
  return adminService.addExamCenter(req.body, req.user.id, req.ip);
});

const updateExamCenter = handle(async (req) => {
  return adminService.updateExamCenter(req.params.id, req.body, req.user.id, req.ip);
});

const removeExamCenter = handle(async (req) => {
  return adminService.removeExamCenter(req.params.id, req.user.id, req.ip);
});

// ─── City / Expansion Management ──────────────────────────────────────────────

const getCities = handle(async () => {
  return adminService.getActiveCities();
});

const addCity = handle(async (req) => {
  const { cityName, state } = req.body;
  if (!cityName || !state) {
    const err = new Error('cityName and state are required'); err.status = 400; throw err;
  }
  return adminService.addCity(cityName, state, req.user.id, req.ip);
});

const getCityReadiness = handle(async (req) => {
  return adminService.getCityExpansionReadiness(req.params.city);
});

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getDashboard,
  getCityStats,
  getRevenueReport,
  getAllTeachers,
  getPendingTeachers,
  approveTeacher,
  flagTeacher,
  removeTeacher,
  getTeacherPayouts,
  processTeacherPayout,
  getAllStudents,
  suspendUser,
  reactivateUser,
  getAllBookings,
  overrideReschedule,
  forceCompleteSession,
  getAllDisputes,
  resolveDispute,
  sendPlatformNotification,
  sendBulkNotification,
  viewFirstClassUsage,
  viewPackageConversions,
  viewPendingReminders,
  triggerReminder,
  getAllExamCenters,
  addExamCenter,
  updateExamCenter,
  removeExamCenter,
  getCities,
  addCity,
  getCityReadiness
};
