<script setup lang="ts">
defineProps<{
  title?: string
  className?: string
}>()
</script>

<template>
  <div
    class="bg-survey-surface border border-survey-border rounded-lg overflow-hidden card-hover"
    :class="className"
  >
    <div v-if="title" class="px-5 py-4 border-b border-survey-border flex items-center justify-between">
      <h3 class="text-sm font-semibold text-survey-text-primary">{{ title }}</h3>
      <slot name="header-actions"></slot>
    </div>
    <div class="p-5">
      <slot></slot>
    </div>
  </div>
</template>
