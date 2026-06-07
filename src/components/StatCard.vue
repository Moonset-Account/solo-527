<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value: string | number
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: string
  icon?: string
}>()

const colorClass = computed(() => {
  switch (props.color) {
    case 'green': return 'text-green-600 bg-green-50'
    case 'red': return 'text-red-600 bg-red-50'
    case 'blue': return 'text-blue-600 bg-blue-50'
    case 'amber': return 'text-amber-600 bg-amber-50'
    default: return 'text-slate-600 bg-slate-50'
  }
})
</script>

<template>
  <div class="bg-white rounded-xl p-5 card-shadow transition-all hover:-translate-y-0.5">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-slate-500 font-medium">{{ title }}</p>
        <div class="flex items-baseline gap-1 mt-2">
          <span class="text-3xl font-bold font-mono text-slate-800">{{ value }}</span>
          <span v-if="unit" class="text-sm text-slate-500">{{ unit }}</span>
        </div>
        <div v-if="trend && trendValue" class="flex items-center gap-1 mt-2 text-xs">
          <span
            :class="{
              'text-green-600': trend === 'down',
              'text-red-600': trend === 'up',
              'text-slate-500': trend === 'stable'
            }"
          >
            <span v-if="trend === 'up'">↑</span>
            <span v-else-if="trend === 'down'">↓</span>
            <span v-else>→</span>
            {{ trendValue }}
          </span>
          <span class="text-slate-400">较昨日</span>
        </div>
      </div>
      <div
        v-if="icon"
        class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
        :class="colorClass"
      >
        {{ icon }}
      </div>
    </div>
  </div>
</template>
