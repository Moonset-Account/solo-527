<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  max?: number
  label?: string
}>()

const max = computed(() => props.max || 100)
const percentage = computed(() => Math.min(100, Math.max(0, (props.score / max.value) * 100)))

const colorClass = computed(() => {
  if (percentage.value >= 70) return 'bg-emerald-500'
  if (percentage.value >= 40) return 'bg-amber-500'
  return 'bg-red-500'
})

const textColor = computed(() => {
  if (percentage.value >= 70) return 'text-emerald-600'
  if (percentage.value >= 40) return 'text-amber-600'
  return 'text-red-600'
})
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="colorClass"
        :style="{ width: `${percentage}%` }"
      />
    </div>
    <span class="text-xs font-medium min-w-[3rem] text-right" :class="textColor">
      {{ label || `${score}` }}
    </span>
  </div>
</template>
