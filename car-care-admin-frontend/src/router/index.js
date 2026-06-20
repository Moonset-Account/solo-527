import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/detection'
  },
  {
    path: '/detection',
    name: 'Detection',
    component: () => import('@/views/detection/index.vue')
  },
  {
    path: '/package',
    name: 'Package',
    component: () => import('@/views/package/index.vue')
  },
  {
    path: '/repair',
    name: 'Repair',
    component: () => import('@/views/repair/index.vue')
  },
  {
    path: '/trace',
    name: 'Trace',
    component: () => import('@/views/trace/index.vue')
  },
  {
    path: '/report',
    name: 'Report',
    component: () => import('@/views/report/index.vue')
  },
  {
    path: '/system',
    name: 'System',
    component: () => import('@/views/system/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
