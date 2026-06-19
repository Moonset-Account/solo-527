<template>
  <div class="space-y-4">
    <n-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span>操作日志</span>
          <n-space>
            <n-select
              v-model:value="filterOperator"
              :options="operatorOptions"
              placeholder="操作人"
              style="width: 150px"
              clearable
            />
            <n-select
              v-model:value="filterOperationType"
              :options="operationTypeOptions"
              placeholder="操作类型"
              style="width: 150px"
              clearable
            />
            <n-select
              v-model:value="filterTargetType"
              :options="targetTypeOptions"
              placeholder="目标类型"
              style="width: 150px"
              clearable
            />
            <n-button @click="loadData">
              查询
            </n-button>
          </n-space>
        </div>
      </template>

      <n-data-table
        :data="logs"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        bordered
      />
    </n-card>

    <n-modal v-model:show="showDetailModal" preset="card" title="操作详情" style="width: 600px">
      <div v-if="currentLog" class="space-y-4">
        <n-descriptions bordered :column="2">
          <n-descriptions-item label="操作人">
            {{ currentLog.operator_info?.real_name || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="操作时间">
            {{ formatTime(currentLog.created_at) }}
          </n-descriptions-item>
          <n-descriptions-item label="IP地址">
            {{ currentLog.ip_address || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="操作类型">
            {{ getOperationText(currentLog.operation_type) }}
          </n-descriptions-item>
          <n-descriptions-item label="目标类型">
            {{ getTargetText(currentLog.target_type) }}
          </n-descriptions-item>
          <n-descriptions-item label="目标ID">
            {{ currentLog.target_id || '-' }}
          </n-descriptions-item>
        </n-descriptions>

        <n-divider>变更内容</n-divider>
        
        <div v-if="currentLog.old_value" class="mb-4">
          <p class="text-sm font-medium text-gray-600 mb-2">修改前：</p>
          <pre class="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto max-h-40">{{ JSON.stringify(currentLog.old_value, null, 2) }}</pre>
        </div>
        
        <div v-if="currentLog.new_value">
          <p class="text-sm font-medium text-gray-600 mb-2">修改后：</p>
          <pre class="bg-green-50 p-3 rounded-lg text-sm overflow-x-auto max-h-40">{{ JSON.stringify(currentLog.new_value, null, 2) }}</pre>
        </div>
        
        <div v-if="!currentLog.old_value && !currentLog.new_value" class="text-gray-500 text-center py-4">
          无变更内容
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
import { ref, onMounted, computed, h } from 'vue'
import {
  NCard,
  NDataTable,
  NButton,
  NSelect,
  NSpace,
  NModal,
  NTag,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  useMessage,
  DataTableColumns,
  SelectOption,
  DataTablePagination
} from 'naive-ui'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const { apiRequest } = useAuth()

const logs = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterOperator = ref<number | null>(null)
const filterOperationType = ref<string | null>(null)
const filterTargetType = ref<string | null>(null)
const showDetailModal = ref(false)
const currentLog = ref<any>(null)

const operatorOptions = ref<SelectOption[]>([])
const operationTypeOptions: SelectOption[] = [
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '登录', value: 'login' },
  { label: '取消', value: 'cancel' },
  { label: '标记爽约', value: 'mark_no_show' },
  { label: '批量创建', value: 'batch_create' }
]
const targetTypeOptions: SelectOption[] = [
  { label: '用户', value: 'user' },
  { label: '咨询师', value: 'counselor' },
  { label: '排班', value: 'schedule' },
  { label: '时段', value: 'time_slot' },
  { label: '预约', value: 'appointment' },
  { label: '爽约名单', value: 'no_show_list' }
]

function getOperationType(type: string) {
  const map: Record<string, any> = {
    create: 'success',
    update: 'warning',
    delete: 'error',
    login: 'info',
    cancel: 'default',
    mark_no_show: 'error',
    batch_create: 'primary'
  }
  return map[type] || 'default'
}

function getOperationText(type: string) {
  const map: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    login: '登录',
    cancel: '取消',
    mark_no_show: '标记爽约',
    batch_create: '批量创建',
    change_password: '修改密码'
  }
  return map[type] || type
}

function getTargetText(type: string) {
  const map: Record<string, string> = {
    user: '用户',
    counselor: '咨询师',
    schedule: '排班',
    time_slot: '时段',
    appointment: '预约',
    no_show_list: '爽约名单'
  }
  return map[type] || type
}

function formatTime(time: string) {
  return time ? new Date(time).toLocaleString('zh-CN') : '-'
}

const columns = computed<DataTableColumns>(() => [
  { title: 'ID', key: 'id', width: 60 },
  {
    title: '操作人',
    key: 'operator',
    width: 150,
    render: (row: any) => {
      return h('div', null, [
        h('div', null, row.operator_info?.real_name || '-'),
        h('div', { class: 'text-xs text-gray-500' }, row.ip_address || '-')
      ])
    }
  },
  {
    title: '操作类型',
    key: 'operation_type',
    width: 120,
    render: (row: any) => {
      return h(NTag, { type: getOperationType(row.operation_type) }, () => getOperationText(row.operation_type))
    }
  },
  {
    title: '目标',
    key: 'target',
    width: 150,
    render: (row: any) => {
      return h('div', null, [
        h('div', null, getTargetText(row.target_type)),
        h('div', { class: 'text-xs text-gray-500' }, `ID: ${row.target_id || '-'}`)
      ])
    }
  },
  { title: 'IP地址', key: 'ip_address', width: 120 },
  { title: '操作时间', key: 'created_at' },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    fixed: 'right',
    render: (row: any) => {
      return h(
        NButton,
        { size: 'small', text: true, onClick: () => viewDetail(row) },
        () => '详情'
      )
    }
  }
])

const pagination = computed<DataTablePagination>(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  onUpdatePage: (p: number) => { page.value = p; loadData() },
  onUpdatePageSize: (ps: number) => { pageSize.value = ps; page.value = 1; loadData() }
}))

async function loadUsers() {
  try {
    const users = await apiRequest<any[]>('/api/auth/users')
    operatorOptions.value = users.map(u => ({ label: u.real_name, value: u.id }))
  } catch (error) {
    console.error('加载用户列表失败')
  }
}

async function loadData() {
  try {
    loading.value = true
    const params: any = {
      skip: (page.value - 1) * pageSize.value,
      limit: pageSize.value
    }
    if (filterOperator.value) {
      params.operator_id = filterOperator.value
    }
    if (filterOperationType.value) {
      params.operation_type = filterOperationType.value
    }
    if (filterTargetType.value) {
      params.target_type = filterTargetType.value
    }
    
    const data = await apiRequest<any[]>('/api/operation-logs', { params })
    logs.value = data
    total.value = data.length
  } catch (error) {
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function viewDetail(row: any) {
  currentLog.value = row
  showDetailModal.value = true
}

onMounted(() => {
  loadUsers()
  loadData()
})
</script>
