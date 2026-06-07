<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQualityStore } from '@/stores/quality'
import CardContainer from '@/components/layout/CardContainer.vue'
import DimensionFilter from '@/components/filters/DimensionFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'
import NoteModal from '@/components/common/NoteModal.vue'
import DataCaliberCard from '@/components/common/DataCaliberCard.vue'
import { X } from 'lucide-vue-next'
import type { AnomalySample } from '@/types'

const route = useRoute()
const router = useRouter()
const qualityStore = useQualityStore()

const showDrawer = ref(false)
const selectedSampleId = ref<string | null>(null)
const showNoteModal = ref(false)
const noteTarget = ref<{ type: 'sample', id: string, name: string } | null>(null)

const filteredData = computed(() => qualityStore.anomalySamples)

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
    <div class="relative">
      <DataCaliberCard />
      <button
        v-if="hasActiveFilters"
        @click="clearFilters"
        class="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded bg-survey-danger/10 text-survey-danger text-xs hover:bg-survey-danger/20 transition-colors z-10"
      >
        <X class="w-3.5 h-3.5" />
        清除筛选
      </button>
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
