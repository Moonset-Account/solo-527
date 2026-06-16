<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
  label: string
}>()

const variantClasses = computed(() => {
  const map: Record<string, string> = {
    success: 'bg-mint/10 text-mint border-mint/20',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    danger: 'bg-coral/10 text-coral border-coral/20',
    info: 'bg-rosegold/10 text-rosegold border-rosegold/20',
    default: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return map[props.variant || 'default']
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border',
      variantClasses,
    ]"
  >
    {{ label }}
  </span>
</template>
