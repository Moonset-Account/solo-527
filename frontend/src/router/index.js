import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { useUserStore } from '@/store/user'

NProgress.configure({ showSpinner: false })

const publicRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true }
  }
]

const asyncRoutes = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { title: '首页' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled', permission: 'dashboard' }
      }
    ]
  },
  {
    path: '/lead',
    component: () => import('@/layout/index.vue'),
    meta: { title: '线索管理', icon: 'User' },
    children: [
      {
        path: 'list',
        name: 'LeadList',
        component: () => import('@/views/lead/list.vue'),
        meta: { title: '线索列表', icon: 'List', permission: 'lead:list' }
      },
      {
        path: 'detail/:id',
        name: 'LeadDetail',
        component: () => import('@/views/lead/detail.vue'),
        meta: { title: '线索详情', hidden: true, permission: 'lead:view' }
      }
    ]
  },
  {
    path: '/contract',
    component: () => import('@/layout/index.vue'),
    meta: { title: '合同管理', icon: 'Document' },
    children: [
      {
        path: 'list',
        name: 'ContractList',
        component: () => import('@/views/contract/list.vue'),
        meta: { title: '合同列表', icon: 'Document', permission: 'contract:list' }
      },
      {
        path: 'detail/:id',
        name: 'ContractDetail',
        component: () => import('@/views/contract/detail.vue'),
        meta: { title: '合同详情', hidden: true, permission: 'contract:list' }
      }
    ]
  },
  {
    path: '/approval',
    component: () => import('@/layout/index.vue'),
    meta: { title: '审批中心', icon: 'Check' },
    children: [
      {
        path: 'discount',
        name: 'DiscountApproval',
        component: () => import('@/views/approval/discount.vue'),
        meta: { title: '折扣审批', icon: 'Money', permission: 'approval:discount' }
      },
      {
        path: 'detail/:id',
        name: 'ApprovalDetail',
        component: () => import('@/views/approval/detail.vue'),
        meta: { title: '审批详情', hidden: true, permission: 'approval:discount' }
      }
    ]
  },
  {
    path: '/todo',
    component: () => import('@/layout/index.vue'),
    meta: { title: '待办任务', icon: 'Bell' },
    children: [
      {
        path: 'my',
        name: 'MyTodo',
        component: () => import('@/views/todo/my.vue'),
        meta: { title: '我的待办', icon: 'Tickets', permission: 'todo:my' }
      }
    ]
  },
  {
    path: '/report',
    component: () => import('@/layout/index.vue'),
    meta: { title: '报表中心', icon: 'DataAnalysis' },
    children: [
      {
        path: 'payment',
        name: 'PaymentReport',
        component: () => import('@/views/report/payment.vue'),
        meta: { title: '回款进度', icon: 'Wallet', permission: 'report:payment' }
      },
      {
        path: 'payment-detail/:id',
        name: 'PaymentDetail',
        component: () => import('@/views/report/payment-detail.vue'),
        meta: { title: '回款详情', hidden: true, permission: 'report:payment' }
      },
      {
        path: 'prediction',
        name: 'DealPrediction',
        component: () => import('@/views/report/prediction.vue'),
        meta: { title: '成交预测', icon: 'TrendCharts', permission: 'report:prediction' }
      }
    ]
  },
  {
    path: '/system',
    component: () => import('@/layout/index.vue'),
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/system/user.vue'),
        meta: { title: '用户管理', icon: 'UserFilled', permission: 'system:user' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: publicRoutes
})

const whiteList = ['/login', '/404']

function hasPermission(permissions, route) {
  if (route.meta && route.meta.permission) {
    return permissions.includes(route.meta.permission)
  }
  return true
}

function filterAsyncRoutes(routes, permissions) {
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(permissions, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, permissions)
      }
      res.push(tmp)
    }
  })
  return res
}

let routeAdded = false

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  document.title = to.meta.title ? `${to.meta.title} - 装修线索报价协同系统` : '装修线索报价协同系统'

  const token = getToken()
  const userStore = useUserStore()

  if (!token) {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
    NProgress.done()
    return
  }

  if (to.path === '/login') {
    next({ path: '/' })
    NProgress.done()
    return
  }

  if (!routeAdded) {
    try {
      if (!userStore.userInfo || !userStore.userInfo.id) {
        await userStore.getUserInfo()
      }
      const permissions = userStore.permissions || []
      const accessRoutes = filterAsyncRoutes(asyncRoutes, permissions)
      accessRoutes.forEach(route => {
        router.addRoute(route)
      })
      routeAdded = true
      next({ ...to, replace: true })
    } catch (error) {
      userStore.logout()
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export function resetRouter() {
  routeAdded = false
  const newRouter = createRouter({
    history: createWebHistory(),
    routes: publicRoutes
  })
  router.matcher = newRouter.matcher
}

export default router
