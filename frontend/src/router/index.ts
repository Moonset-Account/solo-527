import { createRouter, createWebHistory, RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/types'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { public: true, title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/portal/dashboard',
    children: [
      {
        path: 'portal/dashboard',
        name: 'PortalDashboard',
        component: () => import('@/views/portal/Dashboard.vue'),
        meta: { title: '首页概览', icon: 'House' },
      },
      {
        path: 'portal/applications',
        name: 'MyApplications',
        component: () => import('@/views/portal/MyApplications.vue'),
        meta: { title: '我的申请', icon: 'Document' },
      },
      {
        path: 'portal/applications/new',
        name: 'NewApplication',
        component: () => import('@/views/portal/NewApplication.vue'),
        meta: { title: '新建领用申请', icon: 'Plus', hidden: true },
      },
      {
        path: 'portal/applications/:id',
        name: 'ApplicationDetail',
        component: () => import('@/views/portal/ApplicationDetail.vue'),
        meta: { title: '申请详情', icon: 'View', hidden: true },
      },
      {
        path: 'portal/reagents',
        name: 'PortalReagents',
        component: () => import('@/views/portal/Reagents.vue'),
        meta: { title: '试剂查询', icon: 'Search' },
      },
      {
        path: 'portal/instruments',
        name: 'PortalInstruments',
        component: () => import('@/views/portal/Instruments.vue'),
        meta: { title: '仪器预约', icon: 'Cpu' },
      },
      {
        path: 'portal/notifications',
        name: 'MyNotifications',
        component: () => import('@/views/portal/Notifications.vue'),
        meta: { title: '我的消息', icon: 'Bell' },
      },
      {
        path: 'portal/profile',
        name: 'MyProfile',
        component: () => import('@/views/portal/Profile.vue'),
        meta: { title: '个人中心', icon: 'User' },
      },
      {
        path: 'admin/approvals',
        name: 'AdminApprovals',
        component: () => import('@/views/admin/Approvals.vue'),
        meta: {
          title: '审核预约',
          icon: 'Check',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        },
      },
      {
        path: 'admin/reagents',
        name: 'AdminReagents',
        component: () => import('@/views/admin/ReagentsManage.vue'),
        meta: {
          title: '试剂管理',
          icon: 'Box',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        },
      },
      {
        path: 'admin/samples',
        name: 'AdminSamples',
        component: () => import('@/views/admin/SamplesManage.vue'),
        meta: {
          title: '样本管理',
          icon: 'Collection',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER],
        },
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersManage.vue'),
        meta: {
          title: '用户权限',
          icon: 'UserFilled',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        },
      },
      {
        path: 'admin/audit',
        name: 'AdminAudit',
        component: () => import('@/views/admin/AuditLog.vue'),
        meta: {
          title: '审计追踪 / 复盘',
          icon: 'Tickets',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        },
      },
      {
        path: 'admin/relations',
        name: 'AdminRelations',
        component: () => import('@/views/admin/Relations.vue'),
        meta: {
          title: '关联管理',
          icon: 'Link',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        },
      },
      {
        path: 'config/dictionaries',
        name: 'ConfigDictionaries',
        component: () => import('@/views/config/Dictionaries.vue'),
        meta: {
          title: '字典配置',
          icon: 'Grid',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        },
      },
      {
        path: 'config/notifications',
        name: 'ConfigNotifications',
        component: () => import('@/views/config/NotificationConfig.vue'),
        meta: {
          title: '提醒配置',
          icon: 'Setting',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        },
      },
      {
        path: 'config/documents',
        name: 'ConfigDocuments',
        component: () => import('@/views/config/Documents.vue'),
        meta: {
          title: '原始单据',
          icon: 'Files',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER],
        },
      },
      {
        path: 'maintenance-board',
        name: 'MaintenanceBoard',
        component: () => import('@/views/maintenance/MaintenanceBoard.vue'),
        meta: {
          title: '维保及时看板',
          icon: 'Monitor',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER],
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue'),
    meta: { public: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

function checkRoleAccess(userRoles: UserRole[], requiredRoles?: UserRole[]) {
  if (!requiredRoles || requiredRoles.length === 0) return true
  return requiredRoles.some((r) => userRoles.includes(r))
}

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const userStore = useUserStore()
  document.title = to.meta.title ? `${to.meta.title} - 试剂库存管理门户` : '试剂库存管理门户'

  if (to.meta.public) {
    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/')
    } else {
      next()
    }
    return
  }

  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (!checkRoleAccess(userStore.roles as UserRole[], to.meta.roles as UserRole[])) {
    next('/portal/dashboard')
    return
  }

  next()
})

export default router
