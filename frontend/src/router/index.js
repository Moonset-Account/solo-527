import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览', icon: 'HomeFilled' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/OrderList.vue'),
        meta: { title: '工单管理', icon: 'Document' }
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/OrderCreate.vue'),
        meta: { title: '提交报修', icon: 'Edit' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue'),
        meta: { title: '工单详情', icon: 'Document' }
      },
      {
        path: 'inspection',
        name: 'Inspection',
        component: () => import('@/views/Inspection.vue'),
        meta: { title: '巡检管理', icon: 'Location' }
      },
      {
        path: 'expenses',
        name: 'Expenses',
        component: () => import('@/views/ExpenseList.vue'),
        meta: { title: '费用管理', icon: 'Money' }
      },
      {
        path: 'satisfaction',
        name: 'Satisfaction',
        component: () => import('@/views/Satisfaction.vue'),
        meta: { title: '满意度管理', icon: 'Star' }
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/Messages.vue'),
        meta: { title: '消息中心', icon: 'Bell' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
