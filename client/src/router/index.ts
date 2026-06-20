import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'ActivityList',
      component: () => import('../views/ActivityList.vue')
    },
    {
      path: '/activity/:id',
      name: 'ActivityDetail',
      component: () => import('../views/ActivityDetail.vue')
    },
    {
      path: '/activity/create',
      name: 'ActivityCreate',
      component: () => import('../views/ActivityCreate.vue')
    },
    {
      path: '/reports',
      name: 'ReportList',
      component: () => import('../views/ReportList.vue')
    },
    {
      path: '/refunds',
      name: 'RefundList',
      component: () => import('../views/RefundList.vue')
    },
    {
      path: '/config',
      name: 'ConfigCenter',
      component: () => import('../views/ConfigCenter.vue')
    },
    {
      path: '/download',
      name: 'DownloadDetail',
      component: () => import('../views/DownloadDetail.vue')
    }
  ]
})

export default router
