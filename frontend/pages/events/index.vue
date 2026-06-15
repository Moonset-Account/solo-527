<template>
  <div>
    <NCard style="margin-bottom: 16px">
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap">
        <NSelect
          v-model:value="eventStore.filters.status"
          :options="statusOptions"
          placeholder="状态筛选"
          clearable
          style="width: 140px"
          @update:value="handleFilter"
        />
        <NSelect
          v-model:value="eventStore.filters.event_type"
          :options="eventTypeOptions"
          placeholder="类型筛选"
          clearable
          style="width: 140px"
          @update:value="handleFilter"
        />
        <NInput
          v-model:value="eventStore.filters.keyword"
          placeholder="搜索事件标题"
          clearable
          style="width: 240px"
          @keyup.enter="handleFilter"
        />
        <NButton type="primary" @click="handleFilter">查询</NButton>
        <div style="flex: 1" />
        <NButton type="primary" @click="$router.push('/events/new')">+ 上报事件</NButton>
      </div>
    </NCard>
    <NCard>
      <NDataTable
        :columns="columns"
        :data="eventStore.events"
        :loading="eventStore.loading"
        :bordered="false"
        :pagination="pagination"
        :row-key="(row: any) => row.id"
        @update:page="handlePageChange"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, ref, computed } from 'vue'
import { NCard, NSelect, NInput, NButton, NDataTable, NTag, useMessage } from 'naive-ui'

const eventStore = useEventStore()
const api = useApi()
const router = useRouter()
const message = useMessage()

const statusOptions = [
  { label: '待整改', value: 'pending' },
  { label: '已指派', value: 'assigned' },
  { label: '整改中', value: 'rectifying' },
  { label: '复查中', value: 'reviewing' },
  { label: '已闭环', value: 'closed' },
  { label: '已驳回', value: 'rejected' },
]

const eventTypeOptions = ref<{ label: string; value: string }[]>([])

onMounted(async () => {
  const items = await api.getDictItems('event_type')
  eventTypeOptions.value = items.map((i: any) => ({ label: i.label, value: i.key || i.value }))
  await eventStore.fetchEvents()
})

const pagination = computed(() => ({
  page: eventStore.filters.page,
  pageSize: eventStore.filters.page_size,
  itemCount: eventStore.total,
  showSizePicker: false,
}))

const statusMap: Record<string, { label: string; type: any }> = {
  pending: { label: '待整改', type: 'info' },
  assigned: { label: '已指派', type: 'info' },
  rectifying: { label: '整改中', type: 'warning' },
  reviewing: { label: '复查中', type: 'success' },
  closed: { label: '已闭环', type: 'success' },
  rejected: { label: '已驳回', type: 'error' },
}

function isTimeout(event: any) {
  if (['closed'].includes(event.status)) return false
  if (!event.deadline) return false
  return new Date(event.deadline) < new Date()
}

const columns = [
  { title: '事件标题', key: 'title', ellipsis: { tooltip: true } },
  {
    title: '类型', key: 'event_type', width: 100,
    render(row: any) {
      const opt = eventTypeOptions.value.find((o: any) => o.value === row.event_type)
      return opt?.label || row.event_type
    }
  },
  {
    title: '状态', key: 'status', width: 100,
    render(row: any) {
      const s = statusMap[row.status]
      return h(NTag, { type: s?.type || 'default', size: 'small', round: true }, { default: () => s?.label || row.status })
    }
  },
  {
    title: '位置', key: 'location', width: 160, ellipsis: { tooltip: true },
    render(row: any) { return row.address || row.location || '-' }
  },
  {
    title: '上报人', key: 'reporter', width: 80,
    render(row: any) { return row.reporter || '-' }
  },
  {
    title: '上报时间', key: 'created_at', width: 160,
    render(row: any) {
      return row.created_at ? new Date(row.created_at).toLocaleString('zh-CN') : '-'
    }
  },
  {
    title: '超时', key: 'timeout', width: 70,
    render(row: any) {
      return isTimeout(row) ? h('span', { style: 'color: #ed8936; font-weight: 700' }, '⚠ 超时') : ''
    }
  },
  {
    title: '操作', key: 'actions', width: 120,
    render(row: any) {
      return h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, { text: true, type: 'primary', onClick: () => router.push(`/events/${row.id}`) }, { default: () => '详情' }),
      ])
    }
  },
]

const handleFilter = () => {
  eventStore.filters.page = 1
  eventStore.fetchEvents()
}

const handlePageChange = (page: number) => {
  eventStore.filters.page = page
  eventStore.fetchEvents()
}
</script>
