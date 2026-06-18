import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页概览', icon: 'DataAnalysis' }
      },
      {
        path: 'anomalies',
        name: 'Anomalies',
        redirect: '/anomalies/list',
        meta: { title: '异常监控', icon: 'Warning' },
        children: [
          {
            path: 'list',
            name: 'AnomalyList',
            component: () => import('@/views/anomalies/list.vue'),
            meta: { title: '异常列表' }
          },
          {
            path: ':id',
            name: 'AnomalyDetail',
            component: () => import('@/views/anomalies/detail.vue'),
            meta: { title: '异常详情', hidden: true }
          }
        ]
      },
      {
        path: 'alert-rules',
        name: 'AlertRules',
        component: () => import('@/views/alert-rules/index.vue'),
        meta: { title: '告警规则', icon: 'Bell', roles: ['admin', 'manager'] }
      },
      {
        path: 'datasets',
        name: 'Datasets',
        redirect: '/datasets/list',
        meta: { title: '数据集管理', icon: 'Files', roles: ['admin', 'manager'] },
        children: [
          {
            path: 'list',
            name: 'DatasetList',
            component: () => import('@/views/datasets/list.vue'),
            meta: { title: '数据集列表' }
          },
          {
            path: ':id',
            name: 'DatasetDetail',
            component: () => import('@/views/datasets/detail.vue'),
            meta: { title: '数据集详情', hidden: true }
          }
        ]
      },
      {
        path: 'reports',
        name: 'Reports',
        redirect: '/reports/list',
        meta: { title: '复盘报表', icon: 'Document' },
        children: [
          {
            path: 'list',
            name: 'ReportList',
            component: () => import('@/views/reports/list.vue'),
            meta: { title: '报表列表' }
          },
          {
            path: ':id',
            name: 'ReportDetail',
            component: () => import('@/views/reports/detail.vue'),
            meta: { title: '报表详情', hidden: true }
          }
        ]
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/search/index.vue'),
        meta: { title: '全局搜索', icon: 'Search' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/notifications/index.vue'),
        meta: { title: '消息中心', icon: 'Message' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/index.vue'),
        meta: { title: '个人中心', icon: 'Setting', hidden: true }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { title: '无权限', public: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  NProgress.start()
  const userStore = useUserStore()
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + '用户增长异常监控台'

  if (to.meta.public) {
    next()
    return
  }

  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && !(to.meta.roles as string[]).includes(userStore.userInfo?.role as string)) {
    next('/403')
    return
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
