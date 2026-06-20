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
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'tours',
        name: 'Tours',
        component: () => import('@/views/tours/TourList.vue'),
        meta: { title: '导览路线' }
      },
      {
        path: 'tours/:id',
        name: 'TourDetail',
        component: () => import('@/views/tours/TourDetail.vue'),
        meta: { title: '路线详情' }
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('@/views/tours/ScheduleList.vue'),
        meta: { title: '排期管理' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/inventory/InventoryList.vue'),
        meta: { title: '库存管理' }
      },
      {
        path: 'inventory/:id',
        name: 'InventoryDetail',
        component: () => import('@/views/inventory/InventoryDetail.vue'),
        meta: { title: '库存详情' }
      },
      {
        path: 'cleaning-tasks',
        name: 'CleaningTasks',
        component: () => import('@/views/cleaning/CleaningTaskList.vue'),
        meta: { title: '清洁任务' }
      },
      {
        path: 'reminders',
        name: 'Reminders',
        component: () => import('@/views/reminders/ReminderList.vue'),
        meta: { title: '消息提醒' }
      },
      {
        path: 'reminder-rules',
        name: 'ReminderRules',
        component: () => import('@/views/reminders/ReminderRuleList.vue'),
        meta: { title: '提醒规则' }
      },
      {
        path: 'drivers',
        name: 'Drivers',
        component: () => import('@/views/drivers/DriverList.vue'),
        meta: { title: '司机管理' }
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
  const token = userStore.token

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
