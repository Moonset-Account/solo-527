import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/requirements',
      },
      {
        path: 'requirements',
        name: 'requirements',
        component: () => import('@/pages/RequirementsPage.vue'),
      },
      {
        path: 'requirements/new',
        name: 'requirement-new',
        component: () => import('@/pages/RequirementFormPage.vue'),
      },
      {
        path: 'requirements/:id',
        name: 'requirement-detail',
        component: () => import('@/pages/RequirementDetailPage.vue'),
        props: true,
      },
      {
        path: 'reminders',
        name: 'reminders',
        component: () => import('@/pages/RemindersPage.vue'),
        meta: { roles: ['project_pm', 'admin'] },
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('@/pages/AdminPage.vue'),
        meta: { roles: ['admin'] },
      },
      {
        path: 'logs',
        name: 'logs',
        component: () => import('@/pages/AuditLogsPage.vue'),
        meta: { roles: ['project_pm', 'admin'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: string[]
  }
}

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next('/login')
    return
  }
  if (to.meta.roles && authStore.userRole && !to.meta.roles.includes(authStore.userRole)) {
    next('/requirements')
    return
  }
  if (to.path === '/login' && authStore.isLoggedIn) {
    next('/requirements')
    return
  }
  next()
})

export default router
