<template>
  <div class="card-hover">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-500">{{ title }}</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ value }}</p>
        <div v-if="trend && trendValue" class="mt-2 flex items-center gap-1 text-sm">
          <TrendingUp v-if="trend === 'up'" class="w-4 h-4 text-success" />
          <TrendingDown v-else class="w-4 h-4 text-danger" />
          <span :class="trend === 'up' ? 'text-success' : 'text-danger'">{{ trendValue }}</span>
        </div>
      </div>
      <div
        :class="[
          'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
          colorClasses[color ?? 'primary']
        ]"
      >
        <component :is="icon" class="w-6 h-6" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, TrendingDown } from 'lucide-vue-next'

defineProps<{
  title: string
  value: string | number
  icon: any
  trend?: 'up' | 'down'
  trendValue?: string
  color?: 'primary' | 'success' | 'warning' | 'danger'
}>()

const colorClasses: Record<string, string> = {
  primary: 'bg-primary-100 text-primary-500',
  success: 'bg-green-100 text-success',
  warning: 'bg-amber-100 text-warning',
  danger: 'bg-red-100 text-danger',
}
</script>
