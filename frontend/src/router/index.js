import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' }
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/member/index.vue'),
        meta: { title: '会员管理', icon: 'User' }
      },
      {
        path: 'member-detail/:id',
        name: 'MemberDetail',
        component: () => import('@/views/member/detail.vue'),
        meta: { title: '会员详情', icon: 'User', hidden: true }
      },
      {
        path: 'benefits',
        name: 'Benefits',
        component: () => import('@/views/benefit/index.vue'),
        meta: { title: '权益中心', icon: 'Present' }
      },
      {
        path: 'levels',
        name: 'Levels',
        component: () => import('@/views/level/index.vue'),
        meta: { title: '等级规则', icon: 'Medal', roles: ['admin', 'brand_operator'] }
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('@/views/coupon/index.vue'),
        meta: { title: '优惠券', icon: 'Discount' }
      },
      {
        path: 'points',
        name: 'Points',
        component: () => import('@/views/points/index.vue'),
        meta: { title: '积分权益', icon: 'Coin' }
      },
      {
        path: 'redeems',
        name: 'Redeems',
        component: () => import('@/views/redeem/index.vue'),
        meta: { title: '兑换记录', icon: 'ShoppingCart' }
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/activity/index.vue'),
        meta: { title: '会员活跃', icon: 'DataAnalysis' }
      },
      {
        path: 'reach-logs',
        name: 'ReachLogs',
        component: () => import('@/views/reach-log/index.vue'),
        meta: { title: '触达日志', icon: 'Message', roles: ['admin', 'brand_operator'] }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/report/index.vue'),
        meta: { title: '数据报表', icon: 'TrendCharts', roles: ['admin', 'brand_operator'] }
      },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (to.meta.requiresAuth !== false && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta?.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(userStore.user?.role)) {
      next('/dashboard')
      return
    }
  }

  document.title = `${to.meta?.title || ''} - 青禾会员触达台`
  next()
})

export default router
