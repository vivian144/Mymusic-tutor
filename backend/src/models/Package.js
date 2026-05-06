const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  packageType: {
    type: DataTypes.ENUM('1_month', '3_months', '6_months', '12_months'),
    allowNull: false
  },
  instrument: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gradeTarget: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  sessionsPerWeek: {
    type: DataTypes.INTEGER,
    defaultValue: 2
  },
  totalSessions: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  completedSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reschedulesAllowed: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reschedulesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  platformFee: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: '25% of total amount'
  },
  teacherEarnings: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: '75% of total amount'
  },
  status: {
    type: DataTypes.ENUM(
      'pending_payment',
      'active',
      'completed',
      'cancelled',
      'paused'
    ),
    defaultValue: 'pending_payment'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Razorpay payment ID'
  },
  learningGoal: {
    type: DataTypes.ENUM('grades', 'hobby'),
    defaultValue: 'grades'
  }
}, {
  timestamps: true
});

module.exports = Package;