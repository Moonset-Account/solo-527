import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'map',
    component: () => import('@/pages/MapPage.vue'),
    meta: { public: true, title: '桶点地图' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true, title: '登录' }
  },
  {
    path: '/manager',
    name: 'manager',
    component: () => import('@/pages/manager/ManagerLayout.vue'),
    meta: { roles: ['manager'] },
    children: [
      {
        path: '',
        name: 'manager-dashboard',
        component: () => import('@/pages/manager/DashboardPage.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'misuse',
        name: 'manager-misuse',
        component: () => import('@/pages/manager/MisusePage.vue'),
        meta: { title: '误投趋势' }
      },
      {
        path: 'full-alert',
        name: 'manager-full-alert',
        component: () => import('@/pages/manager/FullAlertPage.vue'),
        meta: { title: '桶满报警' }
      },
      {
        path: 'efficiency',
        name: 'manager-efficiency',
        component: () => import('@/pages/manager/EfficiencyPage.vue'),
        meta: { title: '清运效率' }
      },
      {
        path: 'inspection',
        name: 'manager-inspection',
        component: () => import('@/pages/manager/InspectionPage.vue'),
        meta: { title: '巡查覆盖' }
      },
      {
        path: 'community',
        name: 'manager-community',
        component: () => import('@/pages/manager/CommunityPage.vue'),
        meta: { title: '社区对比' }
      }
    ]
  },
  {
    path: '/audit',
    name: 'audit',
    component: () => import('@/pages/audit/AuditPage.vue'),
    meta: { roles: ['manager', 'auditor'], title: '照片审核' }
  },
  {
    path: '/public',
    name: 'public',
    component: () => import('@/pages/PublicDashboard.vue'),
    meta: { public: true, title: '公开数据看板' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { roles: ['manager'], title: '系统设置' }
  },
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/pages/ForbiddenPage.vue'),
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    next()
    return
  }

  if (!userStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && !(to.meta.roles as string[]).includes(userStore.role)) {
    next({ name: 'forbidden' })
    return
  }

  next()
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 城市垃圾分类投放分析系统`
  }
})

export default router
