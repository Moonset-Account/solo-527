<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-slate-400">
    <Inbox class="w-12 h-12 mb-3" />
    <p class="text-sm">{{ text || '暂无数据' }}</p>
  </div>
</template>
