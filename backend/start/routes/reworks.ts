import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'ReworksController.index')
  Route.get('stats', 'ReworksController.stats')
  Route.get(':id', 'ReworksController.show')
  
  Route.group(() => {
    Route.post('/', 'ReworksController.store')
    Route.put(':id', 'ReworksController.update')
    Route.delete(':id', 'ReworksController.destroy')
  }).middleware(['role:admin,workshop_manager'])
})
  .prefix('api/reworks')
  .middleware('auth')
