import { createRouter, createWebHistory } from 'vue-router'

const StationOverview = () => import('../views/station/Overview.vue')
const StationBuilding = () => import('../views/station/Building.vue')
const StationMealCount = () => import('../views/station/MealCount.vue')
const StationDietary = () => import('../views/station/Dietary.vue')
const StationColdBox = () => import('../views/station/ColdBox.vue')
const StationUnsigned = () => import('../views/station/Unsigned.vue')
const StationElders = () => import('../views/station/Elders.vue')
const StationSubsidy = () => import('../views/station/Subsidy.vue')
const StationReconciliation = () => import('../views/station/Reconciliation.vue')
const StationNotifications = () => import('../views/station/Notifications.vue')
const StationReview = () => import('../views/station/Review.vue')
const StationElderDetail = () => import('../views/station/ElderDetail.vue')

const CourierRoutes = () => import('../views/courier/Routes.vue')
const CourierDeliveries = () => import('../views/courier/Deliveries.vue')
const CourierUnsigned = () => import('../views/courier/Unsigned.vue')

const routes = [
  { path: '/', redirect: '/station/overview' },
  {
    path: '/station/overview',
    component: StationOverview,
    meta: { title: '路线总览' }
  },
  {
    path: '/station/building',
    component: StationBuilding,
    meta: { title: '楼栋概览' }
  },
  {
    path: '/station/meal-count',
    component: StationMealCount,
    meta: { title: '餐量统计' }
  },
  {
    path: '/station/dietary',
    component: StationDietary,
    meta: { title: '饮食冲突' }
  },
  {
    path: '/station/cold-box',
    component: StationColdBox,
    meta: { title: '保温箱异常' }
  },
  {
    path: '/station/unsigned',
    component: StationUnsigned,
    meta: { title: '未签收列表' }
  },
  {
    path: '/station/elders',
    component: StationElders,
    meta: { title: '长者管理' }
  },
  {
    path: '/station/elders/:id',
    component: StationElderDetail,
    meta: { title: '长者详情' }
  },
  {
    path: '/station/subsidy',
    component: StationSubsidy,
    meta: { title: '补贴核查' }
  },
  {
    path: '/station/reconciliation',
    component: StationReconciliation,
    meta: { title: '对账管理' }
  },
  {
    path: '/station/notifications',
    component: StationNotifications,
    meta: { title: '通知管理' }
  },
  {
    path: '/station/review',
    component: StationReview,
    meta: { title: '审核任务' }
  },
  {
    path: '/courier/routes',
    component: CourierRoutes,
    meta: { title: '配送路线' }
  },
  {
    path: '/courier/deliveries',
    component: CourierDeliveries,
    meta: { title: '今日配送' }
  },
  {
    path: '/courier/unsigned',
    component: CourierUnsigned,
    meta: { title: '待签收' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
