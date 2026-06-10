import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'MaterialsController.index')
  Route.get(':id', 'MaterialsController.show')
  Route.get('work-order/:id/readiness', 'MaterialsController.checkWorkOrderReadiness')
  
  Route.group(() => {
    Route.post('/', 'MaterialsController.store')
    Route.put(':id', 'MaterialsController.update')
    Route.delete(':id', 'MaterialsController.destroy')
    Route.post('work-order/:id/material', 'MaterialsController.updateWorkOrderMaterial')
  }).middleware(['role:admin,workshop_manager'])
})
  .prefix('api/materials')
  .middleware('auth')
