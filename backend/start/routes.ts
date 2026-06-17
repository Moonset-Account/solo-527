import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', async () => {
  return {
    message: '家电维修服务系统 API',
    version: '1.0.0',
  }
})

router
  .group(() => {
    router.post('register', '#controllers/auth_controller.register')
    router.post('login', '#controllers/auth_controller.login')
    router.post('logout', '#controllers/auth_controller.logout').use(middleware.auth())
    router.get('me', '#controllers/auth_controller.me').use(middleware.auth())
  })
  .prefix('api/auth')

router
  .group(() => {
    router.get('price-rules/all', '#controllers/price_rules_controller.all')
    router.get('communities/all', '#controllers/communities_controller.all')
    router.get('technicians/all', '#controllers/technicians_controller.all')

    router
      .group(() => {
        router.post('orders', '#controllers/orders_controller.create')
        router.get('orders', '#controllers/orders_controller.myOrders')
        router.get('orders/:id', '#controllers/orders_controller.show')
        router.post('orders/:id/cancel', '#controllers/orders_controller.cancel')
        router.post('orders/:id/evaluate', '#controllers/orders_controller.evaluate')

        router.post('upload/image', '#controllers/uploads_controller.uploadImage')
        router.post('upload/multiple', '#controllers/uploads_controller.uploadMultiple')
      })
      .use(middleware.auth())
  })
  .prefix('api')

router
  .group(() => {
    router
      .group(() => {
        router.get('overview', '#controllers/statistics_controller.overview')
        router.get('technician-load', '#controllers/statistics_controller.technicianLoad')
        router.get('repurchase-stats', '#controllers/statistics_controller.repurchaseStats')
        router.get('late-reason-stats', '#controllers/statistics_controller.lateReasonStats')
      })
      .prefix('statistics')

    router
      .group(() => {
        router.get('orders', '#controllers/admin_orders_controller.index')
        router.get('orders/:id', '#controllers/admin_orders_controller.show')
        router.post('orders/:id/assign', '#controllers/admin_orders_controller.assign')
        router.post('orders/:id/reschedule', '#controllers/admin_orders_controller.reschedule')
        router.post('orders/:id/cancel', '#controllers/admin_orders_controller.cancel')
        router.put('orders/:id', '#controllers/admin_orders_controller.updateStatus')
        router.get('check-technician-load', '#controllers/admin_orders_controller.checkTechnicianLoad')
      })
      .prefix('orders')

    router
      .group(() => {
        router.get('technicians', '#controllers/technicians_controller.index')
        router.get('technicians/:id', '#controllers/technicians_controller.show')
        router.get('technicians/:id/workload', '#controllers/technicians_controller.workload')
        router.post('technicians', '#controllers/technicians_controller.store')
        router.put('technicians/:id', '#controllers/technicians_controller.update')
        router.delete('technicians/:id', '#controllers/technicians_controller.destroy')
      })
      .prefix('technicians')

    router
      .group(() => {
        router.get('price-rules', '#controllers/price_rules_controller.index')
        router.get('price-rules/:id', '#controllers/price_rules_controller.show')
        router.post('price-rules', '#controllers/price_rules_controller.store')
        router.put('price-rules/:id', '#controllers/price_rules_controller.update')
        router.delete('price-rules/:id', '#controllers/price_rules_controller.destroy')
      })
      .prefix('price-rules')

    router
      .group(() => {
        router.get('communities', '#controllers/communities_controller.index')
        router.get('communities/:id', '#controllers/communities_controller.show')
        router.post('communities', '#controllers/communities_controller.store')
        router.put('communities/:id', '#controllers/communities_controller.update')
        router.delete('communities/:id', '#controllers/communities_controller.destroy')
      })
      .prefix('communities')

    router
      .group(() => {
        router.get('configs', '#controllers/configs_controller.index')
        router.get('configs/:key', '#controllers/configs_controller.show')
        router.put('configs/:key', '#controllers/configs_controller.update')
        router.post('configs', '#controllers/configs_controller.create')
        router.get('configs/:key/value', '#controllers/configs_controller.getValue')
        router.get('config-histories', '#controllers/configs_controller.history')
      })
      .prefix('configs')
  })
  .prefix('api/admin')
  .use([middleware.auth(), middleware.admin()])
