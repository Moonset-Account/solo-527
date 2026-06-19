import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
    meta: { title: '运营仪表盘' },
  },
  {
    path: '/datasets',
    name: 'datasets',
    component: () => import('@/pages/DatasetListPage.vue'),
    meta: { title: '数据集管理' },
  },
  {
    path: '/datasets/:id',
    name: 'dataset-edit',
    component: () => import('@/pages/DatasetEditPage.vue'),
    meta: { title: '编辑数据集' },
  },
  {
    path: '/metrics',
    name: 'metrics',
    component: () => import('@/pages/MetricListPage.vue'),
    meta: { title: '指标维度' },
  },
  {
    path: '/approvals',
    name: 'approvals',
    component: () => import('@/pages/ApprovalPage.vue'),
    meta: { title: '权限审批' },
  },
  {
    path: '/subscriptions',
    name: 'subscriptions',
    component: () => import('@/pages/SubscriptionPage.vue'),
    meta: { title: '异常订阅' },
  },
  {
    path: '/exports',
    name: 'exports',
    component: () => import('@/pages/ExportPage.vue'),
    meta: { title: '报表导出' },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/pages/HistoryPage.vue'),
    meta: { title: '版本对比' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.path !== '/login') {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      next('/login')
      return
    }
  }
  next()
})

export default router
