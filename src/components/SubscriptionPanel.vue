<template>
  <div class="card">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-semibold">订阅提醒</h3>
      <span class="badge-accent">{{ subscriptions.length }}</span>
    </div>
    <div class="max-h-64 overflow-y-auto space-y-2">
      <div
        v-for="sub in subscriptions"
        :key="sub.id"
        class="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-surface/50 transition-colors"
        :class="{ 'opacity-50 line-through': sub.isHandled }"
        @click="toggleSubscription(sub.id)"
      >
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{{ sub.name }}</div>
          <div class="text-xs text-base-400">{{ sub.account }}</div>
        </div>
        <div class="flex items-center gap-2 ml-3 shrink-0">
          <span class="text-sm font-medium">¥{{ sub.amount.toFixed(2) }}</span>
          <span
            class="badge-sm"
            :class="daysBadgeClass(sub.nextBillDate)"
          >
            {{ daysUntilText(sub.nextBillDate) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'
import type { Subscription } from '@/types'

const dataStore = useDataStore()
const subscriptions = computed(() => dataStore.subscriptions)
const toggleSubscription = dataStore.toggleSubscription

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function daysUntilText(dateStr: string): string {
  const d = daysUntil(dateStr)
  if (d <= 0) return '已到期'
  return `${d}天`
}

function daysBadgeClass(dateStr: string): string {
  const d = daysUntil(dateStr)
  if (d < 3) return 'badge-danger'
  if (d <= 7) return 'badge-warn'
  return 'badge-accent'
}
</script>
