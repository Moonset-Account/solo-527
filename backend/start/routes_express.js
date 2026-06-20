import { Router } from 'express'
import { authMiddleware } from './middleware/auth.js'
import { createCtx } from './createCtx.js'

import * as AuthService from '../app/Services/AuthService.js'
import * as DashboardService from '../app/Services/DashboardService.js'
import * as TourService from '../app/Services/TourService.js'
import * as OrderService from '../app/Services/OrderService.js'
import * as InventoryService from '../app/Services/InventoryService.js'
import * as CleaningTaskService from '../app/Services/CleaningTaskService.js'
import * as ReminderService from '../app/Services/ReminderService.js'
import * as DriverService from '../app/Services/DriverService.js'

const router = Router()

function wrapHandler(fn) {
  return async (req, res) => {
    try {
      const ctx = createCtx(req, res)
      await fn(ctx, req, res)
    } catch (error) {
      console.error('Handler error:', error)
      res.status(500).json({
        code: 1,
        message: error.message || '服务器内部错误',
      })
    }
  }
}

router.get('/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'running',
      timestamp: new Date().toISOString(),
    },
  })
})

router.post('/api/auth/login', wrapHandler(async (ctx) => {
  const { username, password } = ctx.request.all()
  const result = await AuthService.login(username, password)
  ctx.response.json({
    code: 0,
    message: 'success',
    data: result,
  })
}))

const apiRouter = Router()
apiRouter.use(authMiddleware)

apiRouter.get('/dashboard/stats', wrapHandler(async (ctx) => {
  const result = await DashboardService.getStats()
  ctx.response.json({
    code: 0,
    message: 'success',
    data: result,
  })
}))

apiRouter.get('/dashboard/exceptions', wrapHandler(async (ctx) => {
  const result = await DashboardService.getExceptions()
  ctx.response.json({
    code: 0,
    message: 'success',
    data: result,
  })
}))

