<script setup lang="ts">
import type { Component } from 'vue'
import { Frown } from 'lucide-vue-next'

interface Props {
  icon?: Component
  title?: string
  description?: string
  actionText?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: Frown,
  title: '暂无数据',
  description: '',
  actionText: '',
})

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4">
    <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
      <component :is="icon" class="w-10 h-10 text-gray-400" />
    </div>
    <h3 class="text-lg font-medium text-gray-900 mb-2">{{ title }}</h3>
    <p v-if="description" class="text-sm text-gray-500 text-center max-w-sm mb-6">
      {{ description }}
    </p>
    <button
      v-if="actionText"
      @click="emit('action')"
      class="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
    >
      {{ actionText }}
    </button>
  </div>
</template>
