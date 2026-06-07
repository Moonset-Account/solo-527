import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/athlete',
    name: 'AthleteView',
    component: () => import('@/views/AthleteView.vue')
  },
  {
    path: '/comparison',
    name: 'ComparisonView',
    component: () => import('@/views/ComparisonView.vue')
  },
  {
    path: '/training/:id',
    name: 'TrainingDetail',
    component: () => import('@/views/TrainingDetail.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const user = localStorage.getItem('user')
  if (to.name !== 'Login' && !user) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
