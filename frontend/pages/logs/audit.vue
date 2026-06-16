<template>
  <div>
    <n-page-header title="审计日志" subtitle="查看系统操作审计记录" />

    <n-card class="mt-4">
      <n-space class="mb-4">
        <n-select
          v-model:value="filterAction"
          placeholder="操作类型"
          :options="actionOptions"
          style="width: 200px"
          clearable
        />
        <n-select
          v-model:value="filterResourceType"
          placeholder="资源类型"
          :options="resourceTypeOptions"
          style="width: 160px"
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

    <n-modal v-model:show="showDetailModal" preset="card" title="日志详情" style="width: 600px">
      <n-descriptions :column="2" bordered size="small">
        <n-descriptions-item label="日志ID">{{ currentLog?.id }}</n-descriptions-item>
        <n-descriptions-item label="操作类型">{{ actionLabelMap[currentLog?.action] || currentLog?.action }}</n-descriptions-item>
        <n-descriptions-item label="操作人">{{ currentLog?.username || '-' }}</n-descriptions-item>
        <n-descriptions-item label="IP地址">{{ currentLog?.ip_address || '-' }}</n-descriptions-item>
        <n-descriptions-item label="资源类型">{{ currentLog?.resource_type || '-' }}</n-descriptions-item>
        <n-descriptions-item label="资源ID">{{ currentLog?.resource_id || '-' }}</n-descriptions-item>
        <n-descriptions-item label="操作时间" :span="2">
          {{ formatDate(currentLog?.created_at) }}
        </n-descriptions-item>
        <n-descriptions-item label="描述" :span="2">
          {{ currentLog?.description || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="User-Agent" :span="2">
          <div class="text-xs break-all">{{ currentLog?.user_agent || '-' }}</div>
        </n-descriptions-item>
      </n-descriptions>

      <n-divider v-if="currentLog?.details" v-text="'详细信息'" />
      <n-alert v-if="currentLog?.details" type="info" :show-icon="false" style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">
        {{ JSON.stringify(currentLog.details, null, 2) }}
      </n-alert>

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
const logs = ref<any[]>([])
const filterAction = ref<string | null>(null)
const filterResourceType = ref<string | null>(null)
const showDetailModal = ref(false)
const currentLog = ref<any>(null)

const actionOptions = [
  { label: '登录', value: 'login' },
  { label: '登出', value: 'logout' },
  { label: '创建申请', value: 'create_request' },
  { label: '审批通过', value: 'approve_request' },
  { label: '审批拒绝', value: 'reject_request' },
  { label: '更新配置', value: 'update_config' },
  { label: '删除配置', value: 'delete_config' },
  { label: '创建用户', value: 'create_user' },
  { label: '更新用户', value: 'update_user' },
  { label: '删除用户', value: 'delete_user' },
  { label: '权限提升', value: 'privilege_escalation' },
  { label: '权限拒绝', value: 'permission_denied' },
]

const resourceTypeOptions = [
  { label: '用户', value: 'user' },
  { label: '申请', value: 'request' },
  { label: '设备', value: 'device' },
  { label: '告警', value: 'alert' },
  { label: '漏洞', value: 'vulnerability' },
]

const actionLabelMap: Record<string, string> = {
  login: '登录',
  logout: '登出',
  create_request: '创建申请',
  approve_request: '审批通过',
  reject_request: '审批拒绝',
  update_config: '更新配置',
  delete_config: '删除配置',
  create_user: '创建用户',
  update_user: '更新用户',
  delete_user: '删除用户',
  privilege_escalation: '权限提升',
  permission_denied: '权限拒绝',
}

const actionTagType: Record<string, string> = {
  login: 'success',
  logout: 'default',
  create_request: 'info',
  approve_request: 'success',
  reject_request: 'error',
  update_config: 'warning',
  delete_config: 'error',
  create_user: 'success',
  update_user: 'warning',
  delete_user: 'error',
  privilege_escalation: 'error',
  permission_denied: 'error',
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '操作',
    key: 'action',
    width: 140,
    render: (row: any) => h(NTag, { type: actionTagType[row.action] as any || 'default', size: 'small' }, { default: () => actionLabelMap[row.action] || row.action }),
  },
  { title: '操作人', key: 'username', width: 120 },
  { title: '资源类型', key: 'resource_type', width: 100 },
  { title: '资源ID', key: 'resource_id', width: 90 },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: 'IP', key: 'ip_address', width: 130 },
  { title: '时间', key: 'created_at', width: 160, render: (row: any) => formatDate(row.created_at) },
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

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { limit: 100 }
    if (filterAction.value) params.action = filterAction.value
    if (filterResourceType.value) params.resource_type = filterResourceType.value

    const data = await api.logs.audit(params)
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
