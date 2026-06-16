<template>
  <div :class="['card flex items-start gap-4 border-l-4', borderClass]">
    <div :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBgClass]">
      <AlertTriangle v-if="level === 'warning'" class="w-5 h-5" />
      <AlertOctagon v-else class="w-5 h-5" />
    </div>
    <div class="flex-1 min-w-0">
      <h4 class="text-sm font-semibold text-gray-900">{{ title }}</h4>
      <p class="mt-1 text-sm text-gray-600">{{ message }}</p>
      <p v-if="timestamp" class="mt-2 text-xs text-gray-400">{{ timestamp }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, AlertOctagon } from 'lucide-vue-next'

const props = defineProps<{
  level: 'warning' | 'critical'
  title: string
  message: string
  timestamp?: string
}>()

const borderClass = computed(() =>
  props.level === 'warning' ? 'border-warning' : 'border-danger'
)

const iconBgClass = computed(() =>
  props.level === 'warning' ? 'bg-amber-100 text-warning' : 'bg-red-100 text-danger'
)
</script>
