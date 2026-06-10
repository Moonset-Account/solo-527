import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览', icon: 'Odometer' },
      },
      {
        path: 'work-orders',
        name: 'WorkOrders',
        component: () => import('@/views/work-orders/Index.vue'),
        meta: { title: '工单管理', icon: 'Document' },
      },
      {
        path: 'work-orders/:id',
        name: 'WorkOrderDetail',
        component: () => import('@/views/work-orders/Detail.vue'),
        meta: { title: '工单详情', hidden: true },
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('@/views/schedules/Index.vue'),
        meta: { title: '排产计划', icon: 'Calendar' },
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/materials/Index.vue'),
        meta: { title: '物料齐套', icon: 'Goods' },
      },
      {
        path: 'reworks',
        name: 'Reworks',
        component: () => import('@/views/reworks/Index.vue'),
        meta: { title: '返工管理', icon: 'RefreshLeft' },
      },
      {
        path: 'production',
        name: 'Production',
        component: () => import('@/views/production/Index.vue'),
        meta: { title: '产量工时', icon: 'Histogram' },
      },
      {
        path: 'risks',
        name: 'Risks',
        component: () => import('@/views/risks/Index.vue'),
        meta: { title: '交期风险', icon: 'Warning' },
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/logs/Index.vue'),
        meta: { title: '操作日志', icon: 'Notebook', roles: ['admin'] },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/Index.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin'] },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = localStorage.getItem('token')

  document.title = to.meta.title ? `${to.meta.title} - 工单排产计划台` : '工单排产计划台'

  if (to.meta.requiresAuth !== false) {
    if (!token) {
      next({ path: '/login', query: { redirect: to.fullPath } })
    } else {
      if (!userStore.userInfo) {
        userStore.getCurrentUser().catch(() => {
          localStorage.removeItem('token')
          next({ path: '/login' })
        })
      }

      if (to.meta.roles && to.meta.roles.length > 0) {
        const hasRole = userStore.roles?.some((role) => to.meta.roles.includes(role.slug))
        if (!hasRole) {
          next('/403')
          return
        }
      }

      next()
    }
  } else {
    if (token && to.path === '/login') {
      next('/')
    } else {
      next()
    }
  }
})

export default router
