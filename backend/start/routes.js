import Route from '@ioc:Adonis/Core/Route'

Route.get('/health', async ({ response }) => {
  return response.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'running',
      timestamp: new Date().toISOString(),
    },
  })
})

Route.post('/api/auth/login', 'AuthController.login')

Route.group(() => {
  Route.get('/dashboard/stats', 'DashboardController.stats')
  Route.get('/dashboard/exceptions', 'DashboardController.exceptions')

  Route.get('/tours', 'TourController.index')
  Route.get('/tours/:id', 'TourController.show')
  Route.post('/tours', 'TourController.store')
  Route.put('/tours/:id', 'TourController.update')
  Route.post('/tours/:id/archive', 'TourController.archive')
  Route.post('/tours/:id/publish', 'TourController.publish')
  Route.get('/tours/:id/versions', 'TourController.versions')
  Route.post('/tours/:id/versions', 'TourController.storeVersion')
  Route.post('/tour-versions/:id/approve', 'TourController.approveVersion')
  Route.post('/tour-versions/:id/reject', 'TourController.rejectVersion')

  Route.get('/schedules', 'TourController.schedules')
  Route.post('/schedules', 'TourController.storeSchedule')
  Route.put('/schedules/:id', 'TourController.updateSchedule')

  Route.get('/orders', 'OrderController.index')
  Route.get('/orders/:id', 'OrderController.show')
  Route.post('/orders', 'OrderController.store')
  Route.post('/orders/:id/confirm', 'OrderController.confirm')
  Route.post('/orders/:id/refund', 'OrderController.refund')
  Route.post('/orders/:id/cancel', 'OrderController.cancel')

  Route.get('/inventory/summary', 'InventoryController.index')
  Route.get('/inventory/:id', 'InventoryController.show')
  Route.get('/inventory/:id/logs', 'InventoryController.logs')
  Route.post('/inventory/:id/adjust', 'InventoryController.adjust')

  Route.get('/cleaning-tasks', 'CleaningTaskController.index')
  Route.get('/cleaning-tasks/:id', 'CleaningTaskController.show')
  Route.post('/cleaning-tasks', 'CleaningTaskController.store')
  Route.put('/cleaning-tasks/:id', 'CleaningTaskController.update')
  Route.post('/cleaning-tasks/:id/start', 'CleaningTaskController.start')
  Route.post('/cleaning-tasks/:id/complete', 'CleaningTaskController.complete')
  Route.post('/cleaning-tasks/:id/cancel', 'CleaningTaskController.cancel')

  Route.get('/reminders', 'ReminderController.index')
  Route.post('/reminders/:id/read', 'ReminderController.markRead')
  Route.post('/reminders/read-all', 'ReminderController.markAllRead')
  Route.get('/reminders/unread-count', 'ReminderController.unreadCount')
  Route.get('/reminder-rules', 'ReminderController.rules')
  Route.post('/reminder-rules', 'ReminderController.storeRule')
  Route.put('/reminder-rules/:id', 'ReminderController.updateRule')
  Route.delete('/reminder-rules/:id', 'ReminderController.deleteRule')
  Route.post('/reminder-rules/:id/toggle', 'ReminderController.toggleRule')

  Route.get('/drivers', 'DriverController.index')
  Route.post('/drivers', 'DriverController.store')
  Route.put('/drivers/:id', 'DriverController.update')
  Route.delete('/drivers/:id', 'DriverController.destroy')
  Route.post('/drivers/:id/record-delay', 'DriverController.recordDelay')
}).prefix('/api').middleware('auth')
