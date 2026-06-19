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
            <n-button type="primary" @click="navigateTo('/appointments/new')">
              <template #icon>
                <n-icon><AddCircleOutline /></n-icon>
              </template>
              新建预约
            </n-button>
          </n-space>
        </div>
      </template>

      <n-data-table
        :data="appointments"
        :columns="columns"
        :pagination="pagination"
        :loading="loading"
        bordered
      />
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
        <div v-else class="text-gray-500 text-center py-4">
          暂无操作记录
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
import { ref, onMounted, h, computed } from 'vue'
import {
  NCard,
  NDataTable,
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
  NPopconfirm,
  NIcon,
  useMessage,
  DataTableColumns,
  SelectOption
} from 'naive-ui'
import { AddCircleOutline, EyeOutline, CheckmarkOutline, CloseOutline, AlertCircleOutline, CheckmarkDoneOutline } from '@vicons/ionicons5'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const { apiRequest } = useAuth()

const appointments = ref<any[]>([])
const loading = ref(false)
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

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  onUpdatePage: (p: number) => { page.value = p; loadData() },
  onUpdatePageSize: (ps: number) => { pageSize.value = ps; page.value = 1; loadData() }
}))

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

const columns: DataTableColumns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '访客姓名', key: 'visitor_name', width: 100 },
  { title: '访客电话', key: 'visitor_phone', width: 130 },
  {
    title: '咨询师',
    key: 'counselor',
    width: 100,
    render: (row: any) => row.schedule_info?.counselor_info?.name || '-'
  },
  {
    title: '预约信息',
    key: 'schedule',
    width: 180,
    render: (row: any) => {
      const schedule = row.schedule_info
      if (!schedule) return '-'
      return h('div', null, [
        h('div', null, String(schedule.schedule_date)),
        h('div', { class: 'text-xs text-gray-500 mt-1' },
          `${schedule.time_slot_info?.start_time || ''} - ${schedule.time_slot_info?.end_time || ''}`
        )
      ])
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => h(NTag, { type: getStatusType(row.status) }, () => getStatusText(row.status))
  },
  {
    title: '创建人',
    key: 'creator',
    width: 100,
    render: (row: any) => row.creator_info?.real_name || '-'
  },
  {
    title: '最近操作',
    key: 'last_operation',
    width: 150,
    render: (row: any) => {
      const op = row.last_operation
      if (!op) return h('span', { class: 'text-gray-400' }, '-')
      return h('div', null, [
        h('div', { class: 'text-xs font-medium' }, String(op.operator)),
        h('div', { class: 'text-xs text-gray-500 mt-1' }, formatTime(op.timestamp))
      ])
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 260,
    fixed: 'right',
    render: (row: any) => {
      const actions: any[] = [
        h(NButton, {
          size: 'small',
          type: 'default',
          onClick: () => {
            currentAppointment.value = row
            showDetailModal.value = true
          }
        }, {
          icon: () => h(NIcon, null, () => h(EyeOutline)),
          default: () => '查看'
        })
      ]

      if (row.status === 'pending') {
        actions.push(h(NButton, {
          size: 'small',
          type: 'success',
          onClick: () => handleAction(row, 'confirm')
        }, {
          icon: () => h(NIcon, null, () => h(CheckmarkOutline)),
          default: () => '确认'
        }))
      }

      if (row.status === 'confirmed') {
        actions.push(h(NButton, {
          size: 'small',
          type: 'primary',
          onClick: () => handleAction(row, 'complete')
        }, {
          icon: () => h(NIcon, null, () => h(CheckmarkDoneOutline)),
          default: () => '完成'
        }))
      }

      if (row.status !== 'cancelled' && row.status !== 'completed' && row.status !== 'no_show') {
        actions.push(h(NPopconfirm, {
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: () => handleAction(row, 'cancel')
        }, {
          trigger: () => h(NButton, { size: 'small', type: 'warning' }, {
            icon: () => h(NIcon, null, () => h(CloseOutline)),
            default: () => '取消'
          }),
          default: () => '确定要取消这个预约吗？'
        }))
      }

      if ((row.status === 'confirmed' || row.status === 'pending') && row.status !== 'no_show') {
        actions.push(h(NPopconfirm, {
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: () => handleAction(row, 'no_show')
        }, {
          trigger: () => h(NButton, { size: 'small', type: 'error' }, {
            icon: () => h(NIcon, null, () => h(AlertCircleOutline)),
            default: () => '爽约'
          }),
          default: () => '标记为爽约会将该访客加入爽约名单，确定继续？'
        }))
      }

      return h(NSpace, { size: 8 }, () => actions)
    }
  }
]

async function handleAction(row: any, key: string) {
  try {
    if (key === 'confirm') {
      await apiRequest(`/api/appointments/${row.id}`, {
        method: 'PUT',
        body: { status: 'confirmed' }
      })
      message.success('预约已确认')
    } else if (key === 'complete') {
      await apiRequest(`/api/appointments/${row.id}`, {
        method: 'PUT',
        body: { status: 'completed' }
      })
      message.success('预约已完成')
    } else if (key === 'cancel') {
      await apiRequest(`/api/appointments/${row.id}`, {
        method: 'DELETE'
      })
      message.success('预约已取消')
    } else if (key === 'no_show') {
      await apiRequest(`/api/appointments/${row.id}/mark-no-show`, {
        method: 'POST'
      })
      message.success('已标记为爽约')
    }
    loadData()
  } catch (error: any) {
    message.error(error.data?.detail || '操作失败')
  }
}

async function loadData() {
  loading.value = true
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

    const data = await apiRequest<any>('/api/appointments', { params })
    if (Array.isArray(data)) {
      appointments.value = data
      total.value = data.length
    } else if (data && Array.isArray(data.items)) {
      appointments.value = data.items
      total.value = data.total || data.items.length
    } else {
      appointments.value = []
      total.value = 0
    }
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
