import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: DefaultLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'House', requiresAuth: true }
      },
      {
        path: 'analytics',
        meta: { title: '数据分析', icon: 'DataAnalysis', requiresAuth: true },
        children: [
          {
            path: '',
            redirect: '/analytics/dashboard'
          },
          {
            path: 'dashboard',
            name: 'AnalyticsDashboard',
            component: () => import('@/views/analytics/AnalyticsDashboard.vue'),
            meta: { title: '数据总览', icon: 'DataBoard', requiresAuth: true }
          },
          {
            path: 'batch-query',
            name: 'BatchQuery',
            component: () => import('@/views/analytics/BatchQuery.vue'),
            meta: { title: '批量查询', icon: 'Search', requiresAuth: true }
          }
        ]
      },
      {
        path: 'place-order',
        name: 'PlaceOrder',
        component: () => import('@/views/order/PlaceOrder.vue'),
        meta: { title: '客户下单', icon: 'EditPen', requiresAuth: true }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/order/OrderList.vue'),
        meta: { title: '订单管理', icon: 'List', requiresAuth: true }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetail.vue'),
        meta: { title: '订单详情', icon: 'Document', requiresAuth: true, hidden: true }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/User.vue'),
        meta: { title: '用户管理', icon: 'User', requiresAuth: true }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: { title: '关于', icon: 'InfoFilled', requiresAuth: true }
      },
      {
        path: 'configs',
        name: 'ConfigList',
        component: () => import('@/views/config/ConfigList.vue'),
        meta: { title: '配置管理', icon: 'Setting', requiresAuth: true }
      },
      {
        path: 'reviews',
        name: 'ReviewList',
        component: () => import('@/views/review/ReviewList.vue'),
        meta: { title: '评价回访', icon: 'ChatLineSquare', requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '404', requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || ''} - ${import.meta.env.VITE_APP_TITLE}`
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
