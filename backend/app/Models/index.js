import sequelize from '../../config/database.js'

import User from './User.js'
import Driver from './Driver.js'
import Tour from './Tour.js'
import TourVersion from './TourVersion.js'
import TourSchedule from './TourSchedule.js'
import Order from './Order.js'
import OrderItem from './OrderItem.js'
import CleaningTask from './CleaningTask.js'
import ReminderRule from './ReminderRule.js'
import Reminder from './Reminder.js'
import InventoryLog from './InventoryLog.js'

const models = {
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
  InventoryLog,
}

Object.keys(models).forEach((modelName) => {
  if (typeof models[modelName].associate === 'function') {
    models[modelName].associate(models)
  }
})

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
  InventoryLog,
}

export default models
