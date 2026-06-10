import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'LogsController.index')
  Route.get('risk', 'LogsController.riskLogs')
  Route.get(':id', 'LogsController.show')
})
  .prefix('api/logs')
  .middleware(['auth', 'role:admin'])
