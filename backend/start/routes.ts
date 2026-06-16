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
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { message: '席位配置台 API', version: 'v1' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('login', [controllers.AccessTokens, 'store'])
        router.post('logout', [controllers.AccessTokens, 'destroy']).use(middleware.auth())
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.put('profile', [controllers.Profile, 'update'])
      })
      .prefix('account')
      .as('account')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('stats', [controllers.Dashboard, 'stats'])
        router.get('todos', [controllers.Dashboard, 'todos'])
        router.get('recent-activity', [controllers.Dashboard, 'recentActivity'])
      })
      .prefix('dashboard')
      .as('dashboard')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [controllers.Users, 'index'])
        router.get(':id', [controllers.Users, 'show'])
        router.post('', [controllers.Users, 'store']).use(middleware.role('admin'))
        router.put(':id', [controllers.Users, 'update']).use(middleware.role('admin'))
        router.delete(':id', [controllers.Users, 'destroy']).use(middleware.role('admin'))
        router.post(':id/roles', [controllers.Users, 'assignRoles']).use(middleware.role('admin'))
        router.get(':id/roles', [controllers.Users, 'getRoles'])
      })
      .prefix('users')
      .as('users')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [controllers.Roles, 'index'])
        router.get(':id', [controllers.Roles, 'show'])
        router.post('', [controllers.Roles, 'store']).use(middleware.role('admin'))
        router.put(':id', [controllers.Roles, 'update']).use(middleware.role('admin'))
        router.delete(':id', [controllers.Roles, 'destroy']).use(middleware.role('admin'))
        router.post(':id/permissions', [controllers.Roles, 'assignPermissions']).use(middleware.role('admin'))
      })
      .prefix('roles')
      .as('roles')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [controllers.Plans, 'index'])
        router.get(':id', [controllers.Plans, 'show'])
        router.post('', [controllers.Plans, 'store']).use(middleware.role(['admin', 'product_manager']))
        router.put(':id', [controllers.Plans, 'update']).use(middleware.role(['admin', 'product_manager']))
        router.delete(':id', [controllers.Plans, 'destroy']).use(middleware.role('admin'))
      })
      .prefix('plans')
      .as('plans')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [controllers.Seats, 'index'])
        router.get('idle', [controllers.Seats, 'idleList'])
        router.get('batch-query', [controllers.Seats, 'batchQuery'])
        router.get(':id', [controllers.Seats, 'show'])
        router.post('', [controllers.Seats, 'store']).use(middleware.role(['admin', 'operator']))
        router.put(':id', [controllers.Seats, 'update']).use(middleware.role(['admin', 'operator']))
        router.delete(':id', [controllers.Seats, 'destroy']).use(middleware.role('admin'))
        router.get(':id/notes', [controllers.Seats, 'getNotes'])
        router.post(':id/notes', [controllers.Seats, 'addNote'])
        router.patch(':id/idle-status', [controllers.Seats, 'updateIdleStatus']).use(middleware.role(['admin', 'operator']))
      })
      .prefix('seats')
      .as('seats')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('trends', [controllers.Usage, 'trends'])
        router.get('records', [controllers.Usage, 'records'])
        router.get('errors', [controllers.Usage, 'errors'])
        router.get('summary', [controllers.Usage, 'summary'])
        router.get('seat/:seatId', [controllers.Usage, 'seatUsage'])
      })
      .prefix('usage')
      .as('usage')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [controllers.Bills, 'index'])
        router.get('export', [controllers.Bills, 'export'])
        router.post('generate', [controllers.Bills, 'generate']).use(middleware.role(['admin', 'product_manager']))
        router.get(':id', [controllers.Bills, 'show'])
        router.post('', [controllers.Bills, 'store']).use(middleware.role(['admin', 'product_manager']))
        router.put(':id', [controllers.Bills, 'update']).use(middleware.role(['admin', 'product_manager']))
        router.delete(':id', [controllers.Bills, 'destroy']).use(middleware.role('admin'))
      })
      .prefix('bills')
      .as('bills')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [controllers.BillingCycles, 'index'])
        router.post('', [controllers.BillingCycles, 'store']).use(middleware.role('admin'))
        router.put(':id', [controllers.BillingCycles, 'update']).use(middleware.role('admin'))
        router.delete(':id', [controllers.BillingCycles, 'destroy']).use(middleware.role('admin'))
        router.patch(':id/default', [controllers.BillingCycles, 'setDefault']).use(middleware.role('admin'))
      })
      .prefix('billing-cycles')
      .as('billing_cycles')
      .use(middleware.auth())

    router
      .group(() => {
        router.get('', [controllers.RenewalLists, 'index'])
        router.get('stats', [controllers.RenewalLists, 'stats'])
        router.get('export', [controllers.RenewalLists, 'export'])
        router.post('batch-import', [controllers.RenewalLists, 'batchImport']).use(middleware.role(['admin', 'operator']))
        router.get(':id', [controllers.RenewalLists, 'show'])
        router.post('', [controllers.RenewalLists, 'store']).use(middleware.role(['admin', 'operator']))
        router.put(':id', [controllers.RenewalLists, 'update']).use(middleware.role(['admin', 'operator']))
        router.delete(':id', [controllers.RenewalLists, 'destroy']).use(middleware.role('admin'))
        router.post(':id/assign', [controllers.RenewalLists, 'assign']).use(middleware.role(['admin', 'operator']))
        router.post(':id/follow-up', [controllers.RenewalLists, 'followUp']).use(middleware.role(['admin', 'operator']))
      })
      .prefix('renewal-lists')
      .as('renewal_lists')
      .use(middleware.auth())
  })
  .prefix('/api/v1')
