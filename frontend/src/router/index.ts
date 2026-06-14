import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/subscribe',
    name: 'Subscribe',
    component: () => import('@/views/SubscribeView.vue'),
    meta: { requiresAuth: false, title: '会员订阅' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '数据看板' }
      },
      {
        path: 'partnerships',
        name: 'Partnerships',
        component: () => import('@/views/PartnershipsView.vue'),
        meta: { title: '品牌合作' }
      },
      {
        path: 'partnerships/:id',
        name: 'PartnershipDetail',
        component: () => import('@/views/PartnershipDetailView.vue'),
        meta: { title: '合作详情' }
      },
      {
        path: 'benefits',
        name: 'Benefits',
        component: () => import('@/views/BenefitsView.vue'),
        meta: { title: '赞助权益' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/OrdersView.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetailView.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'subscriptions',
        name: 'Subscriptions',
        component: () => import('@/views/SubscriptionsView.vue'),
        meta: { title: '会员订阅管理' }
      },
      {
        path: 'refunds',
        name: 'Refunds',
        component: () => import('@/views/RefundsView.vue'),
        meta: { title: '退款异常池' }
      },
      {
        path: 'configs',
        name: 'Configs',
        component: () => import('@/views/ConfigsView.vue'),
        meta: { title: '系统配置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('qinghe_token')
  if (to.meta.requiresAuth && !token && to.path !== '/login' && to.path !== '/subscribe') {
    next('/login')
  } else {
    next()
  }
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 青禾收入结算台`
  }
})

export default router
