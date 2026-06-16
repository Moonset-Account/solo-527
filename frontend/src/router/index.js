import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/home',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页', requiresAuth: true }
      },
      {
        path: 'court-booking',
        name: 'CourtBooking',
        component: () => import('@/views/booking/CourtList.vue'),
        meta: { title: '场地预约', requiresAuth: true }
      },
      {
        path: 'booking/create/:courtId?',
        name: 'BookingCreate',
        component: () => import('@/views/booking/BookingCreate.vue'),
        meta: { title: '创建预约', requiresAuth: true }
      },
      {
        path: 'my-bookings',
        name: 'MyBooking',
        component: () => import('@/views/booking/MyBooking.vue'),
        meta: { title: '我的预约', requiresAuth: true }
      },
      {
        path: 'payment/:bookingId',
        name: 'Payment',
        component: () => import('@/views/booking/Payment.vue'),
        meta: { title: '支付', requiresAuth: true }
      },
      {
        path: 'course-center',
        name: 'CourseCenter',
        component: () => import('@/views/course/CourseList.vue'),
        meta: { title: '课程中心', requiresAuth: true }
      },
      {
        path: 'my-courses',
        name: 'MyCourses',
        component: () => import('@/views/course/CourseSchedule.vue'),
        meta: { title: '我的课程', requiresAuth: true }
      },
      {
        path: 'court',
        name: 'CourtManage',
        component: () => import('@/views/booking/CourtList.vue'),
        meta: { title: '场地管理', requiresAuth: true, roles: ['admin', 'manager'] }
      },
      {
        path: 'equipment',
        name: 'EquipmentManage',
        component: () => import('@/views/equipment/EquipmentList.vue'),
        meta: { title: '设备管理', requiresAuth: true, roles: ['admin', 'manager'] }
      },
      {
        path: 'inspection',
        name: 'InspectionManage',
        component: () => import('@/views/inspection/InspectionList.vue'),
        meta: { title: '巡检管理', requiresAuth: true, roles: ['admin', 'manager', 'inspector'] }
      },
      {
        path: 'repair',
        name: 'RepairManage',
        component: () => import('@/views/repair/RepairList.vue'),
        meta: { title: '维修管理', requiresAuth: true, roles: ['admin', 'manager', 'repairer'] }
      },
      {
        path: 'coach',
        name: 'CoachManage',
        component: () => import('@/views/coach/CoachList.vue'),
        meta: { title: '教练管理', requiresAuth: true, roles: ['admin', 'manager'] }
      },
      {
        path: 'course',
        name: 'CourseManage',
        component: () => import('@/views/course/CourseList.vue'),
        meta: { title: '课程管理', requiresAuth: true, roles: ['admin', 'manager'] }
      },
      {
        path: 'course-schedule',
        name: 'CourseScheduleManage',
        component: () => import('@/views/course/CourseSchedule.vue'),
        meta: { title: '课程排班', requiresAuth: true, roles: ['admin', 'manager', 'coach'] }
      },
      {
        path: 'todo',
        name: 'TodoManage',
        component: () => import('@/views/todo/TodoList.vue'),
        meta: { title: '待办事项', requiresAuth: true }
      },
      {
        path: 'report/court-usage',
        name: 'CourtUsageReport',
        component: () => import('@/views/report/CourtUsage.vue'),
        meta: { title: '场地利用趋势', requiresAuth: true, roles: ['admin', 'manager'] }
      },
      {
        path: 'report/inventory',
        name: 'InventoryReport',
        component: () => import('@/views/report/InventoryReport.vue'),
        meta: { title: '库存占用报表', requiresAuth: true, roles: ['admin', 'manager'] }
      },
      {
        path: 'log/api-log',
        name: 'ApiLog',
        component: () => import('@/views/system/ApiLog.vue'),
        meta: { title: '接口日志', requiresAuth: true, roles: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth !== false && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/home')
  } else {
    next()
  }
})

export default router
