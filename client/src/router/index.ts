import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue'),
        meta: { title: '首页仪表盘' },
      },
      {
        path: 'reception/inspection',
        name: 'ReceptionInspection',
        component: () => import('@/pages/reception/InspectionView.vue'),
        meta: { title: '检测项目查看' },
      },
      {
        path: 'leads',
        name: 'Leads',
        component: () => import('@/pages/leads/LeadList.vue'),
        meta: { title: '线索列表' },
      },
      {
        path: 'leads/assign',
        name: 'LeadsAssign',
        component: () => import('@/pages/leads/LeadAssign.vue'),
        meta: { title: '线索分配' },
      },
      {
        path: 'followup/tasks',
        name: 'FollowupTasks',
        component: () => import('@/pages/followup/FollowupTasks.vue'),
        meta: { title: '回访任务' },
      },
      {
        path: 'quality/status',
        name: 'QualityStatus',
        component: () => import('@/pages/quality/QualityStatus.vue'),
        meta: { title: '维修质量状态' },
      },
      {
        path: 'quality/report',
        name: 'QualityReport',
        component: () => import('@/pages/quality/QualityReport.vue'),
        meta: { title: '质量报表' },
      },
      {
        path: 'config/vehicles',
        name: 'ConfigVehicles',
        component: () => import('@/pages/config/VehicleList.vue'),
        meta: { title: '车辆档案' },
      },
      {
        path: 'config/templates',
        name: 'ConfigTemplates',
        component: () => import('@/pages/config/TemplateList.vue'),
        meta: { title: '检测模板' },
      },
      {
        path: 'config/parts',
        name: 'ConfigParts',
        component: () => import('@/pages/config/PartList.vue'),
        meta: { title: '配件报价' },
      },
      {
        path: 'config/rules',
        name: 'ConfigRules',
        component: () => import('@/pages/config/RuleList.vue'),
        meta: { title: '规则管理' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 汽车维修管理系统`
  }
})

export default router
