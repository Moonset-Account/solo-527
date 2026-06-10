/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { status: 'ok', message: '青禾预约候补台 API 服务运行中' }
})

Route.group(() => {
  Route.post('/login', 'AuthController.login')
  Route.post('/logout', 'AuthController.logout').middleware('auth')
  Route.get('/me', 'AuthController.me').middleware('auth')
}).prefix('/api/auth')

Route.group(() => {
  Route.get('/dashboard', 'DashboardController.index')
  Route.get('/dashboard/conversion', 'DashboardController.conversion')
  Route.get('/dashboard/no-show-trend', 'DashboardController.noShowTrend')
}).prefix('/api').middleware('auth')

Route.group(() => {
  Route.get('/', 'BookingsController.index')
  Route.post('/', 'BookingsController.store')
  Route.get('/:id', 'BookingsController.show')
  Route.put('/:id', 'BookingsController.update')
  Route.patch('/:id/status', 'BookingsController.updateStatus')
  Route.delete('/:id', 'BookingsController.destroy')
  Route.post('/:id/notes', 'BookingsController.addNote')
  Route.get('/:id/notes', 'BookingsController.getNotes')
  Route.post('/:id/attachments', 'BookingsController.uploadAttachment')
  Route.get('/:id/attachments', 'BookingsController.getAttachments')
  Route.get('/:id/history', 'BookingsController.getHistory')
  Route.get('/export/list', 'BookingsController.exportList')
  Route.get('/no-show/list', 'BookingsController.noShowList')
}).prefix('/api/bookings').middleware('auth')

Route.group(() => {
  Route.get('/', 'CustomersController.index')
  Route.post('/', 'CustomersController.store')
  Route.get('/:id', 'CustomersController.show')
  Route.put('/:id', 'CustomersController.update')
  Route.delete('/:id', 'CustomersController.destroy')
  Route.get('/:id/bookings', 'CustomersController.getBookings')
}).prefix('/api/customers').middleware('auth')

Route.group(() => {
  Route.get('/', 'ServicesController.index')
  Route.post('/', 'ServicesController.store')
  Route.get('/:id', 'ServicesController.show')
  Route.put('/:id', 'ServicesController.update')
  Route.delete('/:id', 'ServicesController.destroy')
}).prefix('/api/services').middleware('auth')

Route.group(() => {
  Route.get('/', 'StaffController.index')
  Route.post('/', 'StaffController.store')
  Route.get('/:id', 'StaffController.show')
  Route.put('/:id', 'StaffController.update')
  Route.delete('/:id', 'StaffController.destroy')
  Route.get('/:id/schedules', 'StaffController.getSchedules')
  Route.post('/:id/schedules', 'StaffController.addSchedule')
  Route.put('/schedules/:id', 'StaffController.updateSchedule')
  Route.delete('/schedules/:id', 'StaffController.deleteSchedule')
}).prefix('/api/staff').middleware('auth')

Route.group(() => {
  Route.get('/', 'TimeSlotsController.index')
  Route.get('/calendar', 'TimeSlotsController.calendar')
  Route.get('/available', 'TimeSlotsController.available')
  Route.post('/', 'TimeSlotsController.store')
  Route.post('/bulk', 'TimeSlotsController.bulkCreate')
  Route.put('/:id', 'TimeSlotsController.update')
  Route.delete('/:id', 'TimeSlotsController.destroy')
}).prefix('/api/time-slots').middleware('auth')

Route.group(() => {
  Route.get('/', 'ExceptionTodosController.index')
  Route.get('/pending-count', 'ExceptionTodosController.pendingCount')
  Route.post('/', 'ExceptionTodosController.store')
  Route.get('/:id', 'ExceptionTodosController.show')
  Route.put('/:id', 'ExceptionTodosController.update')
  Route.patch('/:id/handle', 'ExceptionTodosController.handle')
  Route.delete('/:id', 'ExceptionTodosController.destroy')
}).prefix('/api/exceptions').middleware('auth')
