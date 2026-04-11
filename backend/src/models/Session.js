const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  packageId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Packages', key: 'id' }
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  teacherId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  },
  status: {
    type: DataTypes.ENUM(
      'scheduled',
      'completed',
      'cancelled',
      'rescheduled',
      'student_absent',
      'teacher_absent'
    ),
    defaultValue: 'scheduled'
  },
  teacherNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'What was covered in this session'
  },
  homework: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  studentRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  studentReview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  teacherRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 }
  },
  reminder24Sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder2Sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reminder15Sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Session;