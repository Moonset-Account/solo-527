import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/PageLayout.vue'),
    meta: { requiresAuth: true, role: 'sales' },
    children: [
      {
        path: '',
        redirect: '/drafts'
      },
      {
        path: 'drafts',
        name: 'DraftList',
        component: () => import('@/views/sales/DraftList.vue'),
        meta: { title: '邮件草稿', icon: 'Document' }
      },
      {
        path: 'drafts/new',
        name: 'DraftNew',
        component: () => import('@/views/sales/DraftNew.vue'),
        meta: { title: '新建草稿', icon: 'Edit' }
      },
      {
        path: 'drafts/:id/edit',
        name: 'DraftEdit',
        component: () => import('@/views/sales/DraftEdit.vue'),
        meta: { title: '编辑草稿', icon: 'EditPen' }
      },
      {
        path: 'drafts/:id/versions/:vid',
        name: 'DraftVersion',
        component: () => import('@/views/sales/DraftVersion.vue'),
        meta: { title: '查看版本', icon: 'Clock' }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/components/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据看板', icon: 'DataAnalysis' }
      },
      {
        path: 'prompts',
        name: 'AdminPrompts',
        component: () => import('@/views/admin/Prompts.vue'),
        meta: { title: '提示词管理', icon: 'MagicStick' }
      },
      {
        path: 'knowledge',
        name: 'AdminKnowledge',
        component: () => import('@/views/admin/Knowledge.vue'),
        meta: { title: '知识库管理', icon: 'Collection' }
      },
      {
        path: 'review',
        name: 'AdminReview',
        component: () => import('@/views/admin/Review.vue'),
        meta: { title: '复核看板', icon: 'CircleCheck' }
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('@/views/admin/Logs.vue'),
        meta: { title: '调用日志', icon: 'Tickets' }
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  document.title = to.meta.title ? `${to.meta.title} - 销售邮件智能处理台` : '销售邮件智能处理台'

  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      next({ path: '/login', query: { redirect: to.fullPath } })
    } else if (to.meta.role && userStore.role !== to.meta.role && userStore.role !== 'admin') {
      if (userStore.role === 'admin' && to.path.startsWith('/admin')) {
        next()
      } else if (userStore.role === 'sales' && !to.path.startsWith('/admin')) {
        next()
      } else {
        next(userStore.role === 'admin' ? '/admin' : '/')
      }
    } else {
      next()
    }
  } else {
    if (to.path === '/login' && userStore.isLoggedIn) {
      next(userStore.role === 'admin' ? '/admin' : '/')
    } else {
      next()
    }
  }
})

export default router
