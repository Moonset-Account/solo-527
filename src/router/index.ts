import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { title: '能耗看板' },
      },
      {
        path: 'meters',
        name: 'MeterList',
        component: () => import('@/pages/MeterListPage.vue'),
        meta: { title: '表计管理' },
      },
      {
        path: 'meters/add',
        name: 'MeterAdd',
        component: () => import('@/pages/MeterAddPage.vue'),
        meta: { title: '新增表计' },
      },
      {
        path: 'zones',
        name: 'ZoneList',
        component: () => import('@/pages/ZoneListPage.vue'),
        meta: { title: '分区管理' },
      },
      {
        path: 'zones/:id',
        name: 'ZoneDetail',
        component: () => import('@/pages/ZoneDetailPage.vue'),
        meta: { title: '分区详情' },
      },
      {
        path: 'alarms',
        name: 'AlarmList',
        component: () => import('@/pages/AlarmListPage.vue'),
        meta: { title: '告警列表' },
      },
      {
        path: 'alarms/:id',
        name: 'AlarmDetail',
        component: () => import('@/pages/AlarmDetailPage.vue'),
        meta: { title: '告警详情' },
      },
      {
        path: 'alarms/review',
        name: 'AlarmReview',
        component: () => import('@/pages/AlarmReviewPage.vue'),
        meta: { title: '月度复盘' },
      },
      {
        path: 'subsidies',
        name: 'SubsidyList',
        component: () => import('@/pages/SubsidyListPage.vue'),
        meta: { title: '补贴记录' },
      },
      {
        path: 'subsidies/:id',
        name: 'SubsidyDetail',
        component: () => import('@/pages/SubsidyDetailPage.vue'),
        meta: { title: '补贴详情' },
      },
      {
        path: 'data-query',
        name: 'DataQuery',
        component: () => import('@/pages/DataQueryPage.vue'),
        meta: { title: '数据查询' },
      },
      {
        path: 'sync',
        name: 'SyncList',
        component: () => import('@/pages/SyncListPage.vue'),
        meta: { title: '同步管理' },
      },
      {
        path: 'sync/:id',
        name: 'SyncDetail',
        component: () => import('@/pages/SyncDetailPage.vue'),
        meta: { title: '同步详情' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
