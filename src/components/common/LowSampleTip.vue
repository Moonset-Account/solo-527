<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { isLowSample } from '@/utils/privacy'

const props = defineProps<{
  sampleSize: number
  minSize?: number
  showText?: boolean
}>()

const isLow = () => isLowSample(props.sampleSize, props.minSize)
</script>

<template>
  <span
    v-if="isLow()"
    class="inline-flex items-center gap-1 text-xs text-orange-600"
    :title="`样本量低于${props.minSize || 10}，可能存在统计偏差`"
  >
    <AlertTriangle class="w-3.5 h-3.5" />
    <span v-if="showText">样本不足</span>
  </span>
</template>
