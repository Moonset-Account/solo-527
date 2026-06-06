import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板' }
      },
      {
        path: 'plots',
        name: 'Plots',
        component: () => import('@/views/Plots.vue'),
        meta: { title: '地块地图' }
      },
      {
        path: 'claims',
        name: 'Claims',
        component: () => import('@/views/Claims.vue'),
        meta: { title: '认领申请' }
      },
      {
        path: 'crops',
        name: 'Crops',
        component: () => import('@/views/Crops.vue'),
        meta: { title: '作物管理' }
      },
      {
        path: 'rotation',
        name: 'Rotation',
        component: () => import('@/views/Rotation.vue'),
        meta: { title: '轮值表' }
      },
      {
        path: 'tools',
        name: 'Tools',
        component: () => import('@/views/Tools.vue'),
        meta: { title: '公共工具' }
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/Announcements.vue'),
        meta: { title: '公共公告' }
      },
      {
        path: 'harvest',
        name: 'Harvest',
        component: () => import('@/views/Harvest.vue'),
        meta: { title: '收获记录' }
      },
      {
        path: 'photo-log',
        name: 'PhotoLog',
        component: () => import('@/views/PhotoLog.vue'),
        meta: { title: '照片日志' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (!authStore.initialized) {
    await authStore.initAuth()
  }

  if (to.meta.requiresAuth && !authStore.user) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    next({ name: 'Dashboard' })
  } else if (to.name === 'Login' && authStore.user) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
