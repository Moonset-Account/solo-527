import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layout/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '看板' }
      },
      {
        path: 'orders/accept',
        name: 'OrderAccept',
        component: () => import('../views/OrderAccept.vue'),
        meta: { title: '接单' }
      },
      {
        path: 'orders/route/:id',
        name: 'RouteView',
        component: () => import('../views/RouteView.vue'),
        meta: { title: '路线查看' }
      },
      {
        path: 'orders/todo/:id',
        name: 'TodoDetail',
        component: () => import('../views/TodoDetail.vue'),
        meta: { title: '待办详情' }
      },
      {
        path: 'timeliness/analysis',
        name: 'TimelinessAnalysis',
        component: () => import('../views/TimelinessAnalysis.vue'),
        meta: { title: '超时节点分析' }
      },
      {
        path: 'timeliness/fulfillment',
        name: 'FulfillmentData',
        component: () => import('../views/FulfillmentData.vue'),
        meta: { title: '履约时效' }
      },
      {
        path: 'exceptions',
        name: 'ExceptionRecord',
        component: () => import('../views/ExceptionRecord.vue'),
        meta: { title: '异常记录' }
      },
      {
        path: 'batch',
        name: 'BatchImport',
        component: () => import('../views/BatchImport.vue'),
        meta: { title: '批量操作' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
