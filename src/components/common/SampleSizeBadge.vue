<script setup lang="ts">
import { computed } from 'vue'
import { formatSampleSize, isLowSample } from '@/utils/privacy'

const props = defineProps<{
  sampleSize: number
  minSize?: number
}>()

const badgeText = computed(() => formatSampleSize(props.sampleSize, props.minSize))
const isLow = computed(() => isLowSample(props.sampleSize, props.minSize))
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded"
    :class="isLow ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'"
  >
    {{ badgeText }}
  </span>
</template>
