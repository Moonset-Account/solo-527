<template>
  <div class="flex flex-col items-center justify-center py-16 text-bark/40">
    <component :is="icon" :size="48" class="mb-3 opacity-40" />
    <p class="text-sm">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'
import type { Component } from 'vue'

withDefaults(defineProps<{
  message?: string
  icon?: Component
}>(), {
  message: '暂无数据',
  icon: Inbox,
})
</script>
