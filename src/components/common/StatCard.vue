<template>
  <div class="card flex items-center gap-4">
    <div
      :class="[
        'flex h-12 w-12 items-center justify-center rounded-btn',
        iconBg,
      ]"
    >
      <component :is="icon" :size="22" :class="iconColor" />
    </div>
    <div>
      <div class="text-sm text-bark/60">{{ label }}</div>
      <div class="text-xl font-bold text-bark">{{ displayValue }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  icon: Component
  iconBg?: string
  iconColor?: string
}>()

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString('zh-CN')
  }
  return props.value
})
</script>
