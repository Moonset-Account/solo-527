<template>
  <div class="space-y-0">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="relative flex gap-4 pb-6"
    >
      <div class="flex flex-col items-center">
        <div
          :class="[
            'h-3 w-3 rounded-full border-2',
            i === 0 ? 'border-accent bg-accent' : 'border-brand/30 bg-white',
          ]"
        />
        <div
          v-if="i < items.length - 1"
          class="w-px flex-1 bg-brand/20"
        />
      </div>
      <div class="min-w-0 flex-1">
        <div class="text-sm font-medium text-bark">{{ item.action }}</div>
        <div class="mt-0.5 text-xs text-bark/50">
          {{ item.operator }} · {{ formatDateTime(item.timestamp) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDateTime } from '@/lib/utils'

defineProps<{
  items: { action: string; operator: string; timestamp: string }[]
}>()
</script>
