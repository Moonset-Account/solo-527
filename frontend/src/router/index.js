import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '数据看板' }
  },
  {
    path: '/draft',
    name: 'DraftList',
    component: () => import('@/views/DraftList.vue'),
    meta: { title: '邮件草稿' }
  },
  {
    path: '/draft/:id',
    name: 'DraftEditor',
    component: () => import('@/views/DraftEditor.vue'),
    meta: { title: '编辑邮件' }
  },
  {
    path: '/review',
    name: 'ReviewPanel',
    component: () => import('@/views/ReviewPanel.vue'),
    meta: { title: '审核面板' }
  },
  {
    path: '/trace',
    name: 'TraceQuery',
    component: () => import('@/views/TraceQuery.vue'),
    meta: { title: '事后追踪' }
  },
  {
    path: '/forbidden',
    name: 'ForbiddenWord',
    component: () => import('@/views/ForbiddenWord.vue'),
    meta: { title: '禁用词管理' }
  },
  {
    path: '/prompt',
    name: 'PromptTemplate',
    component: () => import('@/views/PromptTemplate.vue'),
    meta: { title: '提示词版本' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
