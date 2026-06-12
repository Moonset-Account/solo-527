<template>
  <NSpace vertical :size="16">
    <NCard :title="`报修详情 #${id}`">
      <template #header-extra>
        <NButton @click="navigateTo('/repairs')">返回列表</NButton>
      </template>
      <NDescriptions bordered :column="2" v-if="repair">
        <NDescriptionsItem label="工单号">{{ repair.id }}</NDescriptionsItem>
        <NDescriptionsItem label="标题">{{ repair.title }}</NDescriptionsItem>
        <NDescriptionsItem label="类别">{{ repair.category }}</NDescriptionsItem>
        <NDescriptionsItem label="状态">
          <NTag :type="statusType(repair.status)" size="small">{{ statusLabel(repair.status) }}</NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="紧急程度">
          <NTag :type="urgencyType(repair.urgency)" size="small">{{ repair.urgency }}</NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="位置">{{ repair.location || '-' }}</NDescriptionsItem>
        <NDescriptionsItem label="宿舍房间">{{ repair.dorm_room }}</NDescriptionsItem>
        <NDescriptionsItem label="创建时间">{{ repair.created_at }}</NDescriptionsItem>
        <NDescriptionsItem label="描述" :span="2">{{ repair.description }}</NDescriptionsItem>
      </NDescriptions>
      <NSkeleton v-else text :repeat="5" />
    </NCard>

    <NCard title="附件列表">
      <NGrid :cols="3" :x-gap="12" :y-gap="12" v-if="attachments.length">
        <NGridItem v-for="att in attachments" :key="att.id">
          <NCard size="small" hoverable>
            <template v-if="att.file_type && att.file_type.startsWith('image/')">
              <img
                :src="`${apiBase}/${att.file_path}`"
                :alt="att.file_name"
                style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px"
              />
            </template>
            <NText style="display: block; margin-top: 8px; font-size: 14px">{{ att.file_name }}</NText>
            <NText depth="3" style="font-size: 12px">
              {{ att.file_size ? (att.file_size / 1024).toFixed(1) + ' KB' : '' }}
            </NText>
            <template #footer>
              <NSpace justify="end">
                <NButton size="small" tag="a" :href="`${apiBase}/${att.file_path}`" target="_blank">下载</NButton>
              </NSpace>
            </template>
          </NCard>
        </NGridItem>
      </NGrid>
      <NEmpty v-else description="暂无附件" />
    </NCard>

    <NCard title="审核记录">
      <NTimeline v-if="auditRecords.length">
        <NTimelineItem
          v-for="record in auditRecords"
          :key="record.id"
          :type="auditTimelineType(record.action)"
          :title="record.action"
        >
          <NText>{{ record.comment || '无备注' }}</NText>
          <template #footer>
            <NText depth="3" style="font-size: 12px">{{ record.created_at }} - {{ record.auditor_name || record.auditor }}</NText>
          </template>
        </NTimelineItem>
      </NTimeline>
      <NEmpty v-else description="暂无审核记录" />
    </NCard>

    <NCard title="操作历史">
      <NDataTable v-if="history.length" :columns="historyColumns" :data="history" :bordered="false" size="small" />
      <NEmpty v-else description="暂无操作历史" />
    </NCard>

    <NCard title="通知回执">
      <NDataTable v-if="notifications.length" :columns="notificationColumns" :data="notifications" :bordered="false" size="small" />
      <NEmpty v-else description="暂无通知回执" />
    </NCard>
  </NSpace>
</template>

<script setup lang="ts">
import {
  NCard, NSpace, NDescriptions, NDescriptionsItem, NTag, NButton, NText,
  NSkeleton, NTimeline, NTimelineItem, NDataTable, NEmpty, NGrid, NGridItem
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const route = useRoute()
const api = useApi()
const id = computed(() => route.params.id as string)

const repair = ref<any>(null)
const config = useRuntimeConfig()
const apiBase = config.public.API_BASE as string
const attachments = ref<any[]>([])
const auditRecords = ref<any[]>([])
const history = ref<any[]>([])
const notifications = ref<any[]>([])

const statusMap: Record<string, { label: string; type: 'default' | 'info' | 'success' | 'warning' | 'error' }> = {
  pending: { label: '待审核', type: 'info' },
  in_review: { label: '审核中', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'error' },
  in_progress: { label: '处理中', type: 'warning' },
  completed: { label: '已完成', type: 'success' },
  closed: { label: '已关闭', type: 'default' }
}

function statusLabel(status: string) {
  return statusMap[status]?.label || status
}

function statusType(status: string) {
  return statusMap[status]?.type || 'default'
}

function urgencyType(urgency: string) {
  if (urgency === '高') return 'error'
  if (urgency === '中') return 'warning'
  return 'default'
}

function auditTimelineType(action: string) {
  if (action === '通过' || action === 'approve' || action === '完成' || action === 'complete') return 'success'
  if (action === '驳回' || action === 'reject') return 'error'
  return 'info'
}

const historyColumns: DataTableColumns = [
  { title: '字段', key: 'field_name', width: 120 },
  { title: '旧值', key: 'old_value', width: 150 },
  { title: '新值', key: 'new_value', width: 150 },
  { title: '时间', key: 'created_at', width: 160 }
]

const notificationColumns: DataTableColumns = [
  { title: '通知方式', key: 'channel', width: 120 },
  { title: '接收状态', key: 'status', width: 100 },
  { title: '发送时间', key: 'sent_at', width: 160 },
  { title: '回执内容', key: 'receipt', ellipsis: { tooltip: true } }
]

onMounted(async () => {
  try {
    const detail = await api.getRepairDetail(id.value) as any
    repair.value = detail
    attachments.value = detail.attachments || []
    auditRecords.value = detail.audit_records || detail.audits || []
    notifications.value = detail.notification_receipts || detail.notifications || []
  } catch {}
  try {
    const res = await api.getRepairHistory(id.value) as any
    history.value = Array.isArray(res) ? res : res.items || []
  } catch {}
})
</script>
