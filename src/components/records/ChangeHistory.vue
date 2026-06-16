<script setup lang="ts">
import type { ChangeLog } from '@/types'

defineProps<{ changes: ChangeLog[] }>()

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="relative">
    <div class="absolute left-4 top-0 bottom-0 w-px bg-rosegold/10" />
    <div class="space-y-6">
      <div
        v-for="(change, idx) in changes"
        :key="change.id"
        class="relative pl-10"
      >
        <div
          :class="[
            'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center',
            idx === 0 ? 'bg-rosegold border-rosegold' : 'bg-white border-rosegold/30',
          ]"
        >
          <div v-if="idx === 0" class="w-1.5 h-1.5 rounded-full bg-white" />
        </div>
        <div class="bg-warmwhite rounded-lg p-3 border border-rosegold/10">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-medium text-rosegold">{{ change.changedBy }}</span>
            <span class="text-xs text-grayrose/40">{{ formatTime(change.changedAt) }}</span>
          </div>
          <p class="text-sm text-gray-800">
            修改了 <span class="font-medium text-rosegold">{{ change.field }}</span>
          </p>
          <div class="flex items-center gap-2 mt-1 text-xs">
            <span class="text-grayrose/50 line-through">{{ change.oldValue || '空' }}</span>
            <span class="text-grayrose/30">→</span>
            <span class="text-mint font-medium">{{ change.newValue }}</span>
          </div>
        </div>
      </div>
      <div v-if="changes.length === 0" class="pl-10 text-center py-8 text-sm text-grayrose/50">
        暂无变更记录
      </div>
    </div>
  </div>
</template>
