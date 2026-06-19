<template>
  <div class="space-y-4">
    <n-card title="导出明细">
      <n-form
        ref="formRef"
        :model="formValue"
        label-placement="top"
        class="max-w-2xl"
      >
        <n-row :gutter="12">
          <n-col :span="12">
            <n-form-item label="开始日期">
              <n-date-picker
                v-model:value="formValue.start_date"
                type="date"
                placeholder="选择开始日期"
                style="width: 100%"
              />
            </n-form-item>
          </n-col>
          <n-col :span="12">
            <n-form-item label="结束日期">
              <n-date-picker
                v-model:value="formValue.end_date"
                type="date"
                placeholder="选择结束日期"
                style="width: 100%"
              />
            </n-form-item>
          </n-col>
        </n-row>
        
        <n-form-item label="导出内容">
          <n-checkbox-group v-model:value="formValue.include_items">
            <n-space>
              <n-checkbox value="utilization">档期利用</n-checkbox>
              <n-checkbox value="conflicts">预约冲突</n-checkbox>
              <n-checkbox value="operations">操作记录</n-checkbox>
            </n-space>
          </n-checkbox-group>
        </n-form-item>

        <n-space>
          <n-button type="primary" :loading="exporting" @click="handleExport">
            <template #icon>
              <DownloadOutline />
            </template>
            导出Excel
          </n-button>
        </n-space>
      </n-form>
    </n-card>

    <n-card title="最近导出任务">
      <n-data-table
        :data="tasks"
        :columns="columns"
        :loading="loading"
        :pagination="pagination"
        bordered
      />
    </n-card>

    <n-modal v-model:show="showErrorModal" preset="card" title="错误详情" style="width: 600px">
      <div v-if="currentTask" class="space-y-4">
        <n-descriptions bordered :column="2">
          <n-descriptions-item label="任务ID">
            {{ currentTask.task_id }}
          </n-descriptions-item>
          <n-descriptions-item label="任务名称">
            {{ currentTask.task_name }}
          </n-descriptions-item>
          <n-descriptions-item label="重试次数">
            {{ currentTask.retry_count }} / {{ currentTask.max_retries }}
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">
            {{ formatTime(currentTask.created_at) }}
          </n-descriptions-item>
        </n-descriptions>

        <n-divider>错误信息</n-divider>
        <div class="bg-red-50 p-4 rounded-lg">
          <p class="text-red-600 font-medium mb-2">{{ currentTask.error_message }}</p>
          <details v-if="currentTask.error_traceback" class="mt-2">
            <summary class="cursor-pointer text-sm text-gray-600">查看堆栈跟踪</summary>
            <pre class="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-60">{{ currentTask.error_traceback }}</pre>
          </details>
        </div>

        <n-divider>请求参数</n-divider>
        <pre class="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto max-h-40">{{ JSON.stringify(currentTask.request_data, null, 2) }}</pre>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import {
  NCard,
  NForm,
  NFormItem,
  NDatePicker,
  NRow,
  NCol,
  NCheckboxGroup,
  NCheckbox,
  NSpace,
  NButton,
  NDataTable,
  NTag,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  useMessage,
  DataTableColumns,
  FormInst,
  DataTablePagination
} from 'naive-ui'
import { DownloadOutline } from '@vicons/ionicons5'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const { apiRequest, downloadFile } = useAuth()

const formRef = ref<FormInst | null>(null)
const exporting = ref(false)
const tasks = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const showErrorModal = ref(false)
const currentTask = ref<any>(null)

const formValue = ref({
  start_date: null as number | null,
  end_date: null as number | null,
  include_items: ['utilization', 'conflicts', 'operations'] as string[]
})

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

const columns = computed<DataTableColumns>(() => [
  { title: '任务名称', key: 'task_name' },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => {
      return h(NTag, { type: getStatusType(row.status) }, () => getStatusText(row.status))
    }
  },
  {
    title: '重试',
    key: 'retry',
    width: 80,
    render: (row: any) => {
      if (row.retry_count > 0) {
        return h('div', { class: 'text-orange-500' }, `${row.retry_count} / ${row.max_retries}`)
      }
      return h('div', { class: 'text-gray-400' }, '-')
    }
  },
  { title: '创建时间', key: 'created_at' },
  { title: '完成时间', key: 'completed_at' },
  {
    title: '操作',
    key: 'actions',
    width: 180,
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
              onClick: () => downloadReport(row.task_id)
            },
            () => '下载'
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
      if (row.status === 'failed') {
        children.push(
          h(
            NButton,
            {
              size: 'small',
              text: true,
              onClick: () => viewError(row)
            },
            () => '查看错误'
          )
        )
      }
      return h(NSpace, null, () => children)
    }
  }
])

const pagination = computed<DataTablePagination>(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
  onUpdatePage: (p: number) => { page.value = p; loadTasks() },
  onUpdatePageSize: (ps: number) => { pageSize.value = ps; page.value = 1; loadTasks() }
}))

async function handleExport() {
  try {
    exporting.value = true
    
    const body: any = {
      include_utilization: formValue.value.include_items.includes('utilization'),
      include_conflicts: formValue.value.include_items.includes('conflicts'),
      include_operations: formValue.value.include_items.includes('operations')
    }
    
    if (formValue.value.start_date) {
      body.start_date = new Date(formValue.value.start_date).toISOString().split('T')[0]
    }
    if (formValue.value.end_date) {
      body.end_date = new Date(formValue.value.end_date).toISOString().split('T')[0]
    }
    
    await apiRequest('/api/reports/export', {
      method: 'POST',
      body
    })
    
    message.success('导出任务已创建，请到任务列表查看进度')
    loadTasks()
  } catch (error: any) {
    message.error(error.data?.detail || '导出失败')
  } finally {
    exporting.value = false
  }
}

async function loadTasks() {
  try {
    loading.value = true
    const params = {
      skip: (page.value - 1) * pageSize.value,
      limit: pageSize.value
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

async function downloadReport(taskId: string) {
  try {
    await downloadFile(`/api/reports/download/${taskId}`, `report_${taskId}.xlsx`)
    message.success('下载已开始')
  } catch (error: any) {
    message.error(error.message || '下载失败')
  }
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

function viewError(row: any) {
  currentTask.value = row
  showErrorModal.value = true
}

onMounted(() => {
  loadTasks()
})
</script>
