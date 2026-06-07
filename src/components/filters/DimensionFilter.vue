<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, X, Filter } from 'lucide-vue-next'
import type { DimensionType } from '@/types'
import { DIMENSION_TYPES, ANOMALY_TYPES } from '@/utils/constants'
import { mockDimensions } from '@/mock/data'

const props = defineProps<{
  dimensionTypes?: DimensionType[]
}>()

const emit = defineEmits<{
  (e: 'filter-change', filters: Record<string, string[]>): void
}>()

const showDropdown = ref<string | null>(null)
const selectedValues = ref<Record<string, string[]>>({})

const allDimensions = computed(() => {
  const types = props.dimensionTypes || ['survey', 'channel', 'region', 'device']
  return DIMENSION_TYPES.filter(d => types.includes(d.type))
})

function getOptions(type: DimensionType) {
  return mockDimensions.filter(d => d.type === type)
}

function toggleDropdown(key: string) {
  showDropdown.value = showDropdown.value === key ? null : key
}

function toggleValue(type: string, id: string) {
  if (!selectedValues.value[type]) {
    selectedValues.value[type] = []
  }
  const idx = selectedValues.value[type].indexOf(id)
  if (idx > -1) {
    selectedValues.value[type].splice(idx, 1)
  } else {
    selectedValues.value[type].push(id)
  }
  emit('filter-change', { ...selectedValues.value })
}

function clearFilter(type: string) {
  selectedValues.value[type] = []
  emit('filter-change', { ...selectedValues.value })
}

function getSelectedNames(type: string) {
  const options = getOptions(type as DimensionType)
  const selected = selectedValues.value[type] || []
  if (selected.length === 0) return '全部'
  const names = options.filter(o => selected.includes(o.id)).map(o => o.name)
  if (names.length <= 2) return names.join('、')
  return `${names[0]} 等 ${names.length} 项`
}
</script>

<template>
  <div class="flex items-center gap-3 flex-wrap">
    <div class="flex items-center gap-1.5 text-survey-text-secondary text-sm">
      <Filter class="w-4 h-4" />
      <span>筛选:</span>
    </div>

    <div
      v-for="dim in allDimensions"
      :key="dim.type"
      class="relative"
    >
      <button
        @click="toggleDropdown(dim.type)"
        class="flex items-center gap-2 px-3 py-1.5 bg-survey-surface border border-survey-border rounded-md text-sm hover:border-survey-primary/50 transition-colors"
        :class="{ 'border-survey-primary/50': showDropdown === dim.type }"
      >
        <span class="text-survey-text-muted">{{ dim.name }}:</span>
        <span :class="(selectedValues[dim.type]?.length || 0) > 0 ? 'text-survey-text-primary' : 'text-survey-text-muted'">
          {{ getSelectedNames(dim.type) }}
        </span>
        <div v-if="(selectedValues[dim.type]?.length || 0) > 0" class="flex items-center">
          <button
            @click.stop="clearFilter(dim.type)"
            class="ml-1 p-0.5 rounded hover:bg-survey-surface-hover text-survey-text-muted hover:text-survey-text-secondary"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
        <ChevronDown class="w-4 h-4 text-survey-text-muted" />
      </button>

      <div
        v-if="showDropdown === dim.type"
        class="absolute top-full left-0 mt-1 w-48 bg-survey-surface border border-survey-border rounded-md shadow-xl z-50 py-1 max-h-64 overflow-y-auto"
      >
        <label
          v-for="opt in getOptions(dim.type)"
          :key="opt.id"
          class="flex items-center gap-2 px-3 py-2 hover:bg-survey-surface-hover cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            :checked="selectedValues[dim.type]?.includes(opt.id)"
            @change="toggleValue(dim.type, opt.id)"
            class="w-4 h-4 rounded border-survey-border bg-survey-bg text-survey-primary focus:ring-survey-primary"
          />
          <span class="text-survey-text-primary">{{ opt.name }}</span>
        </label>
      </div>
    </div>

    <div class="relative">
      <button
        @click="toggleDropdown('anomaly')"
        class="flex items-center gap-2 px-3 py-1.5 bg-survey-surface border border-survey-border rounded-md text-sm hover:border-survey-primary/50 transition-colors"
        :class="{ 'border-survey-primary/50': showDropdown === 'anomaly' }"
      >
        <span class="text-survey-text-muted">异常类型:</span>
        <span :class="(selectedValues['anomaly']?.length || 0) > 0 ? 'text-survey-text-primary' : 'text-survey-text-muted'">
          {{ (selectedValues['anomaly']?.length || 0) > 0 ? `已选 ${selectedValues['anomaly'].length} 项` : '全部' }}
        </span>
        <div v-if="(selectedValues['anomaly']?.length || 0) > 0" class="flex items-center">
          <button
            @click.stop="clearFilter('anomaly')"
            class="ml-1 p-0.5 rounded hover:bg-survey-surface-hover text-survey-text-muted hover:text-survey-text-secondary"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
        <ChevronDown class="w-4 h-4 text-survey-text-muted" />
      </button>

      <div
        v-if="showDropdown === 'anomaly'"
        class="absolute top-full left-0 mt-1 w-48 bg-survey-surface border border-survey-border rounded-md shadow-xl z-50 py-1"
      >
        <label
          v-for="at in ANOMALY_TYPES"
          :key="at.code"
          class="flex items-center gap-2 px-3 py-2 hover:bg-survey-surface-hover cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            :checked="selectedValues['anomaly']?.includes(at.code)"
            @change="toggleValue('anomaly', at.code)"
            class="w-4 h-4 rounded border-survey-border bg-survey-bg text-survey-primary focus:ring-survey-primary"
          />
          <span class="text-survey-text-primary">{{ at.name }}</span>
        </label>
      </div>
    </div>
  </div>
</template>
