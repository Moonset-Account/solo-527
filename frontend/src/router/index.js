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
    redirect: '/dashboard',
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '待办首页', icon: 'Odometer' }
      },
      {
        path: 'seats',
        name: 'Seats',
        component: () => import('@/views/SeatList.vue'),
        meta: { title: '席位管理', icon: 'Monitor' }
      },
      {
        path: 'seats/idle',
        name: 'IdleSeats',
        component: () => import('@/views/IdleSeats.vue'),
        meta: { title: '闲置席位', icon: 'Moon' }
      },
      {
        path: 'seats/:id',
        name: 'SeatDetail',
        component: () => import('@/views/SeatDetail.vue'),
        meta: { title: '席位详情', hidden: true }
      },
      {
        path: 'plans',
        name: 'Plans',
        component: () => import('@/views/PlanList.vue'),
        meta: { title: '套餐管理', icon: 'Box' }
      },
      {
        path: 'usage',
        name: 'Usage',
        component: () => import('@/views/UsageStats.vue'),
        meta: { title: '用量统计', icon: 'DataLine' }
      },
      {
        path: 'bills',
        name: 'Bills',
        component: () => import('@/views/BillList.vue'),
        meta: { title: '账单管理', icon: 'Document' }
      },
      {
        path: 'renewal',
        name: 'Renewal',
        component: () => import('@/views/RenewalList.vue'),
        meta: { title: '续费名单', icon: 'Clock' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/UserList.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin'] }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/RoleList.vue'),
        meta: { title: '角色管理', icon: 'UserFilled', roles: ['admin'] }
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

  if (to.meta.requiresAuth !== false && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && token) {
    next({ path: '/dashboard' })
  } else {
    next()
  }
})

export default router
