const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeacherProfile = sequelize.define('TeacherProfile', {
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
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Years of experience'
  },
  instruments: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'guitar, drums, keyboard'
  },
  highestGrade: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Highest Trinity grade completed'
  },
  canTeachUpToGrade: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Automatically set to highestGrade - 2'
  },
  teachingMode: {
    type: DataTypes.ENUM('offline', 'online', 'both'),
    defaultValue: 'offline'
  },
  badgeLevel: {
    type: DataTypes.ENUM(
      'emerging',
      'verified',
      'senior',
      'elite',
      'experience_verified',
      'practitioner'
    ),
    defaultValue: 'emerging'
  },
  certificateType: {
    type: DataTypes.ENUM('trinity', 'rockschool', 'experience_based'),
    allowNull: true
  },
  experienceProofUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  experienceProofType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'institute_letter, performance_video, reference_letter, other'
  },
  isPractitioner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'True when no grade certificate but experience verified by admin'
  },
  syllabus: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['trinity_classical', 'trinity_rock_pop']
  },
  hourlyRate: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  serviceRadiusKm: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    comment: 'How far teacher is willing to travel'
  },
  aadhaarVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  backgroundChecked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  certificateUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  aadhaarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  introVideoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  approvalStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
    defaultValue: 'pending'
  },
  approvalNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  totalSessions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalEarnings: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  totalReviews: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  availability: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Weekly availability schedule'
  }
}, {
  timestamps: true
});

module.exports = TeacherProfile;