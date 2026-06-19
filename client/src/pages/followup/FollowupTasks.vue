<template>
  <div>
    <PageHeader title="回访任务" subtitle="查看和完成客户回访任务" />
    <a-card>
      <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
        <a-tab-pane key="all" tab="全部" />
        <a-tab-pane key="pending" tab="待回访" />
        <a-tab-pane key="completed" tab="已完成" />
        <a-tab-pane key="no_answer" tab="未接通" />
      </a-tabs>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <StatusTag :status="record.status" type="followup" />
          </template>
          <template v-else-if="column.key === 'appointmentStatus'">
            <a-tag v-if="record.appointmentStatus === 'success'" color="success">预约成功</a-tag>
            <a-tag v-else-if="record.appointmentStatus === 'failed'" color="error">预约失败</a-tag>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'appointmentSuccess'">
            <a-tag v-if="record.appointmentSuccess" color="success">是</a-tag>
            <a-tag v-else-if="record.appointmentSuccess === false" color="default">否</a-tag>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'scheduledTime'">
            {{ formatDate(record.scheduledTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button
              v-if="record.status === 'pending' || record.status === 'no_answer'"
              type="primary"
              size="small"
              @click="showCompleteModal(record)"
            >
              拨打
            </a-button>
            <a-button v-else type="link" size="small" @click="viewDetail(record)">查看</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="completeModalOpen"
      title="完成回访"
      :ok-text="appointmentSuccess ? '完成并预约' : '完成'"
      @ok="handleComplete"
    >
      <a-form layout="vertical">
        <a-form-item label="回访结果">
          <a-textarea
            v-model:value="followupResult"
            placeholder="请输入回访结果..."
            :rows="4"
          />
        </a-form-item>
        <a-form-item label="未接通">
          <a-switch v-model:checked="isNoAnswer" />
          <span class="ml-2 text-gray-500">客户未接听电话</span>
        </a-form-item>
        <a-form-item v-if="!isNoAnswer" label="是否预约成功">
          <a-switch v-model:checked="appointmentSuccess" />
        </a-form-item>
        <template v-if="appointmentSuccess && !isNoAnswer">
          <a-form-item label="预约日期">
            <a-date-picker
              v-model:value="appointmentDate"
              style="width: 100%"
              format="YYYY-MM-DD"
              placeholder="选择预约日期"
            />
          </a-form-item>
          <a-form-item label="选择车辆">
            <a-select v-model:value="selectedVehicleId" placeholder="请选择车辆" style="width: 100%">
              <a-select-option v-for="v in vehicleList" :key="v.id" :value="v.id">
                {{ v.plateNumber }} - {{ v.brand }} {{ v.model }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </template>
      </a-form>
    </a-modal>

    <a-modal v-model:open="detailModalOpen" title="回访详情" :footer="null">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="客户姓名">{{ currentFollowup?.customerName }}</a-descriptions-item>
        <a-descriptions-item label="联系电话">{{ currentFollowup?.customerPhone }}</a-descriptions-item>
        <a-descriptions-item label="回访类型">{{ currentFollowup?.type }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <StatusTag :status="currentFollowup?.status || ''" type="followup" />
        </a-descriptions-item>
        <a-descriptions-item label="预约状态">
          <a-tag v-if="currentFollowup?.appointmentStatus === 'success'" color="success">预约成功</a-tag>
          <a-tag v-else-if="currentFollowup?.appointmentStatus === 'failed'" color="error">预约失败</a-tag>
          <span v-else>-</span>
        </a-descriptions-item>
        <a-descriptions-item label="计划时间">{{ formatDate(currentFollowup?.scheduledTime) }}</a-descriptions-item>
        <a-descriptions-item label="回访内容" :span="2">{{ currentFollowup?.content }}</a-descriptions-item>
        <a-descriptions-item v-if="currentFollowup?.result" label="回访结果" :span="2">
          {{ currentFollowup?.result }}
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'
import PageHeader from '@/components/PageHeader.vue'
import StatusTag from '@/components/StatusTag.vue'
import { getMyTasks, completeFollowup } from '@/api/followups'
import { getVehicleList } from '@/api/vehicles'
import type { Followup, Vehicle, PaginationParams } from '@/types'

const loading = ref(false)
const list = ref<Followup[]>([])
const activeTab = ref('all')
const vehicleList = ref<Vehicle[]>([])
const completeModalOpen = ref(false)
const detailModalOpen = ref(false)
const currentFollowup = ref<Followup | null>(null)
const followupResult = ref('')
const isNoAnswer = ref(false)
const appointmentSuccess = ref(false)
const appointmentDate = ref<Dayjs | null>(null)
const selectedVehicleId = ref<number | null>(null)

const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`
})

const columns = [
  { title: '客户姓名', dataIndex: 'customerName', key: 'customerName' },
  { title: '联系电话', dataIndex: 'customerPhone', key: 'customerPhone' },
  { title: '回访类型', dataIndex: 'type', key: 'type' },
  { title: '预约状态', key: 'appointmentStatus', width: 100 },
  { title: '预约成功', key: 'appointmentSuccess', width: 100 },
  { title: '计划时间', key: 'scheduledTime' },
  { title: '操作', key: 'action', width: 100 }
]

const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const fetchList = async () => {
  loading.value = true
  try {
    const params: PaginationParams = {
      page: pagination.value.current,
      pageSize: pagination.value.pageSize
    }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }
    const res = await getMyTasks(params)
    list.value = res.list
    pagination.value.total = res.total
  } finally {
    loading.value = false
  }
}

const fetchVehicles = async () => {
  const res = await getVehicleList({ page: 1, pageSize: 100 })
  vehicleList.value = res.list
}

const onTabChange = () => {
  pagination.value.current = 1
  fetchList()
}

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current
  pagination.value.pageSize = pag.pageSize
  fetchList()
}

const showCompleteModal = (record: Followup) => {
  currentFollowup.value = record
  followupResult.value = ''
  isNoAnswer.value = false
  appointmentSuccess.value = false
  appointmentDate.value = null
  selectedVehicleId.value = null
  completeModalOpen.value = true
}

const viewDetail = (record: Followup) => {
  currentFollowup.value = record
  detailModalOpen.value = true
}

const handleComplete = async () => {
  if (!currentFollowup.value) return
  if (!isNoAnswer.value && !followupResult.value.trim()) {
    message.warning('请输入回访结果')
    return
  }
  if (appointmentSuccess.value && !appointmentDate.value) {
    message.warning('请选择预约日期')
    return
  }
  if (appointmentSuccess.value && !selectedVehicleId.value) {
    message.warning('请选择车辆')
    return
  }
  try {
    await completeFollowup(currentFollowup.value.id, {
      result: isNoAnswer.value ? '客户未接通' : followupResult.value,
      appointmentSuccess: appointmentSuccess.value,
      appointmentDate: appointmentDate.value?.format('YYYY-MM-DD'),
      vehicleId: selectedVehicleId.value || undefined,
      status: isNoAnswer.value ? 'no_answer' : 'completed'
    })
    message.success('回访完成')
    completeModalOpen.value = false
    fetchList()
  } catch (e) {
    message.error('操作失败')
  }
}

onMounted(() => {
  fetchList()
  fetchVehicles()
})
</script>
