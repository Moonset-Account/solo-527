<template>
  <div class="fixed bottom-0 left-0 right-0 bg-base-900/95 backdrop-blur border-t border-surface-border px-6 py-2 text-sm text-base-500 flex items-center justify-between z-50">
    <div class="flex items-center gap-1.5">
      <span>🕐</span>
      <span>{{ formattedTime }}</span>
    </div>
    <div class="flex items-center gap-1.5">
      <span>🔍</span>
      <span>{{ filterStore.filterSummary }}</span>
      <span v-if="filterStore.activeFilterCount > 0" class="badge-accent">{{ filterStore.activeFilterCount }}</span>
    </div>
    <div class="flex items-center gap-1.5">
      <span>📊</span>
      <span>有效样本: {{ sampleSize }}条</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { useFilterStore } from '@/stores/filter'

const dataStore = useDataStore()
const filterStore = useFilterStore()

const formattedTime = computed(() => {
  if (!dataStore.dataMeta?.updatedAt) return '未更新'
  const d = new Date(dataStore.dataMeta.updatedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

const sampleSize = computed(() => dataStore.dataMeta?.sampleSize ?? 0)
</script>
