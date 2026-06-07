import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  QualityMetrics,
  FunnelData,
  AnomalyMatrixCell,
  ChannelRanking,
  QuestionGroupDuration,
  AnomalySample,
  TrendDataPoint,
  ComparisonData,
} from '@/types'
import {
  mockQualityMetrics,
  mockFunnelData,
  mockAnomalyMatrix,
  mockChannelRanking,
  mockQuestionGroupDurations,
  mockAnomalySamples,
  mockTrendData,
  getMockComparisonData,
  getMockAnswerTrajectory,
  getMockQualityCheckHits,
} from '@/mock/data'

export interface SampleFilter {
  channelId?: string
  anomalyType?: string
  region?: string
  deviceType?: string
  qualityMark?: string
  surveyId?: string
}

export type TimeWindow = '24h' | '7d' | '30d' | '90d'

export const useQualityStore = defineStore('quality', () => {
  const timeWindow = ref<TimeWindow>('30d')
  const metrics = ref<QualityMetrics>(mockQualityMetrics)
  const funnelData = ref<FunnelData[]>(mockFunnelData)
  const trendData = ref<TrendDataPoint[]>(mockTrendData)
  const anomalyMatrix = ref<AnomalyMatrixCell[]>(mockAnomalyMatrix)
  const channelRanking = ref<ChannelRanking[]>(mockChannelRanking)
  const questionGroupDurations = ref<QuestionGroupDuration[]>(mockQuestionGroupDurations)
  const allAnomalySamples = ref<AnomalySample[]>(mockAnomalySamples)
  const selectedSample = ref<AnomalySample | null>(null)
  const comparisonData = ref<ComparisonData[]>([])
  const activeFilter = ref<SampleFilter>({})

  const timeWindowMultiplier: Record<TimeWindow, number> = {
    '24h': 0.08,
    '7d': 0.25,
    '30d': 1,
    '90d': 2.8,
  }

  const anomalySamples = computed(() => {
    let result = [...allAnomalySamples.value]
    const f = activeFilter.value
    if (f.channelId) {
      result = result.filter(s => s.channelId === f.channelId)
    }
    if (f.anomalyType) {
      result = result.filter(s => s.anomalyTypes.includes(f.anomalyType!))
    }
    if (f.region) {
      result = result.filter(s => s.region === f.region)
    }
    if (f.deviceType) {
      result = result.filter(s => s.deviceType === f.deviceType)
    }
    if (f.qualityMark) {
      result = result.filter(s => s.qualityMark === f.qualityMark)
    }
    if (f.surveyId) {
      result = result.filter(s => s.surveyId === f.surveyId)
    }
    return result
  })

  const filterDescription = computed(() => {
    const parts: string[] = []
    const f = activeFilter.value
    if (f.channelId) {
      const ch = channelRanking.value.find(c => c.channelId === f.channelId)
      if (ch) parts.push(`渠道: ${ch.channelName}`)
    }
    if (f.anomalyType) {
      const anomalyNames: Record<string, string> = {
        duration: '时长异常',
        skip: '跳题异常',
        ip: 'IP异常',
        device: '设备异常',
        duplicate: '重复提交',
        quality: '质检不通过',
      }
      parts.push(`异常类型: ${anomalyNames[f.anomalyType] || f.anomalyType}`)
    }
    if (f.region) parts.push(`地区: ${f.region}`)
    if (f.deviceType) parts.push(`设备: ${f.deviceType}`)
    if (f.qualityMark) {
      const markNames: Record<string, string> = { pass: '通过', warning: '警告', fail: '不通过' }
      parts.push(`质检: ${markNames[f.qualityMark] || f.qualityMark}`)
    }
    if (f.surveyId) {
      const surveyNames: Record<string, string> = {
        s1: '用户满意度调研 Q2',
        s2: '产品使用反馈调研',
        s3: '品牌认知度调研',
        s4: 'NPS 净推荐值调研',
      }
      parts.push(`问卷: ${surveyNames[f.surveyId] || f.surveyId}`)
    }
    return parts.length > 0 ? parts.join(' | ') : '全部样本'
  })

  const totalSamples = computed(() => Math.floor(metrics.value.totalSamples * timeWindowMultiplier[timeWindow.value]))
  const anomalyRate = computed(() => metrics.value.anomalyRate)
  const scaledMetrics = computed(() => {
    const m = timeWindowMultiplier[timeWindow.value]
    return {
      ...metrics.value,
      totalSamples: Math.floor(metrics.value.totalSamples * m),
      validSamples: Math.floor(metrics.value.validSamples * m),
    }
  })
  const scaledFunnelData = computed(() => {
    const m = timeWindowMultiplier[timeWindow.value]
    return funnelData.value.map(f => ({
      ...f,
      count: Math.floor(f.count * m),
    }))
  })
  const scaledTrendData = computed(() => {
    const days = timeWindow.value === '24h' ? 1 : timeWindow.value === '7d' ? 7 : timeWindow.value === '30d' ? 30 : 90
    const m = timeWindowMultiplier[timeWindow.value]
    return trendData.value.slice(-days).map(t => ({
      ...t,
      totalSamples: Math.floor(t.totalSamples * m),
      anomalyCount: Math.floor(t.anomalyCount * m),
    }))
  })

  function setTimeWindow(window: TimeWindow) {
    timeWindow.value = window
  }

  function setActiveFilter(filter: SampleFilter) {
    activeFilter.value = { ...filter }
  }

  function loadComparisonData(dimension: string) {
    const data = getMockComparisonData(dimension)
    const m = timeWindowMultiplier[timeWindow.value]
    comparisonData.value = data.map(d => ({
      ...d,
      metrics: {
        ...d.metrics,
        totalSamples: d.metrics.totalSamples ? Math.floor(d.metrics.totalSamples * m) : undefined,
        validSamples: d.metrics.validSamples ? Math.floor(d.metrics.validSamples * m) : undefined,
      },
    }))
  }

  function selectSample(sample: AnomalySample | null) {
    selectedSample.value = sample
  }

  function getAnswerTrajectory(sampleId: string) {
    return getMockAnswerTrajectory(sampleId)
  }

  function getQualityCheckHits(sampleId: string) {
    return getMockQualityCheckHits(sampleId)
  }

  function getSampleById(sampleId: string) {
    return allAnomalySamples.value.find(s => s.sampleId === sampleId) || null
  }

  return {
    timeWindow,
    metrics,
    scaledMetrics,
    funnelData,
    scaledFunnelData,
    trendData,
    scaledTrendData,
    anomalyMatrix,
    channelRanking,
    questionGroupDurations,
    anomalySamples,
    allAnomalySamples,
    selectedSample,
    comparisonData,
    activeFilter,
    filterDescription,
    totalSamples,
    anomalyRate,
    setTimeWindow,
    setActiveFilter,
    loadComparisonData,
    selectSample,
    getAnswerTrajectory,
    getQualityCheckHits,
    getSampleById,
  }
})
