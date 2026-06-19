<template>
  <div class="space-y-4">
    <n-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span>预约列表</span>
          <n-space>
            <n-input
              v-model:value="searchPhone"
              placeholder="搜索手机号"
              style="width: 200px"
              clearable
              @keyup.enter="loadData"
            />
            <n-select
              v-model:value="filterStatus"
              :options="statusOptions"
              placeholder="状态筛选"
              style="width: 150px"
              clearable
            />
            <n-date-picker
              v-model:value="dateRange"
              type="daterange"
              placeholder="选择日期范围"
              clearable
            />
            <n-button type="primary" @click="router.push('/appointments/new')">
              <template #icon>
                <AddCircleOutline />
              </template>
              新建预约
            </n-button>
          </n-space>
        </div>
      </template>

      <n-table
        :data="appointments"
        :columns="columns"
        bordered
        :pagination="{
          page: page,
          pageSize: pageSize,
          itemCount: total,
          onUpdatePage: (p) => { page = p; loadData() },
          onUpdatePageSize: (ps) => { pageSize = ps; page = 1; loadData() }
        }"
      >
        <template #status="{ row }">
          <n-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </n-tag>
        </template>
        <template #schedule="{ row }">
          <div v-if="row.schedule_info">
            <div>{{ row.schedule_info.schedule_date }}</div>
            <div class="text-xs text-gray-500">
              {{ row.schedule_info.time_slot_info?.start_time }} - {{ row.schedule_info.time_slot_info?.end_time }}
            </div>
          </div>
        </template>
        <template #counselor="{ row }">
          {{ row.schedule_info?.counselor_info?.name || '-' }}
        </template>
        <template #creator="{ row }">
          {{ row.creator_info?.real_name || '-' }}
        </template>
        <template #last_operation="{ row }">
          <div v-if="row.last_operation" class="text-xs">
            <div>{{ row.last_operation.operator }}</div>
            <div class="text-gray-500">{{ formatTime(row.last_operation.timestamp) }}</div>
          </div>
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-dropdown
              :options="getActionOptions(row)"
              @select="(key) => handleAction(row, key)"
              trigger="click"
            >
              <n-button size="small" text>
                操作 <ChevronDownOutline />
              </n-button>
            </n-dropdown>
          </n-space>
        </template>
      </n-table>
    </n-card>

    <n-modal v-model:show="showDetailModal" preset="card" title="预约详情" style="width: 600px">
      <div v-if="currentAppointment" class="space-y-4">
        <n-descriptions bordered :column="2">
          <n-descriptions-item label="预约ID">
            {{ currentAppointment.id }}
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="getStatusType(currentAppointment.status)">
              {{ getStatusText(currentAppointment.status) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="访客姓名">
            {{ currentAppointment.visitor_name }}
          </n-descriptions-item>
          <n-descriptions-item label="联系电话">
            {{ currentAppointment.visitor_phone }}
          </n-descriptions-item>
          <n-descriptions-item label="性别/年龄">
            {{ currentAppointment.visitor_gender || '-' }} / {{ currentAppointment.visitor_age || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="咨询师">
            {{ currentAppointment.schedule_info?.counselor_info?.name || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="预约日期">
            {{ currentAppointment.schedule_info?.schedule_date || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="时段">
            {{ currentAppointment.schedule_info?.time_slot_info?.start_time }} - {{ currentAppointment.schedule_info?.time_slot_info?.end_time }}
          </n-descriptions-item>
          <n-descriptions-item label="来访原因" :span="2">
            {{ currentAppointment.visit_reason }}
          </n-descriptions-item>
          <n-descriptions-item label="备注" :span="2">
            {{ currentAppointment.notes || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="创建人">
            {{ currentAppointment.creator_info?.real_name || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ formatTime(currentAppointment.created_at) }}
          </n-descriptions-item>
        </n-descriptions>

        <n-divider>最近操作</n-divider>
        <div v-if="currentAppointment.last_operation" class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between">
            <span class="font-medium">{{ currentAppointment.last_operation.operator }}</span>
            <span class="text-gray-500 text-sm">{{ formatTime(currentAppointment.last_operation.timestamp) }}</span>
          </div>
          <div class="text-sm text-gray-600 mt-1">
            操作类型: {{ getOperationText(currentAppointment.last_operation.type) }}
          </div>
          <div v-if="currentAppointment.last_operation.changes" class="text-sm text-gray-600 mt-1">
            修改内容: {{ JSON.stringify(currentAppointment.last_operation.changes) }}
          </div>
        </div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NTable,
  NButton,
  NInput,
  NSelect,
  NDatePicker,
  NSpace,
  NTag,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NDropdown,
  useMessage,
  TableColumns,
  SelectOption,
  DropdownOption
} from 'naive-ui'
import { AddCircleOutline, ChevronDownOutline } from '@vicons/ionicons5'
import { useAuth } from '~/composables/useAuth'

const router = useRouter()
const message = useMessage()
const { apiRequest } = useAuth()

const appointments = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchPhone = ref('')
const filterStatus = ref<string | null>(null)
const dateRange = ref<[number, number] | null>(null)
const showDetailModal = ref(false)
const currentAppointment = ref<any>(null)

const statusOptions: SelectOption[] = [
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
  { label: '爽约', value: 'no_show' }
]

const columns: TableColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '访客姓名', key: 'visitor_name' },
  { title: '访客电话', key: 'visitor_phone' },
  { title: '咨询师', key: 'counselor' },
  { title: '预约信息', key: 'schedule' },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建人', key: 'creator' },
  { title: '最近操作', key: 'last_operation' },
  { title: '操作', key: 'actions', width: 100 }
]

function getStatusType(status: string) {
  const map: Record<string, any> = {
    pending: 'warning',
    confirmed: 'success',
    completed: 'info',
    cancelled: 'default',
    no_show: 'error'
  }
  return map[status] || 'default'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '爽约'
  }
  return map[status] || status
}

function getOperationText(type: string) {
  const map: Record<string, string> = {
    create: '创建',
    update: '更新',
    cancel: '取消',
    mark_no_show: '标记爽约'
  }
  return map[type] || type
}

function formatTime(time: string) {
  return time ? new Date(time).toLocaleString('zh-CN') : '-'
}

function getActionOptions(row: any): DropdownOption[] {
  const options: DropdownOption[] = [
    { label: '查看详情', key: 'view' }
  ]
  
  if (row.status === 'pending') {
    options.push({ label: '确认预约', key: 'confirm' })
  }
  if (row.status !== 'cancelled' && row.status !== 'completed' && row.status !== 'no_show') {
    options.push({ label: '取消预约', key: 'cancel' })
  }
  if (row.status === 'confirmed' || row.status === 'pending') {
    options.push({ label: '标记爽约', key: 'no_show' })
  }
  if (row.status === 'confirmed') {
    options.push({ label: '标记完成', key: 'complete' })
  }
  
  return options
}

async function handleAction(row: any, key: string) {
  try {
    if (key === 'view') {
      currentAppointment.value = row
      showDetailModal.value = true
    } else if (key === 'confirm') {
      await apiRequest(`/api/appointments/${row.id}`, {
        method: 'PUT',
        body: { status: 'confirmed' }
      })
      message.success('预约已确认')
      loadData()
    } else if (key === 'complete') {
      await apiRequest(`/api/appointments/${row.id}`, {
        method: 'PUT',
        body: { status: 'completed' }
      })
      message.success('预约已完成')
      loadData()
    } else if (key === 'cancel') {
      await apiRequest(`/api/appointments/${row.id}`, {
        method: 'DELETE'
      })
      message.success('预约已取消')
      loadData()
    } else if (key === 'no_show') {
      await apiRequest(`/api/appointments/${row.id}/mark-no-show`, {
        method: 'POST'
      })
      message.success('已标记为爽约')
      loadData()
    }
  } catch (error: any) {
    message.error(error.data?.detail || '操作失败')
  }
}

async function loadData() {
  try {
    const params: any = {
      skip: (page.value - 1) * pageSize.value,
      limit: pageSize.value
    }
    
    if (searchPhone.value) {
      params.visitor_phone = searchPhone.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    if (dateRange.value) {
      params.start_date = new Date(dateRange.value[0]).toISOString().split('T')[0]
      params.end_date = new Date(dateRange.value[1]).toISOString().split('T')[0]
    }
    
    const data = await apiRequest<any[]>('/api/appointments', { params })
    appointments.value = data
    total.value = data.length
  } catch (error) {
    message.error('加载数据失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
