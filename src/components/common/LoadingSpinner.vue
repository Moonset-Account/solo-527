<script setup lang="ts">
defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div class="flex items-center justify-center py-12">
    <div
      :class="[
        'animate-spin rounded-full border-2 border-rosegold/20 border-t-rosegold',
        size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7',
      ]"
    />
  </div>
</template>
