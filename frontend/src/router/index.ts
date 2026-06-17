import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/user/Layout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/user/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'order/create',
        name: 'CreateOrder',
        component: () => import('@/views/user/CreateOrder.vue'),
        meta: { title: '快速下单' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/user/Orders.vue'),
        meta: { title: '我的订单', requiresAuth: true }
      },
      {
        path: 'order/:id',
        name: 'OrderDetail',
        component: () => import('@/views/user/OrderDetail.vue'),
        meta: { title: '订单详情', requiresAuth: true }
      }
    ]
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/Login.vue'),
    meta: { title: '管理后台登录' }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/Orders.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'technicians',
        name: 'AdminTechnicians',
        component: () => import('@/views/admin/Technicians.vue'),
        meta: { title: '师傅管理' }
      },
      {
        path: 'price-rules',
        name: 'AdminPriceRules',
        component: () => import('@/views/admin/PriceRules.vue'),
        meta: { title: '价格规则' }
      },
      {
        path: 'configs',
        name: 'AdminConfigs',
        component: () => import('@/views/admin/Configs.vue'),
        meta: { title: '配置管理' }
      },
      {
        path: 'statistics',
        name: 'AdminStatistics',
        component: () => import('@/views/admin/Statistics.vue'),
        meta: { title: '统计分析' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || ''} - ${import.meta.env.VITE_APP_TITLE}`

  const userStore = useUserStore()
  const adminStore = useAdminStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/' })
  } else if (to.meta.requiresAdmin && !adminStore.isLoggedIn) {
    next({ path: '/admin/login' })
  } else {
    next()
  }
})

export default router
