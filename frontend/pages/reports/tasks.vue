<template>
  <div class="space-y-4">
    <n-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span>任务监控</span>
          <n-space>
            <n-select
              v-model:value="filterStatus"
              :options="statusOptions"
              placeholder="状态筛选"
              style="width: 150px"
              clearable
            />
            <n-input
              v-model:value="searchName"
              placeholder="搜索任务名称"
              style="width: 200px"
              clearable
              @keyup.enter="loadTasks"
            />
            <n-button @click="loadTasks">
              刷新
            </n-button>
          </n-space>
        </div>
      </template>

      <n-data-table
        :data="tasks"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        bordered
      />
    </n-card>

    <n-modal v-model:show="showErrorModal" preset="card" title="错误详情" style="width: 700px">
      <div v-if="currentTask" class="space-y-4">
        <n-alert type="error" :title="currentTask.error_message || '未知错误'">
          <div class="mt-2">
            <p class="text-sm mb-1">
              <strong>重试次数:</strong> {{ currentTask.retry_count }} / {{ currentTask.max_retries }}
            </p>
            <p class="text-sm">
              <strong>创建时间:</strong> {{ formatTime(currentTask.created_at) }}
            </p>
          </div>
        </n-alert>

        <n-divider>错误堆栈</n-divider>
        <pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto max-h-60">{{ currentTask.error_traceback || '无堆栈信息' }}</pre>

        <n-divider>请求参数</n-divider>
        <pre class="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto max-h-40">{{ JSON.stringify(currentTask.request_data, null, 2) }}</pre>

        <div v-if="currentTask.response_data" class="mt-4">
          <n-divider>响应数据</n-divider>
          <pre class="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto max-h-40">{{ JSON.stringify(currentTask.response_data, null, 2) }}</pre>
        </div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button v-if="currentTask?.status === 'failed' && currentTask?.retry_count < currentTask?.max_retries" type="warning" @click="retryTask(currentTask)">
            重试任务
          </n-button>
          <n-button @click="showErrorModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showResultModal" preset="card" title="执行结果" style="width: 700px">
      <div v-if="currentTask && currentTask.response_data" class="space-y-4">
        <n-tabs v-model:value="activeResultTab" type="line">
          <n-tab-pane name="utilization" tab="档期利用" v-if="currentTask.response_data.utilization">
            <n-table :data="currentTask.response_data.utilization" :columns="utilizationColumns" size="small" bordered />
          </n-tab-pane>
          <n-tab-pane name="conflicts" tab="预约冲突" v-if="currentTask.response_data.conflicts">
            <n-table :data="currentTask.response_data.conflicts" :columns="conflictColumns" size="small" bordered />
          </n-tab-pane>
          <n-tab-pane name="operations" tab="操作记录" v-if="currentTask.response_data.operations">
            <n-table :data="currentTask.response_data.operations" :columns="operationColumns" size="small" bordered />
          </n-tab-pane>
        </n-tabs>

        <n-divider>原始数据</n-divider>
        <pre class="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto max-h-60">{{ JSON.stringify(currentTask.response_data, null, 2) }}</pre>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button type="primary" @click="downloadReport(currentTask.task_id)">
            下载Excel
          </n-button>
          <n-button @click="showResultModal = false">关闭</n-button>
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
  NTable,
  NButton,
  NInput,
  NSelect,
  NSpace,
  NTag,
  NSpin,
  NProgress,
  NModal,
  NAlert,
  NDivider,
  NTabs,
  NTabPane,
  useMessage,
  DataTableColumns,
  TableColumns,
  SelectOption,
  DataTablePagination
} from 'naive-ui'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const { apiRequest, downloadFile } = useAuth()

const tasks = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filterStatus = ref<string | null>(null)
const searchName = ref('')
const showErrorModal = ref(false)
const showResultModal = ref(false)
const currentTask = ref<any>(null)
const activeResultTab = ref('utilization')

const statusOptions: SelectOption[] = [
  { label: '等待中', value: 'pending' },
  { label: '执行中', value: 'running' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '重试中', value: 'retrying' }
]

function getStatusType(status: string) {
  const map: Record<string, any> = {
    pending: 'default',
    running: 'warning',
    success: 'success',
    failed: 'error',
    retrying: 'warning'
  }
  return map[status] || 'default'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '等待中',
    running: '执行中',
    success: '成功',
    failed: '失败',
    retrying: '重试中'
  }
  return map[status] || status
}

function formatTime(time: string) {
  return time ? new Date(time).toLocaleString('zh-CN') : '-'
}

