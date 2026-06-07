import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import Dashboard from '@/views/Dashboard.vue'
import PeakValley from '@/views/PeakValley.vue'
import Allocation from '@/views/Allocation.vue'
import Alerts from '@/views/Alerts.vue'
import Config from '@/views/Config.vue'
import Reports from '@/views/Reports.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard,
        meta: { title: '综合能耗看板' }
      },
      {
        path: 'peak-valley',
        name: 'peak-valley',
        component: PeakValley,
        meta: { title: '峰谷对比分析' }
      },
      {
        path: 'allocation',
        name: 'allocation',
        component: Allocation,
        meta: { title: '租户分摊管理' }
      },
      {
        path: 'alerts',
        name: 'alerts',
        component: Alerts,
        meta: { title: '异常告警中心' }
      },
      {
        path: 'config',
        name: 'config',
        component: Config,
        meta: { title: '系统配置' }
      },
      {
        path: 'reports',
        name: 'reports',
        component: Reports,
        meta: { title: '报告导出' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
