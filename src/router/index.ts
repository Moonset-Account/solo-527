import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import StationDetail from '@/views/StationDetail.vue'
import ExportPage from '@/views/ExportPage.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/station/:id', name: 'StationDetail', component: StationDetail },
  { path: '/export', name: 'Export', component: ExportPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
