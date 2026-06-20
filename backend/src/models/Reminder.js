import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const Reminder = sequelize.define('Reminder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ruleId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('driver_delay', 'order_reminder', 'cleaning_reminder', 'inventory_alert', 'system'),
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('normal', 'imminent', 'urgent'),
    defaultValue: 'normal'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联业务ID'
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  recipientIds: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: []
  },
  readBy: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('unread', 'read', 'archived'),
    defaultValue: 'unread'
  },
  triggeredAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'reminders',
  timestamps: true
})

export default Reminder
