const User = require('./User');
const TeacherProfile = require('./TeacherProfile');
const StudentProfile = require('./StudentProfile');
const Package = require('./Package');
const Session = require('./Session');
const ExamCenter = require('./ExamCenter');
const ActiveCity = require('./ActiveCity');

// User → TeacherProfile
User.hasOne(TeacherProfile, { foreignKey: 'userId', as: 'teacherProfile' });
TeacherProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → StudentProfile
User.hasOne(StudentProfile, { foreignKey: 'userId', as: 'studentProfile' });
StudentProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Package relationships
User.hasMany(Package, { foreignKey: 'studentId', as: 'studentPackages' });
User.hasMany(Package, { foreignKey: 'teacherId', as: 'teacherPackages' });
Package.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Package.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// Session relationships
Package.hasMany(Session, { foreignKey: 'packageId', as: 'sessions' });
Session.belongsTo(Package, { foreignKey: 'packageId', as: 'package' });
User.hasMany(Session, { foreignKey: 'studentId', as: 'studentSessions' });
User.hasMany(Session, { foreignKey: 'teacherId', as: 'teacherSessions' });
Session.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Session.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

module.exports = {
  User,
  TeacherProfile,
  StudentProfile,
  Package,
  Session,
  ExamCenter,
  ActiveCity
};