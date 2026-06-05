const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Maintenance = sequelize.define('Maintenance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  toolId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reporterId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('reported', 'repairing', 'completed', 'cancelled'),
    defaultValue: 'reported'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  photos: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('photos');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('photos', JSON.stringify(value || []));
    }
  },
  repairCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  repairNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  repairedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  repairedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = Maintenance;
