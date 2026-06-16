import router from '@adonisjs/core/services/router'
import ProductsController from '#controllers/products_controller'
import StockMovementsController from '#controllers/stock_movements_controller'
import AppointmentsController from '#controllers/appointments_controller'
import AnalyticsController from '#controllers/analytics_controller'
import RemindersController from '#controllers/reminders_controller'
import ReminderRulesController from '#controllers/reminder_rules_controller'
import AttachmentsController from '#controllers/attachments_controller'
import ChangeLogsController from '#controllers/change_logs_controller'
import RestockAlertsController from '#controllers/restock_alerts_controller'
import AuthController from '#controllers/auth_controller'
import DashboardController from '#controllers/dashboard_controller'

const AuthMiddleware = () => import('#middleware/auth_middleware')

router.post('/auth/register', [AuthController, 'register'])
router.post('/auth/login', [AuthController, 'login'])

router.group(() => {
  router.get('/auth/me', [AuthController, 'me'])
  router.post('/auth/logout', [AuthController, 'logout'])

  router.resource('products', ProductsController).apiOnly()
  router.get('/products/low-stock', async ({ response }) => {
    const Product = (await import('#models/product')).default
    const products = await Product.query().whereRaw('current_stock <= safety_stock').where('status', 'active')
    return response.ok(products)
  })

  router.get('/stock-movements', [StockMovementsController, 'index'])
  router.post('/stock-movements/in', [StockMovementsController, 'stockIn'])
  router.post('/stock-movements/out', [StockMovementsController, 'stockOut'])
  router.post('/stock-movements/damage', [StockMovementsController, 'stockDamage'])

  router.resource('appointments', AppointmentsController).apiOnly()
  router.post('/appointments/:id/no-show', [AppointmentsController, 'markNoShow'])
  router.post('/appointments/items/:itemId/start', [AppointmentsController, 'startService'])
  router.post('/appointments/items/:itemId/complete', [AppointmentsController, 'completeService'])

  router.get('/analytics/commissions/:consultantId', [AnalyticsController, 'consultantCommissions'])
  router.get('/analytics/service-prices', [AnalyticsController, 'servicePriceAnalysis'])
  router.get('/analytics/consumption-ranking', [AnalyticsController, 'consumptionRanking'])
  router.get('/analytics/anomaly/:productId', [AnalyticsController, 'anomalyTracing'])
  router.get('/analytics/visit-rate', [AnalyticsController, 'visitRate'])

  router.get('/reminders', [RemindersController, 'index'])
  router.get('/reminders/unread-count', [RemindersController, 'unreadCount'])
  router.get('/reminders/:id', [RemindersController, 'show'])
  router.put('/reminders/:id/read', [RemindersController, 'markAsRead'])
  router.put('/reminders/:id/resolve', [RemindersController, 'resolve'])
  router.put('/reminders/:id/escalate', [RemindersController, 'escalate'])

  router.resource('reminder-rules', ReminderRulesController).apiOnly()

  router.get('/attachments', [AttachmentsController, 'index'])
  router.post('/attachments', [AttachmentsController, 'store'])
  router.delete('/attachments/:id', [AttachmentsController, 'destroy'])

  router.get('/change-logs', [ChangeLogsController, 'index'])

  router.get('/restock-alerts', [RestockAlertsController, 'index'])
  router.get('/restock-alerts/pending-count', [RestockAlertsController, 'pendingCount'])
  router.get('/restock-alerts/:id', [RestockAlertsController, 'show'])
  router.put('/restock-alerts/:id/resolve', [RestockAlertsController, 'resolve'])

  router.get('/dashboard', [DashboardController, 'index'])
}).middleware([AuthMiddleware])
