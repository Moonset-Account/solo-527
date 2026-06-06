import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/Default.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { permission: 'dashboard.view' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/Index.vue'),
        meta: { permission: 'order.view' },
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/orders/Create.vue'),
        meta: { permission: 'order.create' },
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/Detail.vue'),
        meta: { permission: 'order.view' },
      },
      {
        path: 'picking',
        name: 'Picking',
        component: () => import('@/views/picking/Index.vue'),
        meta: { permission: 'picking.view' },
      },
      {
        path: 'picking/:id',
        name: 'PickingDetail',
        component: () => import('@/views/picking/Detail.vue'),
        meta: { permission: 'picking.view' },
      },
      {
        path: 'returns',
        name: 'Returns',
        component: () => import('@/views/returns/Index.vue'),
        meta: { permission: 'return.view' },
      },
      {
        path: 'returns/:id',
        name: 'ReturnDetail',
        component: () => import('@/views/returns/Detail.vue'),
        meta: { permission: 'return.view' },
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/views/customers/Index.vue'),
        meta: { permission: 'customer.view' },
      },
      {
        path: 'customers/:id',
        name: 'CustomerDetail',
        component: () => import('@/views/customers/Detail.vue'),
        meta: { permission: 'customer.view' },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/Index.vue'),
        meta: { permission: 'product.view' },
      },
      {
        path: 'locations',
        name: 'Locations',
        component: () => import('@/views/locations/Index.vue'),
        meta: { permission: 'location.view' },
      },
      {
        path: 'debts',
        name: 'Debts',
        component: () => import('@/views/debts/Index.vue'),
        meta: { permission: 'debt.view' },
      },
      {
        path: 'statements',
        name: 'Statements',
        component: () => import('@/views/statements/Index.vue'),
        meta: { permission: 'statement.view' },
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/audit/Index.vue'),
        meta: { permission: 'audit.view' },
      },
      {
        path: 'import-export',
        name: 'ImportExport',
        component: () => import('@/views/import-export/Index.vue'),
        meta: { permission: 'import_export.view' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.guest && userStore.isLoggedIn) {
    next({ name: 'Dashboard' })
    return
  }

  if (to.meta.permission && !userStore.hasPermission(to.meta.permission)) {
    if (!userStore.isLoggedIn) {
      next({ name: 'Login' })
    } else {
      next({ name: 'Dashboard' })
    }
    return
  }

  next()
})

export default router
