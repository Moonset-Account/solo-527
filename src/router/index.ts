import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import MemberRepurchase from '@/views/MemberRepurchase.vue'
import ActivityAnalysis from '@/views/ActivityAnalysis.vue'
import MedicineCategory from '@/views/MedicineCategory.vue'
import SystemSettings from '@/views/SystemSettings.vue'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/permission'
import type { PermissionConfig } from '@/types'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '数据概览' }
      },
      {
        path: 'member/repurchase',
        name: 'MemberRepurchase',
        component: MemberRepurchase,
        meta: { title: '会员复购分析' }
      },
      {
        path: 'activity/analysis',
        name: 'ActivityAnalysis',
        component: ActivityAnalysis,
        meta: {
          title: '活动效果分析',
          requiredPermission: 'canViewAllStores' as keyof PermissionConfig
        }
      },
      {
        path: 'medicine/category',
        name: 'MedicineCategory',
        component: MedicineCategory,
        meta: {
          title: '药品分类管理',
          requiredPermission: 'canManageCategory' as keyof PermissionConfig
        }
      },
      {
        path: 'system/settings',
        name: 'SystemSettings',
        component: SystemSettings,
        meta: {
          title: '系统设置',
          requiredPermission: 'canManageCategory' as keyof PermissionConfig
        }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: {
      template: `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-300">403</h1>
            <p class="mt-4 text-gray-600">您没有访问该页面的权限</p>
            <button onclick="window.location.href='/dashboard'" class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              返回首页
            </button>
          </div>
        </div>
      `
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: {
      template: `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-300">404</h1>
            <p class="mt-4 text-gray-600">页面不存在</p>
            <button onclick="window.location.href='/dashboard'" class="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              返回首页
            </button>
          </div>
        </div>
      `
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  authStore.initFromStorage()

  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.requiredPermission) {
    const permission = to.meta.requiredPermission as keyof PermissionConfig
    if (authStore.user && !hasPermission(authStore.user.role, permission)) {
      next('/403')
      return
    }
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
    return
  }

  next()
})

export default router
