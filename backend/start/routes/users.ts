import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('/', 'UsersController.index')
  Route.get('list', 'UsersController.list')
  Route.get(':id', 'UsersController.show')
  Route.post('/', 'UsersController.store')
  Route.put(':id', 'UsersController.update')
  Route.delete(':id', 'UsersController.destroy')
})
  .prefix('api/users')
  .middleware('auth')
  .middleware(['role:admin'])
