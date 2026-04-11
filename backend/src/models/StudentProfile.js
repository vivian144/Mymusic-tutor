const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentProfile = sequelize.define('StudentProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  parentName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For minor students'
  },
  parentPhone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  instrument: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'guitar, drums, keyboard'
  },
  currentGrade: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '0 = beginner'
  },
  targetGrade: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  syllabus: {
    type: DataTypes.STRING,
    defaultValue: 'trinity_classical'
  },
  hasInstrumentAtHome: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Special requirements or notes'
  }
}, {
  timestamps: true
});

module.exports = StudentProfile;