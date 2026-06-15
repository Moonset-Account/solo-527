<template>
  <NTimeline>
    <NTimelineItem
      v-for="log in logs"
      :key="log.id"
      :type="timelineType(log.to_status)"
      :title="log.action"
    >
      <template #header>
        <div style="display: flex; align-items: center; gap: 8px">
          <span style="font-weight: 500">{{ log.action }}</span>
          <NTag :type="statusTagType(log.to_status)" size="small" round>{{ statusLabel(log.to_status) }}</NTag>
        </div>
      </template>
      <div style="color: #718096; font-size: 13px">
        <div>{{ log.comment }}</div>
        <div style="margin-top: 4px">
          <span>操作人：{{ log.operator }}</span>
          <span style="margin-left: 16px">{{ formatTime(log.created_at) }}</span>
        </div>
      </div>
    </NTimelineItem>
  </NTimeline>
</template>

<script setup lang="ts">
import { NTimeline, NTimelineItem, NTag } from 'naive-ui'

defineProps<{ logs: any[] }>()

const statusMap: Record<string, { label: string; tagType: any; timelineType: any }> = {
  pending: { label: '待整改', tagType: 'info', timelineType: 'default' },
  assigned: { label: '已指派', tagType: 'info', timelineType: 'info' },
  rectifying: { label: '整改中', tagType: 'warning', timelineType: 'warning' },
  reviewing: { label: '复查中', tagType: 'success', timelineType: 'success' },
  closed: { label: '已闭环', tagType: 'success', timelineType: 'success' },
  rejected: { label: '已驳回', tagType: 'error', timelineType: 'error' }
}

const statusLabel = (s: string) => statusMap[s]?.label || s
const statusTagType = (s: string) => statusMap[s]?.tagType || 'default'
const timelineType = (s: string) => statusMap[s]?.timelineType || 'default'

const formatTime = (t: string) => new Date(t).toLocaleString('zh-CN')
</script>
