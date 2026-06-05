const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Borrow = sequelize.define('Borrow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  toolId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue', 'damaged'),
    defaultValue: 'pending'
  },
  borrowDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  expectedReturnDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  actualReturnDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  depositAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  depositStatus: {
    type: DataTypes.ENUM('unpaid', 'paid', 'refunded', 'deducted'),
    defaultValue: 'unpaid'
  },
  returnPhoto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  returnNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Borrow;
