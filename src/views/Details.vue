<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQualityStore } from '@/stores/quality'
import { useFilterStore } from '@/stores/filter'
import CardContainer from '@/components/layout/CardContainer.vue'
import DimensionFilter from '@/components/filters/DimensionFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'
import NoteModal from '@/components/common/NoteModal.vue'
import { X, Database, Clock, Filter } from 'lucide-vue-next'
import type { AnomalySample } from '@/types'

const route = useRoute()
const router = useRouter()
const qualityStore = useQualityStore()
const filterStore = useFilterStore()

const showDrawer = ref(false)
const selectedSampleId = ref<string | null>(null)
const showNoteModal = ref(false)
const noteTarget = ref<{ type: 'sample', id: string, name: string } | null>(null)

const filteredData = computed(() => qualityStore.anomalySamples)
const filterDescription = computed(() => qualityStore.filterDescription)
const timeRangeText = computed(() => `${filterStore.timeRange.start} ~ ${filterStore.timeRange.end}`)

const hasActiveFilters = computed(() => {
  return Object.keys(qualityStore.activeFilter).length > 0
})

function applyFiltersFromQuery() {
  const query = route.query
  const filter: Record<string, string> = {}
  if (query.channel) filter.channelId = query.channel as string
  if (query.anomalyType) filter.anomalyType = query.anomalyType as string
  if (query.region) filter.region = query.region as string
  if (query.device) filter.deviceType = query.device as string
  if (query.qualityMark) filter.qualityMark = query.qualityMark as string
  if (query.survey) filter.surveyId = query.survey as string
  qualityStore.setActiveFilter(filter)
}

function clearFilters() {
  qualityStore.setActiveFilter({})
  router.push({ path: '/details', query: {} })
}

function handleViewDetail(sample: AnomalySample) {
  selectedSampleId.value = sample.sampleId
  showDrawer.value = true
}

function handleAddNote(sample: AnomalySample) {
  noteTarget.value = {
    type: 'sample',
    id: sample.sampleId,
    name: `样本 ${sample.sampleId}`,
  }
  showNoteModal.value = true
}

function handleFilterChange(filters: Record<string, string[]>) {
  const newFilter: Record<string, string> = {}
  if (filters.channel?.length) newFilter.channelId = filters.channel[0]
  if (filters.region?.length) newFilter.region = filters.region[0]
  if (filters.device?.length) newFilter.deviceType = filters.device[0]
  if (filters.survey?.length) newFilter.surveyId = filters.survey[0]
  qualityStore.setActiveFilter(newFilter)
}

watch(() => route.query, () => {
  applyFiltersFromQuery()
}, { immediate: true })

onMounted(() => {
  applyFiltersFromQuery()
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <Database class="w-4 h-4 text-survey-primary" />
          <span class="text-sm font-medium text-survey-text-primary">当前数据口径</span>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="flex items-center gap-1 text-xs text-survey-text-muted hover:text-survey-danger transition-colors"
        >
          <X class="w-3.5 h-3.5" />
          清除筛选
        </button>
      </div>

      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-survey-text-muted" />
          <span class="text-survey-text-muted">时间窗口:</span>
          <span class="text-survey-text-primary font-medium">{{ timeRangeText }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Filter class="w-4 h-4 text-survey-text-muted" />
          <span class="text-survey-text-muted">筛选条件:</span>
          <span class="text-survey-secondary font-medium">{{ filterDescription }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Database class="w-4 h-4 text-survey-text-muted" />
          <span class="text-survey-text-muted">数据来源:</span>
          <span class="text-survey-text-primary font-medium">ClickHouse 原始记录表 (sample_quality_raw)</span>
        </div>
      </div>
    </div>

    <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
      <DimensionFilter
        :dimension-types="['survey', 'channel', 'region', 'device']"
        @filter-change="handleFilterChange"
      />
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
        <p class="text-sm text-survey-text-muted mb-1">筛选后样本数</p>
        <p class="text-2xl font-mono font-bold text-survey-primary">{{ filteredData.length }}</p>
      </div>
      <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
        <p class="text-sm text-survey-text-muted mb-1">质检未通过</p>
        <p class="text-2xl font-mono font-bold text-survey-danger">
          {{ filteredData.filter(s => s.qualityMark === 'fail').length }}
        </p>
      </div>
      <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
        <p class="text-sm text-survey-text-muted mb-1">质检警告</p>
        <p class="text-2xl font-mono font-bold text-survey-warning">
          {{ filteredData.filter(s => s.qualityMark === 'warning').length }}
        </p>
      </div>
      <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
        <p class="text-sm text-survey-text-muted mb-1">已有备注</p>
        <p class="text-2xl font-mono font-bold text-survey-secondary">
          {{ filteredData.filter(s => s.hasNote).length }}
        </p>
      </div>
    </div>

    <CardContainer title="异常样本明细表">
      <template #header-actions>
        <div class="flex items-center gap-2">
          <span class="text-xs text-survey-text-muted">仅展示聚合质量数据，已脱敏处理</span>
          <span class="text-xs px-2 py-0.5 rounded bg-survey-primary/20 text-survey-primary">
            ClickHouse 实时查询
          </span>
        </div>
      </template>
      <DataTable
        :data="filteredData"
        @view-detail="handleViewDetail"
        @add-note="handleAddNote"
      />
    </CardContainer>

    <DetailDrawer
      :visible="showDrawer"
      :sample-id="selectedSampleId"
      @close="showDrawer = false"
    />

    <NoteModal
      v-if="noteTarget"
      :visible="showNoteModal"
      :target-type="noteTarget.type"
      :target-id="noteTarget.id"
      :target-name="noteTarget.name"
      @close="showNoteModal = false"
      @saved="showNoteModal = false"
    />
  </div>
</template>
