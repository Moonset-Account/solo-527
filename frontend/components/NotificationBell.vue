<template>
  <NPopover trigger="click" placement="bottom-end" :width="360">
    <template #trigger>
      <NBadge :value="notificationStore.unreadCount" :max="99">
        <NButton quaternary circle>
          <template #icon>
            <span style="font-size: 18px">🔔</span>
          </template>
        </NButton>
      </NBadge>
    </template>
    <div style="max-height: 400px; overflow-y: auto">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0">
        <span style="font-weight: 600; color: #1a365d">通知</span>
        <NButton text size="small" type="primary" @click="handleMarkAllRead">全部已读</NButton>
      </div>
      <div v-if="!notificationStore.notifications.length" style="text-align: center; padding: 24px; color: #a0aec0">
        暂无通知
      </div>
      <div
        v-for="n in notificationStore.notifications"
        :key="n.id"
        style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer"
        :style="{ background: n.read ? 'transparent' : '#f0f7ff' }"
        @click="handleClick(n)"
      >
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px">
          <span style="font-size: 14px">{{ typeIcon(n.type) }}</span>
          <span style="font-size: 13px; font-weight: 500; color: #2d3748">{{ n.title || n.type }}</span>
          <span v-if="!n.read" style="width: 6px; height: 6px; border-radius: 50%; background: #ed8936; display: inline-block" />
        </div>
        <div style="font-size: 12px; color: #718096; padding-left: 22px">
          {{ n.content || n.message }}
        </div>
        <div style="font-size: 11px; color: #a0aec0; padding-left: 22px; margin-top: 2px">
          {{ formatTime(n.created_at) }}
        </div>
      </div>
    </div>
  </NPopover>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { NBadge, NButton, NPopover, useMessage } from 'naive-ui'

const notificationStore = useNotificationStore()
const message = useMessage()

onMounted(async () => {
  await notificationStore.fetchNotifications()
})

const typeIcon = (type: string) => {
  const map: Record<string, string> = {
    warning: '⚠️',
    error: '🔴',
    success: '✅',
    info: 'ℹ️',
    timeout: '⏰',
    duplicate: '🔄',
  }
  return map[type] || 'ℹ️'
}

const formatTime = (t: string) => t ? new Date(t).toLocaleString('zh-CN') : ''

const handleClick = async (n: any) => {
  if (!n.read) {
    await notificationStore.markRead(n.id)
  }
}

const handleMarkAllRead = async () => {
  await notificationStore.markAllRead()
  message.success('已全部标为已读')
}
</script>
