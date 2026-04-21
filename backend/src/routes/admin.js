const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Every admin route requires authentication AND admin role
router.use(protect, authorize('admin'));

// ─── Dashboard & Stats ────────────────────────────────────────────────────────
router.get('/dashboard',          adminController.getDashboard);
router.get('/stats/revenue',      adminController.getRevenueReport);
router.get('/stats/cities',       adminController.getCityStats);

// ─── Teacher Management ───────────────────────────────────────────────────────
router.get('/teachers',               adminController.getAllTeachers);
router.get('/teachers/pending',       adminController.getPendingTeachers);
router.get('/teachers/payouts',       adminController.getTeacherPayouts);
router.put('/teachers/:id/approve',   adminController.approveTeacher);
router.put('/teachers/:id/flag',      adminController.flagTeacher);
router.delete('/teachers/:id',        adminController.removeTeacher);
router.post('/teachers/:id/payout',   adminController.processTeacherPayout);

// ─── Student Management ───────────────────────────────────────────────────────
router.get('/students',               adminController.getAllStudents);

// ─── User Suspension (students & teachers) ────────────────────────────────────
router.put('/users/:id/suspend',      adminController.suspendUser);
router.put('/users/:id/reactivate',   adminController.reactivateUser);

// ─── Booking & Session Management ─────────────────────────────────────────────
router.get('/bookings',                       adminController.getAllBookings);
router.put('/sessions/:id/reschedule',        adminController.overrideReschedule);
router.put('/sessions/:id/complete',          adminController.forceCompleteSession);
router.get('/disputes',                       adminController.getAllDisputes);
router.put('/disputes/:id/resolve',           adminController.resolveDispute);

// ─── WhatsApp Notifications ────────────────────────────────────────────────────
router.post('/notify/user',   adminController.sendPlatformNotification);
router.post('/notify/bulk',   adminController.sendBulkNotification);

// ─── First Class & Package Oversight ─────────────────────────────────────────
router.get('/first-class/usage',       adminController.viewFirstClassUsage);
router.get('/packages/conversions',    adminController.viewPackageConversions);

// ─── Reminder System ───────────────────────────────────────────────────────────
router.get('/reminders/pending',       adminController.viewPendingReminders);
router.post('/reminders/:id/trigger',  adminController.triggerReminder);

// ─── Exam Center Management ────────────────────────────────────────────────────
router.get('/exam-centers',        adminController.getAllExamCenters);
router.post('/exam-centers',       adminController.addExamCenter);
router.put('/exam-centers/:id',    adminController.updateExamCenter);
router.delete('/exam-centers/:id', adminController.removeExamCenter);

// ─── City / Expansion Management ──────────────────────────────────────────────
router.get('/cities',                    adminController.getCities);
router.post('/cities',                   adminController.addCity);
router.get('/cities/:city/readiness',    adminController.getCityReadiness);

module.exports = router;
