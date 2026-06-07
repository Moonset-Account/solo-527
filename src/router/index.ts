import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Comparison from '@/views/Comparison.vue'
import AnomalyMatrix from '@/views/AnomalyMatrix.vue'
import Details from '@/views/Details.vue'
import Specs from '@/views/Specs.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: { title: '总览仪表盘' },
  },
  {
    path: '/comparison',
    name: 'comparison',
    component: Comparison,
    meta: { title: '多维对比分析' },
  },
  {
    path: '/anomaly',
    name: 'anomaly',
    component: AnomalyMatrix,
    meta: { title: '异常矩阵' },
  },
  {
    path: '/details',
    name: 'details',
    component: Details,
    meta: { title: '明细下钻' },
  },
  {
    path: '/specs',
    name: 'specs',
    component: Specs,
    meta: { title: '口径说明' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