function calculateDuration(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`
}

const columns = computed<DataTableColumns>(() => [
  { title: '任务名称', key: 'task_name' },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row: any) => {
      const children: any[] = [
        h(NTag, { type: getStatusType(row.status) }, () => getStatusText(row.status))
      ]
      if (row.status === 'running' || row.status === 'pending') {
        children.push(h(NSpin, { size: 'small' }))
      }
      return h(NSpace, null, () => children)
    }
  },
  {
    title: '进度',
    key: 'progress',
    width: 150,
    render: (row: any) => {
      if (row.status === 'running') {
        return h('div', { class: 'w-full' }, [
          h(NProgress, { type: 'line', percentage: 50, indeterminate: true, height: 6 })
        ])
      }
      if (row.status === 'success') {
        return h('div', { class: 'text-green-500 text-sm' }, '100%')
      }
      if (row.status === 'failed') {
        return h('div', { class: 'text-red-500 text-sm' }, '失败')
      }
      return h('div', { class: 'text-gray-400 text-sm' }, '等待中')
    }
  },
  {
    title: '重试',
    key: 'retry',
    width: 100,
    render: (row: any) => {
      if (row.retry_count > 0) {
        return h(NTag, { type: 'warning', size: 'small' }, () => `${row.retry_count} / ${row.max_retries}`)
      }
      return h('div', { class: 'text-gray-400' }, '-')
    }
  },
  {
    title: '耗时',
    key: 'duration',
    width: 100,
    render: (row: any) => {
      if (row.started_at && row.completed_at) {
        return calculateDuration(row.started_at, row.completed_at)
      }
      if (row.started_at) {
        return '执行中...'
      }
      return '-'
    }
  },
  { title: '创建时间', key: 'created_at' },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row: any) => {
      const children: any[] = []
      if (row.status === 'success') {
        children.push(
          h(
            NButton,
            {
              size: 'small',
              text: true,
              type: 'primary',
              onClick: () => viewResult(row)
            },
            () => '查看结果'
          )
        )
      }
      if (row.status === 'failed') {
        children.push(
          h(
            NButton,
            {
              size: 'small',
              text: true,
              onClick: () => viewError(row)
            },
            () => '错误详情'
          )
        )
      }
      if (row.status === 'failed' && row.retry_count < row.max_retries) {
        children.push(
          h(
            NButton,
            {
              size: 'small',
              text: true,
              type: 'warning',
              onClick: () => retryTask(row)
            },
            () => '重试'
          )
        )
      }
      return h(NSpace, null, () => children)
    }
  }
])

const utilizationColumns: TableColumns = [
  { title: '咨询师', key: 'counselor_name' },
  { title: '日期', key: 'schedule_date' },
  { title: '时段', key: 'time_slot' },
  { title: '最大预约', key: 'max_appointments' },
  { title: '已预约', key: 'booked_count' },
  { title: '利用率', key: 'utilization_rate' }
]

const conflictColumns: TableColumns = [
  { title: '访客', key: 'visitor_name' },
  { title: '电话', key: 'visitor_phone' },
  { title: '咨询师', key: 'counselor_name' },
  { title: '日期', key: 'schedule_date' },
  { title: '冲突原因', key: 'conflict_reason' }
]

const operationColumns: TableColumns = [
  { title: '操作人', key: 'operator' },
  { title: '操作类型', key: 'operation_type' },
  { title: '目标类型', key: 'target_type' },
  { title: 'IP', key: 'ip_address' },
  { title: '时间', key: 'created_at' }
]

const pagination = computed<DataTablePagination>(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  onUpdatePage: (p: number) => { page.value = p; loadTasks() },
  onUpdatePageSize: (ps: number) => { pageSize.value = ps; page.value = 1; loadTasks() }
}))

async function loadTasks() {
  try {
    loading.value = true
    const params: any = {
      skip: (page.value - 1) * pageSize.value,
      limit: pageSize.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    if (searchName.value) {
      params.task_name = searchName.value
    }
    
    const data = await apiRequest<any[]>('/api/tasks', { params })
    tasks.value = data
    total.value = data.length
  } catch (error) {
    message.error('加载任务列表失败')
  } finally {
    loading.value = false
  }
}

function viewError(row: any) {
  currentTask.value = row
  showErrorModal.value = true
}

function viewResult(row: any) {
  currentTask.value = row
  showResultModal.value = true
}

async function retryTask(row: any) {
  try {
    await apiRequest(`/api/tasks/${row.task_id}/retry`, {
      method: 'POST'
    })
    message.success('已重新提交任务')
    loadTasks()
    showErrorModal.value = false
  } catch (error: any) {
    message.error(error.data?.detail || '重试失败')
  }
}

async function downloadReport(taskId: string) {
  try {
    await downloadFile(`/api/reports/download/${taskId}`, `report_${taskId}.xlsx`)
    message.success('下载已开始')
  } catch (error: any) {
    message.error(error.message || '下载失败')
  }
}

onMounted(() => {
  loadTasks()
})
</script>
