import { createRouter, createWebHistory } from 'vue-router'
import WorkbenchPage from '@/pages/WorkbenchPage.vue'
import RulesPage from '@/pages/RulesPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: WorkbenchPage,
  },
  {
    path: '/rules',
    name: 'rules',
    component: RulesPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
