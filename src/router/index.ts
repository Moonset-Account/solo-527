import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { title: '生产看板' },
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('@/pages/inventory/InventoryPage.vue'),
        meta: { title: '库存列表' },
      },
      {
        path: 'inventory/records',
        name: 'inventory-records',
        component: () => import('@/pages/inventory/RecordsPage.vue'),
        meta: { title: '出入库记录' },
      },
      {
        path: 'inventory/damage',
        name: 'inventory-damage',
        component: () => import('@/pages/inventory/DamagePage.vue'),
        meta: { title: '报损登记' },
      },
      {
        path: 'inventory/restock',
        name: 'inventory-restock',
        component: () => import('@/pages/inventory/RestockPage.vue'),
        meta: { title: '补货提醒' },
      },
      {
        path: 'appointments',
        name: 'appointments',
        component: () => import('@/pages/appointments/AppointmentListPage.vue'),
        meta: { title: '预约订单' },
      },
      {
        path: 'appointments/:id',
        name: 'appointment-detail',
        component: () => import('@/pages/appointments/AppointmentDetailPage.vue'),
        meta: { title: '预约详情' },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: () => import('@/pages/analytics/AnalyticsOverviewPage.vue'),
        meta: { title: '消耗分析' },
      },
      {
        path: 'analytics/commission',
        name: 'analytics-commission',
        component: () => import('@/pages/analytics/CommissionPage.vue'),
        meta: { title: '顾问提成' },
      },
      {
        path: 'analytics/pricing',
        name: 'analytics-pricing',
        component: () => import('@/pages/analytics/PricingPage.vue'),
        meta: { title: '项目价格' },
      },
      {
        path: 'analytics/consumption',
        name: 'analytics-consumption',
        component: () => import('@/pages/analytics/ConsumptionPage.vue'),
        meta: { title: '耗材排行' },
      },
      {
        path: 'analytics/anomaly',
        name: 'analytics-anomaly',
        component: () => import('@/pages/analytics/AnomalyPage.vue'),
        meta: { title: '异常追溯' },
      },
      {
        path: 'reminders',
        name: 'reminders',
        component: () => import('@/pages/reminders/ReminderListPage.vue'),
        meta: { title: '提醒列表' },
      },
      {
        path: 'reminders/rules',
        name: 'reminder-rules',
        component: () => import('@/pages/reminders/ReminderRulesPage.vue'),
        meta: { title: '规则配置' },
      },
      {
        path: 'records/:id',
        name: 'record-detail',
        component: () => import('@/pages/records/RecordDetailPage.vue'),
        meta: { title: '记录详情' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
