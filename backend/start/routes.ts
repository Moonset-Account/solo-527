import router from '@adonisjs/core/services/router'

router.get('/', async () => {
  return {
    status: 'ok',
    service: 'tea-inventory-api',
  }
})

router.group(() => {
  router.post('register', '#controllers/auth_controller.register')
  router.post('login', '#controllers/auth_controller.login')
}).prefix('api/auth')

router.group(() => {
  router.get('profile', '#controllers/auth_controller.profile')
  router.post('logout', '#controllers/auth_controller.logout')
}).prefix('api/auth').middleware('auth:api')

router.group(() => {
  router.get('stores', '#controllers/stores_controller.index')
  router.get('stores/:id', '#controllers/stores_controller.show')
}).prefix('api').middleware('auth:api')

router.group(() => {
  router.post('sales', '#controllers/sales_controller.store')
  router.get('sales', '#controllers/sales_controller.index')
  router.get('sales/:id', '#controllers/sales_controller.show')
}).prefix('api/operations').middleware('auth:api')

router.group(() => {
  router.get('exceptions', '#controllers/exceptions_controller.index')
  router.get('exceptions/:id', '#controllers/exceptions_controller.show')
  router.post('exceptions', '#controllers/exceptions_controller.store')
  router.put('exceptions/:id', '#controllers/exceptions_controller.update')
}).prefix('api/operations').middleware('auth:api')

router.group(() => {
  router.get('safety-stocks', '#controllers/safety_stocks_controller.index')
  router.post('safety-stocks', '#controllers/safety_stocks_controller.store')
  router.put('safety-stocks/:id', '#controllers/safety_stocks_controller.update')
  router.delete('safety-stocks/:id', '#controllers/safety_stocks_controller.destroy')
}).prefix('api/admin').middleware('auth:api')

router.group(() => {
  router.get('loss-reasons', '#controllers/loss_reasons_controller.index')
  router.post('loss-reasons', '#controllers/loss_reasons_controller.store')
  router.put('loss-reasons/:id', '#controllers/loss_reasons_controller.update')
  router.delete('loss-reasons/:id', '#controllers/loss_reasons_controller.destroy')
}).prefix('api/admin').middleware('auth:api')

router.group(() => {
  router.get('ingredients', '#controllers/ingredients_controller.index')
  router.post('ingredients', '#controllers/ingredients_controller.store')
  router.put('ingredients/:id', '#controllers/ingredients_controller.update')
  router.get('ingredients/:id', '#controllers/ingredients_controller.show')
}).prefix('api/admin').middleware('auth:api')

router.group(() => {
  router.get('records', '#controllers/process_records_controller.index')
  router.get('records/:id', '#controllers/process_records_controller.show')
  router.post('records', '#controllers/process_records_controller.store')
  router.put('records/:id', '#controllers/process_records_controller.update')
}).prefix('api/process').middleware('auth:api')

router.group(() => {
  router.get('inspections', '#controllers/process_records_controller.inspections')
  router.post('inspections', '#controllers/process_records_controller.createInspection')
}).prefix('api/process').middleware('auth:api')

router.group(() => {
  router.get('cash-flows', '#controllers/process_records_controller.cashFlows')
  router.post('cash-flows', '#controllers/process_records_controller.createCashFlow')
}).prefix('api/process').middleware('auth:api')

router.group(() => {
  router.get('inventory-logs', '#controllers/process_records_controller.inventoryLogs')
  router.post('inventory-logs', '#controllers/process_records_controller.createInventoryLog')
}).prefix('api/process').middleware('auth:api')

router.group(() => {
  router.get('rectifications', '#controllers/rectifications_controller.index')
  router.get('rectifications/:id', '#controllers/rectifications_controller.show')
  router.post('rectifications', '#controllers/rectifications_controller.store')
  router.put('rectifications/:id', '#controllers/rectifications_controller.update')
  router.post('rectifications/:id/close', '#controllers/rectifications_controller.close')
  router.get('rectifications/statistics/summary', '#controllers/rectifications_controller.statistics')
}).prefix('api').middleware('auth:api')

router.group(() => {
  router.get('profit-report', '#controllers/reports_controller.profitReport')
}).prefix('api/reports').middleware('auth:api')
