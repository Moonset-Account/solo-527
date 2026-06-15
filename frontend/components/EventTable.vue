<template>
  <NCard title="最近事件" style="margin-bottom: 24px">
    <template #header-extra>
      <NButton text type="primary" @click="$router.push('/events')">查看全部</NButton>
    </template>
    <NDataTable :columns="columns" :data="events" :bordered="false" :pagination="false" size="small" />
  </NCard>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NCard, NDataTable, NButton, NTag } from 'naive-ui'
import { useRouter } from '#app'

const props = defineProps<{ events: any[] }>()
const router = useRouter()

const statusMap: Record<string, { label: string; type: any }> = {
  pending: { label: '待整改', type: 'info' },
  assigned: { label: '已指派', type: 'info' },
  rectifying: { label: '整改中', type: 'warning' },
  reviewing: { label: '复查中', type: 'success' },
  closed: { label: '已闭环', type: 'success' },
  rejected: { label: '已驳回', type: 'error' }
}

function isTimeout(event: any) {
  if (['closed'].includes(event.status)) return false
  if (!event.deadline) return false
  return new Date(event.deadline) < new Date()
}

const columns = [
  { title: '事件标题', key: 'title', ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: any) {
      const s = statusMap[row.status]
      return h(NTag, { type: s?.type || 'default', size: 'small', round: true }, { default: () => s?.label || row.status })
    }
  },
  { title: '上报人', key: 'reporter', width: 80 },
  {
    title: '上报时间',
    key: 'created_at',
    width: 160,
    render(row: any) {
      return new Date(row.created_at).toLocaleString('zh-CN')
    }
  },
  {
    title: '超时',
    key: 'timeout',
    width: 70,
    render(row: any) {
      return isTimeout(row) ? h('span', { style: 'color: #ed8936; font-weight: 700' }, '⚠ 超时') : ''
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render(row: any) {
      return h(NButton, { text: true, type: 'primary', onClick: () => router.push(`/events/${row.id}`) }, { default: () => '详情' })
    }
  }
]
</script>
