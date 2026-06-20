import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const TourSchedule = sequelize.define('TourSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tourId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tourDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  booked: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'tour_schedules',
  timestamps: true,
  indexes: [
    {
      name: 'tour_date_idx',
      fields: ['tourId', 'tourDate']
    }
  ]
})

export default TourSchedule
