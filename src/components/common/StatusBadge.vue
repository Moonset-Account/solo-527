<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

export type ItemStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'archived'

interface Props {
  status: ItemStatus
}

const props = defineProps<Props>()

const statusConfig = computed(() => {
  const configs: Record<ItemStatus, { label: string; className: string }> = {
    pending: {
      label: '待认领',
      className: 'bg-gray-100 text-gray-600 border-gray-200',
    },
    in_progress: {
      label: '进行中',
      className: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    completed: {
      label: '已完成',
      className: 'bg-green-50 text-green-600 border-green-200',
    },
    overdue: {
      label: '已逾期',
      className: 'bg-red-50 text-red-600 border-red-200',
    },
    archived: {
      label: '已归档',
      className: 'bg-gray-100 text-gray-500 border-gray-200',
    },
  }
  return configs[props.status]
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border',
      cn(statusConfig.className),
    ]"
  >
    {{ statusConfig.label }}
  </span>
</template>
