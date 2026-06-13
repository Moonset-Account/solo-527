import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'operations',
        children: [
          {
            path: 'sales',
            name: 'SalesEntry',
            component: () => import('@/views/operations/SalesEntryView.vue'),
            meta: { title: '营业录入' }
          },
          {
            path: 'exceptions',
            name: 'ExceptionEntry',
            component: () => import('@/views/operations/ExceptionEntryView.vue'),
            meta: { title: '异常录入' }
          }
        ]
      },
      {
        path: 'process',
        children: [
          {
            path: 'records',
            name: 'ProcessRecords',
            component: () => import('@/views/process/ProcessRecordsView.vue'),
            meta: { title: '处理记录' }
          },
          {
            path: 'inspections',
            name: 'Inspections',
            component: () => import('@/views/process/InspectionsView.vue'),
            meta: { title: '巡店任务' }
          },
          {
            path: 'cash-flows',
            name: 'CashFlows',
            component: () => import('@/views/process/CashFlowsView.vue'),
            meta: { title: '现金流水' }
          },
          {
            path: 'inventory-logs',
            name: 'InventoryLogs',
            component: () => import('@/views/process/InventoryLogsView.vue'),
            meta: { title: '食材库存' }
          }
        ]
      },
      {
        path: 'rectifications',
        name: 'Rectifications',
        component: () => import('@/views/rectifications/RectificationsView.vue'),
        meta: { title: '整改管理' }
      },
      {
        path: 'reports',
        children: [
          {
            path: 'profit',
            name: 'ProfitReport',
            component: () => import('@/views/reports/ProfitReportView.vue'),
            meta: { title: '利润报表' }
          }
        ]
      },
      {
        path: 'admin',
        children: [
          {
            path: 'safety-stocks',
            name: 'SafetyStocks',
            component: () => import('@/views/admin/SafetyStocksView.vue'),
            meta: { title: '安全库存设置' }
          },
          {
            path: 'loss-reasons',
            name: 'LossReasons',
            component: () => import('@/views/admin/LossReasonsView.vue'),
            meta: { title: '报损原因管理' }
          },
          {
            path: 'ingredients',
            name: 'Ingredients',
            component: () => import('@/views/admin/IngredientsView.vue'),
            meta: { title: '食材管理' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
