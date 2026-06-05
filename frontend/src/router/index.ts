import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/admin/Dashboard.vue'),
          meta: { title: '数据看板' }
        },
        {
          path: 'reagents',
          name: 'Reagents',
          component: () => import('@/views/admin/Reagents.vue'),
          meta: { title: '试剂管理' }
        },
        {
          path: 'reagents/:id',
          name: 'ReagentDetail',
          component: () => import('@/views/admin/ReagentDetail.vue'),
          meta: { title: '试剂详情' }
        },
        {
          path: 'storage',
          name: 'Storage',
          component: () => import('@/views/admin/Storage.vue'),
          meta: { title: '柜位管理' }
        },
        {
          path: 'requisitions',
          name: 'Requisitions',
          component: () => import('@/views/admin/Requisitions.vue'),
          meta: { title: '领用管理' }
        },
        {
          path: 'requisitions/:id',
          name: 'RequisitionDetail',
          component: () => import('@/views/admin/RequisitionDetail.vue'),
          meta: { title: '领用详情' }
        },
        {
          path: 'inventory',
          name: 'Inventory',
          component: () => import('@/views/admin/Inventory.vue'),
          meta: { title: '盘点管理' }
        },
        {
          path: 'inventory/:id',
          name: 'InventoryDetail',
          component: () => import('@/views/admin/InventoryDetail.vue'),
          meta: { title: '盘点详情' }
        },
        {
          path: 'notifications',
          name: 'Notifications',
          component: () => import('@/views/admin/Notifications.vue'),
          meta: { title: '通知中心' }
        },
        {
          path: 'audit',
          name: 'Audit',
          component: () => import('@/views/admin/Audit.vue'),
          meta: { title: '审计日志', roles: ['admin'] }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/admin/Users.vue'),
          meta: { title: '用户管理', roles: ['admin'] }
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/admin/Reports.vue'),
          meta: { title: '报表中心' }
        }
      ]
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
          meta: { title: '首页' }
        },
        {
          path: 'scan',
          name: 'MobileScan',
          component: () => import('@/views/mobile/Scan.vue'),
          meta: { title: '扫码' }
        },
        {
          path: 'stock-in',
          name: 'MobileStockIn',
          component: () => import('@/views/mobile/StockIn.vue'),
          meta: { title: '入库' }
        },
        {
          path: 'requisition',
          name: 'MobileRequisition',
          component: () => import('@/views/mobile/Requisition.vue'),
          meta: { title: '领用申请' }
        },
        {
          path: 'requisitions',
          name: 'MobileRequisitions',
          component: () => import('@/views/mobile/Requisitions.vue'),
          meta: { title: '我的申请' }
        },
        {
          path: 'confirm',
          name: 'MobileConfirm',
          component: () => import('@/views/mobile/Confirm.vue'),
          meta: { title: '待确认' }
        },
        {
          path: 'inventory',
          name: 'MobileInventory',
          component: () => import('@/views/mobile/Inventory.vue'),
          meta: { title: '盘点' }
        },
        {
          path: 'profile',
          name: 'MobileProfile',
          component: () => import('@/views/mobile/Profile.vue'),
          meta: { title: '我的' }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.restoreSession()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
  } else if (to.meta.roles && userStore.user) {
    const roles = to.meta.roles as string[]
    if (!roles.includes(userStore.user.role)) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
