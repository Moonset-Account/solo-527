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
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'people',
        name: 'People',
        component: () => import('@/views/People.vue'),
        meta: { title: '人员管理' }
      },
      {
        path: 'credentials',
        name: 'Credentials',
        component: () => import('@/views/Credentials.vue'),
        meta: { title: '证件管理' }
      },
      {
        path: 'vehicles',
        name: 'Vehicles',
        component: () => import('@/views/Vehicles.vue'),
        meta: { title: '车辆管理' }
      },
      {
        path: 'work-zones',
        name: 'WorkZones',
        component: () => import('@/views/WorkZones.vue'),
        meta: { title: '作业区域' }
      },
      {
        path: 'passes',
        name: 'Passes',
        component: () => import('@/views/Passes.vue'),
        meta: { title: '通行证管理' }
      },
      {
        path: 'pass-apply',
        name: 'PassApply',
        component: () => import('@/views/PassApply.vue'),
        meta: { title: '访客申请' }
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: () => import('@/views/Approvals.vue'),
        meta: { title: '审批管理' }
      },
      {
        path: 'violations',
        name: 'Violations',
        component: () => import('@/views/Violations.vue'),
        meta: { title: '违规管理' }
      },
      {
        path: 'gate',
        name: 'Gate',
        component: () => import('@/views/Gate.vue'),
        meta: { title: '门岗放行' }
      },
      {
        path: 'gate-logs',
        name: 'GateLogs',
        component: () => import('@/views/GateLogs.vue'),
        meta: { title: '门岗记录' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { title: '通知中心' }
      },
      {
        path: 'import-export',
        name: 'ImportExport',
        component: () => import('@/views/ImportExport.vue'),
        meta: { title: '导入导出' }
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

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
