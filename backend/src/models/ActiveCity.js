const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActiveCity = sequelize.define('ActiveCity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cityName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'active_cities',
  timestamps: true
});

module.exports = ActiveCity;
