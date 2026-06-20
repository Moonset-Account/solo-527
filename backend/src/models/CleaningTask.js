import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const CleaningTask = sequelize.define('CleaningTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  scheduleId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  vehiclePlate: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  cleaningType: {
    type: DataTypes.ENUM('daily', 'deep', 'emergency'),
    defaultValue: 'daily'
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  scheduledTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  assigneeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '负责人'
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'cleaning_tasks',
  timestamps: true
})

export default CleaningTask
