<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: String,
  colorMap: {
    type: Object,
    default: () => ({}),
  },
})

const defaultColorMap = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  draft: 'bg-gray-100 text-gray-700',
  generated: 'bg-purple-100 text-purple-700',
  published: 'bg-green-100 text-green-700',
  paused: 'bg-orange-100 text-orange-700',
  inactive: 'bg-red-100 text-red-700',
  disputed: 'bg-red-100 text-red-700',
  confirmed: 'bg-green-100 text-green-700',
  resolved: 'bg-green-100 text-green-700',
  ignored: 'bg-gray-100 text-gray-700',
}

const colorClass = computed(() => {
  return props.colorMap[props.status] || defaultColorMap[props.status] || 'bg-gray-100 text-gray-700'
})
</script>

<template>
  <span :class="[colorClass, 'inline-block rounded-full px-2 py-0.5 text-xs font-medium']">
    {{ status }}
  </span>
</template>
