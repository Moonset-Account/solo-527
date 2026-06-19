<template>
  <a-tag :color="tagColor">{{ displayText }}</a-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  type?: 'lead' | 'appointment' | 'quality' | 'exception' | 'followup'
}>()

const statusMap: Record<string, Record<string, { color: string; text: string }>> = {
  lead: {
    pending: { color: 'default', text: '待分配' },
    assigned: { color: 'blue', text: '已分配' },
    following: { color: 'processing', text: '跟进中' },
    converted: { color: 'success', text: '已转化' },
    lost: { color: 'error', text: '已流失' },
  },
  appointment: {
    pending: { color: 'default', text: '待确认' },
    confirmed: { color: 'blue', text: '已确认' },
    completed: { color: 'success', text: '已完成' },
    cancelled: { color: 'default', text: '已取消' },
    no_show: { color: 'warning', text: '未到店' },
  },
  quality: {
    pending: { color: 'default', text: '待检测' },
    inspecting: { color: 'processing', text: '检测中' },
    repairing: { color: 'orange', text: '维修中' },
    completed: { color: 'success', text: '已完成' },
    exception: { color: 'red', text: '异常' },
    passed: { color: 'success', text: '已通过' },
    failed: { color: 'error', text: '未通过' },
    repaired: { color: 'warning', text: '已返修' },
  },
  exception: {
    pending: { color: 'default', text: '待处理' },
    processing: { color: 'processing', text: '处理中' },
    resolved: { color: 'success', text: '已解决' },
    closed: { color: 'default', text: '已关闭' },
  },
  followup: {
    pending: { color: 'processing', text: '待回访' },
    completed: { color: 'success', text: '已完成' },
    cancelled: { color: 'default', text: '已取消' },
    no_answer: { color: 'warning', text: '未接通' },
  },
}

const tagColor = computed(() => {
  const map = statusMap[props.type || 'lead']
  return map[props.status]?.color || 'default'
})

const displayText = computed(() => {
  const map = statusMap[props.type || 'lead']
  return map[props.status]?.text || props.status
})
</script>
