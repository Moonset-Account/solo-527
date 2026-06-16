<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <component :is="iconComponent" class="w-8 h-8 text-gray-400" />
    </div>
    <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-sm text-gray-500 max-w-sm">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Inbox } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  description?: string
  icon?: any
}>()

const iconComponent = computed(() => props.icon ?? Inbox)
</script>
