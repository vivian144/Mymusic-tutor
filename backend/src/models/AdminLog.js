const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminLog = sequelize.define('AdminLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  targetType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  targetId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  }
}, {
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['adminId'] },
    { fields: ['action'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = AdminLog;
