<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, MessageSquare, Eye } from 'lucide-vue-next'
import type { AnomalySample } from '@/types'
import { formatDuration, formatDateTime, formatPercent } from '@/utils/format'
import { ANOMALY_TYPES } from '@/utils/constants'
import TagBadge from './TagBadge.vue'

const props = defineProps<{
  data: AnomalySample[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-detail', sample: AnomalySample): void
  (e: 'add-note', sample: AnomalySample): void
}>()

const currentPage = ref(1)
const pageSize = 10

const totalPages = computed(() => Math.ceil(props.data.length / pageSize))

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return props.data.slice(start, start + pageSize)
})

function getAnomalyName(code: string) {
  const type = ANOMALY_TYPES.find(t => t.code === code)
  return type?.name || code
}

function getAnomalyVariant(code: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    duration: 'danger',
    skip: 'warning',
    ip: 'info',
    device: 'warning',
    duplicate: 'danger',
    quality: 'info',
  }
  return map[code] || 'info'
}

function getQualityVariant(mark: string): 'success' | 'warning' | 'danger' {
  if (mark === 'pass') return 'success'
  if (mark === 'warning') return 'warning'
  return 'danger'
}

function getQualityText(mark: string) {
  if (mark === 'pass') return '通过'
  if (mark === 'warning') return '警告'
  return '未通过'
}
</script>

<template>
  <div class="w-full">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-survey-border">
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">样本 ID</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">渠道</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">地区</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">设备</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">答题时长</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">跳题率</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">异常类型</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">质检标记</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">提交时间</th>
            <th class="text-left py-3 px-4 font-medium text-survey-text-secondary whitespace-nowrap">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sample in pagedData"
            :key="sample.sampleId"
            class="border-b border-survey-border/50 hover:bg-survey-surface-hover transition-colors"
          >
            <td class="py-3 px-4 font-mono text-survey-text-primary">{{ sample.sampleId }}</td>
            <td class="py-3 px-4 text-survey-text-secondary">{{ sample.channelName }}</td>
            <td class="py-3 px-4 text-survey-text-secondary">{{ sample.region }}</td>
            <td class="py-3 px-4 text-survey-text-secondary">{{ sample.deviceType }}</td>
            <td class="py-3 px-4 text-survey-text-primary font-mono">{{ formatDuration(sample.duration) }}</td>
            <td class="py-3 px-4 text-survey-text-primary font-mono">
              {{ formatPercent(sample.skipCount / sample.totalQuestions) }}
            </td>
            <td class="py-3 px-4">
              <div class="flex flex-wrap gap-1 max-w-[180px]">
                <TagBadge
                  v-for="code in sample.anomalyTypes.slice(0, 2)"
                  :key="code"
                  :text="getAnomalyName(code)"
                  :variant="getAnomalyVariant(code)"
                  size="sm"
                />
                <TagBadge
                  v-if="sample.anomalyTypes.length > 2"
                  :text="`+${sample.anomalyTypes.length - 2}`"
                  variant="default"
                  size="sm"
                />
              </div>
            </td>
            <td class="py-3 px-4">
              <TagBadge
                :text="getQualityText(sample.qualityMark)"
                :variant="getQualityVariant(sample.qualityMark)"
                size="sm"
              />
            </td>
            <td class="py-3 px-4 text-survey-text-secondary text-xs">
              {{ formatDateTime(sample.submitTime) }}
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-1">
                <button
                  @click="emit('view-detail', sample)"
                  class="p-1.5 rounded hover:bg-survey-bg text-survey-text-muted hover:text-survey-primary transition-colors"
                  title="查看详情"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <button
                  @click="emit('add-note', sample)"
                  class="p-1.5 rounded hover:bg-survey-bg transition-colors"
                  :class="sample.hasNote ? 'text-survey-secondary' : 'text-survey-text-muted hover:text-survey-secondary'"
                  title="添加备注"
                >
                  <MessageSquare class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between px-4 py-3 border-t border-survey-border">
      <p class="text-sm text-survey-text-muted">
        共 <span class="text-survey-text-primary font-mono">{{ data.length }}</span> 条记录
      </p>
      <div class="flex items-center gap-2">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="p-1.5 rounded border border-survey-border text-survey-text-secondary hover:bg-survey-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="text-sm text-survey-text-secondary px-2">
          <span class="text-survey-text-primary font-mono">{{ currentPage }}</span>
          <span class="mx-1">/</span>
          <span class="font-mono">{{ totalPages }}</span>
        </span>
        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="p-1.5 rounded border border-survey-border text-survey-text-secondary hover:bg-survey-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
