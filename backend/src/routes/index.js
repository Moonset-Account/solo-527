import { Router } from 'express'
import {
  loginController,
  profileController,
  logoutController
} from '../controllers/authController.js'
import { authMiddleware } from '../middleware/auth.js'
import {
  dashboardStats,
  anomalies
} from '../controllers/dashboardController.js'
import {
  listTours,
  getTour,
  createTourController,
  updateTourController,
  deleteTourController,
  listSchedules,
  createScheduleController,
  updateScheduleController
} from '../controllers/tourController.js'
import {
  listOrders,
  getOrder,
  createOrderController,
  confirmOrderController,
  refundOrderController,
  cancelOrderController
} from '../controllers/orderController.js'
import {
  inventorySummary,
  inventoryDetail,
  inventoryLogs,
  adjustInventoryController
} from '../controllers/inventoryController.js'
import {
  listCleaningTasks,
  getCleaningTask,
  createCleaningTaskController,
  updateCleaningTaskController,
  deleteCleaningTaskController
} from '../controllers/cleaningTaskController.js'
import {
  listReminders,
  unreadCount,
  markAsReadController,
  markAllAsReadController,
  listReminderRules,
  createReminderRuleController,
  updateReminderRuleController,
  deleteReminderRuleController,
  triggerDriverDelay
} from '../controllers/reminderController.js'
import {
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver
} from '../controllers/driverController.js'

const router = Router()

router.post('/auth/login', loginController)
router.post('/auth/logout', authMiddleware, logoutController)
router.get('/auth/profile', authMiddleware, profileController)

router.get('/dashboard/stats', authMiddleware, dashboardStats)
router.get('/dashboard/anomalies', authMiddleware, anomalies)

router.get('/tours', authMiddleware, listTours)
router.get('/tours/:id', authMiddleware, getTour)
router.post('/tours', authMiddleware, createTourController)
router.put('/tours/:id', authMiddleware, updateTourController)
router.delete('/tours/:id', authMiddleware, deleteTourController)

router.get('/schedules', authMiddleware, listSchedules)
router.post('/schedules', authMiddleware, createScheduleController)
router.put('/schedules/:id', authMiddleware, updateScheduleController)

router.get('/orders', authMiddleware, listOrders)
router.get('/orders/:id', authMiddleware, getOrder)
router.post('/orders', authMiddleware, createOrderController)
router.post('/orders/:id/confirm', authMiddleware, confirmOrderController)
router.post('/orders/:id/refund', authMiddleware, refundOrderController)
router.post('/orders/:id/cancel', authMiddleware, cancelOrderController)

router.get('/inventory/summary', authMiddleware, inventorySummary)
router.get('/inventory/:id/detail', authMiddleware, inventoryDetail)
router.get('/inventory/logs', authMiddleware, inventoryLogs)
router.post('/inventory/:id/adjust', authMiddleware, adjustInventoryController)

router.get('/cleaning-tasks', authMiddleware, listCleaningTasks)
router.get('/cleaning-tasks/:id', authMiddleware, getCleaningTask)
router.post('/cleaning-tasks', authMiddleware, createCleaningTaskController)
router.put('/cleaning-tasks/:id', authMiddleware, updateCleaningTaskController)
router.delete('/cleaning-tasks/:id', authMiddleware, deleteCleaningTaskController)

router.get('/reminders', authMiddleware, listReminders)
router.get('/reminders/unread-count', authMiddleware, unreadCount)
router.post('/reminders/:id/read', authMiddleware, markAsReadController)
router.post('/reminders/read-all', authMiddleware, markAllAsReadController)

router.get('/reminder-rules', authMiddleware, listReminderRules)
router.post('/reminder-rules', authMiddleware, createReminderRuleController)
router.put('/reminder-rules/:id', authMiddleware, updateReminderRuleController)
router.delete('/reminder-rules/:id', authMiddleware, deleteReminderRuleController)

router.post('/reminders/trigger-driver-delay', authMiddleware, triggerDriverDelay)

router.get('/drivers', authMiddleware, listDrivers)
router.get('/drivers/:id', authMiddleware, getDriver)
router.post('/drivers', authMiddleware, createDriver)
router.put('/drivers/:id', authMiddleware, updateDriver)
router.delete('/drivers/:id', authMiddleware, deleteDriver)

export default router
