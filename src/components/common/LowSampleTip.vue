<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { isLowSample } from '@/utils/privacy'

const props = withDefaults(defineProps<{
  sampleSize?: number
  minSize?: number
  showText?: boolean
  message?: string
}>(), {
  showText: true,
})

const shouldShow = computed(() => {
  if (props.message) {
    return true
  }
  if (props.sampleSize !== undefined) {
    return isLowSample(props.sampleSize, props.minSize)
  }
  return false
})

const displayMessage = computed(() => {
  if (props.message) {
    return props.message
  }
  return `样本量低于${props.minSize || 10}，可能存在统计偏差`
})
</script>

<template>
  <div
    v-if="shouldShow"
    class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700"
  >
    <AlertTriangle class="w-4 h-4 flex-shrink-0" />
    <span v-if="showText" class="text-sm">{{ displayMessage }}</span>
  </div>
</template>
