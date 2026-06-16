<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 rounded-full bg-rosegold/5 flex items-center justify-center mb-4">
      <Inbox class="w-8 h-8 text-rosegold/30" />
    </div>
    <h3 v-if="title" class="text-base font-medium text-gray-700">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-sm text-grayrose/60">{{ description }}</p>
    <slot />
  </div>
</template>
