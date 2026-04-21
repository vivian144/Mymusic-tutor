const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  setAvailability,
  searchTeachers,
  getPendingTeachers,
  approveTeacher,
  getEarnings,
  getSessions
} = require('../controllers/teacherController');

// Static routes before param routes to avoid conflicts
router.get('/profile',      protect,                          getProfile);
router.put('/profile',      protect, authorize('teacher'),    updateProfile);
router.put('/availability', protect, authorize('teacher'),    setAvailability);
router.get('/search',       protect,                          searchTeachers);
router.get('/earnings',     protect, authorize('teacher'),    getEarnings);
router.get('/sessions',     protect, authorize('teacher'),    getSessions);
router.get('/pending',      protect, authorize('admin'),      getPendingTeachers);
router.put('/:id/approve',  protect, authorize('admin'),      approveTeacher);

module.exports = router;
