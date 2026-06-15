<template>
  <div class="card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold text-slate-800">{{ title }}</h3>
      <button class="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
        查看全部
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-4">
      <div v-for="stat in stats" :key="stat.label" class="text-center p-3 rounded-lg" :class="stat.bgClass">
        <p class="text-2xl font-bold font-mono" :class="stat.valueClass">{{ stat.value }}</p>
        <p class="text-xs text-slate-500 mt-1">{{ stat.label }}</p>
      </div>
    </div>

    <div class="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-1">
      <div
        v-for="item in items.slice(0, 5)"
        :key="item.id"
        class="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
        @click="$emit('select', item)"
      >
        <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" :class="getPriorityBg(item.priority)">
          <AlertTriangle v-if="item.priority === 'high'" class="w-5 h-5" :class="getPriorityColor(item.priority)" />
          <Activity v-else-if="item.priority === 'medium'" class="w-5 h-5" :class="getPriorityColor(item.priority)" />
          <Info v-else class="w-5 h-5" :class="getPriorityColor(item.priority)" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-slate-800 truncate">{{ item.title }}</p>
            <span class="badge" :class="'badge-' + getStatusColor(item.status)">
              {{ getStatusText(item.status) }}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5 truncate">{{ item.readableReason }}</p>
        </div>

        <div class="text-right flex-shrink-0">
          <p class="text-xs text-slate-400">截止</p>
          <p class="text-xs font-medium" :class="isOverdue(item) ? 'text-danger-600' : 'text-slate-600'">
            {{ formatDeadline(item.deadline) }}
          </p>
        </div>

        <ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors flex-shrink-0" />
      </div>
    </div>

    <div v-if="items.length === 0" class="text-center py-8">
      <CheckCircle class="w-12 h-12 text-success-400 mx-auto mb-2" />
      <p class="text-sm text-slate-500">暂无待处理异常</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Activity, Info, ChevronRight, CheckCircle } from 'lucide-vue-next'
import dayjs from 'dayjs'
import type { Fluctuation } from '~/types'
import { getStatusText } from '~/utils/format'

const props = defineProps<{
  title: string
  items: Fluctuation[]
  pendingCount: number
  todayNewCount: number
  highPriorityCount: number
  avgProcessingHours: number
}>()

defineEmits<{
  (e: 'select', item: Fluctuation): void
}>()

const stats = computed(() => [
  { label: '待处理', value: props.pendingCount, bgClass: 'bg-warning-50', valueClass: 'text-warning-600' },
  { label: '今日新增', value: props.todayNewCount, bgClass: 'bg-primary-50', valueClass: 'text-primary-500' },
  { label: '高优先级', value: props.highPriorityCount, bgClass: 'bg-danger-50', valueClass: 'text-danger-600' },
  { label: '平均处理(h)', value: props.avgProcessingHours, bgClass: 'bg-slate-50', valueClass: 'text-slate-700' }
])

const getPriorityBg = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-danger-50'
    case 'medium': return 'bg-warning-50'
    default: return 'bg-success-50'
  }
}

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'text-danger-600'
    case 'medium': return 'text-warning-600'
    default: return 'text-success-600'
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'warning'
    case 'processing': return 'primary'
    case 'closed': return 'success'
    default: return 'secondary'
  }
}

const isOverdue = (item: Fluctuation): boolean => {
  if (item.status === 'closed' || !item.deadline) return false
  return dayjs(item.deadline).isBefore(dayjs())
}

const formatDeadline = (deadline?: string): string => {
  if (!deadline) return '-'
  const d = dayjs(deadline)
  if (d.isSame(dayjs(), 'day')) return '今天 ' + d.format('HH:mm')
  if (d.isSame(dayjs().add(1, 'day'), 'day')) return '明天 ' + d.format('HH:mm')
  return d.format('MM-DD HH:mm')
}
</script>
