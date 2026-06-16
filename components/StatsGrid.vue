<template>
  <div class="grid grid-cols-4 gap-6 mb-8">
    <div v-for="stat in stats" :key="stat.label" class="card">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500 mb-1">{{ stat.label }}</p>
          <p class="text-3xl font-bold text-gray-800">{{ stat.value }}</p>
          <p v-if="stat.sub" class="text-xs text-gray-400 mt-1">{{ stat.sub }}</p>
        </div>
        <div :class="['w-12 h-12 rounded-xl flex items-center justify-center text-2xl', stat.bg]">
          {{ stat.icon }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stats: Array<{
    label: string
    value: string | number
    icon: string
    bg: string
    sub?: string
  }>
}>()
</script>
