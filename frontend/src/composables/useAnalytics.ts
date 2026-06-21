import { ref, reactive, computed } from 'vue'
import type { CostDimension } from '@/types'
import {
  getSummaryApi,
  getHitRateApi,
  getCostBreakdownApi,
  getRejectReasonsApi,
  getVersionEffectApi,
  type SummaryData,
  type HitRateData,
  type CostBreakdownData,
  type RejectReasonsData,
  type VersionEffectData,
} from '@/api/modules/analytics'

interface DateRange {
  startDate?: string
  endDate?: string
}

interface Filters {
  dateRange: DateRange
  userId?: string
  costDimension: CostDimension
}

export function useAnalytics() {
  const loading = reactive({
    summary: false,
    hitRate: false,
    costBreakdown: false,
    rejectReasons: false,
    versionEffect: false,
  })

  const error = reactive({
    summary: null as Error | null,
    hitRate: null as Error | null,
    costBreakdown: null as Error | null,
    rejectReasons: null as Error | null,
    versionEffect: null as Error | null,
  })

  const summary = ref<SummaryData>({
    totalCalls: { current: 0, previous: 0, mom: 0, trend: 'flat' },
    hitRate: { current: 0, previous: 0, mom: 0, trend: 'flat', unit: '%' },
    avgCost: { current: 0, previous: 0, mom: 0, trend: 'flat', unit: 'USD' },
    rejectRate: { current: 0, previous: 0, mom: 0, trend: 'flat', unit: '%' },
    totalCost: { current: 0, previous: 0, mom: 0, trend: 'flat', unit: 'USD' },
  })

  const hitRateData = ref<HitRateData>({
    days: 30,
    overallHitRate: 0,
    totalCalls: 0,
    totalApproved: 0,
    trend: [],
  })

  const costBreakdown = ref<CostBreakdownData>({
    dimension: 'date',
    dimensionLabel: '日期',
    items: [],
  })

  const rejectReasons = ref<RejectReasonsData>({
    totalCount: 0,
    items: [],
  })

  const versionEffect = ref<VersionEffectData>({
    templateVersions: [],
    promptVersions: [],
  })

  const filters = reactive<Filters>({
    dateRange: {},
    userId: undefined,
    costDimension: 'date',
  })

  const summaryCardList = computed(() => [
    {
      key: 'totalCalls',
      title: '总生成次数',
      value: summary.value.totalCalls.current,
      unit: '次',
      mom: summary.value.totalCalls.mom,
      trend: summary.value.totalCalls.trend,
      description: '对比上一周期',
      icon: '⚡',
      color: '#2563eb',
      iconBgClass: 'bg-blue-50',
    },
    {
      key: 'hitRate',
      title: '命中率',
      value: summary.value.hitRate.current,
      unit: '%',
      mom: summary.value.hitRate.mom,
      trend: summary.value.hitRate.trend,
      description: '通过率对比',
      icon: '🎯',
      color: '#059669',
      iconBgClass: 'bg-emerald-50',
    },
    {
      key: 'avgCost',
      title: '单次调用成本',
      value: summary.value.avgCost.current,
      unit: ' USD',
      mom: summary.value.avgCost.mom,
      trend: summary.value.avgCost.trend,
      description: '平均费用',
      icon: '💸',
      color: '#d97706',
      iconBgClass: 'bg-amber-50',
    },
    {
      key: 'rejectRate',
      title: '驳回率',
      value: summary.value.rejectRate.current,
      unit: '%',
      mom: summary.value.rejectRate.mom,
      trend: summary.value.rejectRate.trend,
      description: '需要持续优化',
      icon: '⚠️',
      color: '#dc2626',
      iconBgClass: 'bg-red-50',
    },
    {
      key: 'totalCost',
      title: '总调用成本',
      value: summary.value.totalCost.current,
      unit: ' USD',
      mom: summary.value.totalCost.mom,
      trend: summary.value.totalCost.trend,
      description: '周期累计费用',
      icon: '💰',
      color: '#7c3aed',
      iconBgClass: 'bg-purple-50',
    },
  ])

  const miniTrendData = computed(() => buildMiniTrendData(hitRateData.value))

  const hitRateLineData = computed(() => buildHitRateLineData(hitRateData.value))

  const costStackAreaData = computed(() => buildCostStackAreaData(costBreakdown.value, filters.costDimension))

  const costHeatmapData = computed(() => buildCostHeatmapData(costBreakdown.value, filters.costDimension))

  const costTableData = computed(() => buildCostTableData(costBreakdown.value, filters.costDimension))

  const rejectScatterData = computed(() => buildRejectScatterData(rejectReasons.value, costBreakdown.value))

  const rejectBarData = computed(() => buildRejectBarData(rejectReasons.value))

  const versionTableData = computed(() => buildVersionTableData(versionEffect.value))

  const promptVersionTableData = computed(() => buildPromptVersionTableData(versionEffect.value))

  async function loadAll() {
    await Promise.all([
      loadSummary(),
      loadHitRate(),
      loadCostBreakdown(),
      loadRejectReasons(),
      loadVersionEffect(),
    ])
  }

  async function loadSummary() {
    loading.summary = true
    error.summary = null
    try {
      summary.value = await getSummaryApi(buildExtra())
    } catch (e) {
      error.summary = e as Error
    } finally {
      loading.summary = false
    }
  }

  async function loadHitRate() {
    loading.hitRate = true
    error.hitRate = null
    try {
      hitRateData.value = await getHitRateApi(30, buildExtra())
    } catch (e) {
      error.hitRate = e as Error
    } finally {
      loading.hitRate = false
    }
  }

  async function loadCostBreakdown() {
    loading.costBreakdown = true
    error.costBreakdown = null
    try {
      costBreakdown.value = await getCostBreakdownApi(filters.costDimension, buildExtra())
    } catch (e) {
      error.costBreakdown = e as Error
    } finally {
      loading.costBreakdown = false
    }
  }

  async function loadRejectReasons() {
    loading.rejectReasons = true
    error.rejectReasons = null
    try {
      rejectReasons.value = await getRejectReasonsApi(buildExtra())
    } catch (e) {
      error.rejectReasons = e as Error
    } finally {
      loading.rejectReasons = false
    }
  }

  async function loadVersionEffect() {
    loading.versionEffect = true
    error.versionEffect = null
    try {
      versionEffect.value = await getVersionEffectApi(buildExtra())
    } catch (e) {
      error.versionEffect = e as Error
    } finally {
      loading.versionEffect = false
    }
  }

  function setCostDimension(dim: CostDimension) {
    filters.costDimension = dim
    loadCostBreakdown()
  }

  function setDateRange(start?: string, end?: string) {
    filters.dateRange.startDate = start
    filters.dateRange.endDate = end
    loadAll()
  }

  function setUserId(userId?: string) {
    filters.userId = userId
    loadAll()
  }

  function buildExtra() {
    const extra: any = {}
    if (filters.dateRange.startDate) extra.startDate = filters.dateRange.startDate
    if (filters.dateRange.endDate) extra.endDate = filters.dateRange.endDate
    if (filters.userId) extra.userId = filters.userId
    return extra
  }

  function buildMiniTrendData(data: HitRateData) {
    if (!data.trend?.length) {
      return {
        xData: ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', '今日'],
        rateData: [0, 0, 0, 0, 0, 0, 0],
        totalData: [0, 0, 0, 0, 0, 0, 0],
      }
    }
    const trend = data.trend
    return {
      xData: trend.map((d: any) => shortDate(d.date)),
      rateData: trend.map((d: any) => Number(d.hitRate ?? 0)),
      totalData: trend.map((d: any) => Number(d.total ?? 0)),
    }
  }

  function buildHitRateLineData(data: HitRateData) {
    if (!data.trend?.length) {
      return {
        xData: [] as string[],
        rates: [] as number[],
        totals: [] as number[],
        yAxis: { type: 'value', min: 0, max: 100 },
      }
    }
    const trend = data.trend
    return {
      xData: trend.map((d: any) => shortDate(d.date)),
      rates: trend.map((d: any) => Number(d.hitRate ?? 0)),
      totals: trend.map((d: any) => Number(d.total ?? 0)),
    }
  }

  function buildCostStackAreaData(data: CostBreakdownData, dimension: CostDimension) {
    const items = data.items || []

    if (dimension === 'date') {
      return {
        legendData: ['总调用成本', 'Token 消耗成本'],
        xData: items.map(i => shortDate(i.key)),
        seriesData: [
          {
            name: '总调用成本',
            type: 'line',
            stack: 'total',
            smooth: true,
            areaStyle: { opacity: 0.3 },
            data: items.map(i => round(i.totalCost)),
            lineStyle: { width: 2 },
            itemStyle: { color: '#2563eb' },
          },
          {
            name: 'Token 消耗成本',
            type: 'line',
            stack: 'token',
            smooth: true,
            areaStyle: { opacity: 0.25 },
            data: items.map(i => round(i.avgCost * 0.7 * i.callCount)),
            lineStyle: { width: 2, type: 'dashed' },
            itemStyle: { color: '#d97706' },
          },
        ],
      }
    }

    const dimensionLabelMap: Record<CostDimension, { approved: string; rejected: string }> = {
      date: { approved: '生成成本', rejected: '驳回成本' },
      user: { approved: '批准邮件成本', rejected: '驳回邮件成本' },
      reviewer: { approved: '复核通过成本', rejected: '驳回重生成成本' },
      reason: { approved: '其他成本', rejected: '驳回原因关联成本' },
    }
    const labelMap = dimensionLabelMap[dimension]

    return {
      legendData: [labelMap.approved, labelMap.rejected],
      xData: items.map(i => i.label.length > 8 ? i.label.slice(0, 7) + '…' : i.label),
      seriesData: [
        {
          name: labelMap.approved,
          type: 'bar',
          stack: 'total',
          barWidth: 20,
          data: items.map(i => round(i.totalCost * 0.7)),
          itemStyle: { color: '#22c55e' },
        },
        {
          name: labelMap.rejected,
          type: 'bar',
          stack: 'total',
          barWidth: 20,
          data: items.map(i => round(i.totalCost * 0.3)),
          itemStyle: { color: '#ef4444' },
        },
      ],
    }
  }

  function buildCostHeatmapData(data: CostBreakdownData, dimension: CostDimension) {
    const items = data.items || []
    if (dimension === 'date') {
      return {
        title: `按日期成本热力分布（${data.dimensionLabel}）`,
        xData: items.length ? items.map((_, idx) => `周${Math.ceil((idx + 1) / 7)}`) : [],
        yData: items.map(i => shortDate(i.key)),
        data: items.map((i, idx) => [idx, idx, round(i.totalCost)]),
        max: Math.max(1, ...items.map(i => round(i.totalCost))),
      }
    }
    return {
      title: `按${data.dimensionLabel}成本分布`,
      xData: ['生成成本 (USD)', 'Token 消耗', '平均成本 (USD)'],
      yData: items.map(i => i.label.length > 10 ? i.label.slice(0, 9) + '…' : i.label),
      data: items.flatMap((i, idx) => [
        [0, idx, round(i.totalCost)],
        [1, idx, Number(i.totalTokens)],
        [2, idx, round(i.avgCost)],
      ]),
      max: Math.max(
        1,
        ...items.map(i => round(i.totalCost)),
        ...items.map(i => Number(i.totalTokens) / 1000),
        ...items.map(i => round(i.avgCost)),
      ),
    }
  }

  function buildCostTableData(data: CostBreakdownData, dimension: CostDimension) {
    const items = data.items || []
    const totalCost = items.reduce((s, i) => s + (i.totalCost || 0), 0)
    const totalTokens = items.reduce((s, i) => s + (i.totalTokens || 0), 0)
    const totalCalls = items.reduce((s, i) => s + (i.callCount || 0), 0)
    const dimensionNameMap: Record<CostDimension, string> = {
      date: '日期',
      user: '销售姓名',
      reviewer: '复核员',
      reason: '驳回原因',
    }
    return {
      dimensionName: dimensionNameMap[dimension],
      summary: {
        totalItems: items.length,
        totalCost: round(totalCost),
        avgCost: totalCalls ? round(totalCost / totalCalls) : 0,
        totalCalls,
      },
      items: items.map(i => ({
        key: i.key,
        label: i.label,
        totalCost: round(i.totalCost),
        totalTokens: Number(i.totalTokens),
        callCount: Number(i.callCount),
        avgCost: round(i.avgCost),
        share: totalCost > 0 ? round((i.totalCost / totalCost) * 100) : 0,
      })),
    }
  }

  function buildRejectScatterData(rejectData: RejectReasonsData, costData: CostBreakdownData) {
    const reasonItems = rejectData.items || []
    const costItems = costData.items || []

    const costByReasonKey: Record<string, { totalCost: number; callCount: number }> = {}
    if (costData.dimension === 'reason') {
      costItems.forEach(c => {
        costByReasonKey[c.key] = { totalCost: c.totalCost, callCount: c.callCount }
      })
    }

    const reasonCodeMap: Record<string, string> = {
      CONTENT_TONE: '语气',
      COMPLIANCE_RISK: '合规',
      FORMAT_ERROR: '格式',
      DATA_INACCURATE: '数据',
      MISSING_INFO: '缺失',
      OTHER: '其他',
    }

    const data = reasonItems.map(r => {
      const codeKey = r.code?.toUpperCase?.() || r.code || r.name
      const category = r.category || reasonCodeMap[codeKey] || r.name || '未分类'
      const costInfo = costByReasonKey[r.code] || costByReasonKey[r.name] || { totalCost: 0, callCount: 0 }
      const cost = costInfo.totalCost > 0 ? costInfo.totalCost : (r.percentage || 0) * 0.03 * 10
      return {
        value: [Number(r.count || 0), Number(r.percentage || 0), round(cost)],
        category,
        code: r.code || r.name,
        name: r.name,
      }
    })

    const categories = Array.from(new Set(data.map(d => d.category)))

    return {
      legendData: categories,
      maxX: Math.max(3, ...data.map(d => d.value[0])),
      maxY: Math.max(10, ...data.map(d => d.value[1])),
      series: categories.map((cat, idx) => ({
        name: cat,
        type: 'scatter',
        data: data.filter(d => d.category === cat).map(d => d.value),
        itemStyle: {
          color: ['#2563eb', '#d97706', '#dc2626', '#059669', '#7c3aed', '#0891b2'][idx % 6],
          opacity: 0.85,
        },
        symbolSize: (val: number[]) => Math.max(10, Math.min(40, Math.sqrt(val[2] || 1) * 8)),
      })),
      items: data,
    }
  }

  function buildRejectBarData(data: RejectReasonsData) {
    const items = data.items || []
    return {
      xData: items.map(i => (i.name || i.code).length > 6 ? (i.name || i.code).slice(0, 5) + '…' : (i.name || i.code)),
      countData: items.map(i => Number(i.count || 0)),
      percentData: items.map(i => Number(i.percentage || 0)),
      total: data.totalCount || items.reduce((s, i) => s + Number(i.count || 0), 0),
    }
  }

  function buildVersionTableData(data: VersionEffectData) {
    const items = data.templateVersions || []
    const totalCost = items.reduce((s, i) => s + (i.totalCost || 0), 0)
    return {
      summary: {
        totalVersions: items.length,
        totalCalls: items.reduce((s, i) => s + (i.totalCalls || 0), 0),
        avgHitRate: items.length ? round(items.reduce((s, i) => s + (i.hitRate || 0), 0) / items.length) : 0,
        totalCost: round(totalCost),
      },
      items: items.map(i => ({
        id: String(i.id),
        version: i.version,
        name: i.name,
        totalCalls: Number(i.totalCalls || 0),
        hitRate: Number(i.hitRate || 0),
        avgCost: round(i.avgCost),
        totalCost: round(i.totalCost),
        share: totalCost > 0 ? round((i.totalCost / totalCost) * 100) : 0,
        createdAt: i.createdAt,
      })),
    }
  }

  function buildPromptVersionTableData(data: VersionEffectData) {
    const items = data.promptVersions || []
    const totalCost = items.reduce((s, i) => s + (i.totalCost || 0), 0)
    return {
      summary: {
        totalVersions: items.length,
        totalCalls: items.reduce((s, i) => s + (i.totalCalls || 0), 0),
        avgHitRate: items.length ? round(items.reduce((s, i) => s + (i.hitRate || 0), 0) / items.length) : 0,
        totalCost: round(totalCost),
      },
      items: items.map(i => ({
        id: String(i.id),
        version: i.version,
        name: i.name,
        totalCalls: Number(i.totalCalls || 0),
        hitRate: Number(i.hitRate || 0),
        avgCost: round(i.avgCost),
        totalCost: round(i.totalCost),
        share: totalCost > 0 ? round((i.totalCost / totalCost) * 100) : 0,
        createdAt: i.createdAt,
      })),
    }
  }

  function shortDate(s: string) {
    if (!s) return ''
    const m = s.match(/(\d{1,2})[-\/](\d{1,2})$/)
    if (m) return `${Number(m[1])}/${Number(m[2])}`
    const m2 = s.match(/-(\d{2})-(\d{2})$/)
    if (m2) return `${Number(m2[1])}/${Number(m2[2])}`
    return s.length > 5 ? s.slice(-5).replace('-', '/') : s
  }

  function round(n: number) {
    return Math.round(Number(n) * 100) / 100
  }

  return {
    loading,
    error,
    summary,
    hitRateData,
    costBreakdown,
    rejectReasons,
    versionEffect,
    filters,
    summaryCardList,
    miniTrendData,
    hitRateLineData,
    costStackAreaData,
    costHeatmapData,
    costTableData,
    rejectScatterData,
    rejectBarData,
    versionTableData,
    promptVersionTableData,
    loadAll,
    loadSummary,
    loadHitRate,
    loadCostBreakdown,
    loadRejectReasons,
    loadVersionEffect,
    setCostDimension,
    setDateRange,
    setUserId,
  }
}
