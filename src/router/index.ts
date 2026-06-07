import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/DashboardPage.vue'
import AlertsPage from '@/pages/AlertsPage.vue'
import FeedingPage from '@/pages/FeedingPage.vue'
import ComparisonPage from '@/pages/ComparisonPage.vue'
import DrilldownPage from '@/pages/DrilldownPage.vue'
import ReportsPage from '@/pages/ReportsPage.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardPage,
  },
  {
    path: '/alerts',
    name: 'alerts',
    component: AlertsPage,
  },
  {
    path: '/feeding',
    name: 'feeding',
    component: FeedingPage,
  },
  {
    path: '/comparison',
    name: 'comparison',
    component: ComparisonPage,
  },
  {
    path: '/drilldown/:pointId',
    name: 'drilldown',
    component: DrilldownPage,
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportsPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
