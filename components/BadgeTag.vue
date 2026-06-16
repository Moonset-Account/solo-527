<template>
  <div class="flex items-center gap-2">
    <span
      v-if="text"
      :class="['badge', colorClass || defaultColor]"
    >
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  text?: string
  colorClass?: string
}>(), {
  colorClass: ''
})
const defaultColor = computed(() => props.colorClass || 'bg-gray-100 text-gray-800')
</script>
