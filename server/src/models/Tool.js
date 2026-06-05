const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tool = sequelize.define('Tool', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  qrCode: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  deposit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  isValuable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('available', 'borrowed', 'maintenance', 'retired'),
    defaultValue: 'available'
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalBorrows: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Tool;
