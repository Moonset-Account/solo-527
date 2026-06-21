import { computed, ref } from 'vue'
import type { AnalyticsData, DailyStats, CostStats } from '@/types'
import { mockAnalytics } from '@/mock/data'

export function useAnalytics() {
  const data = ref<AnalyticsData>(mockAnalytics)

  const totalCalls = computed(() => {
    return data.value.dailyStats.reduce((sum, d) => sum + d.emailsGenerated, 0)
  })

  const totalCallsMom = computed(() => {
    const days = data.value.dailyStats
    const mid = Math.floor(days.length / 2)
    const first = days.slice(0, mid).reduce((s, d) => s + d.emailsGenerated, 0)
    const second = days.slice(mid).reduce((s, d) => s + d.emailsGenerated, 0)
    if (first === 0) return 0
    return +(((second - first) / first) * 100).toFixed(1)
  })

  const hitRate = computed(() => {
    return data.value.performance.aiAccuracyRate
  })

  const avgCost = computed(() => {
    const total = data.value.costStats.reduce((s, c) => s + c.cost, 0)
    const count = data.value.performance.totalEmails
    return count > 0 ? +(total / count).toFixed(4) : 0
  })

  const rejectionRate = computed(() => {
    const rejected = data.value.riskStats
      .filter(r => r.level === 'high' || r.level === 'critical')
      .reduce((s, r) => s + r.count, 0)
    const total = data.value.riskStats.reduce((s, r) => s + r.count, 0)
    return total > 0 ? +((rejected / total) * 100).toFixed(1) : 0
  })

  function buildCostStackAreaData(daily: DailyStats[], cost: CostStats[]) {
    const dates = daily.map(d => d.date)
    const approved = daily.map(d => Math.round(d.emailsReviewed * 0.7))
    const rejected = daily.map(d => Math.round(d.emailsReviewed * 0.15))
    const used = daily.map((_, i) => Math.round(cost[i]?.tokensOut / 1000 || 0))
    return { dates, approved, rejected, used }
  }

  function buildRejectReasonPieData() {
    const reasons = [
      { value: 42, name: '绝对化用语' },
      { value: 28, name: '风险提示缺失' },
      { value: 18, name: '违规承诺收益' },
      { value: 15, name: '客户信息风险' },
      { value: 12, name: '发送时间不当' },
      { value: 8, name: '其他' }
    ]
    return reasons
  }

  function buildVersionHitBarData() {
    const versions = ['v1.8.0', 'v2.1.5', 'v2.0.0', 'v3.1.0', 'v3.2.0']
    const rates = [78.5, 85.2, 88.0, 92.3, 96.5]
    return { versions, rates }
  }

  function buildCostHeatmapData() {
    const persons = ['张复核', '李运营', '王质检', '赵经理', '系统管理员']
    const days = data.value.dailyStats.slice(-14).map(d => d.date.slice(5))
    const dataArr: [number, number, number][] = []
    for (let p = 0; p < persons.length; p++) {
      for (let d = 0; d < days.length; d++) {
        dataArr.push([d, p, +(Math.random() * 15 + 2).toFixed(1)])
      }
    }
    return { persons, days, data: dataArr }
  }

  function buildRejectScatterData() {
    const reasons = ['绝对化用语', '风险提示缺失', '违规承诺收益', '客户信息风险', '发送时间不当']
    const counts = [42, 28, 18, 15, 12]
    const severities = [9.2, 7.5, 8.8, 6.5, 4.2]
    return reasons.map((name, i) => ({
      name,
      value: [counts[i], severities[i], counts[i] * 30]
    }))
  }

  function buildMiniTrendData(values: number[]) {
    return values.map((v, i) => [i, v])
  }

  const callsTrend = computed(() => {
    const vals = data.value.dailyStats.slice(-14).map(d => d.emailsGenerated)
    return buildMiniTrendData(vals)
  })

  return {
    data,
    totalCalls,
    totalCallsMom,
    hitRate,
    avgCost,
    rejectionRate,
    callsTrend,
    buildCostStackAreaData,
    buildRejectReasonPieData,
    buildVersionHitBarData,
    buildCostHeatmapData,
    buildRejectScatterData
  }
}
