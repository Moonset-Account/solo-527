import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'ProductionsController.index')
  Route.get('summary', 'ProductionsController.summary')
  Route.get('work-hours', 'ProductionsController.workHoursStats')
  Route.get(':id', 'ProductionsController.show')
  
  Route.group(() => {
    Route.post('/', 'ProductionsController.store')
    Route.put(':id', 'ProductionsController.update')
    Route.delete(':id', 'ProductionsController.destroy')
  }).middleware(['role:admin,workshop_manager'])
})
  .prefix('api/productions')
  .middleware('auth')
