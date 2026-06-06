import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false, title: '注册' }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/Default.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '待办看板', icon: 'List' }
      },
      {
        path: 'training-plans',
        name: 'TrainingPlans',
        component: () => import('@/views/TrainingPlans.vue'),
        meta: { title: '训练计划', icon: 'Calendar' }
      },
      {
        path: 'checkins',
        name: 'Checkins',
        component: () => import('@/views/Checkins.vue'),
        meta: { title: '打卡记录', icon: 'CircleCheck' }
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/Activities.vue'),
        meta: { title: '活动报名', icon: 'Trophy' }
      },
      {
        path: 'pace-analysis',
        name: 'PaceAnalysis',
        component: () => import('@/views/PaceAnalysis.vue'),
        meta: { title: '配速分析', icon: 'TrendCharts' }
      },
      {
        path: 'injury-notes',
        name: 'InjuryNotes',
        component: () => import('@/views/InjuryNotes.vue'),
        meta: { title: '伤病备注', icon: 'Warning', roles: ['admin', 'coach'] }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', icon: 'User' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  document.title = to.meta.title ? `${to.meta.title} - 城市跑团` : '城市跑团训练打卡平台'

  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    const userRole = userStore.userRole
    if (!to.meta.roles.includes(userRole)) {
      ElMessage.error('没有权限访问该页面')
      next(from.path || '/dashboard')
      return
    }
  }

  if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    next('/dashboard')
    return
  }

  next()
})

export default router
