import { DataTypes } from 'sequelize'
import sequelize from '../db/index.js'

const ReminderRule = sequelize.define('ReminderRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('driver_delay', 'order_reminder', 'cleaning_reminder', 'inventory_alert'),
    allowNull: false
  },
  level: {
    type: DataTypes.ENUM('normal', 'imminent', 'urgent'),
    defaultValue: 'normal',
    comment: '普通消息、临期提醒、紧急告警'
  },
  triggerCondition: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '触发条件'
  },
  notificationChannels: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['system'],
    comment: '通知渠道: system, sms, email, wechat'
  },
  recipientRoles: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['operator'],
    comment: '接收角色'
  },
  template: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'reminder_rules',
  timestamps: true
})

export default ReminderRule
