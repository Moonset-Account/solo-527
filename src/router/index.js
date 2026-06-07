import { createRouter, createWebHistory } from 'vue-router'
import App from '@/App.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: App,
    meta: { title: '充电桩故障可视化工作台' }
  },
  {
    path: '/login',
    redirect: '/'
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '充电桩故障可视化工作台'
  next()
})

export default router
