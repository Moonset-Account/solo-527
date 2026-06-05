import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { isMobileDevice } from '@/utils/device'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/m',
    component: () => import('@/layouts/MobileLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/m/home'
      },
      {
        path: 'home',
        name: 'MobileHome',
        component: () => import('@/views/mobile/Home.vue'),
        meta: { title: '首页', requiresAuth: true }
      },
      {
        path: 'books',
        name: 'MobileBooks',
        component: () => import('@/views/mobile/Books.vue'),
        meta: { title: '图书', requiresAuth: true }
      },
      {
        path: 'books/:id',
        name: 'MobileBookDetail',
        component: () => import('@/views/mobile/BookDetail.vue'),
        meta: { title: '图书详情', requiresAuth: true }
      },
      {
        path: 'scan',
        name: 'MobileScan',
        component: () => import('@/views/mobile/Scan.vue'),
        meta: { title: '扫码', requiresAuth: true }
      },
      {
        path: 'reservations',
        name: 'MobileReservations',
        component: () => import('@/views/mobile/Reservations.vue'),
        meta: { title: '预留', requiresAuth: true }
      },
      {
        path: 'reservations/create',
        name: 'MobileCreateReservation',
        component: () => import('@/views/mobile/CreateReservation.vue'),
        meta: { title: '创建预留', requiresAuth: true }
      },
      {
        path: 'members',
        name: 'MobileMembers',
        component: () => import('@/views/mobile/Members.vue'),
        meta: { title: '会员', requiresAuth: true }
      },
      {
        path: 'members/:id',
        name: 'MobileMemberDetail',
        component: () => import('@/views/mobile/MemberDetail.vue'),
        meta: { title: '会员详情', requiresAuth: true }
      },
      {
        path: 'events',
        name: 'MobileEvents',
        component: () => import('@/views/mobile/Events.vue'),
        meta: { title: '活动', requiresAuth: true }
      },
      {
        path: 'events/:id',
        name: 'MobileEventDetail',
        component: () => import('@/views/mobile/EventDetail.vue'),
        meta: { title: '活动详情', requiresAuth: true }
      },
      {
        path: 'checkin',
        name: 'MobileCheckIn',
        component: () => import('@/views/mobile/CheckIn.vue'),
        meta: { title: '签到', requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'MobileProfile',
        component: () => import('@/views/mobile/Profile.vue'),
        meta: { title: '我的', requiresAuth: true }
      },
      {
        path: 'offline',
        name: 'MobileOffline',
        component: () => import('@/views/mobile/Offline.vue'),
        meta: { title: '离线数据', requiresAuth: true }
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresManager: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据看板', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'books',
        name: 'AdminBooks',
        component: () => import('@/views/admin/Books.vue'),
        meta: { title: '图书管理', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'inventory',
        name: 'AdminInventory',
        component: () => import('@/views/admin/Inventory.vue'),
        meta: { title: '库存管理', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'members',
        name: 'AdminMembers',
        component: () => import('@/views/admin/Members.vue'),
        meta: { title: '会员管理', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'reservations',
        name: 'AdminReservations',
        component: () => import('@/views/admin/Reservations.vue'),
        meta: { title: '预留管理', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'events',
        name: 'AdminEvents',
        component: () => import('@/views/admin/Events.vue'),
        meta: { title: '活动管理', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'sales',
        name: 'AdminSales',
        component: () => import('@/views/admin/Sales.vue'),
        meta: { title: '销售分析', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'suppliers',
        name: 'AdminSuppliers',
        component: () => import('@/views/admin/Suppliers.vue'),
        meta: { title: '供应商管理', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'validation',
        name: 'AdminValidation',
        component: () => import('@/views/admin/Validation.vue'),
        meta: { title: '数据校验', requiresAuth: true, requiresManager: true }
      },
      {
        path: 'export',
        name: 'AdminExport',
        component: () => import('@/views/admin/Export.vue'),
        meta: { title: '数据导出', requiresAuth: true, requiresManager: true }
      }
    ]
  },
  {
    path: '/',
    redirect: () => {
      const token = localStorage.getItem('token')
      if (!token) return '/login'
      return isMobileDevice() ? '/m/home' : '/admin/dashboard'
    }
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
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }

  if (to.meta.requiresManager && !userStore.isManager) {
    next('/m/home')
    return
  }

  if (to.path === '/login' && token) {
    next(isMobileDevice() ? '/m/home' : '/admin/dashboard')
    return
  }

  next()
})

export default router
