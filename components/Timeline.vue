<template>
  <div v-if="logs?.length" class="space-y-0">
    <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
      <span class="w-1 h-4 bg-primary-500 rounded"></span>操作时间线
      <span class="text-xs text-gray-400 font-normal">共 {{ logs.length }} 条</span>
    </h4>
    <div class="pl-1">
      <div v-for="l in logs" :key="l.id" class="timeline-item">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-gray-800">{{ l.action }}</span>
          <span class="text-xs text-gray-400">{{ fmtDateTime(l.createdAt) }}</span>
        </div>
        <div class="mt-1 text-xs text-gray-500 flex items-center gap-3">
          <span>👤 {{ l.operator }}</span>
        </div>
        <div v-if="l.detail" class="mt-1.5 text-xs text-gray-600 bg-gray-50 rounded p-2 whitespace-pre-wrap break-all">
          {{ l.detail }}
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center py-6 text-sm text-gray-400">暂无操作记录</div>
</template>

<script setup lang="ts">
import type { OperationLog } from '~/types'
defineProps<{ logs?: OperationLog[] | null }>()
</script>
