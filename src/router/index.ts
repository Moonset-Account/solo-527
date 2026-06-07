import { createRouter, createWebHistory } from 'vue-router'
import AnalysisDashboard from '@/views/AnalysisDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: AnalysisDashboard,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
