import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginLayout from '@/components/layout/LoginLayout.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: LoginLayout,
    meta: {
      title: '登录',
      requiresAuth: false
    },
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: {
          title: '登录',
          requiresAuth: false
        }
      }
    ]
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/WorkbenchView.vue'),
        meta: {
          title: '销售工作台',
          icon: 'dashboard',
          requiresAuth: true
        }
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: () => import('@/views/KnowledgeListView.vue'),
        meta: {
          title: '知识库管理',
          icon: 'book',
          requiresAuth: true
        }
      },
      {
        path: 'templates',
        name: 'Templates',
        component: () => import('@/views/TemplateVersionView.vue'),
        meta: {
          title: '话术版本中心',
          icon: 'chat',
          requiresAuth: true
        }
      },
      {
        path: 'prompts',
        name: 'Prompts',
        component: () => import('@/views/PromptVersionView.vue'),
        meta: {
          title: '提示词版本中心',
          icon: 'code',
          requiresAuth: true
        }
      },
      {
        path: 'reviews',
        name: 'Reviews',
        component: () => import('@/views/ReviewQueueView.vue'),
        meta: {
          title: '复核工作台',
          icon: 'check-circle',
          requiresAuth: true,
          roles: ['admin', 'reviewer']
        }
      },
      {
        path: 'risks',
        name: 'Risks',
        component: () => import('@/views/RiskSampleView.vue'),
        meta: {
          title: '风险样本库',
          icon: 'alert-triangle',
          requiresAuth: true,
          roles: ['admin', 'reviewer']
        }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/AnalyticsDashboardView.vue'),
        meta: {
          title: '统计分析看板',
          icon: 'bar-chart',
          requiresAuth: true,
          roles: ['admin']
        }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/OperationLogView.vue'),
        meta: {
          title: '操作日志',
          icon: 'file-text',
          requiresAuth: true,
          roles: ['admin']
        }
      }
    ]
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - 邮件智能审核系统`
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const hasRole = to.meta.roles.includes(authStore.user?.role as string)
    if (!hasRole) {
      next({ name: 'Dashboard' })
      return
    }
  }

  if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' })
    return
  }

  next()
})

export default router
