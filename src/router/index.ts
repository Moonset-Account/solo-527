import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import MerchantDetailPage from '@/pages/MerchantDetailPage.vue'
import ReportsPage from '@/pages/ReportsPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/merchant/:id',
    name: 'merchant-detail',
    component: MerchantDetailPage
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportsPage
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
