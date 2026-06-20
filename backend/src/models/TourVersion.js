import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const TourVersion = sequelize.define('TourVersion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tourId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '版本内容(JSON格式)'
  },
  changeLog: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tour_versions',
  timestamps: true
})

export default TourVersion
