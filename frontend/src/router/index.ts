import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '运营工作台', icon: 'DataAnalysis', keepAlive: true },
      },
      {
        path: 'bookings',
        name: 'Bookings',
        component: () => import('@/views/BookingListView.vue'),
        meta: { title: '预约管理', icon: 'Calendar' },
      },
      {
        path: 'bookings/create',
        name: 'CreateBooking',
        component: () => import('@/views/BookingCreateView.vue'),
        meta: { title: '新建预约', icon: 'Plus' },
      },
      {
        path: 'bookings/:id',
        name: 'BookingDetail',
        component: () => import('@/views/BookingDetailView.vue'),
        meta: { title: '预约详情', icon: 'Document' },
      },
      {
        path: 'no-show',
        name: 'NoShowList',
        component: () => import('@/views/NoShowListView.vue'),
        meta: { title: '爽约名单', icon: 'Warning' },
      },
      {
        path: 'available-slots',
        name: 'AvailableSlots',
        component: () => import('@/views/AvailableSlotsView.vue'),
        meta: { title: '可约时段', icon: 'Clock' },
      },
      {
        path: 'staff-schedule',
        name: 'StaffSchedule',
        component: () => import('@/views/StaffScheduleView.vue'),
        meta: { title: '技师排班', icon: 'UserFilled' },
      },
      {
        path: 'exceptions',
        name: 'ExceptionList',
        component: () => import('@/views/ExceptionListView.vue'),
        meta: { title: '异常待办池', icon: 'BellFilled' },
      },
      {
        path: 'customers',
        name: 'CustomerList',
        component: () => import('@/views/CustomerListView.vue'),
        meta: { title: '客户管理', icon: 'User' },
      },
      {
        path: 'staff',
        name: 'StaffList',
        component: () => import('@/views/StaffListView.vue'),
        meta: { title: '人员管理', icon: 'Avatar' },
      },
      {
        path: 'services',
        name: 'ServiceList',
        component: () => import('@/views/ServiceListView.vue'),
        meta: { title: '服务配置', icon: 'Tools' },
      },
      {
        path: 'conversion',
        name: 'ConversionAnalysis',
        component: () => import('@/views/ConversionView.vue'),
        meta: { title: '预约转化分析', icon: 'TrendCharts' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  userStore.restoreFromStorage()

  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  document.title = `${to.meta.title || '青禾预约候补台'} | 青禾预约候补台`
  next()
})

export default router
