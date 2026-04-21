const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getProgress,
  getSessions,
  getPackages,
  bookFirstClass
} = require('../controllers/studentController');

router.get('/profile',     protect, authorize('student'), getProfile);
router.put('/profile',     protect, authorize('student'), updateProfile);
router.get('/progress',    protect, authorize('student'), getProgress);
router.get('/sessions',    protect, authorize('student'), getSessions);
router.get('/packages',    protect, authorize('student'), getPackages);
router.post('/first-class', protect, authorize('student'), bookFirstClass);

module.exports = router;
