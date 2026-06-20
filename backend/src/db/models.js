import sequelize from './index.js'
import User from '../models/User.js'
import Driver from '../models/Driver.js'
import Tour from '../models/Tour.js'
import TourVersion from '../models/TourVersion.js'
import TourSchedule from '../models/TourSchedule.js'
import Order from '../models/Order.js'
import OrderItem from '../models/OrderItem.js'
import CleaningTask from '../models/CleaningTask.js'
import ReminderRule from '../models/ReminderRule.js'
import Reminder from '../models/Reminder.js'
import InventoryLog from '../models/InventoryLog.js'

Tour.hasMany(TourVersion, { foreignKey: 'tourId', as: 'versions' })
TourVersion.belongsTo(Tour, { foreignKey: 'tourId', as: 'tour' })

Tour.hasMany(TourSchedule, { foreignKey: 'tourId', as: 'schedules' })
TourSchedule.belongsTo(Tour, { foreignKey: 'tourId', as: 'tour' })

TourSchedule.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' })
Driver.hasMany(TourSchedule, { foreignKey: 'driverId', as: 'schedules' })

Tour.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' })
User.hasMany(Tour, { foreignKey: 'operatorId', as: 'tours' })

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' })
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })

OrderItem.belongsTo(Tour, { foreignKey: 'tourId', as: 'tour' })
OrderItem.belongsTo(TourSchedule, { foreignKey: 'scheduleId', as: 'schedule' })

Order.belongsTo(User, { foreignKey: 'confirmedBy', as: 'confirmer' })
Order.belongsTo(User, { foreignKey: 'refundedBy', as: 'refunder' })

CleaningTask.belongsTo(TourSchedule, { foreignKey: 'scheduleId', as: 'schedule' })
CleaningTask.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' })

Reminder.belongsTo(ReminderRule, { foreignKey: 'ruleId', as: 'rule' })

InventoryLog.belongsTo(TourSchedule, { foreignKey: 'scheduleId', as: 'schedule' })
InventoryLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
InventoryLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' })

TourVersion.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' })
TourVersion.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' })

ReminderRule.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' })

export {
  sequelize,
  User,
  Driver,
  Tour,
  TourVersion,
  TourSchedule,
  Order,
  OrderItem,
  CleaningTask,
  ReminderRule,
  Reminder,
  InventoryLog
}
