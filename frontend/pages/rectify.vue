<template>
  <div>
    <NCard style="margin-bottom: 16px">
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap">
        <NSelect
          v-model:value="statusFilter"
          :options="statusOptions"
          placeholder="状态筛选"
          clearable
          style="width: 140px"
          @update:value="loadEvents"
        />
        <NInput
          v-model:value="keyword"
          placeholder="搜索事件标题"
          clearable
          style="width: 240px"
          @keyup.enter="loadEvents"
        />
        <NButton type="primary" @click="loadEvents">查询</NButton>
      </div>
    </NCard>

    <NGrid :cols="1" :x-gap="16" :y-gap="12">
      <NGridItem v-for="event in events" :key="event.id">
        <NCard hoverable style="cursor: pointer" @click="$router.push(`/events/${event.id}`)">
          <div style="display: flex; justify-content: space-between; align-items: center">
            <div style="flex: 1">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px">
                <span style="font-size: 15px; font-weight: 600; color: #1a365d">{{ event.title }}</span>
                <NTag :type="statusMap[event.status]?.type || 'default'" size="small" round>
                  {{ statusMap[event.status]?.label || event.status }}
                </NTag>
                <NTag v-if="isTimeout(event)" type="error" size="small" round>⚠ 超时</NTag>
                <NTag v-if="event.is_duplicate" type="warning" size="small" round>重复</NTag>
              </div>
              <div style="font-size: 13px; color: #718096">
                <span>{{ event.address || event.location || '-' }}</span>
                <span style="margin: 0 12px">|</span>
                <span>上报人：{{ event.reporter || '-' }}</span>
                <span style="margin: 0 12px">|</span>
                <span>{{ formatTime(event.created_at) }}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px">
              <NButton
                v-if="event.status === 'pending'"
                size="small"
                type="primary"
                @click.stop="openAssign(event)"
              >
                指派
              </NButton>
              <NButton
                v-if="event.status === 'rectifying'"
                size="small"
                type="info"
                @click.stop="handleReview(event, 'reviewing')"
              >
                提交复查
              </NButton>
              <NButton
                v-if="event.status === 'reviewing'"
                size="small"
                type="success"
                @click.stop="handleReview(event, 'closed')"
              >
                通过
              </NButton>
              <NButton
                v-if="event.status === 'reviewing'"
                size="small"
                type="error"
                @click.stop="handleReview(event, 'rejected')"
              >
                驳回
              </NButton>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <div v-if="!events.length" style="text-align: center; padding: 60px; color: #a0aec0">
      暂无待处理事件
    </div>

    <NDrawer v-model:show="showAssign" :width="400">
      <NDrawerContent title="指派处理人">
        <NForm label-placement="left" label-width="80">
          <NFormItem label="处理人">
            <NSelect v-model:value="assignForm.assignee" :options="userOptions" placeholder="请选择处理人" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NButton type="primary" @click="confirmAssign" :loading="assigning">确认指派</NButton>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NCard, NGrid, NGridItem, NTag, NButton, NSelect, NInput, NDrawer, NDrawerContent, NForm, NFormItem, useMessage } from 'naive-ui'

const api = useApi()
const message = useMessage()

const events = ref<any[]>([])
const statusFilter = ref<string | null>(null)
const keyword = ref('')
const showAssign = ref(false)
const assigning = ref(false)
const currentEvent = ref<any>(null)
const assignForm = ref({ assignee: null as string | null })
const userOptions = ref<{ label: string; value: string }[]>([])

const statusOptions = [
  { label: '待整改', value: 'pending' },
  { label: '已指派', value: 'assigned' },
  { label: '整改中', value: 'rectifying' },
  { label: '复查中', value: 'reviewing' },
  { label: '已闭环', value: 'closed' },
  { label: '已驳回', value: 'rejected' },
]

const statusMap: Record<string, { label: string; type: any }> = {
  pending: { label: '待整改', type: 'info' },
  assigned: { label: '已指派', type: 'info' },
  rectifying: { label: '整改中', type: 'warning' },
  reviewing: { label: '复查中', type: 'success' },
  closed: { label: '已闭环', type: 'success' },
  rejected: { label: '已驳回', type: 'error' },
}

const formatTime = (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-'
const isTimeout = (event: any) => {
  if (['closed'].includes(event.status)) return false
  if (!event.deadline) return false
  return new Date(event.deadline) < new Date()
}

const loadEvents = async () => {
  const params: any = {}
  if (statusFilter.value) params.status = statusFilter.value
  if (keyword.value) params.keyword = keyword.value
  const result = await api.getEvents(params)
  events.value = result.items || []
}

onMounted(async () => {
  const users = await api.getUsers()
  userOptions.value = users.map((u: any) => ({ label: u.name, value: u.id }))
  await loadEvents()
})

const openAssign = (event: any) => {
  currentEvent.value = event
  assignForm.value.assignee = null
  showAssign.value = true
}

const confirmAssign = async () => {
  if (!assignForm.value.assignee) {
    message.warning('请选择处理人')
    return
  }
  assigning.value = true
  try {
    await api.assignEvent(currentEvent.value.id, assignForm.value.assignee)
    message.success('指派成功')
    showAssign.value = false
    await loadEvents()
  } catch {
    message.error('指派失败')
  } finally {
    assigning.value = false
  }
}

const handleReview = async (event: any, newStatus: string) => {
  const commentMap: Record<string, string> = {
    reviewing: '提交复查',
    closed: '复查通过，事件闭环',
    rejected: '复查不通过，需重新整改',
  }
  await api.changeStatus(event.id, newStatus, commentMap[newStatus])
  if (newStatus === 'closed') message.success('复查通过，事件已闭环')
  else if (newStatus === 'rejected') message.error('复查不通过，已退回整改')
  else message.success('已提交复查')
  await loadEvents()
}
</script>
