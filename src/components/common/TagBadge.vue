<script setup lang="ts">
const props = defineProps<{
  text: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'sm' | 'md'
}>()

const variantClasses: Record<string, string> = {
  default: 'bg-survey-surface-hover text-survey-text-secondary border-survey-border',
  success: 'bg-survey-success/10 text-survey-success border-survey-success/30',
  warning: 'bg-survey-warning/10 text-survey-warning border-survey-warning/30',
  danger: 'bg-survey-danger/10 text-survey-danger border-survey-danger/30',
  info: 'bg-survey-info/10 text-survey-info border-survey-info/30',
  primary: 'bg-survey-primary/10 text-survey-primary border-survey-primary/30',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
}
</script>

<template>
  <span
    class="inline-flex items-center border rounded font-medium"
    :class="[variantClasses[variant || 'default'], sizeClasses[size || 'sm']]"
  >
    {{ text }}
  </span>
</template>
