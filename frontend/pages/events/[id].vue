<template>
  <div v-if="event">
    <NPageHeader @back="$router.back()" style="margin-bottom: 16px">
      <template #title>
        <span style="font-size: 18px; color: #1a365d">{{ event.title }}</span>
      </template>
      <template #extra>
        <NTag :type="statusTagType(event.status)" round>{{ statusLabel(event.status) }}</NTag>
        <NTag v-if="event.is_duplicate" type="warning" round style="margin-left: 8px">重复上报</NTag>
      </template>
    </NPageHeader>

    <NGrid :cols="3" :x-gap="16" :y-gap="16">
      <NGridItem :span="2">
        <NCard title="事件信息" style="margin-bottom: 16px">
          <NDescriptions :column="2" label-placement="left" bordered>
            <NDescriptionsItem label="事件类型">{{ eventTypeLabel }}</NDescriptionsItem>
            <NDescriptionsItem label="上报人">{{ event.reporter || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="联系电话">{{ event.reporter_phone || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="上报时间">{{ formatTime(event.created_at) }}</NDescriptionsItem>
            <NDescriptionsItem label="处理人">{{ event.assigned_to || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="位置">{{ event.address || event.location || '-' }}</NDescriptionsItem>
            <NDescriptionsItem label="事件描述" :span="2">{{ event.description || '-' }}</NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <NCard title="流转记录" style="margin-bottom: 16px">
          <FlowTimeline :logs="flowLogs" />
        </NCard>

        <NCard v-if="event.photos && event.photos.length" title="现场照片">
          <div style="display: flex; gap: 12px; flex-wrap: wrap">
            <img
              v-for="(photo, idx) in event.photos"
              :key="idx"
              :src="typeof photo === 'string' ? photo : photo.url"
              style="width: 200px; height: 150px; object-fit: cover; border-radius: 6px; cursor: pointer"
              @click="previewPhoto(typeof photo === 'string' ? photo : photo.url)"
            />
          </div>
        </NCard>
      </NGridItem>

      <NGridItem :span="1">
        <NCard title="定位信息" style="margin-bottom: 16px">
          <MapPicker
            v-model:lng="event.lng"
            v-model:lat="event.lat"
            v-model:location="eventLocation"
          />
        </NCard>

        <NCard title="操作">
          <NSpace vertical>
            <NButton
              v-if="event.status === 'pending'"
              type="primary"
              block
              @click="showAssignDrawer = true"
            >
              指派处理人
            </NButton>
            <NButton
              v-if="event.status === 'assigned'"
              type="warning"
              block
              @click="handleRectify"
            >
              开始整改
            </NButton>
            <NButton
              v-if="event.status === 'rectifying'"
              type="info"
              block
              @click="handleSubmitReview"
            >
              提交复查
            </NButton>
            <NButton
              v-if="event.status === 'reviewing'"
              type="success"
              block
              @click="handleReviewPass"
            >
              复查通过
            </NButton>
            <NButton
              v-if="event.status === 'reviewing'"
              type="error"
              block
              @click="handleReviewReject"
            >
              复查不通过
            </NButton>
            <NAlert v-if="isTimeout" type="error" style="margin-top: 8px">
              该事件已超过整改时限，请尽快处理！
            </NAlert>
          </NSpace>
        </NCard>
      </NGridItem>
    </NGrid>

    <NDrawer v-model:show="showAssignDrawer" :width="400">
      <NDrawerContent title="指派处理人">
        <NForm label-placement="left" label-width="80">
          <NFormItem label="处理人">
            <NSelect v-model:value="assignForm.assignee" :options="userOptions" placeholder="请选择处理人" />
          </NFormItem>
          <NFormItem label="截止日期">
            <NDatePicker v-model:value="assignForm.deadline" type="datetime" style="width: 100%" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NButton type="primary" @click="handleAssign" :loading="assigning">确认指派</NButton>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
  <div v-else style="text-align: center; padding: 60px; color: #718096">
    <NSpinner v-if="loading" size="large" />
    <div v-else>事件不存在</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  NCard, NGrid, NGridItem, NDescriptions, NDescriptionsItem, NTag, NButton, NSpace,
  NAlert, NDrawer, NDrawerContent, NForm, NFormItem, NSelect, NDatePicker,
  NPageHeader, NSpinner, useMessage
} from 'naive-ui'
import FlowTimeline from '~/components/FlowTimeline.vue'
import MapPicker from '~/components/MapPicker.vue'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const api = useApi()

const event = ref<any>(null)
const flowLogs = ref<any[]>([])
const loading = ref(true)
const showAssignDrawer = ref(false)
const assigning = ref(false)
const assignForm = ref({ assignee: null as string | null, deadline: null as number | null })
const userOptions = ref<{ label: string; value: string }[]>([])

const statusMap: Record<string, { label: string; type: any }> = {
  pending: { label: '待整改', type: 'info' },
  assigned: { label: '已指派', type: 'info' },
  rectifying: { label: '整改中', type: 'warning' },
  reviewing: { label: '复查中', type: 'success' },
  closed: { label: '已闭环', type: 'success' },
  rejected: { label: '已驳回', type: 'error' },
}
const statusLabel = (s: string) => statusMap[s]?.label || s
const statusTagType = (s: string) => statusMap[s]?.type || 'default'
const formatTime = (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-'

const isTimeout = computed(() => {
  if (!event.value) return false
  if (['closed'].includes(event.value.status)) return false
  if (!event.value.deadline) return false
  return new Date(event.value.deadline) < new Date()
})

const eventTypeLabel = computed(() => event.value?.event_type || '-')

const eventLocation = computed({
  get: () => event.value?.address || event.value?.location || '',
  set: (val: string) => { if (event.value) event.value.location = val }
})

onMounted(async () => {
  const id = route.params.id as string
  const data = await api.getEvent(id)
  event.value = data
  const logs = await api.getFlowLogs(id)
  flowLogs.value = logs
  const users = await api.getUsers()
  userOptions.value = users.map((u: any) => ({ label: u.name, value: u.id }))
  loading.value = false
})

const refreshData = async () => {
  const id = route.params.id as string
  event.value = await api.getEvent(id)
  flowLogs.value = await api.getFlowLogs(id)
}

const handleAssign = async () => {
  if (!assignForm.value.assignee) {
    message.warning('请选择处理人')
    return
  }
  assigning.value = true
  try {
    const id = route.params.id as string
    await api.assignEvent(id, assignForm.value.assignee)
    message.success('指派成功')
    showAssignDrawer.value = false
    await refreshData()
  } catch {
    message.error('指派失败')
  } finally {
    assigning.value = false
  }
}

const handleRectify = async () => {
  const id = route.params.id as string
  await api.changeStatus(id, 'rectifying', '开始整改')
  message.success('已开始整改')
  await refreshData()
}

const handleSubmitReview = async () => {
  const id = route.params.id as string
  await api.changeStatus(id, 'reviewing', '提交复查')
  message.success('已提交复查')
  await refreshData()
}

const handleReviewPass = async () => {
  const id = route.params.id as string
  await api.changeStatus(id, 'closed', '复查通过，事件闭环')
  message.success('复查通过，事件已闭环')
  await refreshData()
}

const handleReviewReject = async () => {
  const id = route.params.id as string
  await api.changeStatus(id, 'rectifying', '复查不通过，需重新整改')
  message.error('复查不通过，已退回整改')
  await refreshData()
}

const previewPhoto = (url: string) => {
  window.open(url, '_blank')
}
</script>
