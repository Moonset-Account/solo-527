<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

interface Props {
  title: string
  value: string | number
  unit?: string
  trend?: number
  icon?: any
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  trend: 0,
  color: '#3B82F6'
})

const trendIcon = computed(() => {
  if (props.trend > 0) return TrendingUp
  if (props.trend < 0) return TrendingDown
  return Minus
})

const trendColor = computed(() => {
  if (props.trend > 0) return 'text-status-danger'
  if (props.trend < 0) return 'text-status-success'
  return 'text-slate-400'
})

const trendText = computed(() => {
  const sign = props.trend > 0 ? '+' : ''
  return `${sign}${props.trend.toFixed(1)}%`
})
</script>

<template>
  <div class="card card-hover p-5">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm text-slate-400 mb-2">{{ title }}</p>
        <div class="flex items-baseline gap-2">
          <span class="metric-value text-white">{{ value }}</span>
          <span v-if="unit" class="text-sm text-slate-400">{{ unit }}</span>
        </div>
        <div v-if="trend !== 0" class="flex items-center gap-1 mt-2">
          <component :is="trendIcon" class="w-4 h-4" :class="trendColor" />
          <span class="text-sm" :class="trendColor">{{ trendText }}</span>
          <span class="text-xs text-slate-500">较昨日</span>
        </div>
      </div>
      <div
        v-if="icon"
        class="w-12 h-12 rounded-xl flex items-center justify-center"
        :style="{ backgroundColor: color + '20' }"
      >
        <component :is="icon" class="w-6 h-6" :style="{ color }" />
      </div>
    </div>
  </div>
</template>
