import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    redirect: '/admin/dashboard',
  },
  {
    path: '/customer',
    name: 'CustomerLayout',
    component: () => import('@/layouts/CustomerLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/customer/appointment',
      },
      {
        path: 'appointment',
        name: 'CustomerAppointment',
        component: () => import('@/views/customer/appointment/index.vue'),
        meta: { title: '预约服务' },
      },
      {
        path: 'my-appointments',
        name: 'MyAppointments',
        component: () => import('@/views/customer/my-appointments/index.vue'),
        meta: { title: '我的预约' },
      },
      {
        path: 'services',
        name: 'CustomerServices',
        component: () => import('@/views/customer/services/index.vue'),
        meta: { title: '服务项目' },
      },
      {
        path: 'technicians',
        name: 'CustomerTechnicians',
        component: () => import('@/views/customer/technicians/index.vue'),
        meta: { title: '技师团队' },
      },
    ],
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/admin/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'Odometer' },
      },
      {
        path: 'appointments',
        name: 'AdminAppointments',
        component: () => import('@/views/admin/appointments/index.vue'),
        meta: { title: '预约管理', icon: 'Calendar' },
      },
      {
        path: 'services',
        name: 'AdminServices',
        component: () => import('@/views/admin/services/index.vue'),
        meta: { title: '服务项目', icon: 'Goods' },
      },
      {
        path: 'technicians',
        name: 'AdminTechnicians',
        component: () => import('@/views/admin/technicians/index.vue'),
        meta: { title: '技师管理', icon: 'UserFilled' },
      },
      {
        path: 'schedule',
        name: 'AdminSchedule',
        component: () => import('@/views/admin/schedule/index.vue'),
        meta: { title: '排班管理', icon: 'Clock' },
      },
      {
        path: 'checkin',
        name: 'AdminCheckin',
        component: () => import('@/views/admin/checkin/index.vue'),
        meta: { title: '到店核销', icon: 'Finished' },
      },
      {
        path: 'cashier',
        name: 'AdminCashier',
        component: () => import('@/views/admin/cashier/index.vue'),
        meta: { title: '收银记录', icon: 'Money' },
      },
      {
        path: 'memberships',
        name: 'AdminMemberships',
        component: () => import('@/views/admin/memberships/index.vue'),
        meta: { title: '会员卡', icon: 'CreditCard' },
      },
      {
        path: 'customer-memberships',
        name: 'AdminCustomerMemberships',
        component: () => import('@/views/admin/customer-memberships/index.vue'),
        meta: { title: '会员管理', icon: 'Avatar' },
      },
      {
        path: 'reminders',
        name: 'AdminReminders',
        component: () => import('@/views/admin/reminders/index.vue'),
        meta: { title: '提醒规则', icon: 'Bell' },
      },
      {
        path: 'dictionary',
        name: 'AdminDictionary',
        component: () => import('@/views/admin/dictionary/index.vue'),
        meta: { title: '字典管理', icon: 'Collection' },
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/settings/index.vue'),
        meta: { title: '系统设置', icon: 'Setting' },
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('@/views/admin/logs/index.vue'),
        meta: { title: '操作日志', icon: 'Document' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.title) {
    document.title = `${to.meta.title} - 美甲店预约系统`
  }

  if (to.meta.public) {
    next()
  } else if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
