<template>
  <div class="flex items-center gap-2">
    <div class="flex items-center bg-slate-100 rounded-lg p-1">
      <button
        v-for="option in timeOptions"
        :key="option.value"
        class="time-tag"
        :class="modelValue === option.value ? 'time-tag-active' : 'time-tag-inactive bg-transparent border-transparent hover:bg-white/60'"
        @click="selectTime(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="modelValue === 'custom'" class="flex items-center gap-2">
      <div class="relative">
        <Calendar class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="date"
          :value="startDate"
          class="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          @input="onStartChange"
        />
      </div>
      <span class="text-slate-400">至</span>
      <div class="relative">
        <Calendar class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="date"
          :value="endDate"
          class="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          @input="onEndChange"
        />
      </div>
    </div>

    <button class="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors">
      <RefreshCw class="w-4 h-4" />
      刷新
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Calendar, RefreshCw } from 'lucide-vue-next'
import type { TimeRange } from '~/types'

const props = defineProps<{
  modelValue: TimeRange
  startDate?: string
  endDate?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: TimeRange): void
  (e: 'update:startDate', value: string): void
  (e: 'update:endDate', value: string): void
  (e: 'change', range: TimeRange, start?: string, end?: string): void
}>()

const timeOptions = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'custom', label: '自定义' }
]

const startDate = ref(props.startDate || '')
const endDate = ref(props.endDate || '')

const selectTime = (value: TimeRange) => {
  emit('update:modelValue', value)
  emit('change', value, startDate.value, endDate.value)
}

const onStartChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  startDate.value = target.value
  emit('update:startDate', target.value)
  emit('change', 'custom', target.value, endDate.value)
}

const onEndChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  endDate.value = target.value
  emit('update:endDate', target.value)
  emit('change', 'custom', startDate.value, target.value)
}
</script>
