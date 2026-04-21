const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createFirstClassBooking,
  createPackageBooking,
  confirmBooking,
  cancelBooking,
  rescheduleSession,
  completeSession,
  markStudentAbsent,
  markTeacherAbsent,
  getUpcomingSessions,
  getBookingDetails
} = require('../controllers/bookingController');

// Static routes before param routes
router.get('/upcoming',                              protect,                         getUpcomingSessions);
router.post('/first-class',                          protect, authorize('student'),   createFirstClassBooking);
router.post('/package',                              protect, authorize('student'),   createPackageBooking);
router.post('/sessions/:id/reschedule',              protect,                         rescheduleSession);
router.post('/sessions/:id/complete',               protect, authorize('teacher'),   completeSession);
router.post('/sessions/:id/student-absent',         protect, authorize('teacher'),   markStudentAbsent);
router.post('/sessions/:id/teacher-absent',         protect, authorize('student'),   markTeacherAbsent);

// Param routes last
router.post('/:id/confirm',                          protect,                         confirmBooking);
router.post('/:id/cancel',                           protect,                         cancelBooking);
router.get('/:id',                                   protect,                         getBookingDetails);

module.exports = router;
