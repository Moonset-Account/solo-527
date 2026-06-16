import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ConsultantCommission, ServicePriceAnalysis, ConsumptionRanking, Consumption } from '@/types'
import api from '@/api'

const mockCommissions: ConsultantCommission[] = [
  { id: '1', consultantName: '李顾问', month: '2026-06', totalAppointments: 48, totalRevenue: 18560, commissionRate: 0.15, commissionAmount: 2784, topServices: ['法式美甲', '渐变美甲', '手部护理'] },
  { id: '2', consultantName: '王顾问', month: '2026-06', totalAppointments: 42, totalRevenue: 16380, commissionRate: 0.15, commissionAmount: 2457, topServices: ['光疗延长', '日式美甲', '简单修甲'] },
  { id: '3', consultantName: '赵顾问', month: '2026-06', totalAppointments: 35, totalRevenue: 12890, commissionRate: 0.12, commissionAmount: 1547, topServices: ['卸甲+新做', '法式美甲'] },
]

const mockPriceAnalysis: ServicePriceAnalysis[] = [
  { id: '1', serviceName: '法式美甲', category: '基础服务', sellingPrice: 168, costPrice: 28, profitMargin: 83.3, monthlyUsage: 86, trend: 'up' },
  { id: '2', serviceName: '光疗延长', category: '进阶服务', sellingPrice: 298, costPrice: 52, profitMargin: 82.6, monthlyUsage: 52, trend: 'stable' },
  { id: '3', serviceName: '日式美甲', category: '进阶服务', sellingPrice: 328, costPrice: 45, profitMargin: 86.3, monthlyUsage: 38, trend: 'up' },
  { id: '4', serviceName: '渐变美甲', category: '进阶服务', sellingPrice: 198, costPrice: 32, profitMargin: 83.8, monthlyUsage: 64, trend: 'down' },
  { id: '5', serviceName: '简单修甲', category: '基础服务', sellingPrice: 68, costPrice: 12, profitMargin: 82.4, monthlyUsage: 120, trend: 'stable' },
  { id: '6', serviceName: '手部护理', category: '护理服务', sellingPrice: 88, costPrice: 18, profitMargin: 79.5, monthlyUsage: 95, trend: 'up' },
  { id: '7', serviceName: '卸甲+新做', category: '基础服务', sellingPrice: 58, costPrice: 15, profitMargin: 74.1, monthlyUsage: 45, trend: 'stable' },
]

const mockConsumptionRanking: ConsumptionRanking[] = [
  { id: '1', productName: '甲油胶-经典红', category: '甲油胶', totalConsumed: 86, totalAmount: 5808, usageCount: 86, rank: 1 },
  { id: '2', productName: '底胶-防脱落', category: '甲油胶', totalConsumed: 120, totalAmount: 4320, usageCount: 120, rank: 2 },
  { id: '3', productName: '封层-高亮', category: '甲油胶', totalConsumed: 95, totalAmount: 3420, usageCount: 95, rank: 3 },
  { id: '4', productName: '光疗胶-透明', category: '光疗胶', totalConsumed: 52, totalAmount: 6776, usageCount: 52, rank: 4 },
  { id: '5', productName: '卸甲水-温和型', category: '护理', totalConsumed: 45, totalAmount: 2025, usageCount: 45, rank: 5 },
  { id: '6', productName: '亮片-金色碎片', category: '装饰', totalConsumed: 38, totalAmount: 950, usageCount: 38, rank: 6 },
  { id: '7', productName: '甲片-法式短款', category: '甲片', totalConsumed: 30, totalAmount: 1050, usageCount: 30, rank: 7 },
  { id: '8', productName: '甲油胶-裸粉', category: '甲油胶', totalConsumed: 28, totalAmount: 1904, usageCount: 28, rank: 8 },
]

const mockAnomalyConsumptions: Consumption[] = [
  { id: 'ANO-1', appointmentId: 'APT-010', productId: '4', productName: '亮片-金色碎片', quantity: 15, unitPrice: 25, totalAmount: 375, consultantName: '赵顾问', customerName: '孙女士', consumedAt: '2026-06-14 16:00', isAnomaly: true, anomalyReason: '单次消耗量异常偏高（正常2-3罐）' },
  { id: 'ANO-2', appointmentId: 'APT-012', productId: '3', productName: '光疗胶-透明', quantity: 8, unitPrice: 128, totalAmount: 1024, consultantName: '李顾问', customerName: '周女士', consumedAt: '2026-06-13 14:30', isAnomaly: true, anomalyReason: '单次消耗量超过月均3倍' },
  { id: 'ANO-3', appointmentId: 'APT-015', productId: '1', productName: '甲油胶-经典红', quantity: 1, unitPrice: 68, totalAmount: 68, consultantName: '王顾问', customerName: '吴小姐', consumedAt: '2026-06-12 11:00', isAnomaly: true, anomalyReason: '成本价格录入异常' },
]

export const useAnalyticsStore = defineStore('analytics', () => {
  const commissions = ref<ConsultantCommission[]>([])
  const priceAnalysis = ref<ServicePriceAnalysis[]>([])
  const consumptionRanking = ref<ConsumptionRanking[]>([])
  const anomalyConsumptions = ref<Consumption[]>([])
  const isLoading = ref(false)

  async function fetchCommissions() {
    isLoading.value = true
    try {
      const res = await api.get('/analytics/commissions')
      commissions.value = res.data
    } catch {
      commissions.value = mockCommissions
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPriceAnalysis() {
    isLoading.value = true
    try {
      const res = await api.get('/analytics/price-analysis')
      priceAnalysis.value = res.data
    } catch {
      priceAnalysis.value = mockPriceAnalysis
    } finally {
      isLoading.value = false
    }
  }

  async function fetchConsumptionRanking() {
    isLoading.value = true
    try {
      const res = await api.get('/analytics/consumption-ranking')
      consumptionRanking.value = res.data
    } catch {
      consumptionRanking.value = mockConsumptionRanking
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAnomalyConsumptions() {
    isLoading.value = true
    try {
      const res = await api.get('/analytics/anomaly-consumptions')
      anomalyConsumptions.value = res.data
    } catch {
      anomalyConsumptions.value = mockAnomalyConsumptions
    } finally {
      isLoading.value = false
    }
  }

  return {
    commissions, priceAnalysis, consumptionRanking, anomalyConsumptions, isLoading,
    fetchCommissions, fetchPriceAnalysis, fetchConsumptionRanking, fetchAnomalyConsumptions,
  }
})
