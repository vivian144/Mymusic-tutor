const bookingService = require('../services/bookingService');

const createFirstClassBooking = async (req, res, next) => {
  try {
    const { teacherId, scheduledAt, instrument, grade } = req.body;

    if (!teacherId || !scheduledAt || !instrument || grade === undefined) {
      return res.status(400).json({
        success: false,
        message: 'teacherId, scheduledAt, instrument, and grade are required'
      });
    }

    const data = await bookingService.createFirstClassBooking(
      req.user.id,
      teacherId,
      scheduledAt,
      instrument,
      Number(grade)
    );

    res.status(201).json({
      success: true,
      message: 'First class booking created. Complete payment to confirm.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const createPackageBooking = async (req, res, next) => {
  try {
    const { teacherId, packageType, instrument, grade, sessionsPerWeek } = req.body;

    if (!teacherId || !packageType || !instrument || grade === undefined || !sessionsPerWeek) {
      return res.status(400).json({
        success: false,
        message: 'teacherId, packageType, instrument, grade, and sessionsPerWeek are required'
      });
    }

    const data = await bookingService.createPackageBooking(
      req.user.id,
      teacherId,
      packageType,
      instrument,
      Number(grade),
      Number(sessionsPerWeek)
    );

    res.status(201).json({
      success: true,
      message: 'Package booking created. Complete payment to confirm and schedule sessions.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId is required' });
    }

    const data = await bookingService.confirmBooking(id, paymentId);

    res.json({
      success: true,
      message: data.type === 'package'
        ? `Package confirmed. ${data.sessionCount} sessions have been scheduled.`
        : 'First class booking confirmed.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await bookingService.cancelBooking(id, req.user.id);

    res.json({
      success: true,
      message: `${data.type === 'package' ? 'Package' : 'Session'} cancelled successfully.`,
      data
    });
  } catch (err) {
    next(err);
  }
};

const rescheduleSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newScheduledAt } = req.body;

    if (!newScheduledAt) {
      return res.status(400).json({ success: false, message: 'newScheduledAt is required' });
    }

    const data = await bookingService.rescheduleSession(id, req.user.id, newScheduledAt);

    res.json({
      success: true,
      message: 'Session rescheduled successfully.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, homework } = req.body;

    if (!notes) {
      return res.status(400).json({ success: false, message: 'Session notes are required' });
    }

    const data = await bookingService.completeSession(id, req.user.id, notes, homework);

    res.json({
      success: true,
      message: 'Session marked as complete.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const markStudentAbsent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await bookingService.markStudentAbsent(id, req.user.id);

    res.json({
      success: true,
      message: 'Student marked as absent. Session counts as used.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const markTeacherAbsent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await bookingService.markTeacherAbsent(id, req.user.id);

    res.json({
      success: true,
      message: data.freeRescheduleAdded
        ? 'Teacher marked as absent. A free reschedule has been added to your package.'
        : 'Teacher marked as absent.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const getUpcomingSessions = async (req, res, next) => {
  try {
    const data = await bookingService.getUpcomingSessions(req.user.id, req.user.role);

    res.json({
      success: true,
      message: 'Upcoming sessions retrieved.',
      data
    });
  } catch (err) {
    next(err);
  }
};

const getBookingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await bookingService.getBookingDetails(id, req.user.id);

    res.json({
      success: true,
      message: 'Booking details retrieved.',
      data
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
