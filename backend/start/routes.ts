import Route from '@ioc:Adonis/Core/Route'
import HealthCheck from '@ioc:Adonis/Core/HealthCheck'

Route.get('health', async ({ response }) => {
  const report = await HealthCheck.getReport()
  return report.healthy ? response.ok(report) : response.badRequest(report)
})

Route.group(() => {
  Route.post('register', 'AuthController.register')
  Route.post('login', 'AuthController.login')
  Route.post('logout', 'AuthController.logout').middleware('auth')
  Route.get('me', 'AuthController.me').middleware('auth')
}).prefix('api/auth')

Route.group(() => {
  Route.resource('users', 'UsersController').apiOnly()
}).prefix('api').middleware('auth')

Route.group(() => {
  Route.resource('partnerships', 'BrandPartnershipsController').apiOnly()
  Route.get('partnerships/:id/stages', 'BrandPartnershipsController.getStages')
  Route.post('partnerships/:id/stages', 'BrandPartnershipsController.addStage')
  Route.put('partnerships/:id/stages/:stageId', 'BrandPartnershipsController.updateStage')
}).prefix('api').middleware('auth')

Route.group(() => {
  Route.resource('benefits', 'SponsorshipBenefitsController').apiOnly()
}).prefix('api').middleware('auth')

Route.group(() => {
  Route.resource('orders', 'OrdersController').apiOnly()
  Route.post('orders/:id/nodes', 'OrdersController.addNode')
  Route.put('orders/:id/nodes/:nodeId', 'OrdersController.updateNode')
  Route.get('orders/:id/history', 'OrdersController.getHistory')
  Route.post('orders/:id/comments', 'OrdersController.addComment')
  Route.post('orders/:id/attachments', 'OrdersController.uploadAttachment')
  Route.get('orders/:id/attachments', 'OrdersController.getAttachments')
}).prefix('api').middleware('auth')

Route.group(() => {
  Route.get('subscriptions/public/active', 'SubscriptionsController.getActivePlans')
}).prefix('api')

Route.group(() => {
  Route.resource('subscriptions', 'SubscriptionsController').apiOnly()
  Route.post('subscriptions/checkout', 'SubscriptionsController.checkout')
}).prefix('api').middleware('auth')

Route.group(() => {
  Route.get('refunds', 'RefundExceptionsController.index')
  Route.get('refunds/:id', 'RefundExceptionsController.show')
  Route.put('refunds/:id', 'RefundExceptionsController.update')
  Route.post('refunds/:id/process', 'RefundExceptionsController.process')
}).prefix('api').middleware('auth')

Route.group(() => {
  Route.get('dashboard/overview', 'DashboardController.overview')
  Route.get('dashboard/retention', 'DashboardController.retention')
  Route.get('dashboard/warnings', 'DashboardController.warnings')
  Route.get('dashboard/export', 'DashboardController.exportData')
}).prefix('api').middleware('auth')

Route.group(() => {
  Route.get('configs/status-dict', 'ConfigsController.getStatusDict')
  Route.put('configs/status-dict', 'ConfigsController.updateStatusDict')
  Route.get('configs/reminder-freq', 'ConfigsController.getReminderFrequency')
  Route.put('configs/reminder-freq', 'ConfigsController.updateReminderFrequency')
  Route.get('configs/all', 'ConfigsController.getAll')
}).prefix('api').middleware('auth')
