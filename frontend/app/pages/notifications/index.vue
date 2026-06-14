<template>
  <div>
    <n-space justify="space-between" align="center" style="margin-bottom: 16px">
      <n-space>
        <n-select v-model:value="unreadFilter" placeholder="筛选状态" :options="filterOptions" style="width: 140px" @update:value="loadData" />
      </n-space>
      <n-space>
        <n-tag v-if="store.unreadCount > 0" type="error">{{ store.unreadCount }} 条未读</n-tag>
        <n-button 
          type="primary" 
          :disabled="store.unreadCount === 0" 
          @click="handleMarkAllRead"
        >
          全部标为已读
        </n-button>
      </n-space>
    </n-space>

    <n-list bordered :loading="store.loading">
      <n-list-item 
        v-for="notification in store.notifications" 
        :key="notification.id"
        class="notification-item"
        :class="{ unread: !notification.is_read }"
        @click="handleClick(notification)"
      >
        <template #prefix>
          <n-icon :size="24" :color="getIconColor(notification.type)">
            <component :is="getIcon(notification.type)" />
          </n-icon>
        </template>
        <template #default>
          <div class="notification-content">
            <div class="notification-header">
              <n-space align="center">
                <n-tag :type="getTagType(notification.type)" size="small">
                  {{ getTypeLabel(notification.type) }}
                </n-tag>
                <n-text strong>{{ notification.title }}</n-text>
                <n-badge v-if="!notification.is_read" dot type="error" />
              </n-space>
            </div>
            <div class="notification-body">
              <n-text depth="3">{{ notification.content || '暂无详情' }}</n-text>
            </div>
            <div class="notification-footer">
              <n-text depth="3" style="font-size: 12px">{{ notification.created_at?.slice(0, 16) || '' }}</n-text>
            </div>
          </div>
        </template>
      </n-list-item>
    </n-list>

    <n-empty v-if="store.notifications.length === 0 && !store.loading" description="暂无通知" style="margin-top: 40px" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import {
  AlertCircleOutline,
  TimeOutline,
  CubeOutline,
  HappyOutline,
} from '@vicons/ionicons5'
import { useNotificationsStore } from '~/stores/notifications'
import type { Notification } from '~/types'

definePageMeta({
  layout: 'default',
})

const message = useMessage()
const dialog = useDialog()
const store = useNotificationsStore()
const unreadFilter = ref<boolean | undefined>(undefined)

const filterOptions = [
  { label: '全部', value: undefined },
  { label: '未读', value: false },
  { label: '已读', value: true },
]

const typeIcons: Record<string, any> = {
  inspection_due: AlertCircleOutline,
  delay_warning: TimeOutline,
  material_reminder: CubeOutline,
  satisfaction_reminder: HappyOutline,
  task_reminder: AlertCircleOutline,
  delay_reminder: TimeOutline,
  material_reminder_deprecated: CubeOutline,
  satisfaction_reminder_deprecated: HappyOutline,
}

const typeLabels: Record<string, string> = {
  inspection_due: '任务提醒',
  delay_warning: '延期提醒',
  material_reminder: '材料提醒',
  satisfaction_reminder: '满意度提醒',
  task_reminder: '任务提醒',
  delay_reminder: '延期提醒',
}

const typeTagColors: Record<string, string> = {
  inspection_due: 'warning',
  delay_warning: 'error',
  material_reminder: 'info',
  satisfaction_reminder: 'success',
  task_reminder: 'warning',
  delay_reminder: 'error',
}

const typeIconColors: Record<string, string> = {
  inspection_due: '#E8A838',
  delay_warning: '#FF4D4F',
  material_reminder: '#1B2A4A',
  satisfaction_reminder: '#36B37E',
  task_reminder: '#E8A838',
  delay_reminder: '#FF4D4F',
}

function getIcon(type: string) {
  return typeIcons[type] || AlertCircleOutline
}

function getTypeLabel(type: string) {
  return typeLabels[type] || type
}

function getTagType(type: string) {
  return typeTagColors[type] || 'default'
}

function getIconColor(type: string) {
  return typeIconColors[type] || '#8c8c8c'
}

async function loadData() {
  const params: any = { page: 1, page_size: 50 }
  if (unreadFilter.value !== undefined) {
    params.is_read = unreadFilter.value
  }
  await store.fetchList(params)
}

async function handleClick(notification: Notification) {
  if (!notification.is_read) {
    try {
      await store.markRead(notification.id)
      message.success('已标记为已读')
    } catch (e: any) {
      message.error(e?.data?.detail || '操作失败')
    }
  }
}

function handleMarkAllRead() {
  if (store.unreadCount === 0) return
  dialog.warning({
    title: '确认操作',
    content: `确定要将 ${store.unreadCount} 条未读通知全部标为已读吗？`,
    positiveText: '确认',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await store.markAllRead()
        message.success('已全部标为已读')
      } catch (e: any) {
        message.error(e?.data?.detail || '操作失败')
      }
    },
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.notification-item {
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f5f5f5;
}

.notification-item.unread {
  background: #f0f7ff;
}

.notification-item.unread:hover {
  background: #e6f0ff;
}

.notification-content {
  width: 100%;
}

.notification-header {
  margin-bottom: 4px;
}

.notification-body {
  margin-bottom: 4px;
}

.notification-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
