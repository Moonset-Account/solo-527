import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import HomePage from '@/pages/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import ItemsPage from '@/pages/ItemsPage.vue'
import ItemDetailPage from '@/pages/ItemDetailPage.vue'
import OperationsPage from '@/pages/OperationsPage.vue'
import SettingsPage from '@/pages/SettingsPage.vue'
import UsersPage from '@/pages/UsersPage.vue'
import NotFoundPage from '@/pages/NotFoundPage.vue'
import ForbiddenPage from '@/pages/ForbiddenPage.vue'

export type UserRole = 'pm' | 'admin'

export interface CurrentUser {
  id: string
  name: string
  role: UserRole
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    roles?: UserRole[]
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      title: '登录',
      requiresAuth: false,
    },
  },
  {
    path: '/',
    component: MainLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
        meta: {
          title: '首页',
          roles: ['pm', 'admin'],
        },
      },
      {
        path: 'items',
        name: 'items',
        component: ItemsPage,
        meta: {
          title: '事项管理',
          roles: ['pm', 'admin'],
        },
      },
      {
        path: 'items/:id',
        name: 'item-detail',
        component: ItemDetailPage,
        meta: {
          title: '事项详情',
          roles: ['pm', 'admin'],
        },
      },
      {
        path: 'operations',
        name: 'operations',
        component: OperationsPage,
        meta: {
          title: '运营后台',
          roles: ['admin'],
        },
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsPage,
        meta: {
          title: '配置页',
          roles: ['admin'],
        },
      },
      {
        path: 'users',
        name: 'users',
        component: UsersPage,
        meta: {
          title: '用户管理',
          roles: ['admin'],
        },
      },
    ],
  },
  {
    path: '/403',
    name: '403',
    component: ForbiddenPage,
    meta: {
      title: '权限不足',
      requiresAuth: false,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
    meta: {
      title: '页面不存在',
      requiresAuth: false,
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function getCurrentUser(): CurrentUser | null {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }
  return null
}

function hasPermission(user: CurrentUser | null, roles?: UserRole[]): boolean {
  if (!roles || roles.length === 0) {
    return true
  }
  if (!user) {
    return false
  }
  return roles.includes(user.role)
}

router.beforeEach((to, _from, next) => {
  const user = getCurrentUser()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const roles = to.meta.roles

  if (to.path === '/login') {
    if (user) {
      next('/')
      return
    }
    next()
    return
  }

  if (requiresAuth && !user) {
    next('/login')
    return
  }

  if (roles && !hasPermission(user, roles)) {
    next('/403')
    return
  }

  next()
})

export default router
