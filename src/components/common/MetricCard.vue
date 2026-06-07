<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'
import SampleSizeBadge from './SampleSizeBadge.vue'
import { obfuscateLowSampleValue } from '@/utils/privacy'

const props = defineProps<{
  name: string
  value: number
  unit: string
  trend: number
  sampleSize: number
  lowSample: boolean
}>()

const displayValue = computed(() => {
  if (props.lowSample) {
    return '样本不足'
  }
  return obfuscateLowSampleValue(props.value, props.sampleSize, 10, props.unit)
})

const trendPositive = computed(() => props.trend >= 0)
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between mb-3">
      <h3 class="text-sm font-medium text-gray-600">{{ name }}</h3>
      <SampleSizeBadge :sample-size="sampleSize" />
    </div>
    <div class="flex items-end justify-between">
      <div>
        <p class="text-2xl font-bold text-gray-900" :class="{ 'text-gray-400': lowSample }">
          {{ displayValue }}
        </p>
      </div>
      <div
        class="flex items-center gap-1 text-sm font-medium"
        :class="trendPositive ? 'text-green-600' : 'text-red-600'"
      >
        <TrendingUp v-if="trendPositive" class="w-4 h-4" />
        <TrendingDown v-else class="w-4 h-4" />
        <span>{{ Math.abs(trend) }}%</span>
      </div>
    </div>
  </div>
</template>
