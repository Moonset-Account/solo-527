import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import AppLayout from '@/components/Layout/AppLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/HomePage.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'leads',
        name: 'leads',
        component: () => import('@/pages/LeadsPage.vue'),
        meta: { title: '线索管理', permission: 'leads:read' },
      },
      {
        path: 'leads/:id',
        name: 'lead-detail',
        component: () => import('@/pages/LeadDetailPage.vue'),
        meta: { title: '线索详情', permission: 'leads:read' },
      },
      {
        path: 'followup-plans',
        name: 'followup-plans',
        component: () => import('@/pages/FollowupPlansPage.vue'),
        meta: { title: '回访计划', permission: 'followups:read' },
      },
      {
        path: 'followup-rules',
        name: 'followup-rules',
        component: () => import('@/pages/FollowupRulesPage.vue'),
        meta: { title: '回访规则', permission: 'settings:read' },
      },
      {
        path: 'predictions',
        name: 'predictions',
        component: () => import('@/pages/PredictionsPage.vue'),
        meta: { title: '转化预测', permission: 'predictions:read' },
      },
      {
        path: 'churn',
        name: 'churn',
        component: () => import('@/pages/ChurnAnalysisPage.vue'),
        meta: { title: '流失分析', permission: 'churn:read' },
      },
      {
        path: 'tags',
        name: 'tags',
        component: () => import('@/pages/TagsPage.vue'),
        meta: { title: '标签管理', permission: 'tags:read' },
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/pages/ReportsPage.vue'),
        meta: { title: '报表中心', permission: 'reports:read' },
      },
      {
        path: 'settings/dicts',
        name: 'settings-dicts',
        component: () => import('@/pages/SettingsDictsPage.vue'),
        meta: { title: '字典管理', permission: 'settings:read' },
      },
      {
        path: 'settings/reminders',
        name: 'settings-reminders',
        component: () => import('@/pages/SettingsRemindersPage.vue'),
        meta: { title: '提醒模板', permission: 'settings:read' },
      },
      {
        path: 'settings/scopes',
        name: 'settings-scopes',
        component: () => import('@/pages/SettingsScopesPage.vue'),
        meta: { title: '作用域配置', permission: 'settings:read' },
      },
      {
        path: 'settings/roles',
        name: 'settings-roles',
        component: () => import('@/pages/SettingsRolesPage.vue'),
        meta: { title: '角色权限', permission: 'roles:manage' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
