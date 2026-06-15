<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

export type ItemPriority = 'low' | 'medium' | 'high' | 'urgent'

interface Props {
  priority: ItemPriority
}

const props = defineProps<Props>()

const priorityConfig = computed(() => {
  const configs: Record<ItemPriority, { label: string; className: string; dotClass: string }> = {
    low: {
      label: '低',
      className: 'bg-gray-50 text-gray-600 border-gray-200',
      dotClass: 'bg-gray-400',
    },
    medium: {
      label: '中',
      className: 'bg-blue-50 text-blue-600 border-blue-200',
      dotClass: 'bg-blue-500',
    },
    high: {
      label: '高',
      className: 'bg-orange-50 text-orange-600 border-orange-200',
      dotClass: 'bg-orange-500',
    },
    urgent: {
      label: '紧急',
      className: 'bg-red-50 text-red-600 border-red-200',
      dotClass: 'bg-red-500',
    },
  }
  return configs[props.priority]
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium border',
      cn(priorityConfig.className),
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full', cn(priorityConfig.dotClass)]" />
    {{ priorityConfig.label }}
  </span>
</template>
