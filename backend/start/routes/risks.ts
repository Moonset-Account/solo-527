import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'RisksController.index')
  Route.get('report', 'RisksController.report')
  Route.get('high-risk-orders', 'RisksController.highRiskOrders')
  Route.get(':id', 'RisksController.show')
  
  Route.group(() => {
    Route.post('/', 'RisksController.store')
    Route.post(':id/handle', 'RisksController.handle').middleware(['log:risk,handle,risk'])
  }).middleware(['role:admin,workshop_manager'])
})
  .prefix('api/risks')
  .middleware('auth')
