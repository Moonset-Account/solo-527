<script setup lang="ts">
import { computed } from 'vue'
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-vue-next'
import { useRemindersStore } from '@/stores/reminders'

const remindersStore = useRemindersStore()

const severityConfig: Record<string, { icon: any; color: string; bg: string; border: string; label: string }> = {
  high: { icon: AlertTriangle, color: 'text-coral', bg: 'bg-coral/5', border: 'border-coral/20', label: '紧急' },
  medium: { icon: Bell, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: '一般' },
  low: { icon: Info, color: 'text-mint', bg: 'bg-mint/5', border: 'border-mint/20', label: '提示' },
}

function markRead(id: string) {
  remindersStore.markAsRead(id)
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div
      v-for="(items, severity) in remindersStore.bySeverity"
      :key="severity"
      :class="['rounded-xl border p-5', severityConfig[severity]?.border, severityConfig[severity]?.bg]"
    >
      <div class="flex items-center gap-2 mb-4">
        <component :is="severityConfig[severity]?.icon" :class="['w-5 h-5', severityConfig[severity]?.color]" />
        <h3 :class="['text-sm font-medium', severityConfig[severity]?.color]">
          {{ severityConfig[severity]?.label }} ({{ items.length }})
        </h3>
      </div>
      <div class="space-y-3">
        <div
          v-for="item in items"
          :key="item.id"
          :class="[
            'p-3 rounded-lg bg-white border transition-colors',
            item.isRead ? 'border-rosegold/5 opacity-60' : 'border-rosegold/10',
          ]"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <p :class="['text-sm font-medium', item.isRead ? 'text-grayrose' : 'text-gray-800']">{{ item.title }}</p>
              <p class="text-xs text-grayrose/70 mt-1">{{ item.content }}</p>
              <p class="text-xs text-grayrose/40 mt-2">{{ item.createdAt }}</p>
            </div>
            <button
              v-if="!item.isRead"
              class="text-xs text-rosegold hover:text-rosegold/80 flex-shrink-0"
              @click="markRead(item.id)"
            >
              标记已读
            </button>
          </div>
        </div>
        <div v-if="items.length === 0" class="text-center py-6 text-sm text-grayrose/40">
          暂无{{ severityConfig[severity]?.label }}提醒
        </div>
      </div>
    </div>
  </div>
</template>
