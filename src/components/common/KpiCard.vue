<script setup lang="ts">
import { computed, type Component } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  icon?: Component
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'secondary'
  isPercentage?: boolean
}>()

const colorClasses = computed(() => {
  const colorMap: Record<string, string> = {
    primary: 'text-survey-primary',
    success: 'text-survey-success',
    warning: 'text-survey-warning',
    danger: 'text-survey-danger',
    secondary: 'text-survey-secondary',
  }
  return colorMap[props.color || 'primary']
})

const trendIcon = computed(() => {
  if (props.trend === 'up') return TrendingUp
  if (props.trend === 'down') return TrendingDown
  return Minus
})

const trendColorClass = computed(() => {
  if (props.trend === 'up') return 'text-survey-success'
  if (props.trend === 'down') return 'text-survey-danger'
  return 'text-survey-text-muted'
})
</script>

<template>
  <div class="bg-survey-surface border border-survey-border rounded-lg p-5 card-hover">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-survey-text-muted mb-2">{{ title }}</p>
        <div class="flex items-baseline gap-1">
          <span class="font-mono text-3xl font-bold" :class="colorClasses">{{ value }}</span>
          <span v-if="unit" class="text-sm text-survey-text-muted">{{ unit }}</span>
        </div>
      </div>
      <div v-if="icon" class="w-10 h-10 rounded-lg bg-survey-bg flex items-center justify-center" :class="colorClasses">
        <component :is="icon" class="w-5 h-5" />
      </div>
    </div>
    <div v-if="trendValue" class="mt-3 flex items-center gap-1">
      <component :is="trendIcon" class="w-4 h-4" :class="trendColorClass" />
      <span class="text-xs" :class="trendColorClass">{{ trendValue }}</span>
      <span class="text-xs text-survey-text-muted ml-1">较上周</span>
    </div>
  </div>
</template>
