import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'WorkOrdersController.index')
  Route.get(':id', 'WorkOrdersController.show')
  Route.get(':id/materials', 'WorkOrdersController.getMaterials')
  
  Route.group(() => {
    Route.post('/', 'WorkOrdersController.store')
    Route.put(':id', 'WorkOrdersController.update').middleware(['log:work_order,update,risk'])
    Route.patch(':id/status', 'WorkOrdersController.updateStatus').middleware(['log:work_order,status_change,risk'])
    Route.delete(':id', 'WorkOrdersController.destroy')
  }).middleware(['role:admin,workshop_manager'])
})
  .prefix('api/work-orders')
  .middleware('auth')
