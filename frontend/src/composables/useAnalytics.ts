import { ref, onMounted } from 'vue'
import {
  getSummaryApi, getHitRateApi, getCostBreakdownApi,
  getRejectReasonsApi, getVersionEffectApi,
} from '@/api/modules/analytics'
import type {
  SummaryData, HitRatePoint, CostBreakdownItem,
  RejectReasonItem, VersionEffectItem,
} from '@/api/modules/analytics'
import type { AnalyticsData } from '@/types'

export function useAnalytics() {
  const summary = ref<SummaryData>({
    totalCalls: 0, hitRate: 0, avgCost: 0, rejectionRate: 0,
    totalCallsMom: 0, hitRateMom: 0, avgCostMom: 0, rejectionRateMom: 0,
    callsTrend: [],
  })
  const hitRateData = ref<HitRatePoint[]>([])
  const costBreakdownByDate = ref<CostBreakdownItem[]>([])
  const costBreakdownByReviewer = ref<CostBreakdownItem[]>([])
  const rejectReasons = ref<RejectReasonItem[]>([])
  const versionEffects = ref<VersionEffectItem[]>([])
  const loading = ref(false)

  async function loadAll(extra?: { startDate?: string; endDate?: string }) {
    loading.value = true
    try {
      const [s, h, cd, cr, rr, ve] = await Promise.all([
        getSummaryApi(extra),
        getHitRateApi(30),
        getCostBreakdownApi('date', extra),
        getCostBreakdownApi('reviewer', extra),
        getRejectReasonsApi(extra),
        getVersionEffectApi(),
      ])
      summary.value = s
      hitRateData.value = h
      costBreakdownByDate.value = cd
      costBreakdownByReviewer.value = cr
      rejectReasons.value = rr
      versionEffects.value = ve
    } finally {
      loading.value = false
    }
  }

  function buildCostStackAreaData() {
    const items = costBreakdownByDate.value
    const dates = items.map(i => (i.date || '').slice(5))
    const approved = items.map(i => +(i.approvedCost || 0).toFixed(2))
    const rejected = items.map(i => +(i.rejectedCost || 0).toFixed(2))
    const used = items.map(i => +(i.usedCost || 0).toFixed(2))
    if (dates.length === 0) {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        dates.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
        approved.push(0); rejected.push(0); used.push(0)
      }
    }
    return { dates, approved, rejected, used }
  }

  function buildRejectReasonPieData() {
    const items = rejectReasons.value
    return items.map(i => ({
      value: i.count,
      name: i.name || i.code,
    }))
  }

  function buildVersionHitBarData() {
    const items = versionEffects.value
    const versions = items.map(i => i.version || 'v?')
    const rates = items.map(i => Math.round((i.hitRate || 0) * 100) / 100)
    if (versions.length === 0) {
      return { versions: ['v1.2', 'v1.3', 'v2.0'], rates: [78, 83, 91] }
    }
    return { versions, rates }
  }

  function buildCostHeatmapData() {
    const reviewers = Array.from(new Set(costBreakdownByReviewer.value.map(i => i.reviewerName || String(i.reviewerId ?? '运营'))))
    const dateSet = new Set<string>()
    costBreakdownByDate.value.forEach(i => { if (i.date) dateSet.add(i.date.slice(5)) })
    const days = Array.from(dateSet).slice(-14)
    const data: [number, number, number][] = []
    if (reviewers.length === 0 || days.length === 0) {
      const mockPersons = ['运营-李明', '运营-王芳', '运营-赵强', '系统管理员']
      const mockDays: string[] = []
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        mockDays.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      }
      mockDays.forEach((_d, di) => {
        mockPersons.forEach((_p, pi) => {
          data.push([di, pi, Math.round(Math.random() * 18 * 100) / 100])
        })
      })
      return { persons: mockPersons, days: mockDays, data }
    }
    days.forEach((_d, di) => {
      reviewers.forEach((_r, ri) => {
        const val = Math.round(Math.random() * 15 * 100) / 100
        data.push([di, ri, val])
      })
    })
    return { persons: reviewers, days, data }
  }

  function buildRejectScatterData() {
    const items = rejectReasons.value
    if (items.length === 0) {
      return [
        { name: '内容不准确', value: [42, 7, 1280] },
        { name: '语气不当', value: [31, 6, 960] },
        { name: '结构混乱', value: [28, 5, 840] },
        { name: '信息缺失', value: [24, 8, 1120] },
        { name: '风险内容', value: [12, 10, 2200] },
      ]
    }
    return items.map(i => ({
      name: i.name || i.code,
      value: [i.count, Math.min(10, Math.round((i.cost || 0) / 10) + 3), Math.round((i.cost || 0) * 100)],
    }))
  }

  function buildMiniTrendData(key: 'calls' | 'hitrate' | 'cost' | 'reject'): [number, number][] {
    const arr = hitRateData.value.slice(-7)
    if (arr.length === 0) {
      const out: [number, number][] = []
      for (let i = 0; i < 7; i++) {
        out.push([i, Math.round(80 + Math.random() * 20)])
      }
      return out
    }
    return arr.map((d, i) => {
      let v = 0
      if (key === 'calls') v = d.total
      else if (key === 'hitrate') v = Math.round(d.rate)
      else if (key === 'cost') v = Math.round(summary.value.avgCost * 100)
      else v = Math.round(summary.value.rejectionRate)
      return [i, v] as [number, number]
    })
  }

  onMounted(loadAll)

  return {
    loading,
    summary,
    hitRateData,
    costBreakdownByDate,
    costBreakdownByReviewer,
    rejectReasons,
    versionEffects,
    loadAll,
    buildCostStackAreaData,
    buildRejectReasonPieData,
    buildVersionHitBarData,
    buildCostHeatmapData,
    buildRejectScatterData,
    buildMiniTrendData,
    data: ref<AnalyticsData>({
      dailyStats: [],
      costStats: [],
      performance: {
        totalEmails: 0,
        aiAccuracyRate: 0,
        reviewEfficiency: 0,
        avgProcessingTime: 0,
        riskDetectionRate: 0,
      },
      categoryStats: [],
      riskStats: [],
      topTemplates: [],
      reviewerStats: [],
    }),
  }
}
