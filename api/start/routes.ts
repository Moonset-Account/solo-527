import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

import InventoryController from '#controllers/inventory_controller'
import RequisitionController from '#controllers/requisition_controller'
import ProjectReportController from '#controllers/project_report_controller'
import ComplianceController from '#controllers/compliance_controller'
import FinanceController from '#controllers/finance_controller'
import PermissionController from '#controllers/permission_controller'
import BatchController from '#controllers/batch_controller'
import EquipmentController from '#controllers/equipment_controller'
import OperationHistoryController from '#controllers/operation_history_controller'
import AccessTokensController from '#controllers/access_tokens_controller'
import NewAccountController from '#controllers/new_account_controller'
import ProfileController from '#controllers/profile_controller'

router.group(() => {
  router.post('auth/signup', [NewAccountController, 'store'])
  router.post('auth/login', [AccessTokensController, 'store'])

  router
    .group(() => {
      router.get('account/profile', [ProfileController, 'show'])
      router.post('account/logout', [AccessTokensController, 'destroy'])
    })
    .use(middleware.auth())

  router
    .group(() => {
      router.get('/inventory/stats', [InventoryController, 'stats'])
      router.get('/reagents', [InventoryController, 'index'])
      router.get('/reagents/:id', [InventoryController, 'show'])

      router.get('/requisitions', [RequisitionController, 'index'])
      router.post('/requisitions', [RequisitionController, 'store'])
      router.put('/requisitions/:id/review', [RequisitionController, 'review'])
      router.get('/requisitions/:id', [RequisitionController, 'show'])

      router.get('/projects/reports', [ProjectReportController, 'index'])
      router.get('/projects/:id/report', [ProjectReportController, 'show'])

      router.get('/compliance/reagents', [ComplianceController, 'filter'])
      router.get('/compliance/audit-logs', [ComplianceController, 'auditLogs'])
      router.get('/compliance/drilldown/:id', [ComplianceController, 'drilldown'])

      router.get('/finance/balances', [FinanceController, 'balances'])
      router.post('/finance/allocate', [FinanceController, 'allocate'])
      router.get('/finance/stats', [FinanceController, 'stats'])

      router.get('/permissions/pending', [PermissionController, 'pending'])
      router.put('/permissions/:id/review', [PermissionController, 'review'])

      router.get('/batches', [BatchController, 'index'])
      router.get('/batches/:id', [BatchController, 'detail'])
      router.get('/reagents/:id/batches', [BatchController, 'byReagent'])

      router.get('/equipment/utilization', [EquipmentController, 'utilization'])
      router.get('/equipment/alerts', [EquipmentController, 'alerts'])
      router.put('/equipment/alerts/:id/confirm-admin', [EquipmentController, 'confirmAdmin'])
      router.put('/equipment/alerts/:id/confirm-owner', [EquipmentController, 'confirmOwner'])

      router.get('/operation-histories', [OperationHistoryController, 'index'])
      router.post('/operation-histories/:id/note', [OperationHistoryController, 'addNote'])
    })
    .use(middleware.auth())
}).prefix('/api')
