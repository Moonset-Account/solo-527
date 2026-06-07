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

export const useQualityStore = defineStore('quality', () => {
  const metrics = ref<QualityMetrics>(mockQualityMetrics)
  const funnelData = ref<FunnelData[]>(mockFunnelData)
  const trendData = ref<TrendDataPoint[]>(mockTrendData)
  const anomalyMatrix = ref<AnomalyMatrixCell[]>(mockAnomalyMatrix)
  const channelRanking = ref<ChannelRanking[]>(mockChannelRanking)
  const questionGroupDurations = ref<QuestionGroupDuration[]>(mockQuestionGroupDurations)
  const anomalySamples = ref<AnomalySample[]>(mockAnomalySamples)
  const selectedSample = ref<AnomalySample | null>(null)
  const comparisonData = ref<ComparisonData[]>([])

  const totalSamples = computed(() => metrics.value.totalSamples)
  const anomalyRate = computed(() => metrics.value.anomalyRate)

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
    return anomalySamples.value.find(s => s.sampleId === sampleId) || null
  }

  return {
    metrics,
    funnelData,
    trendData,
    anomalyMatrix,
    channelRanking,
    questionGroupDurations,
    anomalySamples,
    selectedSample,
    comparisonData,
    totalSamples,
    anomalyRate,
    loadComparisonData,
    selectSample,
    getAnswerTrajectory,
    getQualityCheckHits,
    getSampleById,
  }
})
