<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQualityStore } from '@/stores/quality'
import CardContainer from '@/components/layout/CardContainer.vue'
import DimensionFilter from '@/components/filters/DimensionFilter.vue'
import DataTable from '@/components/common/DataTable.vue'
import DetailDrawer from '@/components/common/DetailDrawer.vue'
import NoteModal from '@/components/common/NoteModal.vue'
import type { AnomalySample } from '@/types'

const route = useRoute()
const qualityStore = useQualityStore()

const showDrawer = ref(false)
const selectedSampleId = ref<string | null>(null)
const showNoteModal = ref(false)
const noteTarget = ref<{ type: 'sample', id: string, name: string } | null>(null)

const filteredData = computed(() => {
  return qualityStore.anomalySamples
})

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
  console.log('Filters changed:', filters)
}

onMounted(() => {
  if (route.query.channel || route.query.anomalyType) {
    console.log('Applied filters from matrix:', route.query)
  }
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
      <DimensionFilter
        :dimension-types="['channel', 'region', 'device', 'survey']"
        @filter-change="handleFilterChange"
      />
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-survey-surface border border-survey-border rounded-lg p-4">
        <p class="text-sm text-survey-text-muted mb-1">异常样本总数</p>
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
        <span class="text-xs text-survey-text-muted">仅展示聚合质量数据，已脱敏处理</span>
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
