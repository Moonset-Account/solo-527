import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'SchedulesController.index')
  Route.get('calendar', 'SchedulesController.calendar')
  Route.get(':id', 'SchedulesController.show')
  
  Route.group(() => {
    Route.post('/', 'SchedulesController.store')
    Route.put(':id', 'SchedulesController.update')
    Route.patch(':id/adjust', 'SchedulesController.adjust').middleware(['log:schedule,adjust,risk'])
    Route.delete(':id', 'SchedulesController.destroy')
  }).middleware(['role:admin,workshop_manager'])
})
  .prefix('api/schedules')
  .middleware('auth')
