<template>
  <div>
    <PageHeader title="维修质量状态" subtitle="查看维修质检状态流转" />
    <a-card>
      <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
        <a-tab-pane key="pending" tab="待检测" />
        <a-tab-pane key="inspecting" tab="检测中" />
        <a-tab-pane key="repairing" tab="维修中" />
        <a-tab-pane key="completed" tab="已完成" />
        <a-tab-pane key="exception" tab="异常" />
      </a-tabs>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <a-card
          v-for="record in list"
          :key="record.id"
          hoverable
          @click="toggleExpand(record.id)"
        >
          <template #title>
            <div class="flex justify-between items-center">
              <span>{{ record.plateNumber }}</span>
              <StatusTag :status="record.status" type="quality" />
            </div>
          </template>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-gray-500">工单号</span>
              <span>#{{ record.workOrderId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">服务类型</span>
              <span>{{ record.serviceType }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">技师</span>
              <span>{{ record.technician }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">质检员</span>
              <span>{{ record.inspector }}</span>
            </div>
          </div>

          <a-collapse v-if="expandedId === record.id" class="mt-4" :bordered="false">
            <a-collapse-panel key="1" header="状态流转" :show-arrow="false">
              <a-timeline>
                <a-timeline-item v-for="t in transitions" :key="t.id">
                  <template #dot>
                    <a-badge status="processing" />
                  </template>
                  <div class="flex justify-between">
                    <span>{{ t.fromStatus }} → {{ t.toStatus }}</span>
                    <span class="text-gray-500 text-sm">{{ formatDate(t.createdAt) }}</span>
                  </div>
                  <div class="text-sm text-gray-500">操作人：{{ t.operator }}</div>
                  <div v-if="t.remark" class="text-sm">{{ t.remark }}</div>
                </a-timeline-item>
              </a-timeline>
            </a-collapse-panel>
          </a-collapse>

          <div v-if="expandedId === record.id" class="mt-4 flex gap-2 flex-wrap">
            <a-button
              v-if="record.status === 'pending'"
              type="primary"
              size="small"
              @click.stop="showStatusConfirm(record, 'inspecting', '开始检测')"
            >
              开始检测
            </a-button>
            <a-button
              v-if="record.status === 'inspecting'"
              type="primary"
              size="small"
              @click.stop="showStatusConfirm(record, 'repairing', '完成检测')"
            >
              完成检测
            </a-button>
            <a-button
              v-if="record.status === 'inspecting'"
              danger
              size="small"
              @click.stop="showStatusConfirm(record, 'exception', '检测异常')"
            >
              检测异常
            </a-button>
            <a-button
              v-if="record.status === 'repairing'"
              type="primary"
              size="small"
              @click.stop="showStatusConfirm(record, 'completed', '完成维修')"
            >
              完成维修
            </a-button>
            <a-button
              v-if="record.status === 'exception'"
              type="primary"
              size="small"
              @click.stop="showStatusConfirm(record, 'repairing', '重新维修')"
            >
              重新维修
            </a-button>
          </div>
        </a-card>
        <Empty v-if="list.length === 0 && !loading" description="暂无数据" />
      </div>

      <div v-if="loading" class="text-center py-8">
        <a-spin size="large" />
      </div>
    </a-card>

    <a-modal
      v-model:open="confirmModalOpen"
      :title="confirmTitle"
      @ok="handleStatusChange"
    >
      <p>{{ confirmContent }}</p>
      <a-form-item label="备注" class="mt-4">
        <a-textarea v-model:value="statusRemark" placeholder="请输入备注（可选）" :rows="3" />
      </a-form-item>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import Empty from '@/components/Empty.vue'
import { getQualityRecordList, updateQualityStatus, getStatusTransitions } from '@/api/quality'
import type { QualityRecord, StatusTransition, PaginationParams } from '@/types'

const loading = ref(false)
const list = ref<QualityRecord[]>([])
const activeTab = ref('pending')
const expandedId = ref<number | null>(null)
const transitions = ref<StatusTransition[]>([])
const confirmModalOpen = ref(false)
const confirmTitle = ref('')
const confirmContent = ref('')
const statusRemark = ref('')
const currentRecord = ref<QualityRecord | null>(null)
const targetStatus = ref<QualityRecord['status'] | null>(null)

const statusMap: Record<string, string> = {
  pending: '待检测',
  inspecting: '检测中',
  repairing: '维修中',
  completed: '已完成',
  exception: '异常'
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const fetchList = async () => {
  loading.value = true
  try {
    const params: PaginationParams = {
      page: 1,
      pageSize: 50,
      status: activeTab.value
    }
    const res = await getQualityRecordList(params)
    list.value = res.list
  } finally {
    loading.value = false
  }
}

const fetchTransitions = async (workOrderId: number) => {
  transitions.value = await getStatusTransitions(workOrderId)
}

const onTabChange = () => {
  expandedId.value = null
  fetchList()
}

const toggleExpand = async (id: number) => {
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    expandedId.value = id
    const record = list.value.find(r => r.id === id)
    if (record) {
      await fetchTransitions(record.workOrderId)
    }
  }
}

const showStatusConfirm = (
  record: QualityRecord,
  target: QualityRecord['status'],
  action: string
) => {
  currentRecord.value = record
  targetStatus.value = target
  confirmTitle.value = `确认${action}`
  confirmContent.value = `确定要将工单 #${record.workOrderId} 状态从「${statusMap[record.status]}」改为「${statusMap[target]}」吗？`
  statusRemark.value = ''
  confirmModalOpen.value = true
}

const handleStatusChange = async () => {
  if (!currentRecord.value || !targetStatus.value) return
  try {
    await updateQualityStatus(currentRecord.value.id, {
      status: targetStatus.value,
      remark: statusRemark.value || undefined
    })
    message.success('状态更新成功')
    confirmModalOpen.value = false
    fetchList()
  } catch (e) {
    message.error('操作失败')
  }
}

onMounted(() => {
  fetchList()
})
</script>
