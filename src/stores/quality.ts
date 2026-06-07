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

export const useQualityStore = defineStore('quality', () => {
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
    return parts.length > 0 ? parts.join(' | ') : '全部样本'
  })

  const totalSamples = computed(() => metrics.value.totalSamples)
  const anomalyRate = computed(() => metrics.value.anomalyRate)

  function setActiveFilter(filter: SampleFilter) {
    activeFilter.value = { ...filter }
  }

  function loadComparisonData(dimension: string) {
    comparisonData.value = getMockComparisonData(dimension)
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
    metrics,
    funnelData,
    trendData,
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
    setActiveFilter,
    loadComparisonData,
    selectSample,
    getAnswerTrajectory,
    getQualityCheckHits,
    getSampleById,
  }
})
