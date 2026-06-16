<template>
  <span :class="badgeClass">{{ displayLabel }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  type: 'appointment' | 'payment' | 'task' | 'priority'
}>()

const appointmentMap: Record<string, { label: string; class: string }> = {
  pending: { label: '待确认', class: 'badge-pending' },
  confirmed: { label: '已确认', class: 'badge-confirmed' },
  'in-progress': { label: '进行中', class: 'badge-in-progress' },
  completed: { label: '已完成', class: 'badge-completed' },
  cancelled: { label: '已取消', class: 'badge-cancelled' },
}

const paymentMap: Record<string, { label: string; class: string }> = {
  pending: { label: '待支付', class: 'badge-pending' },
  paid: { label: '已支付', class: 'badge-paid' },
  refunded: { label: '已退款', class: 'badge-refunded' },
  failed: { label: '支付失败', class: 'badge-cancelled' },
}

const taskMap: Record<string, { label: string; class: string }> = {
  pending: { label: '待处理', class: 'badge-pending' },
  'in-progress': { label: '处理中', class: 'badge-in-progress' },
  completed: { label: '已完成', class: 'badge-completed' },
  cancelled: { label: '已取消', class: 'badge-cancelled' },
}

const priorityMap: Record<string, { label: string; class: string }> = {
  low: { label: '低', class: 'badge bg-gray-100 text-gray-700' },
  medium: { label: '中', class: 'badge bg-blue-100 text-blue-700' },
  high: { label: '高', class: 'badge bg-amber-100 text-amber-700' },
  urgent: { label: '紧急', class: 'badge bg-red-100 text-red-700' },
}

const statusMaps = {
  appointment: appointmentMap,
  payment: paymentMap,
  task: taskMap,
  priority: priorityMap,
}

const badgeClass = computed(() => {
  const map = statusMaps[props.type]
  const entry = map[props.status]
  return entry ? entry.class : 'badge bg-gray-100 text-gray-700'
})

const displayLabel = computed(() => {
  const map = statusMaps[props.type]
  const entry = map[props.status]
  return entry ? entry.label : props.status
})
</script>
