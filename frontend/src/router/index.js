import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/dashboard/Index.vue')
  },
  {
    path: '/requirements',
    name: 'RequirementList',
    component: () => import('../views/requirement/List.vue')
  },
  {
    path: '/requirements/create',
    name: 'RequirementCreate',
    component: () => import('../views/requirement/Form.vue')
  },
  {
    path: '/requirements/:id',
    name: 'RequirementDetail',
    component: () => import('../views/requirement/Detail.vue')
  },
  {
    path: '/requirements/:id/edit',
    name: 'RequirementEdit',
    component: () => import('../views/requirement/Form.vue')
  },
  {
    path: '/process',
    name: 'ProcessConfig',
    component: () => import('../views/process/Index.vue')
  },
  {
    path: '/roles',
    name: 'RoleManagement',
    component: () => import('../views/role/Index.vue')
  },
  {
    path: '/todos',
    name: 'TodoList',
    component: () => import('../views/todo/Index.vue')
  },
  {
    path: '/meetings',
    name: 'MeetingMinutes',
    component: () => import('../views/meeting/Index.vue')
  },
  {
    path: '/reminders',
    name: 'ReminderConfig',
    component: () => import('../views/reminder/Index.vue')
  },
  {
    path: '/reports',
    name: 'CollaborationReport',
    component: () => import('../views/report/Index.vue')
  },
  {
    path: '/imports',
    name: 'ImportCenter',
    component: () => import('../views/import/Index.vue')
  },
  {
    path: '/audit-logs',
    name: 'AuditLogList',
    component: () => import('../views/auditlog/Index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
