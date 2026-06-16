<template>
  <div>
    <n-page-header title="错误日志" subtitle="查看API接口异常记录" />

    <n-card class="mt-4">
      <n-space class="mb-4">
        <n-select
          v-model:value="filterResolved"
          placeholder="状态筛选"
          :options="resolvedOptions"
          style="width: 160px"
          clearable
        />
        <n-select
          v-model:value="filterMethod"
          placeholder="请求方法"
          :options="methodOptions"
          style="width: 140px"
          clearable
        />
        <n-button @click="loadData">
          <template #icon><SearchOutlined /></template>
          搜索
        </n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="logs"
        :loading="loading"
        :bordered="false"
        size="small"
      />
    </n-card>

    <n-modal v-model:show="showDetailModal" preset="card" title="错误详情" style="width: 700px">
      <n-descriptions :column="2" bordered size="small">
        <n-descriptions-item label="日志ID">{{ currentLog?.id }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="currentLog?.resolved ? 'success' : 'error'">
            {{ currentLog?.resolved ? '已解决' : '未解决' }}
          </n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="请求方法">{{ currentLog?.method }}</n-descriptions-item>
        <n-descriptions-item label="状态码">{{ currentLog?.status_code || '-' }}</n-descriptions-item>
        <n-descriptions-item label="错误类型" :span="2">{{ currentLog?.error_type || '-' }}</n-descriptions-item>
        <n-descriptions-item label="请求路径" :span="2">{{ currentLog?.path }}</n-descriptions-item>
        <n-descriptions-item label="错误信息" :span="2">
          <div class="text-red-500 break-all">{{ currentLog?.error_message || '-' }}</div>
        </n-descriptions-item>
        <n-descriptions-item label="用户ID">{{ currentLog?.user_id || '-' }}</n-descriptions-item>
        <n-descriptions-item label="IP地址">{{ currentLog?.ip_address || '-' }}</n-descriptions-item>
        <n-descriptions-item label="重试次数">{{ currentLog?.retry_count }}</n-descriptions-item>
        <n-descriptions-item label="最后结果">{{ currentLog?.last_result || '-' }}</n-descriptions-item>
        <n-descriptions-item label="创建时间" :span="2">
          {{ formatDate(currentLog?.created_at) }}
        </n-descriptions-item>
      </n-descriptions>

      <n-divider>请求参数</n-divider>
      <n-alert v-if="currentLog?.query_params" type="info" :show-icon="false" style="font-family: monospace; font-size: 12px;">
        {{ JSON.stringify(currentLog.query_params, null, 2) }}
      </n-alert>
      <n-alert v-else type="default" :show-icon="false">
        无
      </n-alert>

      <n-divider>请求体</n-divider>
      <n-alert v-if="currentLog?.request_body" type="warning" :show-icon="false" style="font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 200px; overflow: auto;">
        {{ currentLog.request_body }}
      </n-alert>
      <n-alert v-else type="default" :show-icon="false">
        无
      </n-alert>

      <n-divider v-if="currentLog?.resolution_note">解决备注</n-divider>
      <n-alert v-if="currentLog?.resolution_note" type="success" :show-icon="false">
        {{ currentLog.resolution_note }}
      </n-alert>

      <template #footer>
        <n-space justify="end">
          <n-button v-if="!currentLog?.resolved" type="success" @click="openResolve">
            标记已解决
          </n-button>
          <n-button @click="showDetailModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showResolveModal" preset="card" title="标记已解决" style="width: 400px">
      <n-form label-placement="top">
        <n-form-item label="解决备注">
          <n-input
            v-model:value="resolveNote"
            type="textarea"
            :rows="3"
            placeholder="请输入解决备注（可选）"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showResolveModal = false">取消</n-button>
          <n-button type="success" :loading="resolving" @click="handleResolve">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import {
  NPageHeader,
  NCard,
  NSpace,
  NSelect,
  NButton,
  NDataTable,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NAlert,
  NForm,
  NFormItem,
  NInput,
  NTag,
  useMessage,
} from 'naive-ui'
import { SearchOutlined } from '@vicons/antd'
import { useApiClient } from '~/composables/useApiClient'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiresAdmin: true,
})

const message = useMessage()
const api = useApiClient()

const loading = ref(false)
const resolving = ref(false)
const logs = ref<any[]>([])
const filterResolved = ref<boolean | null>(null)
const filterMethod = ref<string | null>(null)
const showDetailModal = ref(false)
const showResolveModal = ref(false)
const currentLog = ref<any>(null)
const resolveNote = ref('')

const resolvedOptions = [
  { label: '未解决', value: false },
  { label: '已解决', value: true },
]

const methodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
]

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '方法', key: 'method', width: 70 },
  { title: '路径', key: 'path', ellipsis: { tooltip: true } },
  { title: '状态码', key: 'status_code', width: 90 },
  { title: '错误类型', key: 'error_type', width: 140 },
  { title: '重试次数', key: 'retry_count', width: 90 },
  {
    title: '状态',
    key: 'resolved',
    width: 90,
    render: (row: any) => h(NTag, { type: row.resolved ? 'success' : 'error', size: 'small' }, { default: () => row.resolved ? '已解决' : '未解决' }),
  },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => formatDate(row.created_at) },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row: any) => h(
      NButton,
      { size: 'small', onClick: () => viewDetail(row) },
      { default: () => '详情' }
    ),
  },
]

const viewDetail = (row: any) => {
  currentLog.value = row
  showDetailModal.value = true
}

const openResolve = () => {
  resolveNote.value = ''
  showResolveModal.value = true
}

const handleResolve = async () => {
  if (!currentLog.value) return

  resolving.value = true
  try {
    await api.logs.resolveApiError(currentLog.value.id, { resolution_note: resolveNote.value })
    message.success('已标记为已解决')
    showResolveModal.value = false
    showDetailModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    resolving.value = false
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { limit: 100 }
    if (filterResolved.value !== null && filterResolved.value !== undefined) {
      params.resolved = filterResolved.value
    }
    if (filterMethod.value) params.method = filterMethod.value

    const data = await api.logs.apiErrors(params)
    logs.value = data as any[]
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