apiRouter.get('/tours', wrapHandler(async (ctx) => {
  const result = await TourService.getList(ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/tours/:id', wrapHandler(async (ctx) => {
  const result = await TourService.getDetail(ctx.params.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/tours', wrapHandler(async (ctx) => {
  const result = await TourService.create(ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.put('/tours/:id', wrapHandler(async (ctx) => {
  const result = await TourService.update(ctx.params.id, ctx.request.all())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/tours/:id/archive', wrapHandler(async (ctx) => {
  const result = await TourService.archive(ctx.params.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/tours/:id/publish', wrapHandler(async (ctx) => {
  const result = await TourService.publish(ctx.params.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/tours/:id/versions', wrapHandler(async (ctx) => {
  const result = await TourService.getVersions(ctx.params.id, ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/tours/:id/versions', wrapHandler(async (ctx) => {
  const result = await TourService.createVersion(ctx.params.id, ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/tour-versions/:id/approve', wrapHandler(async (ctx) => {
  const result = await TourService.approveVersion(ctx.params.id, ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/tour-versions/:id/reject', wrapHandler(async (ctx) => {
  const result = await TourService.rejectVersion(ctx.params.id, ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/schedules', wrapHandler(async (ctx) => {
  const result = await TourService.getSchedules(ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/schedules', wrapHandler(async (ctx) => {
  const result = await TourService.createSchedule(ctx.request.all())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.put('/schedules/:id', wrapHandler(async (ctx) => {
  const result = await TourService.updateSchedule(ctx.params.id, ctx.request.all())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/orders', wrapHandler(async (ctx) => {
  const result = await OrderService.getList(ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/orders/:id', wrapHandler(async (ctx) => {
  const result = await OrderService.getDetail(ctx.params.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/orders', wrapHandler(async (ctx) => {
  const result = await OrderService.createOrder(ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/orders/:id/confirm', wrapHandler(async (ctx) => {
  const result = await OrderService.confirmOrder(ctx.params.id, ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/orders/:id/refund', wrapHandler(async (ctx) => {
  const result = await OrderService.refundOrder(ctx.params.id, ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/orders/:id/cancel', wrapHandler(async (ctx) => {
  const result = await OrderService.cancelOrder(ctx.params.id, ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/inventory/summary', wrapHandler(async (ctx) => {
  const result = await InventoryService.getSummary(ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/inventory/:id', wrapHandler(async (ctx) => {
  const result = await InventoryService.getDetail(ctx.params.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/inventory/:id/logs', wrapHandler(async (ctx) => {
  const result = await InventoryService.getLogs(ctx.params.id, ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/inventory/:id/adjust', wrapHandler(async (ctx) => {
  const result = await InventoryService.adjustInventory(ctx.params.id, ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/cleaning-tasks', wrapHandler(async (ctx) => {
  const result = await CleaningTaskService.getList(ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/cleaning-tasks/:id', wrapHandler(async (ctx) => {
  const result = await CleaningTaskService.getDetail(ctx.params.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/cleaning-tasks', wrapHandler(async (ctx) => {
  const result = await CleaningTaskService.create(ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.put('/cleaning-tasks/:id', wrapHandler(async (ctx) => {
  const result = await CleaningTaskService.update(ctx.params.id, ctx.request.all())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/cleaning-tasks/:id/start', wrapHandler(async (ctx) => {
  const result = await CleaningTaskService.startTask(ctx.params.id, ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/cleaning-tasks/:id/complete', wrapHandler(async (ctx) => {
  const result = await CleaningTaskService.completeTask(ctx.params.id, ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/cleaning-tasks/:id/cancel', wrapHandler(async (ctx) => {
  const result = await CleaningTaskService.cancelTask(ctx.params.id, ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/reminders', wrapHandler(async (ctx) => {
  const params = { ...ctx.request.qs(), userId: ctx.auth.user.id }
  const result = await ReminderService.getList(params)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/reminders/:id/read', wrapHandler(async (ctx) => {
  const result = await ReminderService.markRead(ctx.params.id, ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/reminders/read-all', wrapHandler(async (ctx) => {
  const result = await ReminderService.markAllRead(ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/reminders/unread-count', wrapHandler(async (ctx) => {
  const result = await ReminderService.getUnreadCount(ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/reminder-rules', wrapHandler(async (ctx) => {
  const result = await ReminderService.getRules(ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/reminder-rules', wrapHandler(async (ctx) => {
  const result = await ReminderService.createRule(ctx.request.all(), ctx.auth.user.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.put('/reminder-rules/:id', wrapHandler(async (ctx) => {
  const result = await ReminderService.updateRule(ctx.params.id, ctx.request.all())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.delete('/reminder-rules/:id', wrapHandler(async (ctx) => {
  const result = await ReminderService.deleteRule(ctx.params.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/reminder-rules/:id/toggle', wrapHandler(async (ctx) => {
  const result = await ReminderService.toggleRule(ctx.params.id, ctx.request.input('enabled'))
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.get('/drivers', wrapHandler(async (ctx) => {
  const result = await DriverService.getList(ctx.request.qs())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/drivers', wrapHandler(async (ctx) => {
  const result = await DriverService.create(ctx.request.all())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.put('/drivers/:id', wrapHandler(async (ctx) => {
  const result = await DriverService.update(ctx.params.id, ctx.request.all())
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.delete('/drivers/:id', wrapHandler(async (ctx) => {
  const result = await DriverService.deleteDriver(ctx.params.id)
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

apiRouter.post('/drivers/:id/record-delay', wrapHandler(async (ctx) => {
  const result = await DriverService.recordDelay(
    ctx.params.id,
    ctx.request.input('minutes'),
    ctx.request.input('reason'),
    ctx.auth.user.id
  )
  ctx.response.json({ code: 0, message: 'success', data: result })
}))

router.use('/api', apiRouter)

export default router
