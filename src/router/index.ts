import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/inventory',
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/pages/InventoryPage.vue'),
    meta: { title: '库存统计' },
  },
  {
    path: '/requisition',
    name: 'requisition',
    component: () => import('@/pages/RequisitionPage.vue'),
    meta: { title: '领用申请' },
  },
  {
    path: '/project-report',
    name: 'projectReport',
    component: () => import('@/pages/ProjectReportPage.vue'),
    meta: { title: '课题报表' },
  },
  {
    path: '/compliance',
    name: 'compliance',
    component: () => import('@/pages/CompliancePage.vue'),
    meta: { title: '安全合规' },
  },
  {
    path: '/finance',
    name: 'finance',
    component: () => import('@/pages/FinancePage.vue'),
    meta: { title: '经费管理' },
  },
  {
    path: '/permission',
    name: 'permission',
    component: () => import('@/pages/PermissionPage.vue'),
    meta: { title: '权限审核' },
  },
  {
    path: '/batch',
    name: 'batch',
    component: () => import('@/pages/BatchPage.vue'),
    meta: { title: '试剂批次' },
  },
  {
    path: '/equipment',
    name: 'equipment',
    component: () => import('@/pages/EquipmentPage.vue'),
    meta: { title: '设备看板' },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/pages/HistoryPage.vue'),
    meta: { title: '操作历史' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const title = (to.meta?.title as string) || '试剂管理系统'
  document.title = `${title} - 试剂管理系统`
})

export default router
