import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DashboardData } from '@/types'
import api from '@/api'

const mockDashboard: DashboardData = {
  totalProducts: 8,
  lowStockCount: 3,
  todayAppointments: 5,
  todayRevenue: 1504,
  pendingReminders: 4,
  anomalyCount: 3,
  visitRate: 80,
  consumptionTrend7d: [
    { date: '06-10', amount: 2180 },
    { date: '06-11', amount: 1860 },
    { date: '06-12', amount: 2450 },
    { date: '06-13', amount: 3120 },
    { date: '06-14', amount: 2680 },
    { date: '06-15', amount: 3540 },
    { date: '06-16', amount: 1504 },
  ],
  consumptionTrend30d: Array.from({ length: 30 }, (_, i) => ({
    date: `05-${String(18 + i).padStart(2, '0')}`,
    amount: 1500 + Math.floor(Math.random() * 2500),
  })),
}

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardData | null>(null)
  const isLoading = ref(false)

  const summaryCards = computed(() => {
    if (!data.value) return []
    return [
      { label: '耗材总数', value: data.value.totalProducts, icon: 'Package', color: 'text-rosegold' },
      { label: '库存预警', value: data.value.lowStockCount, icon: 'AlertTriangle', color: 'text-coral' },
      { label: '今日预约', value: data.value.todayAppointments, icon: 'Calendar', color: 'text-rosegold' },
      { label: '今日营收', value: `¥${data.value.todayRevenue.toLocaleString()}`, icon: 'TrendingUp', color: 'text-mint' },
      { label: '待处理提醒', value: data.value.pendingReminders, icon: 'Bell', color: 'text-coral' },
      { label: '异常记录', value: data.value.anomalyCount, icon: 'AlertCircle', color: 'text-coral' },
    ]
  })

  async function fetchDashboard() {
    isLoading.value = true
    try {
      const res = await api.get('/dashboard')
      data.value = res.data
    } catch {
      data.value = mockDashboard
    } finally {
      isLoading.value = false
    }
  }

  return { data, isLoading, summaryCards, fetchDashboard }
})
