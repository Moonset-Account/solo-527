import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/vehicles', name: 'VehicleList', component: () => import('../views/VehicleList.vue') },
  { path: '/vehicles/:id', name: 'VehicleDetail', component: () => import('../views/VehicleDetail.vue') },
  { path: '/routes', name: 'RouteList', component: () => import('../views/RouteList.vue') },
  { path: '/routes/:id', name: 'RouteDetail', component: () => import('../views/RouteDetail.vue') },
  { path: '/batches', name: 'BatchList', component: () => import('../views/BatchList.vue') },
  { path: '/batches/:id', name: 'BatchDetail', component: () => import('../views/BatchDetail.vue') },
  { path: '/exceptions', name: 'ExceptionList', component: () => import('../views/ExceptionList.vue') },
  { path: '/exceptions/:id', name: 'ExceptionDetail', component: () => import('../views/ExceptionDetail.vue') },
  { path: '/calibrations', name: 'CalibrationList', component: () => import('../views/CalibrationList.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
