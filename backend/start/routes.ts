/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

import AccessTokensController from '#controllers/access_tokens_controller'
import ProfileController from '#controllers/profile_controller'
import DashboardController from '#controllers/dashboard_controller'
import UsersController from '#controllers/users_controller'
import RolesController from '#controllers/roles_controller'
import PlansController from '#controllers/plans_controller'
import SeatsController from '#controllers/seats_controller'
import UsageController from '#controllers/usage_controller'
import BillsController from '#controllers/bills_controller'
import BillingCyclesController from '#controllers/billing_cycles_controller'
import RenewalListsController from '#controllers/renewal_lists_controller'

router.get('/', () => {
  return { message: '席位配置台 API', version: 'v1' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('login', [AccessTokensController, 'store'])
        router.post('logout', [AccessTokensController, 'destroy']).use(middleware.auth())
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [ProfileController, 'show'])
        router.put('profile', [ProfileController, 'update'])
      })
      .prefix('account')
      .as('account')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('stats', [DashboardController, 'stats'])
        router.get('todos', [DashboardController, 'todos'])
        router.get('recent-activity', [DashboardController, 'recentActivity'])
      })
      .prefix('dashboard')
      .as('dashboard')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [UsersController, 'index'])
        router.get(':id', [UsersController, 'show'])
        router.post('', [UsersController, 'store']).use(middleware.role('admin'))
        router.put(':id', [UsersController, 'update']).use(middleware.role('admin'))
        router.delete(':id', [UsersController, 'destroy']).use(middleware.role('admin'))
        router.post(':id/roles', [UsersController, 'assignRoles']).use(middleware.role('admin'))
        router.get(':id/roles', [UsersController, 'getRoles'])
      })
      .prefix('users')
      .as('users')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [RolesController, 'index'])
        router.get(':id', [RolesController, 'show'])
        router.post('', [RolesController, 'store']).use(middleware.role('admin'))
        router.put(':id', [RolesController, 'update']).use(middleware.role('admin'))
        router.delete(':id', [RolesController, 'destroy']).use(middleware.role('admin'))
        router.post(':id/permissions', [RolesController, 'assignPermissions']).use(middleware.role('admin'))
      })
      .prefix('roles')
      .as('roles')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [PlansController, 'index'])
        router.get(':id', [PlansController, 'show'])
        router.post('', [PlansController, 'store']).use(middleware.role(['admin', 'product_manager']))
        router.put(':id', [PlansController, 'update']).use(middleware.role(['admin', 'product_manager']))
        router.delete(':id', [PlansController, 'destroy']).use(middleware.role('admin'))
      })
      .prefix('plans')
      .as('plans')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [SeatsController, 'index'])
        router.get('idle', [SeatsController, 'idleList'])
        router.get('batch-query', [SeatsController, 'batchQuery'])
        router.get(':id', [SeatsController, 'show'])
        router.post('', [SeatsController, 'store']).use(middleware.role(['admin', 'operator']))
        router.put(':id', [SeatsController, 'update']).use(middleware.role(['admin', 'operator']))
        router.delete(':id', [SeatsController, 'destroy']).use(middleware.role('admin'))
        router.get(':id/notes', [SeatsController, 'getNotes'])
        router.post(':id/notes', [SeatsController, 'addNote'])
        router.patch(':id/idle-status', [SeatsController, 'updateIdleStatus']).use(middleware.role(['admin', 'operator']))
      })
      .prefix('seats')
      .as('seats')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('trends', [UsageController, 'trends'])
        router.get('records', [UsageController, 'records'])
        router.get('errors', [UsageController, 'errors'])
        router.get('summary', [UsageController, 'summary'])
        router.get('seat/:seatId', [UsageController, 'seatUsage'])
      })
      .prefix('usage')
      .as('usage')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [BillsController, 'index'])
        router.get('export', [BillsController, 'export'])
        router.post('generate', [BillsController, 'generate']).use(middleware.role(['admin', 'product_manager']))
        router.get(':id', [BillsController, 'show'])
        router.post('', [BillsController, 'store']).use(middleware.role(['admin', 'product_manager']))
        router.put(':id', [BillsController, 'update']).use(middleware.role(['admin', 'product_manager']))
        router.delete(':id', [BillsController, 'destroy']).use(middleware.role('admin'))
      })
      .prefix('bills')
      .as('bills')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [BillingCyclesController, 'index'])
        router.post('', [BillingCyclesController, 'store']).use(middleware.role('admin'))
        router.put(':id', [BillingCyclesController, 'update']).use(middleware.role('admin'))
        router.delete(':id', [BillingCyclesController, 'destroy']).use(middleware.role('admin'))
        router.patch(':id/default', [BillingCyclesController, 'setDefault']).use(middleware.role('admin'))
      })
      .prefix('billing-cycles')
      .as('billing_cycles')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [RenewalListsController, 'index'])
        router.get('stats', [RenewalListsController, 'stats'])
        router.get('export', [RenewalListsController, 'export'])
        router.post('batch-import', [RenewalListsController, 'batchImport']).use(middleware.role(['admin', 'operator']))
        router.get(':id', [RenewalListsController, 'show'])
        router.post('', [RenewalListsController, 'store']).use(middleware.role(['admin', 'operator']))
        router.put(':id', [RenewalListsController, 'update']).use(middleware.role(['admin', 'operator']))
        router.delete(':id', [RenewalListsController, 'destroy']).use(middleware.role('admin'))
        router.post(':id/assign', [RenewalListsController, 'assign']).use(middleware.role(['admin', 'operator']))
        router.post(':id/follow-up', [RenewalListsController, 'followUp']).use(middleware.role(['admin', 'operator']))
      })
      .prefix('renewal-lists')
      .as('renewal_lists')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
